import { asyncHandler } from '../utils/asyncHandler.js'
import { isDbConfigured } from '../config/db.js'
import {
  getOverview,
  listEvents,
  listProjects,
  listUsers,
  getActivity,
} from '../db/repositories/reviewEvents.js'

function requireDb(req, res, next) {
  if (!isDbConfigured()) {
    res.status(503).json({
      success: false,
      message: 'Database not configured (DATABASE_URL required for analytics)',
    })
    return
  }
  next()
}

export const overview = [
  requireDb,
  asyncHandler(async (_req, res) => {
    const data = await getOverview()
    res.status(200).json({ success: true, data })
  }),
]

export const events = [
  requireDb,
  asyncHandler(async (req, res) => {
    const {
      provider,
      repo,
      status,
      from,
      to,
      limit = 50,
      offset = 0,
      page,
    } = req.query
    const limitNum = Math.min(parseInt(String(limit), 10) || 50, 100)
    const offsetNum = page !== undefined
      ? (Math.max(0, parseInt(String(page), 10) || 0)) * limitNum
      : Math.max(0, parseInt(String(offset), 10) || 0)
    const { events: list, total } = await listEvents({
      provider: provider ? String(provider) : undefined,
      repo: repo ? String(repo) : undefined,
      status: status ? String(status) : undefined,
      from: from ? String(from) : undefined,
      to: to ? String(to) : undefined,
      limit: limitNum,
      offset: offsetNum,
    })
    res.status(200).json({
      success: true,
      data: { events: list, total, limit: limitNum, offset: offsetNum },
    })
  }),
]

export const projects = [
  requireDb,
  asyncHandler(async (_req, res) => {
    const data = await listProjects()
    res.status(200).json({ success: true, data })
  }),
]

export const users = [
  requireDb,
  asyncHandler(async (_req, res) => {
    const data = await listUsers()
    res.status(200).json({ success: true, data })
  }),
]

export const activity = [
  requireDb,
  asyncHandler(async (req, res) => {
    const { from, to, bucket = 'day' } = req.query
    const now = new Date()
    const defaultTo = to ? new Date(String(to)) : now
    const defaultFrom = from
      ? new Date(String(from))
      : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const data = await getActivity({
      from: defaultFrom.toISOString().slice(0, 10),
      to: defaultTo.toISOString().slice(0, 10),
      bucket: bucket === 'week' ? 'week' : 'day',
    })
    res.status(200).json({ success: true, data })
  }),
]
