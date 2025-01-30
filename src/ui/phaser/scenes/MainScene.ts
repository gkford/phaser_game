import Phaser from 'phaser'
import { 
  createInitialGameState, 
  tickGame, 
  reassignWorker, 
  startResearch, 
  togglecardFocus,
  captureWorkerAssignments,
  removeAllWorkers,
  performWorkerUpgrade,
  redistributeWorkers
} from '../../../core/game/state'
import { GameState, CardState, Card } from '../../../types'
import { getWorkerLevelName } from '../../../core/constants/workerLevels'

export default class MainScene extends Phaser.Scene {
  gameState: GameState
  resourceText!: Phaser.GameObjects.Text
  cardTexts: Record<string, Phaser.GameObjects.Text> = {}
  buttons: Record<string, Phaser.GameObjects.Text | Phaser.GameObjects.Rectangle> = {}
  cardPositions: Record<string, number> = {}
  productionTexts: Record<string, Phaser.GameObjects.Text> = {}
  cardContainers: Record<string, Phaser.GameObjects.Container> = {}
  
  private scrollY: number = 0;
  private readonly scrollSpeed: number = 15;
  private maxScroll: number = 0;

  constructor() {
    super('MainScene')
    this.gameState = createInitialGameState()
  }

  private cleanupUI() {
    this.scrollY = 0;
    
    // Destroy all existing card containers
    Object.values(this.cardContainers).forEach(container => {
      container.destroy()
    })
    
    // Destroy resource text if it exists
    if (this.resourceText) {
      this.resourceText.destroy()
    }
    
    // Clear all our tracking objects
    this.cardContainers = {}
    this.cardTexts = {}
    this.buttons = {}
    this.cardPositions = {}
  }

  private getColumnX(columnIndex: number): number {
    const columnWidth = window.innerWidth / 4;  // 4 columns
    return columnWidth * columnIndex + 20; // 20px padding from left
  }

  preload() {
    // Load assets here if needed (e.g., background images, icons)
  }

  create() {
    this.createUI()
    this.time.addEvent({
      delay: 1000,
      callback: this.updateGame,
      callbackScope: this,
      loop: true,
    })
  }

  createUI() {
    this.cleanupUI()

    // Title at the top
    this.add.text(20, 20, 'Prehistoric Tech Game', {
      fontSize: '24px',
      color: '#fff',
    })

    // Column headers - spread evenly across screen
    this.add.text(this.getColumnX(0), 60, 'Resources & Status', { fontSize: '20px', color: '#fff' })
    this.add.text(this.getColumnX(1), 60, 'Tasks', { fontSize: '20px', color: '#fff' })
    this.add.text(this.getColumnX(2), 60, 'Thinking', { fontSize: '20px', color: '#fff' })
    this.add.text(this.getColumnX(3), 60, 'Science', { fontSize: '20px', color: '#fff' })

    // Resources column - keep at left
    this.resourceText = this.add.text(20, 100, this.getResourceText(), {
      fontSize: '18px',
      color: '#fff',
      wordWrap: { width: 350, useAdvancedWrap: true },
      align: 'left'
    })

    // Sort cards by type and filter thinking cards based on worker levels
    const taskCards = Object.entries(this.gameState.cards)
      .filter(([_, card]) => card.type === 'task')
    const thinkingCards = Object.entries(this.gameState.cards)
      .filter(([_, card]) => {
        if (card.type !== 'thinking') return false
    
        // Only show thinking cards that are Discovered AND have corresponding workers
        if (card.id === 'thinkingL1') {
          return card.state === CardState.Discovered && this.gameState.workers.level1.total > 0
        }
        if (card.id === 'thinkingL2') {
          return card.state === CardState.Discovered && this.gameState.workers.level2.total > 0
        }
        return false
      })
    const scienceCards = Object.entries(this.gameState.cards)
      .filter(([_, card]) => card.type === 'science')

    // Create Task Cards - first quarter
    // Create Task Cards - first quarter
    let taskYOffset = 100
    taskCards.forEach(([cardId, card]) => {
      this.createCardUI(cardId, card, this.getColumnX(1), taskYOffset)
      taskYOffset += 190
    })

    // Create Thinking Cards - second quarter
    let thinkingYOffset = 100
    thinkingCards.forEach(([cardId, card]) => {
      this.createCardUI(cardId, card, this.getColumnX(2), thinkingYOffset)
      thinkingYOffset += 190
    })

    // Create Science Cards - third quarter
    let scienceYOffset = 100
    scienceCards.forEach(([cardId, card]) => {
      this.createCardUI(cardId, card, this.getColumnX(3), scienceYOffset)
      scienceYOffset += 190
    })
  }

