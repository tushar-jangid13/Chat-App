import Conversation from '../models/Conversation.js'
import Message from '../models/Message.js'
import User from '../models/User.js'

export async function listConversations(req, res) {
  const conversations = await Conversation.find({ members: req.user._id })
    .populate('members', 'name email avatar lastSeen')
    .populate({
      path: 'lastMessage',
      populate: { path: 'sender', select: 'name avatar' },
    })
    .sort({ updatedAt: -1 })

  return res.json({ conversations })
}

export async function createConversation(req, res) {
  const { participantId } = req.body || {}

  if (!participantId || participantId === req.user.id) {
    return res.status(400).json({ message: 'Choose another user to start a conversation.' })
  }

  const participant = await User.findById(participantId).select('_id')
  if (!participant) {
    return res.status(404).json({ message: 'User not found.' })
  }

  let conversation = await Conversation.findOne({
    members: { $all: [req.user._id, participant._id], $size: 2 },
    isGroup: false,
  }).populate('members', 'name email avatar lastSeen')

  if (!conversation) {
    conversation = await Conversation.create({
      members: [req.user._id, participant._id],
    })
    conversation = await conversation.populate('members', 'name email avatar lastSeen')
  }

  return res.status(201).json({ conversation })
}

export async function listMessages(req, res) {
  const conversation = await findUserConversation(req.params.conversationId, req.user._id, res)
  if (!conversation) return

  const requestedLimit = Number(req.query.limit)
  const limit = Number.isFinite(requestedLimit) && requestedLimit > 0
    ? Math.min(Math.floor(requestedLimit), 100)
    : 50
  const filter = { conversation: conversation._id }

  if (req.query.before) {
    const before = new Date(req.query.before)
    if (Number.isNaN(before.getTime())) {
      return res.status(400).json({ message: 'The message cursor is invalid.' })
    }
    filter.createdAt = { $lt: before }
  }

  const messages = await Message.find(filter)
    .populate('sender', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(limit)

  return res.json({ messages: messages.reverse() })
}

export async function sendMessage(req, res) {
  const conversation = await findUserConversation(req.params.conversationId, req.user._id, res)
  if (!conversation) return

  const text = req.body?.text?.trim()
  if (!text) {
    return res.status(400).json({ message: 'Message text is required.' })
  }

  const message = await Message.create({
    conversation: conversation._id,
    sender: req.user._id,
    text,
    readBy: [req.user._id],
  })

  conversation.lastMessage = message._id
  await conversation.save()
  await message.populate('sender', 'name avatar')

  const io = req.app.get('io')
  io?.to(conversation._id.toString()).emit('message:new', message)
  conversation.members.forEach((memberId) => {
    io?.to(`user:${memberId}`).emit('conversation:updated', {
      conversationId: conversation._id,
    })
  })

  return res.status(201).json({ message })
}

export async function markConversationRead(req, res) {
  const conversation = await findUserConversation(req.params.conversationId, req.user._id, res)
  if (!conversation) return

  await Message.updateMany(
    {
      conversation: conversation._id,
      sender: { $ne: req.user._id },
    },
    { $addToSet: { readBy: req.user._id } },
  )

  return res.status(204).send()
}

async function findUserConversation(conversationId, userId, res) {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    members: userId,
  })

  if (!conversation) {
    res.status(404).json({ message: 'Conversation not found.' })
    return null
  }

  return conversation
}
