import { asyncHandler } from '../utils/asyncHandler.js'
import { getReviewQueue } from '../services/queue/reviewQueue.js'
import { env } from '../config/env.js'
import { isDbConfigured } from '../config/db.js'
import { getRetriesToday } from '../db/repositories/reviewEvents.js'
import { logger } from '../config/logger.js'

function getRepoLabelFromJob(job) {
  const data = job?.data ?? {}
  return (
    data.repository?.full_name ??
    data.project?.path_with_namespace ??
    data.project_id ??
    null
  )
}

/**
 * GET /queue/status - BullMQ job counts and worker concurrency.
 * Query: ?repo=owner/repo (optional) - filter counts to jobs for that repo.
 * Requires auth. Returns 503 if Redis/queue is unavailable.
 */
export const getQueueStatus = [
  asyncHandler(async (req, res) => {
    try {
      const queue = getReviewQueue()
      const repoFilter = req.query.repo ? String(req.query.repo).trim() : null
      logger.info(
        { repoFilter: repoFilter ?? undefined },
        'Queue status requested',
      )

      if (!repoFilter) {
        const counts = await queue.getJobCounts()
        res.status(200).json({
          success: true,
          data: {
            waiting: counts.waiting ?? counts.pending ?? 0,
            active: counts.active ?? 0,
            completed: counts.completed ?? 0,
            failed: counts.failed ?? 0,
            delayed: counts.delayed ?? 0,
            workers: env.REVIEW_WORKER_CONCURRENCY,
          },
        })
        return
      }

      const [waitingJobs, activeJobs] = await Promise.all([
        queue.getJobs(['waiting']),
        queue.getJobs(['active']),
      ])
      const filter = (job) => getRepoLabelFromJob(job) === repoFilter
      const waiting = waitingJobs.filter(filter).length
      const active = activeJobs.filter(filter).length
      res.status(200).json({
        success: true,
        data: {
          waiting,
          active,
          completed: 0,
          failed: 0,
          delayed: 0,
          workers: env.REVIEW_WORKER_CONCURRENCY,
          repo: repoFilter,
        },
      })
    } catch (err) {
      logger.warn(
        { err: err?.message ?? String(err) },
        'Queue unavailable (Redis or worker not configured)',
      )
      res.status(503).json({
        success: false,
        message: 'Queue unavailable (Redis or worker not configured)',
        data: null,
      })
    }
  }),
]

/**
 * GET /queue/retries - Retries today and last failure (for Retry Monitor).
 */
export const getRetries = [
  asyncHandler(async (_req, res) => {
    if (!isDbConfigured()) {
      logger.debug('Retries requested; DB not configured, returning zeros')
      res.status(200).json({
        success: true,
        data: { retriesToday: 0, lastFailure: null },
      })
      return
    }
    const data = await getRetriesToday()
    logger.info(
      { retriesToday: data.retriesToday, hasLastFailure: !!data.lastFailure },
      'Retries data requested',
    )
    res.status(200).json({
      success: true,
      data: {
        retriesToday: data.retriesToday,
        lastFailure: data.lastFailure,
      },
    })
  }),
]
