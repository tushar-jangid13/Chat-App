import { io } from 'socket.io-client'

export function createChatSocket(token, url = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001') {
  return io(url, {
    autoConnect: false,
    auth: { token },
  })
}
