import User from '../models/User.js'

export async function listUsers(req, res) {
  const search = req.query.search?.trim()
  const filter = { _id: { $ne: req.user._id } }

  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    filter.$or = [
      { name: { $regex: escapedSearch, $options: 'i' } },
      { email: { $regex: escapedSearch, $options: 'i' } },
    ]
  }

  const users = await User.find(filter)
    .select('name email avatar lastSeen')
    .sort({ name: 1 })
    .limit(50)

  return res.json({ users })
}

export async function getUser(req, res) {
  const user = await User.findById(req.params.userId).select('name email avatar lastSeen')

  if (!user) {
    return res.status(404).json({ message: 'User not found.' })
  }

  return res.json({ user })
}