  updateGame() {
    const previousCards = JSON.parse(JSON.stringify(this.gameState.cards))
    this.gameState = tickGame(this.gameState)
    this.handlecardTransitions(previousCards, this.gameState.cards)
    this.updateUI()
  }

  updateUI() {
    this.resourceText.setText(this.getResourceText())

    Object.entries(this.gameState.cards).forEach(([cardId, Card]) => {
      // Only update UI elements if they exist
      if (this.cardTexts[cardId]) {
        this.cardTexts[cardId].setText(this.getcardText(cardId))
      }  // <-- Added closing brace
      // Update focus button text if it exists
      if (this.buttons[`${cardId}-focus`]) {
        const focusButton = this.buttons[`${cardId}-focus`];
        const focusText = Card.isFocused 
          ? (Card.state === CardState.Unthoughtof ? 'Stop Imagining' : 'Stop Focus')
          : Card.state === CardState.Unthoughtof 
            ? 'Imagine...' 
            : 'Focus Thinking'
        const prereqsMet = this.arePrerequisitesMet(cardId)
      
        // Check if it's a Text object before calling setText and setColor
        if (focusButton instanceof Phaser.GameObjects.Text) {
          focusButton.setText(focusText)
          focusButton.setColor(Card.isFocused ? '#ff0' : prereqsMet ? '#fff' : '#666')
          focusButton.setAlpha(prereqsMet ? 1 : 0.5)
        }

        // Update the button background if it exists
        if (this.buttons[`${cardId}-focus-bg`]) {
          const buttonBg = this.buttons[`${cardId}-focus-bg`];
          if (buttonBg instanceof Phaser.GameObjects.Rectangle) {
            buttonBg
              .setFillStyle(Card.isFocused ? 0x886600 : prereqsMet ? 0x444444 : 0x222222)
              .setAlpha(prereqsMet ? 1 : 0.5);
          }
        }

        // Remove old listener if it exists
        if (focusButton instanceof Phaser.GameObjects.Text) {
          focusButton.removeAllListeners()

          if (prereqsMet) {
            focusButton
              .setInteractive()
              .on('pointerdown', () => this.handleToggleFocus(cardId))
          } else {
            focusButton.removeInteractive()
          }
        }
      }

      // Handle button visibility based on Card state
      const minusBtn = this.buttons[`${cardId}-minus`]
      const plusBtn = this.buttons[`${cardId}-plus`]
      const researchBtn = this.buttons[`${cardId}-research`]
      const focusBtn = this.buttons[`${cardId}-focus`]

      if (Card.state === CardState.Discovered) {
        // Show +/– for non-science cards
        const showPlusMinus = Card.type !== 'science'
        minusBtn?.setVisible(showPlusMinus)
        plusBtn?.setVisible(showPlusMinus)
        researchBtn?.setVisible(false)
        focusBtn?.setVisible(false)
      } else if (Card.state === CardState.Imagined) {
        // Show research and focus buttons
        minusBtn?.setVisible(false)
        plusBtn?.setVisible(false)
        researchBtn?.setVisible(true)
        focusBtn?.setVisible(true)
      } else if (Card.state === CardState.Unthoughtof) {
        // Hide most buttons, show focus if prerequisites met
        minusBtn?.setVisible(false)
        plusBtn?.setVisible(false)
        researchBtn?.setVisible(false)
        const prereqsMet = this.arePrerequisitesMet(cardId)
        focusBtn?.setVisible(prereqsMet)
      }
    })
  }

