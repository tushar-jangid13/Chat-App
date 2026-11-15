import { Router } from 'express'
import { getUser, listUsers } from '../controllers/userController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

router.use(requireAuth)
router.get('/', listUsers)
router.get('/:userId', getUser)

export default router
