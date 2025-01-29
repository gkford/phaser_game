import Phaser from 'phaser';
import { 
    GameState, 
    INITIAL_STATE, 
    validateGameState, 
    calculateFoodRate, 
    calculateThoughtRate,
    Activity,
    reassignWorker,
    allToHunting 
} from './types';

class MainScene extends Phaser.Scene {
    private gameState: GameState;
    private updateTimer: Phaser.Time.TimerEvent;
    private debugText: Phaser.GameObjects.Text;

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

        // Create debug text display
        this.debugText = this.add.text(20, 20, '', {
            color: '#ffffff',
            fontSize: '16px',
            lineSpacing: 5
        });
        
        // Initial update of debug display
        this.updateDebugDisplay();
    }

    private handleReassignment(from: Activity, to: Activity): void {
        const newState = reassignWorker(this.gameState, from, to);
        this.updateGameState(newState);
    }

    private handleEmergencyReset(): void {
        const newState = allToHunting(this.gameState);
        this.updateGameState(newState);
    }

    private updateDebugDisplay(): void {
        const foodRate = calculateFoodRate(this.gameState);
        const thoughtRate = calculateThoughtRate(this.gameState);
        
        const debugInfo = [
            `Food Storage: ${Math.floor(this.gameState.food)}`,
            `Food Rate: ${foodRate >= 0 ? '+' : ''}${foodRate}/sec`,
            `Thought Rate: ${thoughtRate}/sec`,
            '',
            'Population:',
            `Total: ${this.gameState.population.total}`,
            `Hunting: ${this.gameState.population.hunting}`,
            `Thinking: ${this.gameState.population.thinking}`,
            `Unassigned: ${this.gameState.population.unassigned}`
        ].join('\n');

        this.debugText.setText(debugInfo);
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
        
        // Update debug display
        this.updateDebugDisplay();
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
