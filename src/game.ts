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
    private huntingCard: {
        container: Phaser.GameObjects.Container;
        countText: Phaser.GameObjects.Text;
        contributionText: Phaser.GameObjects.Text;
    };
    private thinkingCard: {
        container: Phaser.GameObjects.Container;
        countText: Phaser.GameObjects.Text;
        contributionText: Phaser.GameObjects.Text;
    };

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
        
        // Create activity cards with their respective activities
        this.huntingCard = this.createActivityCard(300, 100, 'Hunting', 'hunting');
        this.thinkingCard = this.createActivityCard(300, 300, 'Thinking', 'thinking');
        
        // Initial updates
        this.updateDebugDisplay();
        this.updateActivityCards();
    }

    private handleReassignment(from: Activity, to: Activity): void {
        const newState = reassignWorker(this.gameState, from, to);
        this.updateGameState(newState);
    }

    private handleEmergencyReset(): void {
        const newState = allToHunting(this.gameState);
        this.updateGameState(newState);
    }

    private createActivityCard(x: number, y: number, title: string, activity: 'hunting' | 'thinking'): {
        container: Phaser.GameObjects.Container;
        countText: Phaser.GameObjects.Text;
        contributionText: Phaser.GameObjects.Text;
    } {
        const container = this.add.container(x, y);
        
        // Background
        const bg = this.add.rectangle(0, 0, 200, 150, 0x34495e);
        bg.setOrigin(0, 0);
        
        // Title
        const titleText = this.add.text(10, 10, title, {
            color: '#ffffff',
            fontSize: '20px',
            fontStyle: 'bold'
        });
        
        // Count display
        const countText = this.add.text(10, 50, '', {
            color: '#ffffff',
            fontSize: '16px'
        });
        
        // Contribution text
        const contributionText = this.add.text(10, 80, '', {
            color: '#ffffff',
            fontSize: '14px'
        });
        
        // Add buttons with handlers
        const plusButton = this.add.text(160, 50, '+', {
            color: '#ffffff',
            fontSize: '24px',
            backgroundColor: '#27ae60'
        })
        .setInteractive()
        .setData('activity', activity)
        .on('pointerdown', () => {
            // Try to move someone from unassigned to this activity
            this.handleReassignment('unassigned', activity);
            
            // If no unassigned workers, try to move from the other activity
            if (this.gameState.population.unassigned === 0) {
                const otherActivity: Activity = activity === 'hunting' ? 'thinking' : 'hunting';
                this.handleReassignment(otherActivity, activity);
            }
        });
        
        const minusButton = this.add.text(160, 80, '-', {
            color: '#ffffff',
            fontSize: '24px',
            backgroundColor: '#c0392b'
        })
        .setInteractive()
        .setData('activity', activity)
        .on('pointerdown', () => {
            // Move worker to unassigned
            this.handleReassignment(activity, 'unassigned');
        });
        
        container.add([bg, titleText, countText, contributionText, plusButton, minusButton]);
        
        return { container, countText, contributionText };
    }

    private updateActivityCards(): void {
        // Update hunting card
        this.huntingCard.countText.setText(`Workers: ${this.gameState.population.hunting}`);
        this.huntingCard.contributionText.setText(`+2 food/worker/sec`);
        
        // Update thinking card
        this.thinkingCard.countText.setText(`Workers: ${this.gameState.population.thinking}`);
        this.thinkingCard.contributionText.setText(`+1 thought/worker/sec`);
    }

    private updateDebugDisplay(): void {
        // Calculate detailed rates
        const foodProductionRate = this.gameState.population.hunting * 2;
        const foodConsumptionRate = this.gameState.population.total;
        const netFoodRate = calculateFoodRate(this.gameState);
        const thoughtRate = calculateThoughtRate(this.gameState);
        
        const debugInfo = [
            `Food Storage: ${Math.floor(this.gameState.food)}`,
            '',
            'Food Rates:',
            `  Production: +${foodProductionRate}/sec`,
            `  Consumption: -${foodConsumptionRate}/sec`,
            `  Net Rate: ${netFoodRate >= 0 ? '+' : ''}${netFoodRate}/sec`,
            '',
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
        this.updateActivityCards();
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
