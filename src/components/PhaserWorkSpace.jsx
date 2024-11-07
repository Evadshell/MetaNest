import { useEffect, useState } from "react";
import * as Phaser from "phaser";
import io from 'socket.io-client';
import { toast } from 'sonner';

class WorkspaceScene extends Phaser.Scene {
  constructor() {
    super({ key: "WorkspaceScene" });
    this.gridSize = 64;
    this.colors = {
      character: 0x4f46e5,
      chair: 0x22c55e,
      desk: 0xeab308,
    };
    this.players = new Map();
    this.chattingWith = null;
    this.socket = null;
    this.isInitialized = false;
    this.chatIndicators = new Map();
    this.connectionRetries = 0;
    this.maxRetries = 5;
    this.lastPosition = null; // Track last valid position

  }

  init(data) {
    if (!data || !data.width || !data.height) {
      console.error('Invalid workspace data:', data);
      data = { width: 10, height: 10 }; // Fallback dimensions
    }
    this.workspaceData = data;
    this.furniture = new Map();
    this.isInitialized = false;
  }


  create() {
    // Grid creation code remains the same...
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0xcccccc, 0.5);

    const width = this.workspaceData?.width || 10;
    const height = this.workspaceData?.height || 10;

    for (let x = 0; x <= width; x++) {
      graphics.moveTo(x * this.gridSize, 0);
      graphics.lineTo(x * this.gridSize, height * this.gridSize);
    }

    for (let y = 0; y <= height; y++) {
      graphics.moveTo(0, y * this.gridSize);
      graphics.lineTo(width * this.gridSize, y * this.gridSize);
    }
    graphics.strokePath();

    // Create player
    this.createPlayer();

    // this.player = this.add.graphics();
    // this.player.fillStyle(this.colors.character);
    // this.player.fillCircle(0, 0, this.gridSize / 3);

    // this.playerContainer = this.add.container(this.gridSize / 2, this.gridSize / 2, [this.player]);

    // const playerText = this.add.text(0, 0, "👤", {
    //   fontSize: "24px",
    //   color: "#FFFFFF",
    // });
    // playerText.setOrigin(0.5, 0.5);
    // this.playerContainer.add(playerText);

    // Initialize socket and keyboard
    this.initializeSocket();
    this.cursors = this.input.keyboard.createCursorKeys();

