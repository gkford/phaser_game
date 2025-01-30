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

  constructor() {
    super('MainScene')
    this.gameState = createInitialGameState()
  }

  private cleanupUI() {
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

    const l1ThoughtRate = Object.values(this.gameState.cards).reduce(
      (sum, t) =>
        sum + (t.productionPerWorker.thoughts ?? 0) * t.assignedWorkers.level1,
      0
    )

    const l2ThoughtRate = Object.values(this.gameState.cards).reduce(
      (sum, t) =>
        sum + (t.productionPerWorker.thoughts ?? 0) * t.assignedWorkers.level2,
      0
    )

    const totalThoughtRate = l1ThoughtRate + l2ThoughtRate

    return `🍖 Food: ${food}
    | ${getWorkerLevelName('level1')}s: ${this.gameState.workers.level1.assigned}/${
      this.gameState.workers.level1.total
    }
    | ${getWorkerLevelName('level2')}s: ${this.gameState.workers.level2.assigned}/${
      this.gameState.workers.level2.total
    }
    | 🧠 ${getWorkerLevelName('level1')} Thought Rate: ${l1ThoughtRate.toFixed(1)}
    | 🧠 ${getWorkerLevelName('level2')} Thought Rate: ${l2ThoughtRate.toFixed(1)}
    | 🧠 Combined Thought Rate: ${totalThoughtRate.toFixed(
      1
    )} (* ${getWorkerLevelName('level2')} thinking is 1.5 each)`
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
        break

      case CardState.Imagined:
        text = `\n${card.title} - ${getCardStateLabel(card.state)}`
        const discoveredProgress = (card.researchProgress.toDiscoveredCurrent /
          card.researchProgress.toDiscoveredRequired) * 100
        text += ` | Research Progress: ${discoveredProgress.toFixed(0)}%`
        if (card.description) {
          text += `\n${card.description}`
        }
        break

      case CardState.Discovered:
        text = `\n${card.title} - ${getCardStateLabel(card.state)}`
        text += `\n\nL1: ${card.assignedWorkers.level1} | L2: ${card.assignedWorkers.level2}`
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
        this.gameState.cards[cardId].assignedWorkers = { level1: 0, level2: 0 }
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
    const cardContainer = this.add.container(xPos, yPos)
    this.cardContainers[cardId] = cardContainer

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
