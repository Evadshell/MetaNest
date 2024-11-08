import * as Phaser from "phaser";
import { io } from 'socket.io-client'

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#93cbee',
  scale: {
    mode: Phaser.Scale.ScaleModes.RESIZE,
    width: window.innerWidth,
    height: window.innerHeight
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  pixelArt: true
}

const game = new Phaser.Game(config)
let cursors
let player
let otherPlayers = new Map()
let map
let socket

function preload() {
  // Load map assets
  this.load.image('tiles', 'assets/map/FloorAndGround.png')
  this.load.tilemapTiledJSON('map', 'assets/map/map.json')
  
  // Load character assets
  this.load.atlas('adam', 'assets/character/adam.png', 'assets/character/adam.json')
  this.load.atlas('lucy', 'assets/character/lucy.png', 'assets/character/lucy.json')
  this.load.atlas('nancy', 'assets/character/nancy.png', 'assets/character/nancy.json')
  
  // Load items
  this.load.image('computer', 'assets/items/computer.png')
  this.load.image('whiteboard', 'assets/items/whiteboard.png')
  this.load.image('chair', 'assets/items/chair.png')
  
  // Load background
  this.load.image('backdrop_night', 'assets/background/backdrop_night.png')
}

function create() {
  // Create the background
  const backdrop = this.add.image(0, 0, 'backdrop_night')
  backdrop.setOrigin(0, 0)
  backdrop.setScale(2)
  
  // Create the map
  map = this.make.tilemap({ key: 'map' })
  const tileset = map.addTilesetImage('FloorAndGround', 'tiles')
  
  // Create layers
  const floorLayer = map.createLayer('Floor', tileset)
  const wallsLayer = map.createLayer('Walls', tileset)
  const furnitureLayer = map.createLayer('Furniture', tileset)
  
  wallsLayer.setCollisionByProperty({ collides: true })
  
  // Create player animations
  const createCharacterAnims = (name) => {
    this.anims.create({
      key: `${name}-idle-down`,
      frames: this.anims.generateFrameNames(name, {
        prefix: 'idle-down.',
        start: 0,
        end: 5,
      }),
      repeat: -1,
      frameRate: 6
    })

    this.anims.create({
      key: `${name}-walk-down`,
      frames: this.anims.generateFrameNames(name, {
        prefix: 'walk-down.',
        start: 0,
        end: 5,
      }),
      repeat: -1,
      frameRate: 6
    })

    // Add other directions (up, left, right) similarly
  }

  createCharacterAnims('adam')
  createCharacterAnims('lucy')
  createCharacterAnims('nancy')
  
  // Create the player
  player = this.physics.add.sprite(100, 100, 'adam')
  player.setCollideWorldBounds(true)
  player.setSize(32, 32)
  
  // Set up camera
  this.cameras.main.startFollow(player, true)
  this.cameras.main.setZoom(1.5)
  
  // Set up collisions
  this.physics.add.collider(player, wallsLayer)
  
  // Set up controls
  cursors = this.input.keyboard.createCursorKeys()
  
  // Connect to Socket.IO server
  socket = io('http://localhost:4000')
  
  // Handle other players
  socket.on('update-positions', (positions) => {
    Object.entries(positions).forEach(([id, pos]) => {
      if (id !== socket.id) {
        if (!otherPlayers.has(id)) {
          const otherPlayer = this.physics.add.sprite(pos.x, pos.y, 'lucy')
          otherPlayer.setCollideWorldBounds(true)
          otherPlayer.play('lucy-idle-down')
          otherPlayers.set(id, otherPlayer)
        } else {
          const otherPlayer = otherPlayers.get(id)
          otherPlayer.setPosition(pos.x, pos.y)
        }
      }
    })
  })
  
  socket.on('user-left', ({ userId }) => {
    if (otherPlayers.has(userId)) {
      otherPlayers.get(userId).destroy()
      otherPlayers.delete(userId)
    }
  })
  
  // Add toast notification for new users
  socket.on('user-joined', ({ userId }) => {
    console.log(`User ${userId.substr(0, 5)} joined the office!`)
  })
}

function update() {
  if (!player || !cursors) return
  
  const speed = 175
  let velocityX = 0
  let velocityY = 0
  
  // Handle movement
  if (cursors.left.isDown) {
    velocityX = -speed
    player.play('adam-walk-left', true)
    player.flipX = true
  } else if (cursors.right.isDown) {
    velocityX = speed
    player.play('adam-walk-right', true)
    player.flipX = false
  }
  
  if (cursors.up.isDown) {
    velocityY = -speed
    player.play('adam-walk-up', true)
  } else if (cursors.down.isDown) {
    velocityY = speed
    player.play('adam-walk-down', true)
  }
  
  // Set velocity
  player.setVelocity(velocityX, velocityY)
  
  // Play idle animation if not moving
  if (velocityX === 0 && velocityY === 0) {
    player.play('adam-idle-down', true)
  }
  
  // Emit position to server
  socket.emit('move', {
    x: player.x,
    y: player.y,
    anim: player.anims.currentAnim?.key
  })
}

// Handle window resize
window.addEventListener('resize', () => {
  game.scale.resize(window.innerWidth, window.innerHeight)
})

export default game