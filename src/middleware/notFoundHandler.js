import { ApiError } from '../utils/apiError.js'

export const notFoundHandler = (req, res, next) => {
  void res
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`))
}
