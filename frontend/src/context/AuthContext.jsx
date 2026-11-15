/* oxlint-disable react/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../services/api'

export const AuthContext = createContext(null)
export const ChatContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('tchat-token'))
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('tchat-token')))

  useEffect(() => {
    const token = localStorage.getItem('tchat-token')
    if (!token) return

    api.get('/auth/me')
      .then(({ user: savedUser }) => setUser(savedUser))
      .catch(() => {
        localStorage.removeItem('tchat-token')
        localStorage.removeItem('tchat-user')
        setToken(null)
      })
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    const session = await api.post('/auth/login', { email, password })
    saveSession(session)
  }

  async function register(name, email, password) {
    const session = await api.post('/auth/register', { name, email, password })
    saveSession(session)
  }

  function saveSession(session) {
    localStorage.setItem('tchat-token', session.token)
    localStorage.setItem('tchat-user', JSON.stringify(session.user))
    setUser(session.user)
    setToken(session.token)
  }

  function logout() {
    localStorage.removeItem('tchat-token')
    localStorage.removeItem('tchat-user')
    setUser(null)
    setToken(null)
  }

  const value = {
    user,
    token,
    loading,
    isLoggedIn: Boolean(user && token),
    login,
    register,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}

export function useChatContext() {
  const value = useContext(ChatContext)
  if (!value) throw new Error('useChatContext must be used inside ChatContext.Provider')
  return value
}
