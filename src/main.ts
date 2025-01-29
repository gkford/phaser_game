import Phaser from 'phaser';
import MainScene from './ui/phaser/scenes/MainScene';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 1200,  // Increased from 800
    height: 600,
    parent: 'game',
    scene: MainScene,
    backgroundColor: '#2c3e50'
};

new Phaser.Game(config);
