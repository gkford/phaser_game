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

  constructor() {
    super('MainScene')
    this.gameState = createInitialGameState()
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

    // Sort cards by type
    const taskCards = Object.entries(this.gameState.cards)
      .filter(([_, card]) => card.type === 'task')
    const thinkingCards = Object.entries(this.gameState.cards)
      .filter(([_, card]) => card.type === 'thinking')
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
      this.cardTexts[cardId].setText(this.getcardText(cardId))

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

      // Handle dynamic button updates based on Card state
      if (Card.state === CardState.Discovered) {
        // Remove Focus/Research buttons if they exist
        if (this.buttons[`${cardId}-focus`]) {
          this.buttons[`${cardId}-focus`].destroy()
          delete this.buttons[`${cardId}-focus`]
        }
        if (this.buttons[`${cardId}-research`]) {
          this.buttons[`${cardId}-research`].destroy()
          delete this.buttons[`${cardId}-research`]
        }

        // Create +/- buttons if they don't exist yet
        if (!this.buttons[`${cardId}-minus`]) {
          this.buttons[`${cardId}-minus`] = this.add
            .text(420, this.cardPositions[cardId] + 55, '[-]', {
              fontSize: '16px',
              color: '#f00',
            })
            .setInteractive()
            .on('pointerdown', () => this.handleReassign(cardId, 'remove'))
        }
        if (!this.buttons[`${cardId}-plus`]) {
          this.buttons[`${cardId}-plus`] = this.add
            .text(460, this.cardPositions[cardId] + 55, '[+]', {
              fontSize: '16px',
              color: '#0f0',
            })
            .setInteractive()
            .on('pointerdown', () => this.handleReassign(cardId, 'add'))
        }

        // Update production text (create it if missing)
        if (!this.productionTexts[cardId]) {
          this.productionTexts[cardId] = this.add.text(
            120,
            this.cardPositions[cardId] + 55,
            '',
            { fontSize: '16px', color: '#fff' }
          )
        }
        this.productionTexts[cardId].setText(this.getProductionText(cardId))
        this.productionTexts[cardId].setVisible(
          Card.assignedWorkers.level1 + Card.assignedWorkers.level2 > 0
        )
      } else {
        // If the Card is no longer discovered, remove/hide any existing production text
        if (this.productionTexts[cardId]) {
          this.productionTexts[cardId].destroy()
          delete this.productionTexts[cardId]
        }
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
    
    if (card.state === CardState.Unthoughtof) {
      // Mask the title with question marks, preserving spaces
      const maskedTitle = card.title.split('').map(char => 
        char === ' ' ? ' ' : '?'
      ).join('')
      
      // Add research progress
      const progress = (card.researchProgress.toImaginedCurrent / 
        card.researchProgress.toImaginedRequired) * 100
      return `\n${maskedTitle} | Research Progress: ${progress.toFixed(0)}%`
    }

    // For other states, modify the text formatting
    let text = `\n${card.title} - ${getCardStateLabel(card.state)}`

    if (card.state === CardState.Discovered) {
      text += `\n\nL1: ${card.assignedWorkers.level1} | L2: ${card.assignedWorkers.level2}`
    }

    if (card.state === CardState.Imagined) {
      const progress = (card.researchProgress.toDiscoveredCurrent /
        card.researchProgress.toDiscoveredRequired) * 100
      text += ` | Research Progress: ${progress.toFixed(0)}%`
    }

    return text
  }

  private arePrerequisitesMet(cardId: string): boolean {
    const Card = this.gameState.cards[cardId]
    return Card.prerequisites.every(
      (prereq) => this.gameState.cards[prereq].state === CardState.Discovered
    )
  }

  private getProductionText(cardId: string): string {
    const Card = this.gameState.cards[cardId]
    if (Card.assignedWorkers.level1 + Card.assignedWorkers.level2 <= 0)
      return '' // No workers, no production text.

    const assignedSum =
      Card.assignedWorkers.level1 + Card.assignedWorkers.level2
    const foodRate = (Card.productionPerWorker.food ?? 0) * assignedSum
    const thoughtRate = (Card.productionPerWorker.thoughts ?? 0) * assignedSum

    const parts = []
    if (foodRate > 0) {
      parts.push(`${foodRate.toFixed(1)} food/sec`)
    }
    if (thoughtRate > 0) {
      parts.push(`${thoughtRate.toFixed(1)} thoughts/sec`)
    }
    return parts.join(' + ')
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

  private createCardUI(cardId: string, card: Card, xPos: number, yPos: number) {
    this.cardPositions[cardId] = yPos

    // Create background rectangle for card - make it fit column width
    const columnWidth = window.innerWidth / 4;
    const cardWidth = columnWidth - 40; // Leave some margin
    this.add
      .rectangle(xPos, yPos, cardWidth, 170, 0x333333)
      .setOrigin(0, 0)
      .setAlpha(0.5)

    // Add Card info text with proper wrapping
    this.cardTexts[cardId] = this.add.text(
      xPos + 15,
      yPos + 15,
      this.getcardText(cardId),
      {
        fontSize: '16px',
        color: '#fff',
        wordWrap: { width: cardWidth - 30, useAdvancedWrap: true },
        align: 'left'
      }
    )

    // Add description for science cards (show for all states, not just discovered)
    if (card.type === 'science' && card.description) {
      this.add.text(
        xPos + 15,
        yPos + 55,
        card.description,
        {
          fontSize: '14px',
          color: card.state === CardState.Discovered ? '#fff' : '#aaa',
          wordWrap: { width: cardWidth - 30, useAdvancedWrap: true },
          align: 'left'
        }
      )
    }

    // Only add worker assignment buttons for non-science cards
    if (card.state === CardState.Discovered && card.type !== 'science') {
      this.buttons[`${cardId}-minus`] = this.add
        .text(xPos + 15, yPos + 130, '[-]', { fontSize: '16px', color: '#f00' })
        .setInteractive()
        .on('pointerdown', () => this.handleReassign(cardId, 'remove'))

      this.buttons[`${cardId}-plus`] = this.add
        .text(xPos + 55, yPos + 130, '[+]', { fontSize: '16px', color: '#0f0' })
        .setInteractive()
        .on('pointerdown', () => this.handleReassign(cardId, 'add'))

      this.productionTexts[cardId] = this.add.text(
        xPos + 100,
        yPos + 130,
        this.getProductionText(cardId),
        { fontSize: '16px', color: '#fff' }
      )
      this.productionTexts[cardId].setVisible(
        card.assignedWorkers.level1 + card.assignedWorkers.level2 > 0
      )
    }

    if (card.state === CardState.Imagined) {
      this.buttons[`${cardId}-research`] = this.add
        .text(xPos + 15, yPos + 130, '[Think About This]', {
          fontSize: '16px',
          color: '#00f',
        })
        .setInteractive()
        .on('pointerdown', () => this.handleStartResearch(cardId))
    }

    if (card.state === CardState.Imagined || card.state === CardState.Unthoughtof) {
      const focusText = card.isFocused 
        ? (card.state === CardState.Unthoughtof ? 'Stop Imagining' : 'Stop Focus')
        : card.state === CardState.Unthoughtof 
          ? 'Imagine...' 
          : 'Focus Thinking'
      const prereqsMet = this.arePrerequisitesMet(cardId)
      const xOffset = card.state === CardState.Imagined ? xPos + 180 : xPos + 15

      // Create background rectangle for button
      const buttonWidth = 160
      const buttonHeight = 30
      const buttonBg = this.add.rectangle(
        xOffset + 20,
        yPos + 130,
        buttonWidth,
        buttonHeight,
        card.isFocused ? 0x886600 : prereqsMet ? 0x444444 : 0x222222
      )
      .setOrigin(0, 0)
      .setAlpha(prereqsMet ? 1 : 0.5)

      // Add text centered on the button
      const buttonText = this.add
        .text(
          xOffset + 20 + buttonWidth/2,
          yPos + 130 + buttonHeight/2,
          focusText,
          {
            fontSize: '16px',
            color: card.isFocused ? '#ff0' : prereqsMet ? '#fff' : '#666',
          }
        )
        .setOrigin(0.5, 0.5)
        .setAlpha(prereqsMet ? 1 : 0.5)

      if (prereqsMet) {
        // Make the button background interactive
        buttonBg
          .setInteractive()
          .on('pointerdown', () => this.handleToggleFocus(cardId))
          .on('pointerover', () => {
            buttonBg.setFillStyle(card.isFocused ? 0xaa8800 : 0x555555)
          })
          .on('pointerout', () => {
            buttonBg.setFillStyle(card.isFocused ? 0x886600 : 0x444444)
          })

        // Store both the background and text
        this.buttons[`${cardId}-focus-bg`] = buttonBg
        this.buttons[`${cardId}-focus`] = buttonText
      }
    }
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
