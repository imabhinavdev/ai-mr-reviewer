import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import {
  overview,
  events,
  projects,
  users,
  activity,
} from '../controllers/analytics.controller.js'

const router = Router()

router.use(requireAuth)

router.get('/overview', overview)
router.get('/events', events)
router.get('/projects', projects)
router.get('/users', users)
router.get('/activity', activity)

export default router
