import User from '../models/User.js'
import { generateToken } from '../utils/generateToken.js'

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
  }
}

export async function register(req, res) {
  const { name, email, password } = req.body || {}

  if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' })
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters.' })
  }

  if (Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ message: 'Password must be 72 bytes or fewer.' })
  }

  const existingUser = await User.findOne({ email: email.trim().toLowerCase() })
  if (existingUser) {
    return res.status(409).json({ message: 'An account with that email already exists.' })
  }

  const user = await User.create({ name, email, password })
  const token = generateToken(user._id)

  return res.status(201).json({ user: publicUser(user), token })
}

export async function login(req, res) {
  const { email, password } = req.body || {}

  if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) {
    return res.status(400).json({ message: 'Email and password are required.' })
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password')
  const passwordIsCorrect = user && await user.checkPassword(password)

  if (!passwordIsCorrect) {
    return res.status(401).json({ message: 'Email or password is incorrect.' })
  }

  const token = generateToken(user._id)
  return res.json({ user: publicUser(user), token })
}

export function getCurrentUser(req, res) {
  return res.json({ user: publicUser(req.user) })
}
