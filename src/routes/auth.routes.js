import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { login, logout, me } from '../controllers/auth.controller.js'

const router = Router()

router.post('/login', login)
router.post('/logout', logout)
router.get('/me', requireAuth, me)

export default router
