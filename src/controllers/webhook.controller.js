import { asyncHandler } from '../utils/asyncHandler.js'
import { getReviewQueue } from '../services/queue/reviewQueue.js'
import { recordReviewJob } from '../metrics.js'
import { logger } from '../config/logger.js'
import { isDbConfigured } from '../config/db.js'
import { insertReviewEvent } from '../db/repositories/reviewEvents.js'
import { insertWebhookEvent } from '../db/repositories/webhookEvents.js'
import {
  detectAndValidateWebhook,
  getReviewJobId,
  getReviewEventPayload,
  isReviewableAction,
} from '../lib/webhookProvider.js'

function getWebhookEventType(provider, event) {
  return provider === 'github' ? 'pull_request' : 'merge_request'
}

function getWebhookAction(provider, event) {
  if (provider === 'github') return event?.action ?? null
  return event?.object_attributes?.action ?? null
}

export const reviewPRWebhook = asyncHandler(async (req, res) => {
  let parsed
  try {
    parsed = detectAndValidateWebhook(req.body)
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
    return
  }

  const { provider, event } = parsed

  const repoLabel =
    provider === 'github'
      ? event?.repository?.full_name
      : (event?.project?.path_with_namespace ?? event?.project_id)
  const mrNumber =
    provider === 'github'
      ? event?.pull_request?.number
      : event?.object_attributes?.iid

  const queued = isReviewableAction(provider, event)
  if (isDbConfigured()) {
    try {
      await insertWebhookEvent({
        provider,
        eventType: getWebhookEventType(provider, event),
        repoName: String(repoLabel ?? 'unknown'),
        action: getWebhookAction(provider, event) ?? undefined,
        accepted: true,
        queued,
      })
    } catch (err) {
      logger.warn({ err }, 'Failed to log webhook event')
    }
  }

  if (!queued) {
    logger.info(
      {
        provider,
        repoLabel,
        mrNumber,
        reason: 'non_reviewable_action',
      },
      'Webhook received but action is not reviewable; event ignored',
    )
    res.status(200).json({
      accepted: true,
      queued: false,
      reason: 'non_reviewable_action',
      message:
        'Event ignored (only opened/synchronize for GitHub; open/reopen/update for GitLab)',
      provider,
      repoLabel,
      mrNumber,
    })
    return
  }

  const baseId = getReviewJobId(provider, event)
  const jobId = `${baseId}-${Date.now()}`
  const queue = getReviewQueue()
  const job = await queue.add('review', event, { jobId })

  if (isDbConfigured()) {
    try {
      const { repoId, repoName, authorUsername } = getReviewEventPayload(
        provider,
        event,
      )
      await insertReviewEvent({
        provider,
        repoId,
        repoName,
        mrNumber,
        authorUsername,
        bullmqJobId: job.id,
      })
    } catch (err) {
      logger.warn({ err, jobId: job.id }, 'Failed to persist review event for analytics')
    }
  }

  recordReviewJob('enqueued')
  logger.info(
    {
      jobId: job.id,
      jobName: job.name,
      provider,
      repoLabel,
      mrNumber,
    },
    'Review job enqueued; worker will process in background',
  )

  res.status(202).json({
    accepted: true,
    queued: true,
    message:
      'Review started (runs in background; check app logs for progress or errors)',
    provider,
    repoLabel,
    mrNumber,
    jobId: job.id,
  })
})

/**
 * GET /webhooks/events - List recent webhook events (auth required).
 */
export const listWebhookEvents = asyncHandler(async (req, res) => {
  if (!isDbConfigured()) {
    res.status(200).json({ success: true, data: { events: [] } })
    return
  }
  const { listWebhookEvents: listEvents } = await import('../db/repositories/webhookEvents.js')
  const limit = Math.min(parseInt(String(req.query.limit), 10) || 50, 100)
  const events = await listEvents({ limit })
  logger.info(
    { limit, count: events?.length ?? 0 },
    'Webhook events list requested',
  )
  res.status(200).json({
    success: true,
    data: {
      events: events.map((e) => ({
        id: e.id,
        provider: e.provider,
        eventType: e.eventType,
        repoName: e.repoName,
        action: e.action,
        accepted: e.accepted,
        queued: e.queued,
        receivedAt: e.receivedAt,
      })),
    },
  })
})
