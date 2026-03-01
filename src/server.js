import express from 'express'
import { env } from './config/env.js'
import { httpLogger } from './config/httpLogger.js'
import { logger } from './config/logger.js'
import { errorHandler } from './middleware/errorHandler.js'
import { notFoundHandler } from './middleware/notFoundHandler.js'
import { asyncHandler } from './utils/asyncHandler.js'

const app = express()

app.disable('x-powered-by')
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: false }))
app.use(httpLogger)

app.get(
  '/',
  asyncHandler(async (req, res) => {
    req.log.info({ requestId: req.id }, 'Health route hit')
    res.status(200).json({ success: true, message: 'Hello World', requestId: req.id })
  })
)

app.use(notFoundHandler)
app.use(errorHandler)

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, `Server is running on http://localhost:${env.PORT}`)
})

const shutdown = (signal) => {
  logger.warn({ signal }, 'Shutdown signal received')

  server.close(() => {
    logger.info('HTTP server closed')
    process.exit(0)
  })

  setTimeout(() => {
    logger.error('Forced shutdown after timeout')
    process.exit(1)
  }, 10000).unref()
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'Unhandled promise rejection')
})
process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'Uncaught exception')
  process.exit(1)
})

export default app
