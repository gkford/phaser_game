const config = {
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

let player;
let cursors;

function preload() {
    // Load a simple colored rectangle as our player
    this.load.setBaseURL('https://labs.phaser.io');
    this.load.image('sky', 'assets/skies/space3.png');
    this.load.image('player', 'assets/sprites/phaser-dude.png');
}

function create() {
    // Add background
    this.add.image(400, 300, 'sky');
    
    // Create player sprite
    player = this.add.sprite(400, 300, 'player');
    
    // Enable physics on the player
    this.physics.add.existing(player);
    
    // Add some bounce
    player.body.setBounce(0.2);
    player.body.setCollideWorldBounds(true);
    
    // Set up keyboard input
    cursors = this.input.keyboard.createCursorKeys();
}

function update() {
    // Handle player movement
    if (cursors.left.isDown) {
        player.x -= 4;
        player.flipX = true;
    }
    else if (cursors.right.isDown) {
        player.x += 4;
        player.flipX = false;
    }

    if (cursors.up.isDown) {
        player.y -= 4;
    }
    else if (cursors.down.isDown) {
        player.y += 4;
    }
}
