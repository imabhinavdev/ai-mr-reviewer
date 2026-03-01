import { randomUUID } from 'node:crypto'
import pinoHttp from 'pino-http'
import { logger } from './logger.js'

export const httpLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const existingId = req.headers['x-request-id']
    const requestId = typeof existingId === 'string' && existingId.trim() ? existingId : randomUUID()
    res.setHeader('x-request-id', requestId)
    return requestId
  },
  customLogLevel: (req, res, error) => {
    if (error || res.statusCode >= 500) {
      return 'error'
    }

    if (res.statusCode >= 400) {
      return 'warn'
    }

    return 'info'
  },
  customSuccessMessage: (req, res) => `${req.method} ${req.url} completed with ${res.statusCode}`,
  customErrorMessage: (req, res, error) => `${req.method} ${req.url} failed with ${res.statusCode}: ${error.message}`
})
