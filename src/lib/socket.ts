import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'

let io: SocketIOServer | null = null

export function initializeSocket(server: HTTPServer) {
  if (io) {
    return io
  }

  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  })

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })

  return io
}

export function getSocketIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized')
  }
  return io
}

