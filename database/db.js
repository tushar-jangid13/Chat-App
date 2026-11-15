import mongoose from 'mongoose'

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI

  if (!uri) {
    throw new Error('MONGODB_URI is missing from the environment')
  }

  await mongoose.connect(uri, {
    dbName: process.env.MONGODB_DATABASE || 'tchat',
  })
  console.log('Connected to MongoDB')
}

export async function disconnectDatabase() {
  await mongoose.disconnect()
}

export function isValidObjectId(value) {
  return mongoose.isValidObjectId(value)
}
