import jwt from 'jsonwebtoken'
import { Server } from 'socket.io'
import { isValidObjectId } from '@tchat/database'
import Conversation from '../models/Conversation.js'
import User from '../models/User.js'

const activeUsers = new Map()

function sendReply(reply, result) {
  if (typeof reply === 'function') reply(result)
}

export function attachSocketServer(httpServer) {
  const localOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://[::1]:5173',
  ]
  const configuredOrigins = (process.env.CLIENT_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
  const origins = [...new Set([...localOrigins, ...configuredOrigins])]
  const io = new Server(httpServer, { cors: { origin: origins } })

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token
      if (!token) throw new Error('Authentication required')

      const payload = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(payload.sub).select('name avatar')
      if (!user) throw new Error('Authentication required')

      socket.user = user
      next()
    } catch {
      next(new Error('Authentication required'))
    }
  })

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString()
    const connectionCount = activeUsers.get(userId) || 0
    activeUsers.set(userId, connectionCount + 1)

    socket.join(`user:${userId}`)
    socket.emit('users:online', [...activeUsers.keys()])
    if (connectionCount === 0) {
      io.emit('user:online', { userId })
    }

    socket.on('conversation:join', async (conversationId, reply) => {
      try {
        if (!isValidObjectId(conversationId)) {
          return sendReply(reply, { ok: false, message: 'Invalid conversation.' })
        }

        const conversation = await Conversation.exists({
          _id: conversationId,
          members: socket.user._id,
        })

        if (!conversation) {
          return sendReply(reply, { ok: false, message: 'Conversation not found.' })
        }

        socket.join(conversationId)
        return sendReply(reply, { ok: true })
      } catch {
        return sendReply(reply, { ok: false, message: 'Could not join conversation.' })
      }
    })

    socket.on('conversation:leave', (conversationId) => {
      socket.leave(conversationId)
    })

    socket.on('typing:start', (conversationId) => {
      if (socket.rooms.has(conversationId)) {
        socket.to(conversationId).emit('typing:start', {
          conversationId,
          user: socket.user,
        })
      }
    })

    socket.on('typing:stop', (conversationId) => {
      if (socket.rooms.has(conversationId)) {
        socket.to(conversationId).emit('typing:stop', {
          conversationId,
          userId,
        })
      }
    })

    socket.on('disconnect', () => {
      const remainingConnections = (activeUsers.get(userId) || 1) - 1

      if (remainingConnections > 0) {
        activeUsers.set(userId, remainingConnections)
        return
      }

      activeUsers.delete(userId)
      const lastSeen = new Date()
      User.findByIdAndUpdate(userId, { lastSeen }).catch(console.error)
      io.emit('user:offline', { userId, lastSeen })
    })
  })

  return io
}