  getResourceText(): string {
    const food = Math.floor(this.gameState.resources.food)

    // Calculate persistent upgrades
    let bonusesText = '\nBonuses:'
    let hasBonuses = false
    Object.values(this.gameState.cards).forEach(card => {
      if (card.state === CardState.Discovered && card.persistentUpgrade) {
        hasBonuses = true
        if (card.persistentUpgrade.type === 'foodProduction') {
          bonusesText += `\n${card.title}: ${card.persistentUpgrade.multiplier.toFixed(1)}x 🍖`
        }
      }
    })

    // Calculate thought rates for each level
    const l1Card = this.gameState.cards['thinkingL1']
    const l2Card = this.gameState.cards['thinkingL2']
    const l3Card = this.gameState.cards['thinkingL3'] || { assignedWorkers: { level3: 0 }, productionPerWorker: { thoughts: 0 } }
    const l4Card = this.gameState.cards['thinkingL4'] || { assignedWorkers: { level4: 0 }, productionPerWorker: { thoughts: 0 } }

    const l1ThoughtRate = (l1Card.assignedWorkers.level1 + l1Card.assignedWorkers.level2) * 
        (l1Card.productionPerWorker.thoughts ?? 0)
    const l2ThoughtRate = l2Card.assignedWorkers.level2 * 
        (l2Card.productionPerWorker.thoughts ?? 0)
    const l3ThoughtRate = l3Card.assignedWorkers.level3 * 
        (l3Card.productionPerWorker.thoughts ?? 0)
    const l4ThoughtRate = l4Card.assignedWorkers.level4 * 
        (l4Card.productionPerWorker.thoughts ?? 0)

    // Calculate food production and consumption
    let totalFoodProduction = 0
    Object.values(this.gameState.cards).forEach(card => {
        if (card.state === CardState.Discovered && card.productionPerWorker.food) {
            const totalWorkers = Object.values(card.assignedWorkers).reduce((sum, count) => sum + count, 0)
            totalFoodProduction += card.productionPerWorker.food * totalWorkers
        }
    })

    // Calculate total workers for food consumption
    const totalWorkers = 
        this.gameState.workers.level1.total + 
        this.gameState.workers.level2.total +
        (this.gameState.workers.level3?.total || 0) +
        (this.gameState.workers.level4?.total || 0)
    
    const foodConsumption = totalWorkers // 1 food per worker
    const excessFood = totalFoodProduction - foodConsumption

    return `🍖 Food: ${food}

Population:
${getWorkerLevelName('level1')}s: ${this.gameState.workers.level1.assigned}/${this.gameState.workers.level1.total}
${getWorkerLevelName('level2')}s: ${this.gameState.workers.level2.assigned}/${this.gameState.workers.level2.total}
${getWorkerLevelName('level3')}s: ${this.gameState.workers.level3?.assigned || 0}/${this.gameState.workers.level3?.total || 0}
${getWorkerLevelName('level4')}s: ${this.gameState.workers.level4?.assigned || 0}/${this.gameState.workers.level4?.total || 0}

Thought Rates:
🧠 ${getWorkerLevelName('level1')}: ${l1ThoughtRate.toFixed(1)}/sec
🧠 ${getWorkerLevelName('level2')}: ${l2ThoughtRate.toFixed(1)}/sec
🧠 ${getWorkerLevelName('level3')}: ${l3ThoughtRate.toFixed(1)}/sec
🧠 ${getWorkerLevelName('level4')}: ${l4ThoughtRate.toFixed(1)}/sec

Food Economy:
Production: ${totalFoodProduction.toFixed(1)}/sec
Consumption: ${foodConsumption.toFixed(1)}/sec
Net Change: ${excessFood.toFixed(1)}/sec${hasBonuses ? `\n${bonusesText}` : ''}`
  }

