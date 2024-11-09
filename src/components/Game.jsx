// components/Game.js
import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { io } from 'socket.io-client'
import { Toaster } from "sonner";
import { Button } from './ui/button'

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' })
        this.players = new Map()
        this.collectibles = new Map()
        this.leaderboard = []
        this.playerData = null
    }

    init(data) {
        this.username = data.username
    }

    create() {
        // Setup world bounds
        this.worldBounds = { width: 2000, height: 1500 }
        this.cameras.main.setBounds(0, 0, this.worldBounds.width, this.worldBounds.height)
        
        // Create background grid
        this.createBackground()

        // Connect to server
        this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000')
        this.setupSocketHandlers()

        // Setup input
        this.cursors = this.input.keyboard.createCursorKeys()
        this.wasd = {
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        }

        // Join game
        this.socket.emit('player-join', {
            username: this.username,
            color: this.getRandomColor()
        })

        // Setup UI
        this.createUI()
    }

    createBackground() {
        const graphics = this.add.graphics()
        graphics.lineStyle(1, 0x333333, 0.3)

        // Draw grid
        for (let x = 0; x < this.worldBounds.width; x += 50) {
            graphics.moveTo(x, 0)
            graphics.lineTo(x, this.worldBounds.height)
        }
        for (let y = 0; y < this.worldBounds.height; y += 50) {
            graphics.moveTo(0, y)
            graphics.lineTo(this.worldBounds.width, y)
        }
        graphics.strokePath()
    }

    createUI() {
        // Score display
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setScrollFactor(0)

        // Create leaderboard
        this.leaderboardGroup = this.add.group()
        this.updateLeaderboardUI()
    }

    updateLeaderboardUI() {
        this.leaderboardGroup.clear(true, true)
        
        const bg = this.add.rectangle(
            this.cameras.main.width - 160,
            110,
            300,
            200,
            0x000000,
            0.7
        ).setScrollFactor(0)
        this.leaderboardGroup.add(bg)

        const title = this.add.text(
            this.cameras.main.width - 280,
            20,
            'TOP PLAYERS',
            {
                fontSize: '20px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setScrollFactor(0)
        this.leaderboardGroup.add(title)

        this.leaderboard.forEach((player, index) => {
            const text = this.add.text(
                this.cameras.main.width - 280,
                50 + (index * 25),
                `${index + 1}. ${player.username}: ${player.score}`,
                {
                    fontSize: '16px',
                    color: player.id === this.socket.id ? '#ffff00' : '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 2
                }
            ).setScrollFactor(0)
            this.leaderboardGroup.add(text)
        })
    }

    setupSocketHandlers() {
        this.socket.on('game-state', (state) => {
            this.handleGameState(state)
        })

        this.socket.on('player-joined', (playerData) => {
            this.addPlayer(playerData)
        })

        this.socket.on('player-moved', (playerData) => {
            this.updatePlayerPosition(playerData)
        })

        this.socket.on('player-left', (data) => {
            this.removePlayer(data.id)
            this.leaderboard = data.leaderboard
            this.updateLeaderboardUI()
        })

        this.socket.on('collectible-collected', (data) => {
            this.handleCollectibleCollected(data)
        })
    }

 // components/Game.js (continued)

 handleGameState(state) {
        // Clear existing state
        this.players.forEach(player => player.destroy())
        this.players.clear()
        this.collectibles.forEach(collectible => collectible.destroy())
        this.collectibles.clear()

        // Add all players
        Object.values(state.players).forEach(playerData => {
            if (playerData.id === this.socket.id) {
                this.playerData = playerData;
                this.addMainPlayer(playerData);
            } else {
                this.addPlayer(playerData);
            }
        });

        // Add all collectibles
        Object.values(state.collectibles).forEach(collectible => {
            this.addCollectible(collectible);
        });

        // Update leaderboard
        this.leaderboard = state.leaderboard;
        this.updateLeaderboardUI();
    }

    addMainPlayer(playerData) {
        const player = this.add.container(playerData.x, playerData.y);
        
        // Player shape
        const shape = this.add.polygon(0, 0, [
            [-10, -10],
            [10, -10],
            [10, 10],
            [-10, 10]
        ], playerData.color);
        
        // Direction indicator
        const indicator = this.add.triangle(15, 0, 0, -5, 10, 0, 0, 5, playerData.color);
        
        // Username text
        const text = this.add.text(0, -20, playerData.username, {
            fontSize: '14px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        player.add([shape, indicator, text]);
        this.players.set(playerData.id, player);

        // Follow player with camera
        this.cameras.main.startFollow(player);

        // Add particle emitter for movement trail
        this.createPlayerTrail(player);
    }

    createPlayerTrail(player) {
        const particles = this.add.particles('particle');
        const emitter = particles.createEmitter({
            speed: 100,
            scale: { start: 0.2, end: 0 },
            blendMode: 'ADD',
            lifespan: 200,
            follow: player
        });
        return emitter;
    }

    addPlayer(playerData) {
        const player = this.add.container(playerData.x, playerData.y);
        
        const shape = this.add.polygon(0, 0, [
            [-10, -10],
            [10, -10],
            [10, 10],
            [-10, 10]
        ], playerData.color);
        
        const text = this.add.text(0, -20, playerData.username, {
            fontSize: '14px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        player.add([shape, text]);
        this.players.set(playerData.id, player);
    }

    addCollectible(collectibleData) {
        const collectible = this.add.container(collectibleData.x, collectibleData.y);
        
        const shape = collectibleData.type === 'power' 
            ? this.add.star(0, 0, 5, 10, 15, 0xffff00)
            : this.add.circle(0, 0, 5, 0x00ff00);
        
        // Add pulsing animation
        this.tweens.add({
            targets: shape,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        collectible.add(shape);
        this.collectibles.set(collectibleData.id, collectible);
    }

    updatePlayerPosition(playerData) {
        const player = this.players.get(playerData.id);
        if (player) {
            player.setPosition(playerData.x, playerData.y);
        }
    }

    removePlayer(playerId) {
        const player = this.players.get(playerId);
        if (player) {
            player.destroy();
            this.players.delete(playerId);
        }
    }

    handleCollectibleCollected(data) {
        const collectible = this.collectibles.get(data.collectibleId);
        if (collectible) {
            // Add collection animation
            this.tweens.add({
                targets: collectible,
                scaleX: 0,
                scaleY: 0,
                alpha: 0,
                duration: 200,
                onComplete: () => {
                    collectible.destroy();
                    this.collectibles.delete(data.collectibleId);
                }
            });

            // Add new collectible
            if (data.newCollectible) {
                this.addCollectible(data.newCollectible);
            }

            // Update player state if it's the current player
            if (data.playerId === this.socket.id) {
                this.playerData = data.playerState;
                this.scoreText.setText(`Score: ${this.playerData.score}`);
                
                // Show power-up effect
                if (data.playerState.powerUps.length > 0) {
                    this.showPowerUpEffect();
                }
            }

            // Update leaderboard
            this.updateLeaderboardUI();
        }
    }

    showPowerUpEffect() {
        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0xffff00);
        graphics.strokeCircle(0, 0, 30);
        
        const player = this.players.get(this.socket.id);
        if (player) {
            player.add(graphics);
            
            this.time.delayedCall(5000, () => {
                graphics.destroy();
            });
        }
    }

    update() {
        if (!this.playerData) return;

        const player = this.players.get(this.socket.id);
        if (!player) return;

        // Handle movement
        const movement = {
            x: player.x,
            y: player.y
        };

        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            movement.x -= this.playerData.speed * this.game.loop.delta * 0.001;
        }
        if (this.cursors.right.isDown || this.wasd.right.isDown) {
            movement.x += this.playerData.speed * this.game.loop.delta * 0.001;
        }
        if (this.cursors.up.isDown || this.wasd.up.isDown) {
            movement.y -= this.playerData.speed * this.game.loop.delta * 0.001;
        }
        if (this.cursors.down.isDown || this.wasd.down.isDown) {
            movement.y += this.playerData.speed * this.game.loop.delta * 0.001;
        }

        // Only emit if position changed
        if (movement.x !== player.x || movement.y !== player.y) {
            player.setPosition(movement.x, movement.y);
            this.socket.emit('player-move', movement);
        }
    }
}

// Create game configuration
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#1a1a1a',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: MainScene
};

// Game component
export default function Game({ username }) {
    const gameRef = useRef(null);

    useEffect(() => {
        if (!gameRef.current) {
            const game = new Phaser.Game({
                ...config,
                parent: 'game-container',
                scale: {
                    mode: Phaser.Scale.RESIZE,
                    width: '100%',
                    height: '100%'
                }
            });

            game.scene.start('MainScene', { username });
            gameRef.current = game;

            // Handle window resize
            const resizeGame = () => {
                game.scale.resize(window.innerWidth, window.innerHeight);
            };

            window.addEventListener('resize', resizeGame);

            // Show welcome toast
           console.log("hi")

            return () => {
                window.removeEventListener('resize', resizeGame);
                game.destroy(true);
            };
        }
    }, [username]);

    return (
        <div id="game-container" className="w-screen h-screen">
            <div className="fixed top-4 right-4 z-10">
                <Button 
                    variant="outline" 
                    onClick={() => window.location.reload()}
                >
                    New Game
                </Button>
            </div>
        </div>
    );
}
