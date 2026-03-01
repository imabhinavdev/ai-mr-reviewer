import { Queue, Worker } from 'bullmq'
import { getRedisConnection, closeRedisConnection } from '../../config/redis.js'
import { runReviewPRJob } from '../../jobs/reviewPRJob.js'
import { logger } from '../../config/logger.js'
import { recordReviewJob } from '../../metrics.js'

const QUEUE_NAME = 'review-pr'

function getConnection() {
  return getRedisConnection()
}

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
    reviewQueue = new Queue(QUEUE_NAME, { connection: getConnection() })
  }
  return reviewQueue
}

/**
 * Start the worker that processes review jobs. Call after HTTP server is listening.
 */
export function startReviewWorker() {
  if (reviewWorker) return

  reviewWorker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const start = Date.now()
      try {
        const event = job.data
        await runReviewPRJob(event)
        recordReviewJob('completed', (Date.now() - start) / 1000)
      } catch (err) {
        recordReviewJob('failed', (Date.now() - start) / 1000)
        throw err
      }
    },
    { connection: getConnection() },
  )

  reviewWorker.on('completed', (job) => {
    logger.debug({ jobId: job.id }, 'Review job completed')
  })

  reviewWorker.on('failed', (job, err) => {
    logger.error(
      {
        err,
        jobId: job?.id,
        repo: job?.data?.repository?.full_name,
        pr: job?.data?.pull_request?.number,
      },
      'Review job failed',
    )
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
