import { env } from '../config/env.js'
import { logger } from '../config/logger.js'
import { ApiError } from '../utils/apiError.js'

export const errorHandler = (error, req, res, next) => {
  void next
  const statusCode = error.statusCode && Number.isInteger(error.statusCode) ? error.statusCode : 500
  const message = error.message || 'Internal server error'

  const requestLogger = req.log || logger
  requestLogger.error(
    {
      err: error,
      requestId: req.id,
      path: req.originalUrl,
      method: req.method,
      statusCode
    },
    'Request failed'
  )

  const responseBody = {
    success: false,
    message,
    requestId: req.id
  }

  if (error instanceof ApiError && error.details) {
    responseBody.details = error.details
  }

  if (env.NODE_ENV !== 'production' && error.stack) {
    responseBody.stack = error.stack
  }

  res.status(statusCode).json(responseBody)
}
