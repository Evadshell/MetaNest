import { useEffect, useState, useCallback } from "react";
import * as Phaser from "phaser";
import io from "socket.io-client";
import { toast } from "sonner";

class WorkspaceScene extends Phaser.Scene {
  constructor() {
    super({ key: "WorkspaceScene" });
    this.gridSize = 64;
    this.colors = {
      grid: 0xe2e8f0,
      gridBg: 0xf8fafc,
      player: 0x4f46e5,
      otherPlayer: 0x22c55e,
      meetingZone: {
        fill: 0xfef3c7,
        border: 0xf59e0b
      },
      chatZone: {
        fill: 0xdbeafe,
        border: 0x3b82f6
      },
      dndZone: {
        fill: 0xfee2e2,
        border: 0xef4444
      },
      activeZone: {
        fill: 0xf0fdf4,
        border: 0x22c55e
      }
    };
    this.players = new Map();
    this.chatIndicators = new Map();
    this.zones = new Map();
    this.socket = null;
    this.isInitialized = false;
    this.connectionRetries = 0;
    this.maxRetries = 5;
    this.lastPosition = null;
    this.playerSpeed = 5;
    this.socketReconnectDelay = 1000;
  }

  init(data) {
    const defaultData = { width: 15, height: 15 };
    this.workspaceData = data?.width && data?.height ? data : defaultData;
    this.furniture = new Map();
    this.isInitialized = false;
  }

  create() {
    this.createBackground();
    this.createZones();
    this.createPlayer();
    this.initializeSocket();
    this.setupInteractions();
    
    // Add smooth camera follow
    this.cameras.main.startFollow(this.playerContainer, true, 0.09, 0.09);
    this.cameras.main.setZoom(1);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.isInitialized = true;
  }

  createBackground() {
    const { width, height } = this.workspaceData;
    
    // Create subtle gradient background
    const background = this.add.graphics();
    background.fillGradientStyle(
      0xffffff,
      0xffffff,
      0xf8fafc,
      0xf8fafc,
      1
    );
    background.fillRect(0, 0, width * this.gridSize, height * this.gridSize);

    // Create grid with softer lines
    const grid = this.add.graphics();
    grid.lineStyle(1, this.colors.grid, 0.2);

    // Draw vertical lines
    for (let x = 0; x <= width; x++) {
      grid.moveTo(x * this.gridSize, 0);
      grid.lineTo(x * this.gridSize, height * this.gridSize);
    }

    // Draw horizontal lines
    for (let y = 0; y <= height; y++) {
      grid.moveTo(0, y * this.gridSize);
      grid.lineTo(width * this.gridSize, y * this.gridSize);
    }

    grid.strokePath();
  }

  createZones() {
    const zoneConfigs = [
      {
        type: 'meeting',
        x: 2,
        y: 2,
        width: 4,
        height: 4,
        colors: this.colors.meetingZone,
        label: 'Meeting Area'
      },
      {
        type: 'chat',
        x: 8,
        y: 2,
        width: 3,
        height: 3,
        colors: this.colors.chatZone,
        label: 'Chat Zone'
      },
      {
        type: 'dnd',
        x: 2,
        y: 8,
        width: 3,
        height: 3,
        colors: this.colors.dndZone,
        label: 'Do Not Disturb'
      }
    ];

    zoneConfigs.forEach(config => {
      const zone = this.add.graphics();
      
      // Fill zone with semi-transparent color
      zone.fillStyle(config.colors.fill, 0.3);
      zone.fillRect(
        config.x * this.gridSize,
        config.y * this.gridSize,
        config.width * this.gridSize,
        config.height * this.gridSize
      );

      // Add border
      zone.lineStyle(2, config.colors.border, 0.8);
      zone.strokeRect(
        config.x * this.gridSize,
        config.y * this.gridSize,
        config.width * this.gridSize,
        config.height * this.gridSize
      );

      // Add zone label
      const label = this.add.text(
        (config.x + config.width/2) * this.gridSize,
        (config.y + config.height/2) * this.gridSize,
        config.label,
        {
          fontFamily: 'Arial',
          fontSize: '16px',
          color: '#475569',
          backgroundColor: '#ffffff80',
          padding: { x: 8, y: 4 }
        }
      );
      label.setOrigin(0.5);

      this.zones.set(config.type, {
        graphics: zone,
        bounds: new Phaser.Geom.Rectangle(
          config.x * this.gridSize,
          config.y * this.gridSize,
          config.width * this.gridSize,
          config.height * this.gridSize
        )
      });
    });
  }

