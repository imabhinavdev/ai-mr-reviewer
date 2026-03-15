import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { getQueueStatus, getRetries } from '../controllers/queue.controller.js'

const router = Router()

router.use(requireAuth)
router.get('/status', getQueueStatus)
router.get('/retries', getRetries)

export default router
