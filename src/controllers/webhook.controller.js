import { asyncHandler } from '../utils/asyncHandler.js'
import { logger } from '../config/logger.js'
import { getDiffFromEvent } from '../utils/getDiffFromEvent.js'

export const reviewPRWebhook = asyncHandler(async (req, res) => {
  const event = req.body
  const diffInPullRequest = await getDiffFromEvent(event)
  console.log(diffInPullRequest)
  logger.info('Review PR Webhook received')
  res
    .status(200)
    .json({
      success: true,
      message: 'Review PR Webhook received',
      diffInPullRequest,
    })
})
