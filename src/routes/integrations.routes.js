import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { getIntegrations } from '../controllers/integrations.controller.js'

const router = Router()

router.use(requireAuth)
router.get('/', getIntegrations)

export default router
