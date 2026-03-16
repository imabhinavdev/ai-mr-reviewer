import { Router } from 'express'
import webhookRoutes from './webhook.routes.js'
import authRoutes from './auth.routes.js'
import analyticsRoutes from './analytics.routes.js'
import integrationsRoutes from './integrations.routes.js'
import queueRoutes from './queue.routes.js'
import systemRoutes from './system.routes.js'

const router = Router()

router.use('/webhooks', webhookRoutes)
router.use('/auth', authRoutes)
router.use('/analytics', analyticsRoutes)
router.use('/integrations', integrationsRoutes)
router.use('/queue', queueRoutes)
router.use('/system', systemRoutes)

export default router
