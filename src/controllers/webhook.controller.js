import { asyncHandler } from '../utils/asyncHandler.js'
import { getReviewQueue } from '../services/queue/reviewQueue.js'
import { recordReviewJob } from '../metrics.js'

function isValidPREvent(body) {
  return (
    body &&
    typeof body === 'object' &&
    body.pull_request &&
    body.repository?.full_name &&
    typeof body.pull_request.number === 'number'
  )
}

export const reviewPRWebhook = asyncHandler(async (req, res) => {
  const event = req.body

  if (!isValidPREvent(event)) {
    res.status(400).json({ success: false, message: 'Invalid webhook payload' })
    return
  }

  const repo = event.repository?.full_name
  const prNumber = event.pull_request?.number
  const jobId = repo && prNumber != null ? `${repo}#${prNumber}` : undefined

  const queue = getReviewQueue()
  await queue.add('review', event, { jobId })
  recordReviewJob('enqueued')

  res.status(202).json({
    accepted: true,
    message: 'Review started',
  })
})