  createPlayer() {
    const playerContainer = this.add.container(
      this.gridSize * 1.5,
      this.gridSize * 1.5
    );

    // Create player avatar with a more modern design
    const avatar = this.add.graphics();
    
    // Outer circle (border)
    avatar.lineStyle(3, 0xffffff, 1);
    avatar.fillStyle(this.colors.player, 1);
    avatar.beginPath();
    avatar.arc(0, 0, this.gridSize / 3, 0, Math.PI * 2);
    avatar.closePath();
    avatar.fill();
    avatar.stroke();

    // Add subtle inner circle for depth
    avatar.lineStyle(2, 0xffffff, 0.3);
    avatar.beginPath();
    avatar.arc(0, 0, this.gridSize / 4, 0, Math.PI * 2);
    avatar.closePath();
    avatar.stroke();

    const nameLabel = this.add.text(0, -this.gridSize/2, 'You', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#1e293b',
      backgroundColor: '#ffffff90',
      padding: { x: 4, y: 2 }
    });
    nameLabel.setOrigin(0.5);

    playerContainer.add([avatar, nameLabel]);
    this.playerContainer = playerContainer;
    this.lastPosition = {
      x: playerContainer.x,
      y: playerContainer.y
    };
  }

  initializeSocket() {
    if (this.socket) {
      console.log("Socket already exists, cleaning up...");
      this.socket.removeAllListeners();
      this.socket.close();
    }

    this.socket = io("http://localhost:4000", {
      reconnection: true,
      reconnectionAttempts: this.maxRetries,
      reconnectionDelay: this.socketReconnectDelay,
      timeout: 10000,
      // Add transport options to prefer WebSocket
      transports: ['websocket', 'polling'],
      // Prevent multiple connections
      multiplex: false
    });

    this.setupSocketListeners();
  }

  setupSocketListeners() {
    if (!this.socket) return;
    this.socket.removeAllListeners();
    this.socket.on("connect", () => {
      if (!this.socket.recovered) {
        console.log("Connected to server:", this.socket.id);
        this.connectionRetries = 0;
        // Only show toast on initial connection, not reconnects
        if (!this.hasInitialConnection) {
          toast.success("Connected to workspace!");
          this.hasInitialConnection = true;
        }
        // Send initial position
        if (this.playerContainer) {
          this.emitPosition(this.playerContainer.x, this.playerContainer.y);
        }
      }
    });

    this.socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      this.handleConnectionError();
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Disconnected:", reason);
      if (reason === "io server disconnect" || reason === "transport close") {
        toast.error("Disconnected from workspace");
      }
    });

    this.socket.on("user-joined", ({ userId, totalUsers }) => {
      // Only show toast if it's not our own connection
      if (userId !== this.socket.id) {
        toast.success(`New user joined! (${totalUsers} online)`);
      }
    });

    this.socket.on("user-left", this.handleUserLeft.bind(this));
    this.socket.on("update-positions", this.updatePlayerPositions.bind(this));
  }

  handleConnectionError() {
    this.connectionRetries++;
    if (this.connectionRetries >= this.maxRetries) {
      toast.error("Unable to connect to workspace");
      this.socket.disconnect();
    } else {
      toast.error(`Connection failed (${this.connectionRetries}/${this.maxRetries})`);
    }
  }

  handleUserJoined({ userId, totalUsers }) {
    toast.success(`New user joined! (${totalUsers} online)`);
  }

  handleUserLeft({ userId, totalUsers }) {
    this.removePlayer(userId);
    toast.info(`User left (${totalUsers} online)`);
  }

  removePlayer(userId) {
    const player = this.players.get(userId);
    if (player) {
      player.destroy();
      this.players.delete(userId);
    }
  }

  updatePlayerPositions(positions) {
    Object.entries(positions).forEach(([userId, position]) => {
      if (!position || userId === this.socket.id) return;

      let player = this.players.get(userId);
      
      if (!player) {
        player = this.createOtherPlayer(position);
        this.players.set(userId, player);
      } else {
        // Smooth movement using tweens
        this.tweens.add({
          targets: player,
          x: position.x,
          y: position.y,
          duration: 100,
          ease: 'Power1'
        });
      }
    });
  }

  createOtherPlayer(position) {
    const container = this.add.container(position.x, position.y);
    
    const avatar = this.add.graphics();
    avatar.lineStyle(3, 0xffffff, 1);
    avatar.fillStyle(this.colors.otherPlayer, 1);
    avatar.beginPath();
    avatar.arc(0, 0, this.gridSize / 3, 0, Math.PI * 2);
    avatar.closePath();
    avatar.fill();
    avatar.stroke();

    const label = this.add.text(0, -this.gridSize/2, 'User', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#1e293b',
      backgroundColor: '#ffffff90',
      padding: { x: 4, y: 2 }
    });
    label.setOrigin(0.5);

    container.add([avatar, label]);
    return container;
  }

  emitPosition(x, y) {
    if (this.socket?.connected) {
      this.socket.emit("move", { x, y });
    }
  }

  update() {
    if (!this.isInitialized || !this.socket?.connected || !this.playerContainer) return;

    const currentPosition = {
      x: this.playerContainer.x,
      y: this.playerContainer.y
    };

    let newX = currentPosition.x;
    let newY = currentPosition.y;
    let moved = false;

    // Smoother movement with diagonal support
    if (this.cursors.left.isDown && this.cursors.up.isDown) {
      newX -= this.playerSpeed * 0.707;
      newY -= this.playerSpeed * 0.707;
      moved = true;
    } else if (this.cursors.left.isDown && this.cursors.down.isDown) {
      newX -= this.playerSpeed * 0.707;
      newY += this.playerSpeed * 0.707;
      moved = true;
    } else if (this.cursors.right.isDown && this.cursors.up.isDown) {
      newX += this.playerSpeed * 0.707;
      newY -= this.playerSpeed * 0.707;
      moved = true;
    } else if (this.cursors.right.isDown && this.cursors.down.isDown) {
      newX += this.playerSpeed * 0.707;
      newY += this.playerSpeed * 0.707;
      moved = true;
    } else {
      if (this.cursors.left.isDown) {
        newX -= this.playerSpeed;
        moved = true;
      } else if (this.cursors.right.isDown) {
        newX += this.playerSpeed;
        moved = true;
      }
      
      if (this.cursors.up.isDown) {
        newY -= this.playerSpeed;
        moved = true;
      } else if (this.cursors.down.isDown) {
        newY += this.playerSpeed;
        moved = true;
      }
    }

    // Boundary checks
    const maxX = this.workspaceData.width * this.gridSize - this.gridSize/2;
    const maxY = this.workspaceData.height * this.gridSize - this.gridSize/2;
    newX = Phaser.Math.Clamp(newX, this.gridSize/2, maxX);
    newY = Phaser.Math.Clamp(newY, this.gridSize/2, maxY);

    if (moved && (newX !== currentPosition.x || newY !== currentPosition.y)) {
      this.playerContainer.setPosition(newX, newY);
      this.emitPosition(newX, newY);
      this.lastPosition = { x: newX, y: newY };
    }
  }
}

