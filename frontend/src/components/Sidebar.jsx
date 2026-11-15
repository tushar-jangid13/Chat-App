import { useRef } from 'react'
import { useAuth, useChatContext } from '../context/AuthContext'
import { Avatar, Icon } from './Message'
import Navbar from './Navbar'
import UserList from './UserList'

export default function Sidebar() {
  const { query, setQuery } = useChatContext()
  const { user } = useAuth()
  const searchInput = useRef(null)
  const profileName = user?.name || 'Username'
  const initials = profileName
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  function openProfile() {
    window.location.hash = '/profile'
  }

  return (
    <aside className="sidebar">
      <Navbar />

      <div className="chat-heading">
        <span>Messages</span>
        <button
          className="icon-button quiet"
          aria-label="New chat"
          onClick={() => searchInput.current?.focus()}
        >
          <Icon name="plus" size={18} />
        </button>
      </div>

      <label className="search-box">
        <Icon name="search" size={17} />
        <input
          ref={searchInput}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search users"
          aria-label="Search users"
        />
      </label>

      <UserList />

      <footer className="sidebar-footer">
        <button
          type="button"
          className="sidebar-profile"
          onClick={openProfile}
        >
          <Avatar person={{ initials, color: 'lilac' }} />
          <span className="sidebar-profile-copy">
            <strong>{profileName}</strong>
            <span>Personal workspace</span>
          </span>
        </button>
      </footer>
    </aside>
  )
}
