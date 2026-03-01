import { env } from '../config/env.js'

/**
 * Protect /metrics with a shared token via Authorization header.
 * Expected format: Authorization: Bearer <METRICS_TOKEN>
 */
export function verifyMetricsToken(req, res, next) {
  const auth = req.headers.authorization
  const expected = `Bearer ${env.METRICS_TOKEN}`

  if (auth !== expected) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized metrics access',
    })
  }

  return next()
}
