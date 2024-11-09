import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { rateLimit } from 'express-rate-limit';

const app = express();
const server = createServer(app);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use(limiter);

const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.CLIENT_URL] 
      : ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

class GameWorld {
  constructor() {
    this.players = new Map();
    this.collectibles = new Map();
    this.leaderboard = [];
    this.worldBounds = { width: 2000, height: 1500 };
    this.spawnCollectibles();
  }

  spawnCollectibles() {
    for (let i = 0; i < 20; i++) {
      this.addCollectible();
    }
  }

  addCollectible() {
    const id = Math.random().toString(36).substr(2, 9);
    this.collectibles.set(id, {
      id,
      x: Math.random() * this.worldBounds.width,
      y: Math.random() * this.worldBounds.height,
      type: Math.random() > 0.8 ? 'power' : 'points',
      value: Math.random() > 0.8 ? 10 : 1
    });
  }

  addPlayer(socketId, playerData) {
    const spawnPoint = this.getRandomSpawnPoint();
    this.players.set(socketId, {
      id: socketId,
      x: spawnPoint.x,
      y: spawnPoint.y,
      size: 20,
      speed: 300,
      color: playerData.color || this.getRandomColor(),
      score: 0,
      powerUps: [],
      username: playerData.username || `Player${socketId.substr(0, 4)}`,
      lastActive: Date.now(),
      lastPosition: spawnPoint
    });
    this.updateLeaderboard();
  }

  getRandomSpawnPoint() {
    return {
      x: Math.random() * (this.worldBounds.width - 100) + 50,
      y: Math.random() * (this.worldBounds.height - 100) + 50
    };
  }

  getRandomColor() {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  updatePlayer(socketId, data) {
    const player = this.players.get(socketId);
    if (player) {
      const newPos = this.validatePosition(data);
      Object.assign(player, newPos, { lastActive: Date.now() });
      this.checkCollectibleCollisions(socketId);
    }
  }

  validatePosition(position) {
    return {
      x: Math.max(0, Math.min(position.x, this.worldBounds.width)),
      y: Math.max(0, Math.min(position.y, this.worldBounds.height))
    };
  }

  checkCollectibleCollisions(playerId) {
    const player = this.players.get(playerId);
    if (!player) return;

    this.collectibles.forEach((collectible, collectibleId) => {
      if (this.checkCollision(player, collectible)) {
        this.handleCollection(playerId, collectibleId);
      }
    });
  }

  checkCollision(player, collectible) {
    const distance = Math.sqrt(
      Math.pow(player.x - collectible.x, 2) + 
      Math.pow(player.y - collectible.y, 2)
    );
    return distance < player.size + 10;
  }

  handleCollection(playerId, collectibleId) {
    const player = this.players.get(playerId);
    const collectible = this.collectibles.get(collectibleId);
    
    if (player && collectible) {
      if (collectible.type === 'power') {
        player.powerUps.push({
          type: 'speed',
          duration: 5000,
          startTime: Date.now()
        });
        player.speed = 450; // Temporary speed boost
        setTimeout(() => {
          player.speed = 300;
          player.powerUps = player.powerUps.filter(p => p.startTime + p.duration > Date.now());
        }, 5000);
      } else {
        player.score += collectible.value;
      }
      
      this.collectibles.delete(collectibleId);
      this.addCollectible(); // Spawn new collectible
      this.updateLeaderboard();
      
      return {
        playerId,
        collectibleId,
        playerState: player,
        newCollectible: Array.from(this.collectibles.values()).pop()
      };
    }
    return null;
  }

  updateLeaderboard() {
    this.leaderboard = Array.from(this.players.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(p => ({
        username: p.username,
        score: p.score,
        id: p.id
      }));
  }

  removePlayer(socketId) {
    this.players.delete(socketId);
    this.updateLeaderboard();
  }

  getState() {
    return {
      players: Object.fromEntries(this.players),
      collectibles: Object.fromEntries(this.collectibles),
      leaderboard: this.leaderboard
    };
  }
}

const gameWorld = new GameWorld();
const MOVE_RATE_LIMIT = 16;
const INACTIVE_TIMEOUT = 5 * 60 * 1000;

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('player-join', (playerData = {}) => {
    try {
      gameWorld.addPlayer(socket.id, playerData);
      socket.emit('game-state', gameWorld.getState());
      socket.broadcast.emit('player-joined', gameWorld.players.get(socket.id));
    } catch (error) {
      handleError(socket, 'player-join', error);
    }
  });

  socket.on('player-move', (movement) => {
    try {
      const player = gameWorld.players.get(socket.id);
      if (!player || Date.now() - player.lastActive < MOVE_RATE_LIMIT) return;

      const collectionUpdate = gameWorld.updatePlayer(socket.id, movement);
      
      socket.broadcast.emit('player-moved', {
        id: socket.id,
        ...gameWorld.players.get(socket.id)
      });

      if (collectionUpdate) {
        io.emit('collectible-collected', collectionUpdate);
      }
    } catch (error) {
      handleError(socket, 'player-move', error);
    }
  });

  socket.on('disconnect', () => {
    gameWorld.removePlayer(socket.id);
    io.emit('player-left', { id: socket.id, leaderboard: gameWorld.leaderboard });
  });
});

function handleError(socket, event, error) {
  console.error(`Error in ${event}:`, error);
  socket.emit('error', { event, message: error.message });
}

setInterval(() => {
  for (const [socketId, player] of gameWorld.players.entries()) {
    if (Date.now() - player.lastActive > INACTIVE_TIMEOUT) {
      gameWorld.removePlayer(socketId);
      io.emit('player-left', { id: socketId, leaderboard: gameWorld.leaderboard });
    }
  }
}, 60000);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Game server running on port ${PORT}`));