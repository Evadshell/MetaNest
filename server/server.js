// server.js
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
const app = express();
const server = createServer(app);
 const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});
 let users = {}; // Store user positions

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Broadcast new user joining
  socket.broadcast.emit('user-joined', socket.id);
 

  // Listen for initial position from new user
  socket.on('set-initial-position', (position) => {
    users[socket.id] = position;
     io.emit('update-positions', users); // Broadcast updated positions
  });

  // Listen for position updates and broadcast them
  socket.on('move', (position) => {
    users[socket.id] = position;
     io.emit('update-positions', users); // Send updated positions to all clients
  });
  socket.on('request-chat', (targetUserId) => {
    io.to(targetUserId).emit('chat-request', socket.id);
  });
  socket.on('send-message', ({ recipientId, message }) => {
    io.to(recipientId).emit('receive-message', { senderId: socket.id, message });
  });

  // Remove user on disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
     delete users[socket.id];
    io.emit('update-positions', users); // Update others about the disconnected user
  });
 
});

server.listen(4000, () => {
  console.log('Socket.IO server running on port 4000');
});
