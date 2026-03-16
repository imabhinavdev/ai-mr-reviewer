import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { getSystemHealth } from '../controllers/system.controller.js'

const router = Router()

router.use(requireAuth)
router.get('/health', getSystemHealth)

export default router
