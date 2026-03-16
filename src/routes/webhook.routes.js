import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import {
  reviewPRWebhook,
  listWebhookEvents,
} from '../controllers/webhook.controller.js'
import { verifyWebhook } from '../middleware/verifyWebhook.js'

const router = Router()

router.post('/review-pr', verifyWebhook, reviewPRWebhook)
router.get('/events', requireAuth, listWebhookEvents)

export default router
