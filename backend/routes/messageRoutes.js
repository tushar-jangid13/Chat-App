import { Router } from 'express'
import {
  createConversation,
  listConversations,
  listMessages,
  markConversationRead,
  sendMessage,
} from '../controllers/messageController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

router.use(requireAuth)
router.get('/conversations', listConversations)
router.post('/conversations', createConversation)
router.get('/conversations/:conversationId/messages', listMessages)
router.post('/conversations/:conversationId/messages', sendMessage)
router.patch('/conversations/:conversationId/read', markConversationRead)

export default router
