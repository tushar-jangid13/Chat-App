import { useCallback, useEffect, useState } from 'react'
import ChatBox from '../components/ChatBox'
import Sidebar from '../components/Sidebar'
import { ChatContext, useAuth } from '../context/AuthContext'
import useSocket from '../hooks/useSocket'
import { api } from '../services/api'
import '../styles/App.css'

const avatarColors = ['peach', 'lilac', 'mint', 'blue', 'yellow']

function makeInitials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function formatTime(date) {
  if (!date) return ''
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date))
}

function formatConversation(conversation, currentUserId, index = 0) {
  const otherMember = conversation.members.find(
    (member) => String(member._id) !== String(currentUserId),
  )
  const name = conversation.isGroup
    ? conversation.name
    : otherMember?.name || 'Conversation'

  return {
    id: String(conversation._id),
    name,
    initials: makeInitials(name),
    color: avatarColors[index % avatarColors.length],
    participantId: otherMember ? String(otherMember._id) : null,
    preview: conversation.lastMessage?.text || 'Start a conversation',
    time: formatTime(conversation.lastMessage?.createdAt || conversation.updatedAt),
    unread: 0,
    online: false,
  }
}

function formatMessage(message, currentUserId) {
  return {
    id: String(message._id),
    from: String(message.sender._id) === String(currentUserId) ? 'me' : 'them',
    text: message.text,
    time: formatTime(message.createdAt),
  }
}

export default function Home() {
  const { user, token } = useAuth()
  const userId = user?.id || user?._id
  const { socket } = useSocket(token)

  const [chats, setChats] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [users, setUsers] = useState([])
  const [searchedUserQuery, setSearchedUserQuery] = useState('')
  const [draft, setDraft] = useState('')
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')

  const activeChat = chats.find((chat) => chat.id === activeId) || null
  const loadChats = useCallback(async () => {
    const { conversations } = await api.get('/messages/conversations')
    const nextChats = conversations.map((conversation, index) =>
      formatConversation(conversation, userId, index),
    )

    setChats(nextChats)
    if (nextChats.length === 0) setMessages([])
    setActiveId((currentId) => {
      if (nextChats.some((chat) => chat.id === currentId)) return currentId
      return nextChats[0]?.id || null
    })
  }, [userId])

  useEffect(() => {
    // Load the signed-in user's conversations from the API.
    // oxlint-disable-next-line react/set-state-in-effect
    loadChats().catch((error) => setNotice(error.message))
  }, [loadChats])

  useEffect(() => {
    const search = query.trim()
    if (search.length < 2) return undefined

    let cancelled = false
    const timeout = window.setTimeout(async () => {
      try {
        const result = await api.get(`/users?search=${encodeURIComponent(search)}`)
        if (!cancelled) {
          setUsers(result.users)
          setSearchedUserQuery(search)
        }
      } catch (error) {
        if (!cancelled) {
          setUsers([])
          setSearchedUserQuery(search)
          setNotice(error.message)
        }
      }
    }, 250)

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [query])

  useEffect(() => {
    if (!activeId) return undefined

    let cancelled = false
    const path = `/messages/conversations/${activeId}`

    async function loadMessages() {
      try {
        const result = await api.get(`${path}/messages`)
        if (cancelled) return
        setMessages(result.messages.map((message) => formatMessage(message, userId)))
        await api.patch(`${path}/read`)
      } catch (error) {
        if (!cancelled) setNotice(error.message)
      }
    }

    loadMessages()
    return () => {
      cancelled = true
    }
  }, [activeId, userId])

  useEffect(() => {
    if (!socket || !activeId) return undefined

    socket.emit('conversation:join', activeId)

    function receiveMessage(message) {
      if (String(message.conversation) !== activeId) return
      const nextMessage = formatMessage(message, userId)
      setMessages((current) => {
        if (current.some((item) => item.id === nextMessage.id)) return current
        return [...current, nextMessage]
      })
    }

    socket.on('message:new', receiveMessage)
    return () => {
      socket.emit('conversation:leave', activeId)
      socket.off('message:new', receiveMessage)
    }
  }, [socket, activeId, userId])

  useEffect(() => {
    if (!socket) return undefined

    function updatePresence({ userId: changedUserId, online }) {
      setChats((current) => current.map((chat) => (
        chat.participantId === changedUserId ? { ...chat, online } : chat
      )))
    }

    function setOnlineUsers(userIds) {
      const onlineUsers = new Set(userIds)
      setChats((current) => current.map((chat) => ({
        ...chat,
        online: onlineUsers.has(chat.participantId),
      })))
    }

    function updateConversations() {
      loadChats().catch((error) => setNotice(error.message))
    }

    socket.on('user:online', (event) => updatePresence({ ...event, online: true }))
    socket.on('user:offline', (event) => updatePresence({ ...event, online: false }))
    socket.on('users:online', setOnlineUsers)
    socket.on('conversation:updated', updateConversations)

    return () => {
      socket.off('user:online')
      socket.off('user:offline')
      socket.off('users:online', setOnlineUsers)
      socket.off('conversation:updated', updateConversations)
    }
  }, [socket, loadChats])

  function openChat(chat) {
    setActiveId(chat.id)
    setNotice('')
  }

  async function openUser(person) {
    try {
      const { conversation } = await api.post('/messages/conversations', {
        participantId: person._id,
      })
      const chat = formatConversation(conversation, userId)
      setChats((current) => [chat, ...current.filter((item) => item.id !== chat.id)])
      setActiveId(chat.id)
      setQuery('')
      setNotice('')
    } catch (error) {
      setNotice(error.message)
    }
  }

  async function sendMessage(event) {
    event.preventDefault()
    const text = draft.trim()
    if (!text || !activeChat) return

    setDraft('')
    try {
      const { message } = await api.post(
        `/messages/conversations/${activeId}/messages`,
        { text },
      )
      const nextMessage = formatMessage(message, userId)
      setMessages((current) => {
        if (current.some((item) => item.id === nextMessage.id)) return current
        return [...current, nextMessage]
      })
    } catch (error) {
      setDraft(text)
      setNotice(error.message)
    }
  }

  function notify(text) {
    setNotice(text)
    window.setTimeout(() => setNotice(''), 2500)
  }

  const chatState = {
    activeId,
    activeChat,
    visibleChats: chats,
    users,
    searchingUsers: query.trim().length >= 2 && searchedUserQuery !== query.trim(),
    messages,
    setMessages,
    draft,
    setDraft,
    query,
    setQuery,
    notice,
    openChat,
    openUser,
    sendMessage,
    notify,
  }

  return (
    <ChatContext.Provider value={chatState}>
      <main className="app-shell">
        <Sidebar />
        <ChatBox />
      </main>
    </ChatContext.Provider>
  )
}
