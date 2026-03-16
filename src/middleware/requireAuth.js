import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

/**
 * Constant-time string comparison for password check.
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  const bufA = Buffer.from(a, 'utf8')
  const bufB = Buffer.from(b, 'utf8')
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

/**
 * Verify JWT from Authorization header or cookie. Attach req.user and next(), or 401.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function requireAuth(req, res, next) {
  if (!env.JWT_SECRET) {
    res.status(503).json({ success: false, message: 'Auth not configured' })
    return
  }

  let token = null
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7)
  }
  if (!token && req.cookies?.dashboard_token) {
    token = req.cookies.dashboard_token
  }

  if (!token) {
    res.status(401).json({ success: false, message: 'Unauthorized' })
    return
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET)
    req.user = { username: decoded.sub, role: decoded.role }
    next()
  } catch {
    res
      .status(401)
      .json({ success: false, message: 'Invalid or expired token' })
  }
}

export { timingSafeEqual }
