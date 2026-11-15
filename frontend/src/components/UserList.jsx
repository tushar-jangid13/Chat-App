import { useChatContext } from '../context/AuthContext'
import { Avatar } from './Message'

export default function UserList() {
  const {
    activeId,
    visibleChats,
    openChat,
    openUser,
    query,
    users,
    searchingUsers,
  } = useChatContext()

  if (query.trim()) {
    return (
      <nav className="chat-list" aria-label="Users">
        {searchingUsers && <p className="empty-search">Searching users…</p>}
        {!searchingUsers && query.trim().length < 2 && (
          <p className="empty-search">Type at least 2 characters to search.</p>
        )}
        {!searchingUsers && query.trim().length >= 2 && users.map((user) => {
          const initials = user.name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase()

          return (
            <button
              className="chat-row"
              key={user._id}
              onClick={() => openUser(user)}
            >
              <Avatar person={{ initials, color: 'lilac' }} />
              <span className="chat-details">
                <span className="chat-name">{user.name}</span>
                <span className="chat-preview">{user.email}</span>
              </span>
            </button>
          )
        })}
        {!searchingUsers && query.trim().length >= 2 && users.length === 0 && (
          <p className="empty-search">No users found.</p>
        )}
      </nav>
    )
  }

  return (
    <nav className="chat-list" aria-label="Conversations">
      {visibleChats.map((chat) => (
        <button
          className={`chat-row ${activeId === chat.id ? 'active' : ''}`}
          key={chat.id}
          onClick={() => openChat(chat)}
        >
          <Avatar person={chat} />
          <span className="chat-details">
            <span className="chat-name">{chat.name}</span>
          </span>
        </button>
      ))}
      {visibleChats.length === 0 && (
        <p className="empty-search">No conversations found.</p>
      )}
    </nav>
  )
}
