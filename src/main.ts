import Phaser from 'phaser';
import MainScene from './ui/phaser/scenes/MainScene';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game',
    scene: MainScene,
    backgroundColor: '#2c3e50'
};

new Phaser.Game(config);