export default function PhaserWorkspace({ workspaceData }) {
  const [isClient, setIsClient] = useState(false);
  const [gameInstance, setGameInstance] = useState(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleResize = useCallback(() => {
    if (!gameInstance) return;
    
    const container = document.getElementById("phaser-container");
    if (!container?.parentElement) return;

    const parent = container.parentElement;
    const availableWidth = parent.clientWidth - 32;
    const availableHeight = window.innerHeight - 200;
    
    const scaleX = availableWidth / (workspaceData.width * 64);
    const scaleY = availableHeight / (workspaceData.height * 64);
    const scale = Math.min(scaleX, scaleY, 1);
    
    gameInstance.scale.resize(workspaceData.width * 64, workspaceData.height * 64);
    gameInstance.scale.setZoom(scale);
  }, [gameInstance, workspaceData]);

  useEffect(() => {
    if (!isClient || !workspaceData) return;

    const config = {
      type: Phaser.AUTO,
      parent: "phaser-container",
      width: workspaceData.width * 64,
      height: workspaceData.height * 64,
height: workspaceData.height * 64,
      backgroundColor: '#ffffff',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      },
      scene: WorkspaceScene,
    };

    const game = new Phaser.Game(config);
    setGameInstance(game);

    window.addEventListener('resize', handleResize);
    
    // Initial resize
    setTimeout(handleResize, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (game) {
        const scene = game.scene.getScene('WorkspaceScene');
        if (scene?.socket) {
          scene.socket.removeAllListeners();
          scene.socket.disconnect();
        }
        game.destroy(true);
      }    };
  }, [isClient, workspaceData, handleResize]);

  if (!isClient) return null;

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-sm font-medium text-gray-700">Workspace Active</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Start Meeting
          </button>
          <button className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-100 rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Share Link
          </button>
        </div>
      </div>
      
      <div className="relative flex-1 w-full min-h-[600px] bg-gray-50 rounded-lg shadow-lg overflow-hidden">
        <div
          id="phaser-container"
          className="absolute inset-0 bg-white"
        />
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          <button className="p-2 text-gray-700 bg-white rounded-full shadow-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          <button className="p-2 text-gray-700 bg-white rounded-full shadow-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}