import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);

// Enhanced error handling for server creation
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000, // 60 seconds
  pingInterval: 25000, // 25 seconds
  connectTimeout: 5000, // 5 seconds
});

// Track connected users and their states with error handling
const users = new Map();

// Middleware to handle connection errors
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (socket.handshake.headers['x-forwarded-for']) {
    console.log('Client IP:', socket.handshake.headers['x-forwarded-for']);
  }
  next();
});

io.on('connection', (socket) => {
  try {
    console.log('User connected:', socket.id);
    
    // Initialize user data with error handling
    users.set(socket.id, {
      position: null,
      lastActive: Date.now(),
      connectionTime: Date.now(),
      chatSessions: []

    });

    // Notify others of new user with error handling
    socket.broadcast.emit('user-joined', {
      userId: socket.id,
      totalUsers: users.size
    });

    // Handle initial position with validation
    socket.on('set-initial-position', (position) => {
      try {
        if (!position || typeof position !== 'object') {
          throw new Error('Invalid position data');
        }

        const userData = users.get(socket.id);
        if (userData) {
          userData.position = position;
          userData.lastActive = Date.now();
          users.set(socket.id, userData);

          // Send current positions to all clients
          broadcastPositions();
        }
      } catch (error) {
        console.error('Error in set-initial-position:', error);
        socket.emit('error', 'Invalid position data');
      }
    });

    // Handle movement updates with rate limiting
    let lastMoveTime = Date.now();
    const MOVE_RATE_LIMIT = 50; // milliseconds

    socket.on('move', (position) => {
      try {
        const now = Date.now();
        if (now - lastMoveTime < MOVE_RATE_LIMIT) {
          return; // Rate limit exceeded
        }
        lastMoveTime = now;

        if (!position || typeof position !== 'object') {
          throw new Error('Invalid movement data');
        }

        const userData = users.get(socket.id);
        if (userData) {
          userData.position = position;
          userData.lastActive = now;
          users.set(socket.id, userData);

          // Broadcast position update to all clients
          broadcastPositions();
        }
      } catch (error) {
        console.error('Error in move handler:', error);
        socket.emit('error', 'Invalid movement data');
      }
    });

    // Handle chat requests with validation
    socket.on('request-chat', (targetUserId) => {
      try {
        if (!targetUserId || !users.has(targetUserId) || targetUserId === socket.id) {
          throw new Error('Invalid target user');
        }
  
        const existingSession = users.get(socket.id).chatSessions.find(
          (session) => session.participants.includes(targetUserId)
        );
  
        if (existingSession) {
          // Session already exists
          socket.emit('chat-already-exists', existingSession.id);
          return;
        }
  
        // Create a new chat session
        const newChatSession = {
          id: `chat-${socket.id}-${targetUserId}`,
          participants: [socket.id, targetUserId],
          messages: [],
        };
  
        // Register session for both users
        users.get(socket.id).chatSessions.push(newChatSession);
        users.get(targetUserId).chatSessions.push(newChatSession);
  
        // Notify both users of the chat request
        [socket.id, targetUserId].forEach((userId) =>
          io.to(userId).emit('chat-request', {
            senderId: socket.id,
            chatSessionId: newChatSession.id,
            timestamp: Date.now(),
          })
        );
      } catch (error) {
        console.error('Error in chat request:', error);
        socket.emit('error', 'Invalid chat request');
      }
    });

    // Handle messages with size limit
    socket.on('send-message', ({ chatSessionId, message }) => {
      try {
        if (!chatSessionId || !message || message.length > 1000) {
          throw new Error('Invalid message data');
        }
  
        const senderData = users.get(socket.id);
        const chatSession = senderData.chatSessions.find(
          (session) => session.id === chatSessionId
        );
  
        if (chatSession) {
          const newMessage = {
            senderId: socket.id,
            message,
            timestamp: Date.now(),
          };
          chatSession.messages.push(newMessage);
  
          chatSession.participants.forEach((participantId) =>
            io.to(participantId).emit('receive-message', newMessage)
          );
        } else {
          socket.emit('error', 'Chat session not found');
        }
      } catch (error) {
        console.error('Error in message handling:', error);
        socket.emit('error', 'Invalid message data');
      }
    });

    // Handle disconnection with cleanup
    socket.on('disconnect', (reason) => {
      try {
        console.log('User disconnected:', socket.id, 'Reason:', reason);
        users.delete(socket.id);

        // Notify remaining users
        io.emit('user-left', {
          userId: socket.id,
          totalUsers: users.size,
          reason
        });

        broadcastPositions();
      } catch (error) {
        console.error('Error in disconnect handler:', error);
      }
    });
  } catch (error) {
    console.error('Error in connection handler:', error);
  }
});

// Helper function to broadcast positions
function broadcastPositions() {
  try {
    io.emit('update-positions', Object.fromEntries(
      Array.from(users.entries()).map(([id, data]) => [id, data.position])
    ));
  } catch (error) {
    console.error('Error broadcasting positions:', error);
  }
}

// Clean up inactive users with error handling
setInterval(() => {
  try {
    const now = Date.now();
    const inactiveTimeout = 5 * 60 * 1000; // 5 minutes

    for (const [socketId, userData] of users.entries()) {
      if (now - userData.lastActive > inactiveTimeout) {
        users.delete(socketId);
        io.emit('user-left', {
          userId: socketId,
          totalUsers: users.size,
          reason: 'inactivity'
        });
      }
    }
  } catch (error) {
    console.error('Error in cleanup interval:', error);
  }
}, 60000);

// Enhanced health check endpoint
app.get('/health', (req, res) => {
  try {
    const metrics = {
      status: 'healthy',
      connections: users.size,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
    res.status(200).json(metrics);
  } catch (error) {
    console.error('Error in health check:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

const PORT = process.env.PORT || 4000;

// Enhanced server startup
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
  console.log('Server configuration:', {
    pingTimeout: io.engine.opts.pingTimeout,
    pingInterval: io.engine.opts.pingInterval,
    connectTimeout: io.engine.opts.connectTimeout
  });
});

// Enhanced graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
});