import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'

function Router() {
  const { isLoggedIn, loading } = useAuth()
  const [route, setRoute] = useState(window.location.hash.replace(/^#\/?/, '') || 'login')

  useEffect(() => {
    function updateRoute() {
      setRoute(window.location.hash.replace(/^#\/?/, '') || 'home')
    }

    window.addEventListener('hashchange', updateRoute)
    return () => window.removeEventListener('hashchange', updateRoute)
  }, [])

  useEffect(() => {
    if (loading) return

    const authRoute = route === 'login' || route === 'register'

    if (!isLoggedIn && !authRoute) {
      window.location.hash = '/login'
    } else if (isLoggedIn && authRoute) {
      window.location.hash = '/home'
    }
  }, [isLoggedIn, loading, route])

  if (loading) return <main className="auth-page">Loading tChat…</main>

  if (!isLoggedIn) {
    return route === 'register' ? <Register /> : <Login />
  }

  if (route === 'profile') return <Profile />

  return <Home />
}

export default function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  )
}
