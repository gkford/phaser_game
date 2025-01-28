import Phaser from 'phaser';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let player: Phaser.Physics.Arcade.Sprite;
let cursors: Phaser.Types.Input.Keyboard.CursorKeys;

function preload(this: Phaser.Scene): void {
    // Load a simple colored rectangle as our player
    this.load.setBaseURL('https://labs.phaser.io');
    this.load.image('sky', 'assets/skies/space3.png');
    this.load.image('player', 'assets/sprites/phaser-dude.png');
}

function create(this: Phaser.Scene): void {
    // Add background
    this.add.image(400, 300, 'sky');
    
    // Add text in the middle of the screen
    this.add.text(400, 200, 'Vite + Phaser is working!', {
        color: '#ffffff',
        fontSize: '32px'
    }).setOrigin(0.5);
    
    // Create player sprite
    player = this.physics.add.sprite(400, 300, 'player');
    
    // Add some bounce
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);
    
    // Set up keyboard input
    cursors = this.input.keyboard.createCursorKeys();
}

function update(): void {
    if (!player || !cursors) return;

    // Handle player movement
    if (cursors.left.isDown) {
        player.setX(player.x - 4);
        player.setFlipX(true);
    }
    else if (cursors.right.isDown) {
        player.setX(player.x + 4);
        player.setFlipX(false);
    }

    if (cursors.up.isDown) {
        player.setY(player.y - 4);
    }
    else if (cursors.down.isDown) {
        player.setY(player.y + 4);
    }
}
