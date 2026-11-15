import 'dotenv/config'
import { createServer } from 'node:http'
import app from './app.js'
import { connectDatabase, disconnectDatabase } from './config/db.js'
import { attachSocketServer } from './sockets/socket.js'

const port = Number(process.env.PORT) || 5001

async function startServer() {
  if (!process.env.JWT_SECRET) {
    throw new Error('Set JWT_SECRET in backend/.env before starting the server.')
  }

  await connectDatabase()

  const httpServer = createServer(app)
  const io = attachSocketServer(httpServer)
  app.set('io', io)

  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`tChat API listening on http://localhost:${port}`)
  })

  function stopServer() {
    io.close(async () => {
      await disconnectDatabase()
      process.exit(0)
    })
  }

  process.on('SIGINT', stopServer)
  process.on('SIGTERM', stopServer)
}

startServer().catch((error) => {
  console.error('Could not start tChat:', error.message)
  process.exit(1)
})
