import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import {
  overview,
  events,
  eventById,
  projects,
  users,
  userProfile,
  activity,
  reposHealthList,
  detectionCategories,
  codeQualityInsights,
  prComplexity,
  reviewCompare,
  alerts,
  userInsights,
} from '../controllers/analytics.controller.js'
import repositoryRoutes from './repository.routes.js'

const router = Router()

router.use(requireAuth)

router.get('/overview', overview)
router.get('/events/:id', eventById)
router.get('/events', events)
router.get('/projects', projects)
router.get('/users', users)
router.get('/users/:provider/:username/insights', userInsights)
router.get('/users/:provider/:username', userProfile)
router.get('/activity', activity)
router.get('/repositories/health', reposHealthList)
router.use('/repositories', repositoryRoutes)
router.get('/insights/detection-categories', detectionCategories)
router.get('/insights/code-quality', codeQualityInsights)
router.get('/pr-complexity', prComplexity)
router.get('/reviews/compare', reviewCompare)
router.get('/alerts', alerts)

export default router