  getcardText(cardId: string): string {
    const card = this.gameState.cards[cardId]
    let text = ''
    
    switch (card.state) {
      case CardState.Unthoughtof:
        // Mask the title with question marks, preserving spaces
        const maskedTitle = card.title.split('').map(char => 
          char === ' ' ? ' ' : '?'
        ).join('')
        
        // Add research progress
        const imaginedProgress = (card.researchProgress.toImaginedCurrent / 
          card.researchProgress.toImaginedRequired) * 100
        text = `\n${maskedTitle} | Research Progress: ${imaginedProgress.toFixed(0)}%`
        
        // Add masked description if present
        if (card.description) {
          const maskedDesc = card.description.split('').map(char => 
            char === ' ' ? ' ' : '?'
          ).join('')
          text += `\n${maskedDesc}`
        }

        // Add thinking level requirement if present
        if (card.minimumThinkingLevel) {
          text += `\nRequires ${getWorkerLevelName('level' + card.minimumThinkingLevel)} thinking`
        }
        break

      case CardState.Imagined:
        text = `\n${card.title} - ${getCardStateLabel(card.state)}`
        const discoveredProgress = (card.researchProgress.toDiscoveredCurrent /
          card.researchProgress.toDiscoveredRequired) * 100
        text += ` | Research Progress: ${discoveredProgress.toFixed(0)}%`
        if (card.description) {
          text += `\n${card.description}`
        }
        // Add thinking level requirement if present
        if (card.minimumThinkingLevel) {
          text += `\nRequires ${getWorkerLevelName('level' + card.minimumThinkingLevel)} thinking`
        }
        break

      case CardState.Discovered:
        text = `\n${card.title} - ${getCardStateLabel(card.state)}`
        text += `\n\nL1: ${card.assignedWorkers.level1} | L2: ${card.assignedWorkers.level2}`
        
        // Add production rate info if card produces food
        if (card.productionPerWorker.food) {
          const totalWorkers = Object.values(card.assignedWorkers).reduce((sum, count) => sum + count, 0);
          const foodPerSecond = totalWorkers * card.productionPerWorker.food;
          text += `\nProducing ${foodPerSecond.toFixed(1)} food/sec`
        }
        
        if (card.description) {
          text += `\n${card.description}`
        }
        break
    }

    return text
  }

  private arePrerequisitesMet(cardId: string): boolean {
    const Card = this.gameState.cards[cardId]
    return Card.prerequisites.every(
      (prereq) => this.gameState.cards[prereq].state === CardState.Discovered
    )
  }


  private handlecardTransitions(
    oldCards: Record<string, Card>,
    newCards: Record<string, Card>
  ) {
    for (const [cardId, newcard] of Object.entries(newCards)) {
      const oldcard = oldCards[cardId]

      // Handle Unthoughtof -> Imagined transition
      if (
        oldcard.state === CardState.Unthoughtof &&
        newcard.state === CardState.Imagined
      ) {
        // Reset the Card's workers, research progress, and focus
        this.gameState.cards[cardId].assignedWorkers = { 
          level1: 0, 
          level2: 0, 
          level3: 0, 
          level4: 0 
        }
        this.gameState.cards[cardId].researchProgress.toDiscoveredCurrent = 0
        this.gameState.cards[cardId].isFocused = false

        // Show popup
        this.showPopup(
          `You have imagined the possibility of a new Card: ${formatcardTitle(
            cardId
          )}`
        )
      }

      // Handle Imagined -> Discovered transition
      if (
        oldcard.state === CardState.Imagined &&
        newcard.state === CardState.Discovered
      ) {
        // Handle onDiscovery effects
        if (newcard.onDiscovery) {
          if (newcard.onDiscovery.type === 'workerUpgrade') {
            const effect = newcard.onDiscovery;
            
            // Capture current assignments
            const previousAssignments = captureWorkerAssignments(this.gameState);
            
            // Remove all workers
            this.gameState = removeAllWorkers(this.gameState);
            
            // Perform the upgrade
            this.gameState = performWorkerUpgrade(
              this.gameState,
              effect.fromLevel,
              effect.toLevel,
              effect.amount
            );
            
            // Redistribute workers
            this.gameState = redistributeWorkers(this.gameState, previousAssignments);
          }
          // Show effect-specific message
          this.showPopup(newcard.onDiscovery.message);

          // Auto-discover thinkingL2 if we just discovered non-verbal communication
          if (newcard.id === 'nonVerbalCommunication') {
            this.gameState.cards['thinkingL2'].state = CardState.Discovered;
            // Force an immediate UI update after both changes
            this.createUI();
          }
        } else {
          // Show default discovery message
          this.showPopup(
            `You have discovered how to perform a new Card: ${formatcardTitle(
              cardId
            )}`
          )
        }
      }
    }
  }

