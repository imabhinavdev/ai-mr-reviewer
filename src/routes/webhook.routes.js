import { Router } from 'express'
import { reviewPRWebhook } from '../controllers/webhook.controller.js'
import { verifyWebhook } from '../middleware/verifyWebhook.js'

const router = Router()

router.post('/review-pr', verifyWebhook, reviewPRWebhook)

export default router
