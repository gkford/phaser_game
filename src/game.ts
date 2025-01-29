import Phaser from 'phaser';
import { GameState, INITIAL_STATE, validateGameState, calculateFoodRate, calculateThoughtRate } from './types';

class MainScene extends Phaser.Scene {
    private gameState: GameState;
    private updateTimer: Phaser.Time.TimerEvent;

    constructor() {
        super({ key: 'MainScene' });
        const initialState = { ...INITIAL_STATE };
        if (!validateGameState(initialState)) {
            throw new Error('Invalid initial game state');
        }
        this.gameState = initialState;
    }

    private updateGameState(newState: GameState): boolean {
        // Validate before updating
        if (!validateGameState(newState)) {
            return false;
        }
        
        // If valid, update the state
        this.gameState = { ...newState };
        return true;
    }

    create(): void {
        // Set up the 1-second game loop timer
        this.updateTimer = this.time.addEvent({
            delay: 1000,
            callback: this.onGameTick,
            callbackScope: this,
            loop: true
        });

        // Add debug text display
        this.add.text(400, 300, 'Game State Initialized', {
            color: '#ffffff',
            fontSize: '24px'
        }).setOrigin(0.5);
    }

    private onGameTick(): void {
        // Calculate rates
        const foodRate = calculateFoodRate(this.gameState);
        const thoughtRate = calculateThoughtRate(this.gameState);
        
        // Update food storage based on net food rate
        const newState = {
            ...this.gameState,
            food: this.gameState.food + foodRate
        };
        
        // Update game state
        this.updateGameState(newState);
        
        // Log current state and rates (temporary debug output)
        console.log('Game tick:', {
            state: this.gameState,
            foodRate,
            thoughtRate
        });
    }
}

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game',
    backgroundColor: '#2c3e50',
    scene: MainScene
};

new Phaser.Game(config);
