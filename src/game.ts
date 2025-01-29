import Phaser from 'phaser';
import { 
    GameState, 
    INITIAL_STATE, 
    validateGameState, 
    calculateFoodRate, 
    calculateThoughtRate,
    Activity,
    reassignWorker,
    allToHunting,
    updateTaskStates,
    updateResearch,
    TaskState
} from './types';

interface ActivityButton extends Phaser.GameObjects.Text {
    setEnabled(enabled: boolean): void;
    enabled: boolean;
}

class MainScene extends Phaser.Scene {
    private gameState: GameState;
    private updateTimer!: Phaser.Time.TimerEvent;
    private debugText!: Phaser.GameObjects.Text;
    // private sounds: {
    //     click: Phaser.Sound.BaseSound;
    //     error: Phaser.Sound.BaseSound;
    //     emergency: Phaser.Sound.BaseSound;
    // } | null = null;
    
    private emergencyOverlay: {
        container: Phaser.GameObjects.Container;
        background: Phaser.GameObjects.Rectangle;
        text: Phaser.GameObjects.Text;
        button: Phaser.GameObjects.Text;
    } | null = null;

    private isEmergencyActive: boolean = false;
    private isGamePaused: boolean = false;

    private huntingCard!: {
        container: Phaser.GameObjects.Container;
        countText: Phaser.GameObjects.Text;
        contributionText: Phaser.GameObjects.Text;
        plusButton: ActivityButton;
        minusButton: ActivityButton;
    };
    private thinkingCard!: {
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

    private getCardStyle(taskState: TaskState): {
        backgroundColor: number;
        borderColor?: number;
        alpha: number;
    } {
        switch (taskState) {
            case TaskState.Unthoughtof:
                return {
                    backgroundColor: 0x34495e,
                    alpha: 0.5
                };
            case TaskState.Imagined:
                return {
                    backgroundColor: 0x34495e,
                    borderColor: 0xf1c40f, // Yellow glow
                    alpha: 1
                };
            case TaskState.Discovered:
                return {
                    backgroundColor: 0x34495e,
                    borderColor: 0x27ae60, // Green border
                    alpha: 1
                };
        }
    }

    private createTooltip(text: string): Phaser.GameObjects.Container {
        const container = this.add.container(0, 0);
        container.setVisible(false);
        
        // Background
        const bg = this.add.rectangle(0, 0, 200, 80, 0x000000, 0.8);
        bg.setOrigin(0, 0);
        
        // Text
        const tooltipText = this.add.text(10, 10, text, {
            color: '#ffffff',
            fontSize: '14px',
            wordWrap: { width: 180 }
        });
        
        container.add([bg, tooltipText]);
        
        // Adjust background height to fit text
        bg.height = tooltipText.height + 20;
        
        return container;
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
        
        // Run validation in development
        if (process.env.NODE_ENV !== 'production') {
            this.validateGameSystems();
        }
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

    private createResearchBar(x: number, y: number, width: number = 180): Phaser.GameObjects.Container {
        const container = this.add.container(x, y);
        
        // Background
        const bg = this.add.rectangle(0, 0, width, 20, 0x666666);
        bg.setOrigin(0, 0);
        
        // Progress bar
        const bar = this.add.rectangle(2, 2, 0, 16, 0x00ff00);
        bar.setOrigin(0, 0);
        
        // Progress text
        const text = this.add.text(width / 2, 10, '0%', {
            color: '#ffffff',
            fontSize: '12px'
        });
        text.setOrigin(0.5);
        
        container.add([bg, bar, text]);
        
        // Add update method
        container.setData('updateProgress', (progress: number, total: number) => {
            const percentage = (progress / total) * 100;
            const barWidth = (width - 4) * (progress / total);
            bar.width = barWidth;
            text.setText(`${Math.floor(percentage)}%`);
        });
        
        return container;
    }

    private createActivityCard(x: number, y: number, title: string, activity: 'hunting' | 'thinking'): {
        container: Phaser.GameObjects.Container;
        countText: Phaser.GameObjects.Text;
        contributionText: Phaser.GameObjects.Text;
        plusButton: ActivityButton;
        minusButton: ActivityButton;
        researchButton?: Phaser.GameObjects.Text;
        researchBar?: Phaser.GameObjects.Container;
        border?: Phaser.GameObjects.Rectangle;
        tooltip?: Phaser.GameObjects.Container;
    } {
        const container = this.add.container(x, y);
        
        // Background with border
        const border = this.add.rectangle(-5, -5, 210, 160, 0x000000);
        const bg = this.add.rectangle(0, 0, 200, 150, 0x34495e);
        bg.setOrigin(0, 0);
        border.setOrigin(0, 0);
        border.setVisible(false);
        
        // Title (will show ???? for Unthoughtof)
        const titleText = this.add.text(10, 10, '????', {
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
        
        // Research button (initially hidden)
        const researchButton = this.add.text(10, 110, 'Research', {
            color: '#ffffff',
            fontSize: '16px',
            backgroundColor: '#2980b9',
            padding: { x: 10, y: 5 }
        });
        researchButton.setVisible(false);
        researchButton.setInteractive();
        
        // Research progress bar
        const researchBar = this.createResearchBar(10, 140);
        researchBar.setVisible(false);
        
        // Tooltip for prerequisites
        const tooltip = this.createTooltip('');
        
        // Add hover handlers for tooltip
        bg.setInteractive();
        bg.on('pointerover', () => {
            if (this.gameState.taskStates[activity] === TaskState.Unthoughtof) {
                const prereqs = this.gameState.prerequisites[activity];
                const tooltipText = `Requires:\n${prereqs.join('\n')}`;
                tooltip.getAt(1).setText(tooltipText);
                tooltip.setPosition(container.x + 210, container.y);
                tooltip.setVisible(true);
            }
        });
        bg.on('pointerout', () => {
            tooltip.setVisible(false);
        });
        
        // Add all elements to container
        container.add([border, bg, titleText, countText, contributionText, researchButton, researchBar, tooltip]);
        
        return {
            container,
            countText,
            contributionText,
            plusButton: null as any,
            minusButton: null as any,
            researchButton,
            researchBar,
            border,
            tooltip
        };
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
        const updateCard = (card: any, activity: string, title: string) => {
            const taskState = this.gameState.taskStates[activity];
            const style = this.getCardStyle(taskState);
            
            // Update background and border
            const bg = card.container.getAt(1);
            bg.setFillStyle(style.backgroundColor);
            bg.setAlpha(style.alpha);
            
            if (style.borderColor) {
                card.border.setFillStyle(style.borderColor);
                card.border.setVisible(true);
            } else {
                card.border.setVisible(false);
            }
            
            // Update title and content based on state
            const titleText = card.container.getAt(2);
            titleText.setText(taskState === TaskState.Unthoughtof ? '????' : title);
            
            // Update counts and controls
            if (taskState === TaskState.Discovered) {
                card.countText.setText(`Workers: ${this.gameState.population[activity]}`);
                card.contributionText.setVisible(true);
                card.plusButton?.setVisible(true);
                card.minusButton?.setVisible(true);
                card.researchButton?.setVisible(false);
                card.researchBar?.setVisible(false);
            } else if (taskState === TaskState.Imagined) {
                card.countText.setText('');
                card.contributionText.setVisible(false);
                card.plusButton?.setVisible(false);
                card.minusButton?.setVisible(false);
                card.researchButton?.setVisible(!this.isEmergencyActive);
                card.researchBar?.setVisible(this.gameState.researchProgress.taskId === activity);
            } else {
                card.countText.setText('');
                card.contributionText.setVisible(false);
                card.plusButton?.setVisible(false);
                card.minusButton?.setVisible(false);
                card.researchButton?.setVisible(false);
                card.researchBar?.setVisible(false);
            }
            
            // Update research progress if active
            if (this.gameState.researchProgress.taskId === activity) {
                card.researchBar?.getData('updateProgress')(
                    this.gameState.researchProgress.progress,
                    this.gameState.researchProgress.total
                );
            }
        };
        
        // Update each card
        updateCard(this.huntingCard, 'hunting', 'Hunting');
        updateCard(this.thinkingCard, 'thinking', 'Thinking');
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

    private validateGameSystems(): void {
        // Create and show loading screen
        const loadingBg = this.add.rectangle(0, 0, 800, 600, 0x000000, 0.7);
        loadingBg.setOrigin(0, 0);
        loadingBg.setDepth(2000);
        
        const loadingText = this.add.text(400, 300, 'Validating game systems...', {
            color: '#ffffff',
            fontSize: '24px',
            align: 'center'
        });
        loadingText.setOrigin(0.5);
        loadingText.setDepth(2000);

        // Store original emergency show function
        const originalShowEmergency = this.showEmergencyOverlay;
        // Temporarily disable emergency overlay
        this.showEmergencyOverlay = () => {};

        // Run validations
        console.log('=== Game Systems Validation ===');
        
        // Test state validation
        console.log('Testing state validation...');
        const invalidState = {
            ...this.gameState,
            population: {
                ...this.gameState.population,
                total: 11
            }
        };
        console.assert(!validateGameState(invalidState), 'Invalid state was not caught');

        // Test food rate calculations
        console.log('Testing food rate calculations...');
        const testState = {
            ...INITIAL_STATE,
            population: {
                total: 10,
                hunting: 5,
                thinking: 5,
                unassigned: 0
            }
        };
        const foodRate = calculateFoodRate(testState);
        console.assert(foodRate === 0, 'Food rate calculation incorrect');

        // Test emergency system
        console.log('Testing emergency system...');
        const emergencyState = {
            ...INITIAL_STATE,
            food: 0,
            population: {
                total: 10,
                hunting: 0,
                thinking: 10,
                unassigned: 0
            }
        };
        this.updateGameState(emergencyState);
        
        // Test worker reassignment
        console.log('Testing worker reassignment...');
        const reassignResult = reassignWorker(INITIAL_STATE, 'hunting', 'thinking');
        console.assert(
            reassignResult.population.hunting === 9 && 
            reassignResult.population.thinking === 1,
            'Worker reassignment failed'
        );

        console.log('=== Validation Complete ===');

        // Restore original game state and emergency function
        this.updateGameState(INITIAL_STATE);
        this.showEmergencyOverlay = originalShowEmergency;

        // Remove loading screen
        loadingBg.destroy();
        loadingText.destroy();
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
        
        // Update food storage based on net food rate
        let newState = {
            ...this.gameState,
            food: this.gameState.food + foodRate
        };
        
        // Update task states based on prerequisites
        newState = updateTaskStates(newState);
        
        // Update research progress if active
        if (newState.researchProgress.taskId && !this.isEmergencyActive) {
            newState = updateResearch(newState, 1); // 1 second per tick
        }
        
        // Update game state
        this.updateGameState(newState);
        
        // Check for emergency conditions
        this.checkEmergencyState();
        
        // Update displays
        this.updateDebugDisplay();
        this.updateActivityCards();
        this.updateButtonStates();
    }
    public destroy(): void {
        if (this.updateTimer) {
            this.updateTimer.destroy();
        }
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
