import { Router } from 'express'
import webhookRoutes from './webhook.routes.js'
import authRoutes from './auth.routes.js'
import analyticsRoutes from './analytics.routes.js'

const router = Router()

router.use('/webhooks', webhookRoutes)
router.use('/auth', authRoutes)
router.use('/analytics', analyticsRoutes)

export default router
