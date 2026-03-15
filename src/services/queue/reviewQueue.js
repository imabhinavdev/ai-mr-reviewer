import { Queue, Worker } from 'bullmq'
import {
  getRedisConnection,
  getWorkerConnection,
  closeRedisConnection,
} from '../../config/redis.js'
import { runReviewPRJob } from '../../jobs/reviewPRJob.js'
import { logger } from '../../config/logger.js'
import { recordReviewJob } from '../../metrics.js'
import { env } from '../../config/env.js'
import { isDbConfigured } from '../../config/db.js'
import {
  updateReviewEventByBullmqJobId,
  getReviewEventIdByBullmqJobId,
} from '../../db/repositories/reviewEvents.js'
import { insertReviewFindings } from '../../db/repositories/reviewFindings.js'
import { getAIProvider } from '../../services/ai/aiProvider.js'

const QUEUE_NAME = 'review-pr'

/** @type {Queue | null} */
let reviewQueue = null

/** @type {Worker | null} */
let reviewWorker = null

/**
 * Get or create the review PR queue (for adding jobs).
 * @returns {Queue}
 */
export function getReviewQueue() {
  if (!reviewQueue) {
    reviewQueue = new Queue(QUEUE_NAME, { connection: getRedisConnection() })
  }
  return reviewQueue
}

/**
 * Start the worker that processes review jobs. Call after HTTP server is listening.
 */
export function startReviewWorker() {
  if (reviewWorker) return

  const concurrency = env.REVIEW_WORKER_CONCURRENCY

  reviewWorker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const start = Date.now()
      const event = job.data
      const provider = event?.pull_request ? 'github' : 'gitlab'
      const repoLabel =
        event?.repository?.full_name ??
        event?.project?.path_with_namespace ??
        event?.project_id
      const mrNumber =
        event?.pull_request?.number ?? event?.object_attributes?.iid

      logger.info(
        { jobId: job.id, provider, repoLabel, mrNumber },
        'Worker picked up job; starting review',
      )

      const durationSeconds = (Date.now() - start) / 1000
      let aiProvider = null
      try {
        aiProvider = getAIProvider()
      } catch (_) {
        aiProvider = 'unknown'
      }

      try {
        const result = await runReviewPRJob(event, { jobId: job.id })
        recordReviewJob('completed', durationSeconds)
        if (isDbConfigured() && result !== undefined) {
          const updatePayload = {
            status: 'completed',
            commentsPostedCount: result.commentsPosted ?? 0,
            durationSeconds,
            aiProvider,
          }
          if (typeof result.filesChanged === 'number') updatePayload.filesChanged = result.filesChanged
          if (typeof result.linesAdded === 'number') updatePayload.linesAdded = result.linesAdded
          if (typeof result.linesRemoved === 'number') updatePayload.linesRemoved = result.linesRemoved
          await updateReviewEventByBullmqJobId(job.id, updatePayload)
          if (Array.isArray(result.findings) && result.findings.length > 0) {
            const reviewEventId = await getReviewEventIdByBullmqJobId(job.id)
            if (reviewEventId != null) {
              try {
                await insertReviewFindings(reviewEventId, result.findings)
              } catch (findErr) {
                logger.warn({ err: findErr, jobId: job.id }, 'Failed to persist review findings')
              }
            }
          }
        }
      } catch (err) {
        recordReviewJob('failed', durationSeconds)
        if (isDbConfigured()) {
          try {
            await updateReviewEventByBullmqJobId(job.id, {
              status: 'failed',
              durationSeconds,
              aiProvider,
              failureReason: err?.message ?? String(err),
            })
          } catch (updateErr) {
            logger.warn({ err: updateErr, jobId: job.id }, 'Failed to update review event status to failed')
          }
        }
        throw err
      }
    },
    {
      connection: getWorkerConnection(),
      concurrency,
    },
  )

  logger.info(
    { queue: QUEUE_NAME, concurrency },
    'Review worker started; listening for jobs',
  )

  reviewWorker.on('completed', (job) => {
    const event = job.data
    const provider = event?.pull_request ? 'github' : 'gitlab'
    const repoLabel =
      event?.repository?.full_name ??
      event?.project?.path_with_namespace ??
      event?.project_id
    const mrNumber =
      event?.pull_request?.number ?? event?.object_attributes?.iid

    logger.info(
      { jobId: job.id, provider, repoLabel, mrNumber },
      'Review job completed',
    )
  })

  reviewWorker.on('failed', (job, err) => {
    const event = job?.data
    const provider = event?.pull_request ? 'github' : 'gitlab'
    const repoLabel =
      event?.repository?.full_name ??
      event?.project?.path_with_namespace ??
      event?.project_id
    const mrNumber =
      event?.pull_request?.number ?? event?.object_attributes?.iid

    logger.error(
      {
        err,
        jobId: job?.id,
        provider,
        repoLabel,
        mrNumber,
      },
      'Review job failed',
    )
  })

  reviewWorker.on('error', (err) => {
    logger.error({ err }, 'Review worker error (Redis/connection)')
  })
}

/**
 * Gracefully close the worker and Redis. Call on shutdown.
 * @returns {Promise<void>}
 */
export async function closeReviewQueue() {
  if (reviewWorker) {
    await reviewWorker.close()
    reviewWorker = null
  }
  if (reviewQueue) {
    await reviewQueue.close()
    reviewQueue = null
  }
  await closeRedisConnection()
}
