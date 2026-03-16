import { asyncHandler } from '../utils/asyncHandler.js'
import { isDbConfigured } from '../config/db.js'
import {
  syncIntegrationsFromEnv,
  listIntegrations,
} from '../db/repositories/integrations.js'
import { getProviderStats } from '../db/repositories/reviewEvents.js'

function requireDb(req, res, next) {
  if (!isDbConfigured()) {
    res.status(503).json({
      success: false,
      message: 'Database not configured (DATABASE_URL required)',
    })
    return
  }
  next()
}

/** GET /integrations - sync from env then return list with repos reviewed and last activity */
export const getIntegrations = [
  requireDb,
  asyncHandler(async (_req, res) => {
    const data = await syncIntegrationsFromEnv()
    const enriched = await Promise.all(
      data.map(async (integration) => {
        const stats = await getProviderStats(integration.type)
        return {
          ...integration,
          reposReviewed: stats.reposReviewed,
          lastActivityAt: stats.lastActivityAt,
        }
      }),
    )
    res.status(200).json({ success: true, data: enriched })
  }),
]

/** GET /integrations/list - return list without syncing (optional) */
export const list = [
  requireDb,
  asyncHandler(async (_req, res) => {
    const data = await listIntegrations()
    res.status(200).json({ success: true, data })
  }),
]
