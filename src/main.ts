import Phaser from 'phaser';
import MainScene from './phaserGame';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game',
    scene: MainScene,
    backgroundColor: '#2c3e50'
};

new Phaser.Game(config);
