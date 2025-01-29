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

interface ActivityButton extends Phaser.GameObjects.Text {
    setEnabled(enabled: boolean): void;
    enabled: boolean;
}

class MainScene extends Phaser.Scene {
    private gameState: GameState;
    private updateTimer: Phaser.Time.TimerEvent;
    private debugText: Phaser.GameObjects.Text;
    
    private emergencyOverlay: {
        container: Phaser.GameObjects.Container;
        background: Phaser.GameObjects.Rectangle;
        text: Phaser.GameObjects.Text;
        button: Phaser.GameObjects.Text;
    } | null = null;

    private isEmergencyActive: boolean = false;
    private isGamePaused: boolean = false;

    private huntingCard: {
        container: Phaser.GameObjects.Container;
        countText: Phaser.GameObjects.Text;
        contributionText: Phaser.GameObjects.Text;
        plusButton: ActivityButton;
        minusButton: ActivityButton;
    };
    private thinkingCard: {
        container: Phaser.GameObjects.Container;
        countText: Phaser.GameObjects.Text;
        contributionText: Phaser.GameObjects.Text;
        plusButton: ActivityButton;
        minusButton: ActivityButton;
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
        
        // Immediately update displays after state change
        this.updateDebugDisplay();
        this.updateActivityCards();
        this.updateButtonStates();
    }

    private handleEmergencyReset(): void {
        const newState = allToHunting(this.gameState);
        this.updateGameState(newState);
        
        // Immediately update displays after state change
        this.updateDebugDisplay();
        this.updateActivityCards();
        this.updateButtonStates();
    }

    private createActivityCard(x: number, y: number, title: string, activity: 'hunting' | 'thinking'): {
        container: Phaser.GameObjects.Container;
        countText: Phaser.GameObjects.Text;
        contributionText: Phaser.GameObjects.Text;
        plusButton: ActivityButton;
        minusButton: ActivityButton;
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
        // Modified plus button
        const plusButton = this.add.text(160, 50, '+', {
            color: '#ffffff',
            fontSize: '24px',
            backgroundColor: '#27ae60'
        }) as ActivityButton;
        
        plusButton.setInteractive()
            .setData('activity', activity);
        
        plusButton.enabled = true;
        plusButton.setEnabled = function(enabled: boolean) {
            this.enabled = enabled;
            this.setAlpha(enabled ? 1 : 0.5);
            if (enabled) {
                this.setInteractive();
            } else {
                this.removeInteractive();
            }
        };

        plusButton.on('pointerdown', () => {
            if (plusButton.enabled && this.gameState.population.unassigned > 0) {
                this.handleReassignment('unassigned', activity);
            }
        });

        // Modified minus button
        const minusButton = this.add.text(160, 80, '-', {
            color: '#ffffff',
            fontSize: '24px',
            backgroundColor: '#c0392b'
        }) as ActivityButton;
        
        minusButton.setInteractive()
            .setData('activity', activity);
        
        minusButton.enabled = true;
        minusButton.setEnabled = function(enabled: boolean) {
            this.enabled = enabled;
            this.setAlpha(enabled ? 1 : 0.5);
            if (enabled) {
                this.setInteractive();
            } else {
                this.removeInteractive();
            }
        };

        minusButton.on('pointerdown', () => {
            if (minusButton.enabled && this.gameState.population[activity] > 0) {
                this.handleReassignment(activity, 'unassigned');
            }
        });
        
        container.add([bg, titleText, countText, contributionText, plusButton, minusButton]);
        
        return { container, countText, contributionText, plusButton, minusButton };
    }

    private checkEmergencyState(): void {
        const foodRate = calculateFoodRate(this.gameState);
        
        // Emergency conditions: food is 0 or less AND food rate is negative or zero
        if (this.gameState.food <= 0 && foodRate <= 0) {
            if (!this.isEmergencyActive) {
                console.log('Emergency: Food shortage detected!');
                // Reset all workers to hunting
                this.handleEmergencyReset();
                // Show emergency overlay
                this.showEmergencyOverlay();
            }
        } else if (this.isEmergencyActive && this.gameState.food > 0 && foodRate > 0) {
            // Emergency is over
            this.isEmergencyActive = false;
            if (this.emergencyOverlay) {
                this.emergencyOverlay.container.setVisible(false);
            }
        }
        
        // Update all displays
        this.updateDebugDisplay();
        this.updateActivityCards();
        this.updateButtonStates();
    }

    private updateButtonStates(): void {
        const hasUnassigned = this.gameState.population.unassigned > 0;
        
        // During emergency, only hunting is allowed
        if (this.isEmergencyActive) {
            this.huntingCard.plusButton.setEnabled(hasUnassigned);
            this.huntingCard.minusButton.setEnabled(false);
            this.thinkingCard.plusButton.setEnabled(false);
            this.thinkingCard.minusButton.setEnabled(false);
            return;
        }
        
        // Normal button state updates
        this.huntingCard.plusButton.setEnabled(hasUnassigned);
        this.huntingCard.minusButton.setEnabled(this.gameState.population.hunting > 0);
        
        this.thinkingCard.plusButton.setEnabled(hasUnassigned);
        this.thinkingCard.minusButton.setEnabled(this.gameState.population.thinking > 0);
    }

    private updateActivityCards(): void {
        // Existing card updates
        this.huntingCard.countText.setText(`Workers: ${this.gameState.population.hunting}`);
        this.huntingCard.contributionText.setText(`+2 food/worker/sec`);
        
        this.thinkingCard.countText.setText(`Workers: ${this.gameState.population.thinking}`);
        this.thinkingCard.contributionText.setText(`+1 thought/worker/sec`);
        
        // Update button states
        this.updateButtonStates();
    }

    private createEmergencyOverlay(): void {
        // Create semi-transparent background
        const background = this.add.rectangle(0, 0, 800, 600, 0x000000, 0.7);
        background.setOrigin(0, 0);

        // Create warning text
        const text = this.add.text(400, 250, 'EMERGENCY: Food Shortage!\nAll workers reassigned to hunting.', {
            color: '#ff0000',
            fontSize: '24px',
            align: 'center'
        });
        text.setOrigin(0.5);

        // Create dismiss button
        const button = this.add.text(400, 350, 'Understood', {
            color: '#ffffff',
            fontSize: '20px',
            backgroundColor: '#c0392b',
            padding: { x: 20, y: 10 }
        });
        button.setOrigin(0.5);
        button.setInteractive();
        button.on('pointerdown', () => {
            this.hideEmergencyOverlay();
        });

        // Create container and add elements
        const container = this.add.container(0, 0, [background, text, button]);
        container.setDepth(1000); // Ensure it appears above everything else

        this.emergencyOverlay = { container, background, text, button };
    }

    private showEmergencyOverlay(): void {
        if (!this.emergencyOverlay) {
            this.createEmergencyOverlay();
        }
        this.emergencyOverlay?.container.setVisible(true);
        this.isEmergencyActive = true;
        // Pause game when emergency occurs
        this.isGamePaused = true;
    }

    private hideEmergencyOverlay(): void {
        if (this.emergencyOverlay) {
            this.emergencyOverlay.container.setVisible(false);
            // Resume game when overlay is dismissed
            this.isGamePaused = false;
        }
        // Note: We don't set isEmergencyActive to false here
        // That only happens when food situation improves
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
        // Don't update game state if paused
        if (this.isGamePaused) {
            return;
        }

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
        
        // Check for emergency conditions
        this.checkEmergencyState();
        
        // Update displays
        this.updateDebugDisplay();
        this.updateActivityCards();
        this.updateButtonStates();
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
