import { Router } from 'express'
import { reviewPRWebhook } from '../controllers/webhook.controller.js'

const router = Router()

router.post('/review-pr', reviewPRWebhook)

export default router
