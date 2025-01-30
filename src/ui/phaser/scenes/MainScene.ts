import Phaser from 'phaser'
import {
  createInitialGameState,
  tickGame,
  reassignWorker,
  startResearch,
  togglecardFocus,
} from '../../../core/game/state'
import { GameState, CardState, Card } from '../../../types'
import { getWorkerLevelName } from '../../../core/constants/workerLevels'

export default class MainScene extends Phaser.Scene {
  gameState: GameState
  resourceText!: Phaser.GameObjects.Text
  cardTexts: Record<string, Phaser.GameObjects.Text> = {}
  buttons: Record<string, Phaser.GameObjects.Text> = {}
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
    let taskYOffset = 100
    taskCards.forEach(([cardId, card]) => {
      this.createCardUI(cardId, card, this.getColumnX(1), taskYOffset)
      taskYOffset += 125
    })

    // Create Thinking Cards - second quarter
    let thinkingYOffset = 100
    thinkingCards.forEach(([cardId, card]) => {
      this.createCardUI(cardId, card, this.getColumnX(2), thinkingYOffset)
      thinkingYOffset += 125
    })

    // Create Science Cards - third quarter
    let scienceYOffset = 100
    scienceCards.forEach(([cardId, card]) => {
      this.createCardUI(cardId, card, this.getColumnX(3), scienceYOffset)
      scienceYOffset += 125
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
        const focusText = Card.isFocused ? '[Stop Focus]' : '[Focus Thinking]'
        const prereqsMet = this.arePrerequisitesMet(cardId)
        this.buttons[`${cardId}-focus`].setText(focusText)
        this.buttons[`${cardId}-focus`].setColor(
          Card.isFocused ? '#ff0' : prereqsMet ? '#fff' : '#666'
        )
        this.buttons[`${cardId}-focus`].setAlpha(prereqsMet ? 1 : 0.5)

        // Remove old listener if it exists
        this.buttons[`${cardId}-focus`].removeAllListeners()

        if (prereqsMet) {
          this.buttons[`${cardId}-focus`]
            .setInteractive()
            .on('pointerdown', () => this.handleToggleFocus(cardId))
        } else {
          this.buttons[`${cardId}-focus`].removeInteractive()
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
    const Card = this.gameState.cards[cardId]
    let text = `${Card.title} - ${getCardStateLabel(Card.state)}`

    if (Card.state === CardState.Discovered) {
      text += ` | L1: ${Card.assignedWorkers.level1} | L2: ${Card.assignedWorkers.level2}`
    }

    if (Card.state === CardState.Imagined) {
      const progress =
        (Card.researchProgress.toDiscoveredCurrent /
          Card.researchProgress.toDiscoveredRequired) *
        100
      text += ` | Research Progress: ${progress.toFixed(0)}%`
    }

    if (Card.state === CardState.Unthoughtof) {
      const progress =
        (Card.researchProgress.toImaginedCurrent /
          Card.researchProgress.toImaginedRequired) *
        100
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
        this.showPopup(
          `You have discovered how to perform a new Card: ${formatcardTitle(
            cardId
          )}`
        )
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
      .rectangle(xPos, yPos, cardWidth, 105, 0x333333)
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

    // Add Buttons on a new line
    if (card.state === CardState.Discovered) {
      this.buttons[`${cardId}-minus`] = this.add
        .text(xPos + 15, yPos + 55, '[-]', { fontSize: '16px', color: '#f00' })
        .setInteractive()
        .on('pointerdown', () => this.handleReassign(cardId, 'remove'))

      this.buttons[`${cardId}-plus`] = this.add
        .text(xPos + 55, yPos + 55, '[+]', { fontSize: '16px', color: '#0f0' })
        .setInteractive()
        .on('pointerdown', () => this.handleReassign(cardId, 'add'))

      this.productionTexts[cardId] = this.add.text(
        xPos + 100,
        yPos + 55,
        this.getProductionText(cardId),
        { fontSize: '16px', color: '#fff' }
      )
      this.productionTexts[cardId].setVisible(
        card.assignedWorkers.level1 + card.assignedWorkers.level2 > 0
      )
    }

    if (card.state === CardState.Imagined) {
      this.buttons[`${cardId}-research`] = this.add
        .text(xPos + 15, yPos + 55, '[Think About This]', {
          fontSize: '16px',
          color: '#00f',
        })
        .setInteractive()
        .on('pointerdown', () => this.handleStartResearch(cardId))
    }

    if (card.state === CardState.Imagined || card.state === CardState.Unthoughtof) {
      const focusText = card.isFocused ? '[Stop Focus]' : '[Focus Thinking]'
      const prereqsMet = this.arePrerequisitesMet(cardId)
      const xOffset = card.state === CardState.Imagined ? xPos + 180 : xPos + 15
      
      this.buttons[`${cardId}-focus`] = this.add
        .text(xOffset, yPos + 55, focusText, {
          fontSize: '16px',
          color: card.isFocused ? '#ff0' : prereqsMet ? '#fff' : '#666',
        })
        .setAlpha(prereqsMet ? 1 : 0.5)

      if (prereqsMet) {
        this.buttons[`${cardId}-focus`]
          .setInteractive()
          .on('pointerdown', () => this.handleToggleFocus(cardId))
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
      return '????'
    case CardState.Imagined:
      return '🔎 Imagined'
    case CardState.Discovered:
      return '✅ Discovered'
    default:
      return ''
  }
}
