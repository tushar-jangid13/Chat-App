import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { user, logout } = useAuth()
  const name = user?.name || 'Username'
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  function signOut() {
    logout()
    window.location.hash = '/login'
  }

  return (
    <main className="auth-page">
      <section className="auth-card profile-page">
        <a className="back-link" href="#/home">← Back to messages</a>
        <div className="profile-large-avatar">{initials}</div>
        <h1>{name}</h1>
        <p>{user?.email || 'Personal workspace'}</p>
        <button className="auth-submit" onClick={signOut}>Sign out</button>
      </section>
    </main>
  )
}
