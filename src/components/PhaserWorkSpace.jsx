"use client";
// components/PhaserWorkspace.jsx
import { useEffect, useState } from "react";
import * as Phaser from "phaser";
import io from 'socket.io-client';
import { toast } from 'sonner';
const socket = io('http://localhost:4000'); // Connect to Socket.IO server
class WorkspaceScene extends Phaser.Scene {
  constructor() {
    super({ key: "WorkspaceScene" });
    this.gridSize = 64; // Size of each grid cell in pixels
     this.colors = {
      character: 0x4f46e5, // Indigo
      chair: 0x22c55e, // Green
      desk: 0xeab308, // Yellow
    };
    this.players = {};
    this.chattingWith = null;
  }

  init(data) {
    this.workspaceData = data;
    this.furniture = new Map(); // Track placed furniture
  }

  create() {
    const { width, height } = this.workspaceData;

    // Create grid
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0xcccccc, 0.5);

    // Draw vertical lines
    for (let x = 0; x <= width; x++) {
      graphics.moveTo(x * this.gridSize, 0);
      graphics.lineTo(x * this.gridSize, height * this.gridSize);
    }

    // Draw horizontal lines
    for (let y = 0; y <= height; y++) {
      graphics.moveTo(0, y * this.gridSize);
      graphics.lineTo(width * this.gridSize, y * this.gridSize);
    }
    graphics.strokePath();

    // Add player character (circle with avatar or initial)
    const characterX = this.gridSize / 2;
    const characterY = this.gridSize / 2;

    // Create character circle
    this.player = this.add.graphics();
    this.player.fillStyle(this.colors.character);
    this.player.fillCircle(0, 0, this.gridSize / 3);

    // Add player container (for easier movement)
    this.playerContainer = this.add.container(characterX, characterY, [
      this.player,
    ]);

    // Add character text (could be initial or emoji)
    const characterText = this.add.text(0, 0, "👤", {
      fontSize: "24px",
      color: "#FFFFFF",
    });
    characterText.setOrigin(0.5, 0.5);
    this.playerContainer.add(characterText);
   
    // Enable keyboard input
    this.cursors = this.input.keyboard.createCursorKeys();

    // Add furniture placement functionality
    this.input.keyboard.on("keydown-C", () => this.placeFurniture("chair"));
    this.input.keyboard.on("keydown-D", () => this.placeFurniture("desk"));

    // Add click listener for furniture placement
    this.input.on("pointerdown", (pointer) => {
      if (this.selectedFurniture) {
        const gridX = Math.floor(pointer.x / this.gridSize);
        const gridY = Math.floor(pointer.y / this.gridSize);
        this.placeFurnitureAt(this.selectedFurniture, gridX, gridY);
        this.selectedFurniture = null; // Reset selection
      }
    });

    // Add instructions text
    this.add.text(
      10,
      height * this.gridSize + 10,
      "Controls: Arrow Keys to move | Press C for Chair | Press D for Desk | Click to place furniture",
      { fontSize: "14px", fill: "#666" }
    );
    socket.on('user-joined', (userId) => {
        toast(`User ${userId} joined the workspace!`, { type: 'success' });
      });
  
