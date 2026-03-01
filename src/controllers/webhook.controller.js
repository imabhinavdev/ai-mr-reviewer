import { asyncHandler } from '../utils/asyncHandler.js'
import { getReviewQueue } from '../services/queue/reviewQueue.js'
import { recordReviewJob } from '../metrics.js'
import {
  detectAndValidateWebhook,
  getReviewJobId,
} from '../lib/webhookProvider.js'

export const reviewPRWebhook = asyncHandler(async (req, res) => {
  let parsed
  try {
    parsed = detectAndValidateWebhook(req.body)
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
    return
  }

  const { provider, event } = parsed
  const jobId = getReviewJobId(provider, event)

  const queue = getReviewQueue()
  await queue.add('review', event, { jobId })
  recordReviewJob('enqueued')

  res.status(202).json({
    accepted: true,
    message: 'Review started',
    provider,
  })
})
