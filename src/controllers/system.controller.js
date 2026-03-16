import { asyncHandler } from '../utils/asyncHandler.js'
import { getRedisConnection } from '../config/redis.js'
import { getReviewQueue } from '../services/queue/reviewQueue.js'
import { env } from '../config/env.js'

/**
 * GET /system/health - Redis, workers, AI API, webhook service status.
 */
export const getSystemHealth = [
  asyncHandler(async (_req, res) => {
    const health = {
      redis: 'Disconnected',
      workers: 'Not configured',
      aiApi: 'Not configured',
      webhookService: 'Active',
    }

    try {
      const redis = getRedisConnection()
      await redis.ping()
      health.redis = 'Connected'
    } catch {
      health.redis = 'Disconnected'
    }

    const concurrency = env.REVIEW_WORKER_CONCURRENCY
    if (typeof concurrency === 'number' && concurrency > 0) {
      try {
        const queue = getReviewQueue()
        const counts = await queue.getJobCounts()
        const active = counts.active ?? 0
        health.workers = `${concurrency} running (${active} active)`
      } catch {
        health.workers = `${concurrency} configured (queue unavailable)`
      }
    }

    if (env.OPENAI_API_KEY || env.GEMINI_API_KEY || env.ANTHROPIC_API_KEY) {
      health.aiApi = 'Operational'
    }

    res.status(200).json({ success: true, data: health })
  }),
]
