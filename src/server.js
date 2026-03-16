import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cookieParser from 'cookie-parser'
import { env } from './config/env.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const dashboardDist = path.join(projectRoot, 'dashboard', 'dist')
import { httpLogger } from './config/httpLogger.js'
import { logger } from './config/logger.js'
import { errorHandler } from './middleware/errorHandler.js'
import { notFoundHandler } from './middleware/notFoundHandler.js'
import { verifyMetricsToken } from './middleware/verifyMetricsToken.js'
import { asyncHandler } from './utils/asyncHandler.js'
import router from './routes/index.js'
import {
  startReviewWorker,
  closeReviewQueue,
} from './services/queue/reviewQueue.js'
import { ensureRedisConnection } from './config/redis.js'
import { isDbConfigured, closeDb } from './config/db.js'
import { runMigrations } from './db/migrate.js'
import { register, metricsMiddleware } from './metrics.js'

const app = express()

//  Loggers and Cors setup
app.disable('x-powered-by')
// Keep raw body for webhook signature verification (GitHub X-Hub-Signature-256)
app.use(
  express.json({
    limit: '1mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf
    },
  }),
)
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(httpLogger)
app.use(metricsMiddleware)

// Routes
app.get('/metrics', verifyMetricsToken, async (_req, res) => {
  res.set('Content-Type', register.contentType)
  res.send(await register.metrics())
})
app.use('/api/v1', router)
// Back-compat + simpler reverse-proxy routing (domain.com/api/*)
app.use('/api', router)
app.get(
  '/health',
  asyncHandler(async (req, res) => {
    req.log.info({ requestId: req.id }, 'Health route hit')
    res
      .status(200)
      .json({ success: true, message: 'Hello World', requestId: req.id })
  }),
)

// Dashboard SPA: serve static assets and fallback to index.html when built
try {
  const { existsSync } = await import('node:fs')
  if (existsSync(path.join(dashboardDist, 'index.html'))) {
    // Host dashboard under /dashboard (recommended for reverse proxies)
    app.get('/', (req, res, next) => {
      if (req.method !== 'GET') return next()
      res.redirect(302, '/dashboard')
    })
    app.use('/dashboard', express.static(dashboardDist))
    app.get('*', (req, res, next) => {
      if (
        req.method !== 'GET' ||
        req.path.startsWith('/api') ||
        req.path === '/metrics'
      )
        return next()
      if (req.path === '/dashboard' || req.path.startsWith('/dashboard/')) {
        return res.sendFile(path.join(dashboardDist, 'index.html'))
      }
      return next()
    })
  }
} catch {
  // ignore if fs check fails
}

// Global Middlewares for error handling
app.use(notFoundHandler)
app.use(errorHandler)

function getBaseUrl() {
  if (env.BASE_URL) {
    return env.BASE_URL.replace(/\/$/, '')
  }
  return `http://localhost:${env.PORT}`
}

let server

async function start() {
  try {
    await ensureRedisConnection()
    logger.info('Redis connected')
  } catch (err) {
    logger.fatal({ err }, 'Redis connection failed; server not started')
    process.exit(1)
  }

  if (isDbConfigured()) {
    try {
      await runMigrations()
      logger.info('Database migrations completed')
    } catch (err) {
      logger.warn(
        { err },
        'Database migration failed; dashboard/analytics may be unavailable',
      )
    }
  }

  server = app.listen(env.PORT, () => {
    const baseUrl = getBaseUrl()
    const webhookPath = '/api/v1/webhooks/review-pr'
    const webhookUrl = `${baseUrl}${webhookPath}`

    logger.info(
      { port: env.PORT, env: env.NODE_ENV, baseUrl, webhookPath },
      `Server is running on ${baseUrl}`,
    )
    logger.info({ webhookUrl }, `Webhook URL (GitHub & GitLab): ${webhookUrl}`)
    logger.info(
      {
        health: `${baseUrl}/health`,
        metrics: `${baseUrl}/metrics`,
      },
      'Other endpoints: GET /health, GET /metrics (Prometheus)',
    )

    startReviewWorker()
  })
}

start().catch((err) => {
  logger.fatal({ err }, 'Startup failed')
  process.exit(1)
})

const shutdown = async (signal) => {
  logger.warn({ signal }, 'Shutdown signal received')

  await closeReviewQueue()
  if (isDbConfigured()) {
    await closeDb()
  }
  if (!server) {
    process.exit(0)
    return
  }
  server.close(() => {
    logger.info('HTTP server closed')
    process.exit(0)
  })

  setTimeout(() => {
    logger.error('Forced shutdown after timeout')
    process.exit(1)
  }, 10000).unref()
}

process.on('SIGINT', () => shutdown('SIGINT').catch(() => process.exit(1)))
process.on('SIGTERM', () => shutdown('SIGTERM').catch(() => process.exit(1)))
process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'Unhandled promise rejection')
})
process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'Uncaught exception')
  process.exit(1)
})

export default app
