import cors from 'cors'
import express from 'express'
import authRoutes from './routes/authRoutes.js'
import messageRoutes from './routes/messageRoutes.js'
import userRoutes from './routes/userRoutes.js'
import { handleError } from './middleware/errorMiddleware.js'

const app = express()
const authAttempts = new Map()
let authAttemptChecks = 0
const localOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://[::1]:5173',
]
const configuredOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
const allowedOrigins = [...new Set([...localOrigins, ...configuredOrigins])]

app.disable('x-powered-by')
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  })
  if (req.secure || req.get('x-forwarded-proto') === 'https') {
    res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  next()
})

function limitAuthAttempts(req, res, next) {
  const now = Date.now()
  const windowMs = 15 * 60 * 1000
  const maxAttempts = 10
  const key = req.ip
  const current = authAttempts.get(key)
  const attempt = !current || current.resetAt <= now
    ? { count: 0, resetAt: now + windowMs }
    : current

  if (attempt.count >= maxAttempts) {
    res.set('Retry-After', String(Math.ceil((attempt.resetAt - now) / 1000)))
    return res.status(429).json({ message: 'Too many sign-in attempts. Try again later.' })
  }

  attempt.count += 1
  authAttempts.set(key, attempt)
  authAttemptChecks += 1
  if (authAttemptChecks % 256 === 0) {
    for (const [ip, savedAttempt] of authAttempts) {
      if (savedAttempt.resetAt <= now) authAttempts.delete(ip)
    }
    while (authAttempts.size > 10_000) {
      authAttempts.delete(authAttempts.keys().next().value)
    }
  }
  return next()
}

app.use(cors({ origin: allowedOrigins }))
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth/login', limitAuthAttempts)
app.use('/api/auth/register', limitAuthAttempts)
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/messages', messageRoutes)

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' })
})

app.use(handleError)

export default app
