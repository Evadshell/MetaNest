import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { rateLimit } from 'express-rate-limit';

const app = express();
const server = createServer(app);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);

// Improved error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Implement error reporting service here if needed
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://yourdomain.com'] 
      : ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 5000,
});

// Enhanced user tracking
class UserState {
  constructor(socket) {
    this.socket = socket;
    this.position = null;
    this.lastActive = Date.now();
    this.connectionTime = Date.now();
    this.currentZone = null;
    this.chatSessions = new Set();
    this.lastMove = Date.now();
  }

  updatePosition(position) {
    this.position = position;
    this.lastActive = Date.now();
    this.lastMove = Date.now();
  }

  setZone(zone) {
    this.currentZone = zone;
  }

  isInactive(timeout) {
    return Date.now() - this.lastActive > timeout;
  }
}
const users = new Map();
const MOVE_RATE_LIMIT = 50; // ms
const INACTIVE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const RECONNECT_WINDOW = 30000; // 30 seconds for reconnection attempts
const connectionAttempts = new Map();

// Middleware for authentication
io.use((socket, next) => {
  const clientId = socket.handshake.auth.clientId || socket.id;
  
  // Check for frequent reconnection attempts
  const lastAttempt = connectionAttempts.get(clientId);
  const now = Date.now();
  
  if (lastAttempt && (now - lastAttempt) < 1000) {
    return next(new Error('Rate limit exceeded'));
  }
  
  connectionAttempts.set(clientId, now);
  
  // Clean up old connection attempts
  setTimeout(() => connectionAttempts.delete(clientId), 5000);
  
  next();
});

io.on('connection', (socket) => {
  try {
    const existingUser = Array.from(users.values()).find(u => u.socket.handshake.auth.clientId === socket.handshake.auth.clientId);
if (existingUser) {
      console.log('User reconnected:', socket.id);
      // Update socket reference
      existingUser.socket = socket;
      users.set(socket.id, existingUser);
    }  else {
      console.log('New user connected:', socket.id);
      const user = new UserState(socket);
      users.set(socket.id, user);
      
      // Notify others of new user
      socket.broadcast.emit('user-joined', {
        userId: socket.id,
        totalUsers: users.size
      });
    }

    // Handle initial position
    socket.on('set-initial-position', (position) => {
      try {
        if (!isValidPosition(position)) {
          throw new Error('Invalid position data');
        }

        const user = users.get(socket.id);
        if (user) {
          user.updatePosition(position);
          broadcastPositions();
        }
      } catch (error) {
        handleError(socket, 'set-initial-position', error);
      }
    });

    // Handle movement with rate limiting
    socket.on('move', (position) => {
      try {
        const user = users.get(socket.id);
        if (!user) return;

        if (Date.now() - user.lastMove < MOVE_RATE_LIMIT) {
          return; // Rate limit exceeded
        }

        if (!isValidPosition(position)) {
          throw new Error('Invalid movement data');
        }

        user.updatePosition(position);
        broadcastPositions();
      } catch (error) {
        handleError(socket, 'move', error);
      }
    });

    // Handle zone changes
    socket.on('enter-zone', (zoneName) => {
      try {
        const user = users.get(socket.id);
        if (user) {
          user.setZone(zoneName);
          socket.broadcast.emit('user-zone-change', {
            userId: socket.id,
            zone: zoneName
          });
        }
      } catch (error) {
        handleError(socket, 'enter-zone', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      try {
        const user = users.get(socket.id);
        if (!user) return;

        // Give time for potential reconnection before full cleanup
        setTimeout(() => {
          const reconnected = Array.from(users.values()).some(u => 
            u.socket.handshake.auth.clientId === socket.handshake.auth.clientId
          );

          if (!reconnected) {
            handleDisconnect(socket.id, reason);
          }
        }, RECONNECT_WINDOW);

      } catch (error) {
        console.error('Error in disconnect handler:', error);
      }
    });

  } catch (error) {
    console.error('Error in connection handler:', error);
    socket.disconnect(true);
  }
});

// Helper functions
function isValidPosition(position) {
  return position && 
         typeof position === 'object' &&
         typeof position.x === 'number' &&
         typeof position.y === 'number' &&
         !isNaN(position.x) &&
         !isNaN(position.y);
}

function handleError(socket, event, error) {
  console.error(`Error in ${event}:`, error);
  socket.emit('error', {
    event,
    message: error.message
  });
}

function handleDisconnect(userId, reason) {
  users.delete(userId);
  io.emit('user-left', {
    userId,
    totalUsers: users.size,
    reason
  });
  broadcastPositions();
}

function broadcastPositions() {
  try {
    const positions = {};
    for (const [id, user] of users.entries()) {
      positions[id] = user.position;
    }
    io.emit('update-positions', positions);
  } catch (error) {
    console.error('Error broadcasting positions:', error);
  }
}

// Cleanup inactive users
setInterval(() => {
  try {
    for (const [socketId, user] of users.entries()) {
      if (user.isInactive(INACTIVE_TIMEOUT)) {
        handleDisconnect(socketId, 'inactivity');
      }
    }
  } catch (error) {
    console.error('Error in cleanup interval:', error);
  }
}, 60000);

// Health check endpoint
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
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
});