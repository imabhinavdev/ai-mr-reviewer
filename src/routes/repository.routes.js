import { Router } from 'express'
import {
  repoOverview,
  repoActivity,
  repoContributors,
  repoIssueSummary,
  repoHealthScore,
  repoRules,
} from '../controllers/analytics.controller.js'

const router = Router()

router.get('/:provider/:repoId/overview', repoOverview)
router.get('/:provider/:repoId/activity', repoActivity)
router.get('/:provider/:repoId/contributors', repoContributors)
router.get('/:provider/:repoId/issues', repoIssueSummary)
router.get('/:provider/:repoId/health', repoHealthScore)
router.get('/:provider/:repoId/rules', repoRules)

export default router