      // Listen for updates to all players' positions
      socket.on('update-positions', (positions) => {
        this.updatePlayerPositions(positions);
      });
      socket.on('chat-request', (senderId) => {
        if (!this.chattingWith) {
          this.chattingWith = senderId;
          this.createChatButton();
        }
      });
      // Emit initial position to server
      socket.emit('set-initial-position', { x: this.playerContainer.x, y: this.playerContainer.y });
  }

  placeFurniture(type) {
    this.selectedFurniture = type;
  }

  placeFurnitureAt(type, gridX, gridY) {
    const key = `${gridX},${gridY}`;

    // Remove existing furniture at this position
    if (this.furniture.has(key)) {
      this.furniture.get(key).forEach((obj) => obj.destroy());
      this.furniture.delete(key);
    }

    // Create new furniture
    const x = gridX * this.gridSize + this.gridSize / 2;
    const y = gridY * this.gridSize + this.gridSize / 2;

    const circle = this.add.graphics();
    circle.fillStyle(this.colors[type]);
    circle.fillCircle(x, y, this.gridSize / 3);

    const letter = this.add.text(x, y, type === "chair" ? "C" : "D", {
      fontSize: "20px",
      color: "#FFFFFF",
    });
    letter.setOrigin(0.5, 0.5);

    this.furniture.set(key, [circle, letter]);

    // Save furniture placement to database
    this.saveFurniturePlacement(type, gridX, gridY);
  }

  async saveFurniturePlacement(type, x, y) {
    try {
      await fetch("/api/workspaceFurniture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spaceId: this.workspaceData.id,
          elementId: type,
          x,
          y,
        }),
      });
    } catch (error) {
      console.error("Failed to save furniture placement:", error);
    }
  }

  update() {
    const speed = 4;
     const initialPosition = { x: this.playerContainer.x, y: this.playerContainer.y };
        if (this.cursors.left.isDown) {
      this.playerContainer.x -= speed;
      
    } else if (this.cursors.right.isDown) {
      this.playerContainer.x += speed;
      
    }

    if (this.cursors.up.isDown) {
      this.playerContainer.y -= speed;
      
    } else if (this.cursors.down.isDown) {
      this.playerContainer.y += speed;
      
    }
    if (
        initialPosition.x !== this.playerContainer.x ||
        initialPosition.y !== this.playerContainer.y
      ) {
        socket.emit('move', { x: this.playerContainer.x, y: this.playerContainer.y });
      }
    // Keep player within bounds
    this.playerContainer.x = Phaser.Math.Clamp(
      this.playerContainer.x,
      this.gridSize / 2,
      this.workspaceData.width * this.gridSize - this.gridSize / 2
    );
    this.playerContainer.y = Phaser.Math.Clamp(
      this.playerContainer.y,
      this.gridSize / 2,
      this.workspaceData.height * this.gridSize - this.gridSize / 2
    );
  }


   
  updatePlayerPositions(positions) {
    Object.keys(positions).forEach((userId) => {
      if (userId === socket.id) return; // Skip our own player

      if (!this.players[userId]) {
        // Create a new player if they don’t exist yet
        const player = this.add.circle(positions[userId].x, positions[userId].y, 10, 0x00ff00);
        this.players[userId] = player;
      } else {
        // Update existing player’s position
        this.players[userId].x = positions[userId].x;
        this.players[userId].y = positions[userId].y;
        this.checkProximity(userId, positions[userId]);
      }
    });
  }
  checkProximity(userId, position) {
    const dist = Phaser.Math.Distance.Between(this.playerContainer.x, this.playerContainer.y, position.x, position.y);
    if (dist < 64 && !this.chattingWith) {
      this.chattingWith = userId;
      socket.emit('request-chat', userId);
    }
  }

  createChatButton() {
    const chatButton = this.add.text(10, 10, 'Chat', { fontSize: '20px', backgroundColor: '#4f46e5', color: '#fff' })
      .setInteractive()
      .on('pointerdown', () => this.openChatModal());
  }

  openChatModal() {
    this.scene.launch('ChatModal', { recipientId: this.chattingWith });
  }

}
function ChatModal({ recipientId }) {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
  
    useEffect(() => {
      socket.on('receive-message', ({ senderId, message }) => {
        setMessages((msgs) => [...msgs, { senderId, message }]);
      });
    }, []);
  
    const sendMessage = () => {
      if (message) {
        socket.emit('send-message', { recipientId, message });
        setMessages((msgs) => [...msgs, { senderId: socket.id, message }]);
        setMessage('');
      }
    };
  
    return (
      <div className="chat-modal">
        <div className="chat-history">
          {messages.map((msg, i) => (
            <div key={i} className={msg.senderId === socket.id ? 'my-message' : 'their-message'}>
              {msg.message}
            </div>
          ))}
        </div>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    );
  }
  
export default function PhaserWorkspace({ workspaceData }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Check if we're in the browser
    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const config = {
      type: Phaser.AUTO,
      parent: "phaser-container",
      width: workspaceData.width * 64,
      height: workspaceData.height * 64 + 40, // Extra height for instructions
      scene: WorkspaceScene,
      backgroundColor: "#FFFFFF",
    };

    const game = new Phaser.Game(config);
    game.scene.start("WorkspaceScene", workspaceData);

    return () => {
      game.destroy(true);
     };
  }, [isClient, workspaceData]);

  if (!isClient) return null;

  return (
    <div
      id="phaser-container"
      className="border rounded-lg shadow-lg bg-white"
    />
  );
}