  private scroll(amount: number) {
    // Calculate new scroll position
    const newScrollY = this.scrollY + amount;
    
    // Don't scroll above 0
    if (newScrollY < 0) {
        this.scrollY = 0;
    }
    // Don't scroll below max scroll
    else if (newScrollY > this.maxScroll) {
        this.scrollY = this.maxScroll;
    }
    else {
        this.scrollY = newScrollY;
    }

    // Update all containers
    Object.values(this.cardContainers).forEach(container => {
        const originalY = this.cardPositions[container.name];
        container.setY(originalY - this.scrollY);
    });
  }

  private showPopup(message: string) {
    const popup = this.add
      .text(400, 300, message, {
        fontSize: '20px',
        color: '#fff',
        backgroundColor: '#000',
        padding: { x: 10, y: 10 },
      })
      .setOrigin(0.5)

    this.time.addEvent({
      delay: 3000,
      callback: () => {
        popup.destroy()
      },
    })
  }

  handleReassign(cardId: string, action: 'add' | 'remove') {
    this.gameState = reassignWorker(this.gameState, cardId, action)
    this.updateUI()
  }

  handleStartResearch(cardId: string) {
    this.gameState = startResearch(this.gameState, cardId)
    this.updateUI()
  }

  handleToggleFocus(cardId: string) {
    this.gameState = togglecardFocus(this.gameState, cardId)
    this.updateUI()
  }

  private createCardUI(cardId: string, _card: Card, xPos: number, yPos: number) {
    this.cardPositions[cardId] = yPos

    // Create container for the card
    const cardContainer = this.add.container(xPos, yPos);
    cardContainer.name = cardId; // Set container name for scrolling
    this.cardContainers[cardId] = cardContainer;

    // Update max scroll calculation
    const bottomMost = Math.max(...Object.values(this.cardPositions)) + 190; // 190 is card height
    this.maxScroll = Math.max(0, bottomMost - this.cameras.main.height + 100);

    // Create background rectangle inside the container
    const columnWidth = window.innerWidth / 4
    const cardWidth = columnWidth - 40
    cardContainer.add(this.add.rectangle(0, 0, cardWidth, 170, 0x333333).setOrigin(0, 0).setAlpha(0.5))

    // Add Card info text
    const cardInfoText = this.add.text(15, 15, this.getcardText(cardId), {
      fontSize: '16px',
      color: '#fff',
      wordWrap: { width: cardWidth - 30, useAdvancedWrap: true },
      align: 'left'
    })
    cardContainer.add(cardInfoText)
    this.cardTexts[cardId] = cardInfoText


    // Create button container
    const buttonContainer = this.add.container(0, 130)
    cardContainer.add(buttonContainer)

    // Create minus button
    const minusButton = this.add.text(20, 0, '[-]', { fontSize: '16px', color: '#f00' })
      .setInteractive()
      .on('pointerdown', () => this.handleReassign(cardId, 'remove'))
      .setVisible(false)
    buttonContainer.add(minusButton)
    this.buttons[`${cardId}-minus`] = minusButton

    // Create plus button
    const plusButton = this.add.text(60, 0, '[+]', { fontSize: '16px', color: '#0f0' })
      .setInteractive()
      .on('pointerdown', () => this.handleReassign(cardId, 'add'))
      .setVisible(false)
    buttonContainer.add(plusButton)
    this.buttons[`${cardId}-plus`] = plusButton

    // Create research button
    const researchButton = this.add.text(100, 0, '[Think]', { fontSize: '16px', color: '#0ff' })
      .setInteractive()
      .on('pointerdown', () => this.handleStartResearch(cardId))
      .setVisible(false)
    buttonContainer.add(researchButton)
    this.buttons[`${cardId}-research`] = researchButton

    // Create focus button
    const focusButton = this.add.text(180, 0, '[Focus]', { fontSize: '16px', color: '#ff0' })
      .setInteractive()
      .on('pointerdown', () => this.handleToggleFocus(cardId))
      .setVisible(false)
    buttonContainer.add(focusButton)
    this.buttons[`${cardId}-focus`] = focusButton

  }
}

// Utility Functions
function formatcardTitle(cardId: string): string {
  return cardId
}

function getCardStateLabel(state: CardState): string {
  switch (state) {
    case CardState.Unthoughtof:
      return '' // Remove the ???? for unthoughtof state
    case CardState.Imagined:
      return '🔎 Imagined'
    case CardState.Discovered:
      return '✅ Discovered'
    default:
      return ''
  }
}
