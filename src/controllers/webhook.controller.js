import { asyncHandler } from '../utils/asyncHandler.js'
import { logger } from '../config/logger.js'
import { runReviewPRJob } from '../jobs/reviewPRJob.js'

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

  res.status(202).json({
    accepted: true,
    message: 'Review started',
  })

  setImmediate(() => {
    runReviewPRJob(event).catch((err) => {
      logger.error({ err, event: { repo: event?.repository?.full_name, pr: event?.pull_request?.number } }, 'Background review job error')
    })
  })
})
