import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { timingSafeEqual } from '../middleware/requireAuth.js'

const JWT_EXPIRY = '24h'
const COOKIE_NAME = 'dashboard_token'
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 24 * 60 * 60 * 1000, // 24h
  path: '/',
}

/**
 * POST /api/v1/auth/login — body: { username, password }
 */
export function login(req, res) {
  if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD || !env.JWT_SECRET) {
    res.status(503).json({
      success: false,
      message: 'Auth not configured (missing ADMIN_USERNAME, ADMIN_PASSWORD, or JWT_SECRET)',
    })
    return
  }

  const { username, password } = req.body ?? {}
  if (
    typeof username !== 'string' ||
    typeof password !== 'string' ||
    !timingSafeEqual(username, env.ADMIN_USERNAME) ||
    !timingSafeEqual(password, env.ADMIN_PASSWORD)
  ) {
    res.status(401).json({ success: false, message: 'Invalid username or password' })
    return
  }

  const token = jwt.sign(
    { sub: username, role: 'admin' },
    env.JWT_SECRET,
    { expiresIn: JWT_EXPIRY },
  )

  res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS)
  res.status(200).json({
    success: true,
    token,
    user: { username },
    expiresIn: JWT_EXPIRY,
  })
}

/**
 * POST /api/v1/auth/logout — clear cookie
 */
export function logout(req, res) {
  res.clearCookie(COOKIE_NAME, { path: '/' })
  res.status(200).json({ success: true, message: 'Logged out' })
}

/**
 * GET /api/v1/auth/me — return current user from JWT (requires requireAuth)
 */
export function me(req, res) {
  res.status(200).json({
    success: true,
    user: { username: req.user?.username },
  })
}