    this.isInitialized = true;
  }
  createPlayer() {
    // Create player graphics
    this.player = this.add.graphics();
    this.player.fillStyle(this.colors.character);
    this.player.fillCircle(0, 0, this.gridSize / 3);

    // Initial position at center of first grid cell
    const initialX = Math.max(this.gridSize / 2, 0);
    const initialY = Math.max(this.gridSize / 2, 0);
    
    this.playerContainer = this.add.container(initialX, initialY, [this.player]);
    this.lastPosition = {
      x: initialX,
      y: initialY
    };
    const playerText = this.add.text(0, 0, "👤", {
      fontSize: "24px",
      color: "#FFFFFF",
    });
    playerText.setOrigin(0.5, 0.5);
    this.playerContainer.add(playerText);
  }

  validatePosition(position) {
    if (!position || typeof position.x !== 'number' || typeof position.y !== 'number') {
      return false;
    }
    if (isNaN(position.x) || isNaN(position.y)) {
      return false;
    }
    return true;
  }
  initializeSocket() {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    console.log('Initializing socket connection...');
    
    this.socket = io('http://localhost:4000', {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket'],
      timeout: 10000
    });

    this.setupSocketListeners();
    // this.socket = io('http://localhost:4000', {
    //   reconnection: true,
    //   reconnectionAttempts: 5,
    //   reconnectionDelay: 1000,
    //   transports: ['websocket']
    // });

    // this.socket.on('connect', () => {
    //   console.log('Connected to server');
    //   this.socket.emit('set-initial-position', {
    //     x: this.playerContainer.x,
    //     y: this.playerContainer.y
    //   });
    // });

    // this.socket.on('user-joined', ({ userId, totalUsers }) => {
    //   toast.success(`New user joined! Total users: ${totalUsers}`);
    // });

    // this.socket.on('user-left', ({ userId }) => {
    //   this.removePlayer(userId);
    // });

    // this.socket.on('update-positions', (positions) => {
    //   this.updatePlayerPositions(positions);
    // });

    // this.socket.on('chat-request', ({ senderId }) => {
    //   this.handleChatRequest(senderId);
    // });

    // this.socket.on('connect_error', (error) => {
    //   console.error('Connection error:', error);
    //   toast.error('Failed to connect to server');
    // });
  }
  setupSocketListeners() {
    this.socket.on('connect', () => {
      console.log('Connected to server with ID:', this.socket.id);
      this.connectionRetries = 0;
      
      // Send initial position once connected
      const position = {
        x: this.playerContainer.x,
        y: this.playerContainer.y
      };
      console.log('Sending initial position:', position);
      this.socket.emit('set-initial-position', position);
      
      toast.success('Connected to server!');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.connectionRetries++;
      
      if (this.connectionRetries >= this.maxRetries) {
        toast.error('Failed to connect to server after multiple attempts');
        this.socket.disconnect();
      } else {
        toast.error(`Connection error (attempt ${this.connectionRetries}/${this.maxRetries})`);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      toast.error(`Disconnected from server: ${reason}`);
      
      if (reason === 'io server disconnect') {
        // Server disconnected us, retry connection
        this.socket.connect();
      }
    });

    this.socket.on('user-joined', ({ userId, totalUsers }) => {
      console.log('User joined:', userId, 'Total users:', totalUsers);
      toast.success(`New user joined! Total users: ${totalUsers}`);
    });

    this.socket.on('user-left', ({ userId, totalUsers }) => {
      console.log('User left:', userId, 'Total users:', totalUsers);
      this.removePlayer(userId);
      toast.info(`User left. Total users: ${totalUsers}`);
    });

    this.socket.on('update-positions', (positions) => {
      console.log('Received positions update:', positions);
      this.updatePlayerPositions(positions);
    });

    this.socket.on('chat-request', ({ senderId }) => {
      console.log('Received chat request from:', senderId);
      this.handleChatRequest(senderId);
    });
  }

  handleChatRequest(senderId) {
    // Remove existing chat indicator if any
    if (this.chatIndicators.has(senderId)) {
      this.chatIndicators.get(senderId).destroy();
      this.chatIndicators.delete(senderId);
    }

    const player = this.players.get(senderId);
    if (player) {
      const chatContainer = this.add.container(player.x, player.y - 40);
      
      // Add chat bubble background
      const bubble = this.add.graphics();
      bubble.fillStyle(0xFFFFFF, 0.9);
      bubble.lineStyle(2, 0x4f46e5);
      bubble.fillRoundedRect(-30, -15, 60, 30, 8);
      bubble.strokeRoundedRect(-30, -15, 60, 30, 8);
      
      // Add chat icon
      const chatIcon = this.add.text(0, 0, "💬", {
        fontSize: "20px"
      });
      chatIcon.setOrigin(0.5, 0.5);
      
      chatContainer.add([bubble, chatIcon]);
      chatContainer.setDepth(1000);
      chatContainer.setInteractive(new Phaser.Geom.Rectangle(-30, -15, 60, 30), Phaser.Geom.Rectangle.Contains);
      
      chatContainer.on('pointerdown', () => {
        this.game.events.emit('startChat', senderId);
        chatContainer.destroy();
        this.chatIndicators.delete(senderId);
      });

      chatContainer.on('pointerover', () => {
        bubble.clear();
        bubble.fillStyle(0xE8E8E8, 0.9);
        bubble.lineStyle(2, 0x4f46e5);
        bubble.fillRoundedRect(-30, -15, 60, 30, 8);
        bubble.strokeRoundedRect(-30, -15, 60, 30, 8);
      });

      chatContainer.on('pointerout', () => {
        bubble.clear();
        bubble.fillStyle(0xFFFFFF, 0.9);
        bubble.lineStyle(2, 0x4f46e5);
        bubble.fillRoundedRect(-30, -15, 60, 30, 8);
        bubble.strokeRoundedRect(-30, -15, 60, 30, 8);
      });

      this.chatIndicators.set(senderId, chatContainer);
    }
  }

  removePlayer(userId) {
    if (this.players.has(userId)) {
      this.players.get(userId).destroy();
      this.players.delete(userId);
    }
    if (this.chatIndicators.has(userId)) {
      this.chatIndicators.get(userId).destroy();
      this.chatIndicators.delete(userId);
    }
  }

  updatePlayerPositions(positions) {
    Object.entries(positions).forEach(([userId, position]) => {
      if (!position || userId === this.socket.id) return;

      if (!this.players.has(userId)) {
        // Create new player
        const playerGraphics = this.add.graphics();
        playerGraphics.fillStyle(0x00ff00);
        playerGraphics.fillCircle(0, 0, this.gridSize / 3);

        const container = this.add.container(position.x, position.y, [playerGraphics]);
        const playerText = this.add.text(0, 0, "👤", {
          fontSize: "24px",
          color: "#FFFFFF",
        });
        playerText.setOrigin(0.5, 0.5);
        container.add(playerText);

        this.players.set(userId, container);
      } else {
        // Update existing player position
        const player = this.players.get(userId);
        player.setPosition(position.x, position.y);
        
        // Update chat indicator position if it exists
        if (this.chatIndicators.has(userId)) {
          const indicator = this.chatIndicators.get(userId);
          indicator.setPosition(position.x, position.y - 40);
        }
        
        this.checkProximity(userId, position);
      }
    });
  }

  checkProximity(userId, position) {
    const dist = Phaser.Math.Distance.Between(
      this.playerContainer.x,
      this.playerContainer.y,
      position.x,
      position.y
    );

    if (dist < this.gridSize * 2 && !this.chatIndicators.has(userId)) {
      this.socket.emit('request-chat', userId);
    }
  }

  update() {
    if (!this.isInitialized || !this.socket?.connected || !this.playerContainer) return;

    const speed = 4;
    let moved = false;
    const currentPosition = {
      x: this.playerContainer.x,
      y: this.playerContainer.y
    };

    // Calculate new position based on input
    let newX = currentPosition.x;
    let newY = currentPosition.y;

    if (this.cursors.left.isDown) {
      newX -= speed;
      moved = true;
    } else if (this.cursors.right.isDown) {
      newX += speed;
      moved = true;
    }

    if (this.cursors.up.isDown) {
      newY -= speed;
      moved = true;
    } else if (this.cursors.down.isDown) {
      newY += speed;
      moved = true;
    }

    const maxX = (this.workspaceData.width * this.gridSize) - (this.gridSize / 2);
    const maxY = (this.workspaceData.height * this.gridSize) - (this.gridSize / 2);

    newX = Phaser.Math.Clamp(newX, this.gridSize / 2, maxX);
    newY = Phaser.Math.Clamp(newY, this.gridSize / 2, maxY);

    // Update position if it's valid and different from current
    if (!isNaN(newX) && !isNaN(newY) && 
        (newX !== currentPosition.x || newY !== currentPosition.y)) {
      
      this.playerContainer.setPosition(newX, newY);
      
      const newPosition = {
        x: newX,
        y: newY
      };

      // Only emit if position is valid and has changed
      if (this.validatePosition(newPosition) && 
          this.socket?.connected && 
          moved) {
        console.log('Emitting validated move:', newPosition);
        this.socket.emit('move', newPosition);
        this.lastPosition = newPosition;
      }
    } else if (this.lastPosition && 
              (isNaN(newX) || isNaN(newY))) {
      // Restore last valid position if new position is invalid
      this.playerContainer.setPosition(this.lastPosition.x, this.lastPosition.y);
    }


  }
}

