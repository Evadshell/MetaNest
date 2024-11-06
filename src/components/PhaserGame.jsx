import React, { useEffect, useRef } from 'react';

export default function PhaserGame() {
  const gameRef = useRef(null);

  useEffect(() => {
    const initPhaser = async () => {
      const Phaser = (await import('phaser')).default;

      class MainScene extends Phaser.Scene {
        constructor() {
          super({ key: 'WorkspaceScene' })
          this.gridSize = 64 // Size of each grid cell in pixels
          this.colors = {
            character: 0x4F46E5, // Indigo
            chair: 0x22C55E,    // Green
            desk: 0xEAB308,     // Yellow
          }
        }
      
        preload() {
          // Adjust paths as necessary
          this.load.image('tiles', '/office-tileset.png');
          this.load.tilemapTiledJSON('map', '/office-map.json');
          // Adjusted frameWidth and frameHeight based on the spritesheet dimensions
          this.load.spritesheet('character', '/character-spritesheet.png', { frameWidth: 32, frameHeight: 48 });
        }

        create() {
          // Create the tile map
          const map = this.make.tilemap({ key: 'map' });
          const tileset = map.addTilesetImage('office-tileset', 'tiles');
          map.createLayer('Floor', tileset);
        //     const floorLayer = map.createLayer('Floor', tileset, 0, 0);
        // const objectLayer = map.createLayer('Objects', tileset, 0, 0);
          const objectLayer = map.createLayer('Objects', tileset);
          objectLayer.setCollisionByProperty({ collides: true });

          // Create the player
          this.player = this.physics.add.sprite(200, 100, 'character');
          this.player.setCollideWorldBounds(true);

          // Set up collision
          this.physics.add.collider(this.player, objectLayer);

          // Create animations based on spritesheet layout
          this.anims.create({
            key: 'walk-up',
            frames: this.anims.generateFrameNumbers('character', { start: 0, end: 2 }),
            frameRate: 10,
            repeat: -1
          });
          this.anims.create({
            key: 'walk-down',
            frames: this.anims.generateFrameNumbers('character', { start: 12, end: 14 }),
            frameRate: 10,
            repeat: -1
          });
          this.anims.create({
            key: 'walk-right',
            frames: this.anims.generateFrameNumbers('character', { start: 24, end: 26 }),
            frameRate: 10,
            repeat: -1
          });
          this.anims.create({
            key: 'walk-left',
            frames: this.anims.generateFrameNumbers('character', { start: 36, end: 38 }),
            frameRate: 10,
            repeat: -1
          });

          // Set up camera
          this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
          this.cameras.main.startFollow(this.player, true, 0.5, 0.5);

          // Set up cursor keys
          this.cursors = this.input.keyboard.createCursorKeys();
        }

        update() {
          const speed = 100;
          const prevVelocity = this.player.body.velocity.clone();

          // Stop movement before processing input
          this.player.setVelocity(0);

          // Horizontal movement
          if (this.cursors.left.isDown) {
            this.player.setVelocityX(-speed);
            this.player.anims.play('walk-left', true);
          } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(speed);
            this.player.anims.play('walk-right', true);
          }

          // Vertical movement
          if (this.cursors.up.isDown) {
            this.player.setVelocityY(-speed);
            this.player.anims.play('walk-up', true);
          } else if (this.cursors.down.isDown) {
            this.player.setVelocityY(speed);
            this.player.anims.play('walk-down', true);
          }

          // If no movement keys are pressed, stop animation
          if (this.player.body.velocity.x === 0 && this.player.body.velocity.y === 0) {
            this.player.anims.stop();
            // Idle frame based on last direction
            if (prevVelocity.x < 0) this.player.setTexture('character', 12); // Facing left
            else if (prevVelocity.x > 0) this.player.setTexture('character', 24); // Facing right
            else if (prevVelocity.y < 0) this.player.setTexture('character', 36); // Facing up
            else if (prevVelocity.y > 0) this.player.setTexture('character', 0); // Facing down
          }
        }
      }

      const config = {
        type: Phaser.AUTO,
        width: 1000,
        height: 600,
        parent: 'phaser-game',
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { y: 0 },
            debug: false
          }
        },
        scene: [MainScene]
      };

      gameRef.current = new Phaser.Game(config);

      return () => {
        if (gameRef.current) {
          gameRef.current.destroy(true);
        }
      };
    };

    initPhaser();
  }, []);

  return <div id="phaser-game" className="w-full h-full" />;
}
