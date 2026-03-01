import { Registry, Counter, Histogram } from 'prom-client'

export const register = new Registry()

const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register],
})

const httpRequestDurationSeconds = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path'],
  registers: [register],
})

export const reviewJobsTotal = new Counter({
  name: 'review_jobs_total',
  help: 'Total review jobs by status',
  labelNames: ['status'],
  registers: [register],
})

export const reviewJobDurationSeconds = new Histogram({
  name: 'review_job_duration_seconds',
  help: 'Review job processing duration in seconds',
  registers: [register],
})

/**
 * Express middleware: record request count and duration. Skip /metrics.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function metricsMiddleware(req, res, next) {
  if (req.path === '/metrics') return next()

  const start = Date.now()
  res.on('finish', () => {
    const path = req.route?.path ?? req.path
    const status = String(res.statusCode)
    httpRequestsTotal.inc({ method: req.method, path, status })
    const duration = (Date.now() - start) / 1000
    httpRequestDurationSeconds.observe({ method: req.method, path }, duration)
  })
  next()
}

/**
 * Record a review job completed or failed and its duration.
 * @param {'enqueued' | 'completed' | 'failed'} status
 * @param {number} [durationSeconds]
 */
export function recordReviewJob(status, durationSeconds) {
  reviewJobsTotal.inc({ status })
  if (typeof durationSeconds === 'number') {
    reviewJobDurationSeconds.observe(durationSeconds)
  }
}