const ChatModal = ({ recipientId, onClose }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:4000', {
      transports: ['websocket']
    });
    
    setSocket(newSocket);

    newSocket.on('receive-message', ({ senderId, message }) => {
      setMessages(prev => [...prev, { senderId, message, timestamp: new Date() }]);
    });

    return () => newSocket.disconnect();
  }, []);

  const sendMessage = () => {
    if (!message.trim() || !socket) return;
    
    socket.emit('send-message', { recipientId, message });
    setMessages(prev => [...prev, { 
      senderId: socket.id, 
      message,
      timestamp: new Date()
    }]);
    setMessage('');
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-xl border border-gray-200">
      <div className="p-4 border-b flex justify-between items-center bg-primary text-white rounded-t-lg">
        <h3 className="font-semibold">Chat</h3>
        <button 
          onClick={onClose}
          className="hover:bg-primary-dark rounded-full w-6 h-6 flex items-center justify-center"
        >
          ×
        </button>
      </div>
      <div className="h-96 overflow-y-auto p-4 space-y-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.senderId === socket?.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-2 rounded-lg ${
              msg.senderId === socket?.id 
                ? 'bg-primary text-white rounded-tr-none' 
                : 'bg-gray-100 rounded-tl-none'
            }`}>
              {msg.message}
              <div className={`text-xs mt-1 ${msg.senderId === socket?.id ? 'text-primary-100' : 'text-gray-500'}`}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            onClick={sendMessage}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default function PhaserWorkspace({ workspaceData }) {
  const [isClient, setIsClient] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatRecipient, setChatRecipient] = useState(null);
  const [gameInstance, setGameInstance] = useState(null);

  useEffect(() => {
    setIsClient(typeof window !== "undefined");
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const handleResize = () => {
      if (gameInstance) {
        const container = document.getElementById("phaser-container");
        if (!container) return;

        const parent = container.parentElement;
        if (!parent) return;

        // Get available space
        const availableWidth = parent.clientWidth - 32; // Account for padding
        const availableHeight = window.innerHeight - 200; // Account for header and margins

        // Calculate scale to fit
        const scaleX = availableWidth / (workspaceData.width * 64);
        const scaleY = availableHeight / (workspaceData.height * 64);
        const scale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond 1

        // Update game size
        gameInstance.scale.resize(workspaceData.width * 64, workspaceData.height * 64);
        gameInstance.scale.setZoom(scale);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isClient, gameInstance, workspaceData]);

  useEffect(() => {
    if (!isClient || !workspaceData) return;

    console.log('Initializing Phaser game with workspace data:', workspaceData);

    const config = {
      type: Phaser.AUTO,
      parent: "phaser-container",
      width: workspaceData.width * 64,
      height: workspaceData.height * 64,
      backgroundColor: "#FFFFFF",
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        parent: "phaser-container",
      },
      scene: WorkspaceScene
    };

    const game = new Phaser.Game(config);
    setGameInstance(game);

    game.events.on('startChat', (userId) => {
      console.log('Starting chat with user:', userId);
      setChatRecipient(userId);
      setShowChat(true);
    });

    // Handle resize after a short delay to ensure proper initialization
    setTimeout(() => {
      const container = document.getElementById("phaser-container");
      if (container) {
        const parent = container.parentElement;
        if (parent) {
          const availableWidth = parent.clientWidth - 32;
          const availableHeight = window.innerHeight - 200;
          const scaleX = availableWidth / (workspaceData.width * 64);
          const scaleY = availableHeight / (workspaceData.height * 64);
          const scale = Math.min(scaleX, scaleY, 1);
          game.scale.setZoom(scale);
        }
      }
    }, 100);

    return () => {
      console.log('Cleaning up Phaser game');
      game.destroy(true);
    };
  }, [isClient, workspaceData]);

  if (!isClient) return null;

  return (
    <div className="relative w-full h-full flex items-center justify-center">
    <div 
      id="phaser-container" 
      className="aspect-square w-full max-w-[800px] bg-white rounded-lg shadow-lg"
    />
    {showChat && (
      <ChatModal
        recipientId={chatRecipient}
        onClose={() => {
          setShowChat(false);
          setChatRecipient(null);
        }}
      />
    )}
  </div>
  );
}