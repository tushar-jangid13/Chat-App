import { useEffect, useMemo, useState } from 'react'
import { createChatSocket } from '../services/socket'

export default function useSocket(token) {
  const [connection, setConnection] = useState({ token: null, status: 'disconnected' })
  const socket = useMemo(() => token ? createChatSocket(token) : null, [token])

  useEffect(() => {
    if (!socket) return undefined

    socket.on('connect', () => setConnection({ token, status: 'connected' }))
    socket.on('disconnect', () => setConnection({ token, status: 'disconnected' }))
    socket.on('connect_error', () => setConnection({ token, status: 'error' }))
    socket.connect()

    return () => {
      socket.disconnect()
    }
  }, [socket, token])

  const status = !token
    ? 'disconnected'
    : connection.token === token
      ? connection.status
      : 'connecting'

  return { socket, status }
}
