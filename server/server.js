import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const users = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('set-initial-position', (position) => {
    console.log('Setting initial position for user:', socket.id, position);
    users.set(socket.id, position);
    io.emit('update-positions', Object.fromEntries(users));
  });

  socket.on('move', (position) => {
    console.log('User moved:', socket.id, position);
    users.set(socket.id, position);
    io.emit('update-positions', Object.fromEntries(users));
  });

  socket.on('chat-message', (message) => {
    console.log('Chat message received:', socket.id, message);
    io.emit('chat-message', { userId: socket.id, ...message });
  });

  // WebRTC signaling
  socket.on('offer', ({ to, offer }) => {
    console.log('Relaying offer from', socket.id, 'to:', to);
    socket.to(to).emit('offer', { from: socket.id, offer });
  });

  socket.on('answer', ({ to, answer }) => {
    console.log('Relaying answer from', socket.id, 'to:', to);
    socket.to(to).emit('answer', { from: socket.id, answer });
  });

  socket.on('ice-candidate', ({ to, candidate }) => {
    console.log('Relaying ICE candidate from', socket.id, 'to:', to);
    socket.to(to).emit('ice-candidate', { from: socket.id, candidate });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    users.delete(socket.id);
    io.emit('user-left', { userId: socket.id });
    io.emit('update-positions', Object.fromEntries(users));
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

console.log('Server is set up and running. Waiting for connections...');