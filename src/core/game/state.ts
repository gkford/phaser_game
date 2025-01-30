import { cloneDeep } from 'lodash'
import { GameState, CardState, WorkerLevelKey } from '../../types'
import { intialCards } from '../cards/data'

// Initializes game state with predefined cards.
export function createInitialGameState(): GameState {
  return {
    resources: {
      food: 0,
    },
    workers: {
      level1: { total: 10, assigned: 10 },
      level2: { total: 0, assigned: 0 },
    },
    cards: intialCards,
    currentResearchcardId: null,
  }
}

export function reassignWorker(
  state: GameState,
  cardId: string,
  action: 'add' | 'remove'
): GameState {
  const newState = cloneDeep(state)
  const Card = newState.cards[cardId]

  if (action === 'add') {
    // Add the first available worker among the Card's accepted levels, from lowest to highest
    for (const lvl of [1, 2]) {
      const levelKey = ('level' + lvl) as WorkerLevelKey
      if (Card.acceptedWorkerLevels.includes(lvl)) {
        const workerPool = newState.workers[levelKey]
        if (workerPool.assigned < workerPool.total) {
          workerPool.assigned++
          Card.assignedWorkers[levelKey]++
          break
        }
      }
    }
  } else {
    // Remove from highest to lowest
    for (const lvl of [2, 1]) {
      const levelKey = ('level' + lvl) as WorkerLevelKey
      if (Card.acceptedWorkerLevels.includes(lvl)) {
        if (Card.assignedWorkers[levelKey] > 0) {
          // Check if we have enough workers to remove
          if (newState.workers[levelKey].assigned > 0) {
            newState.workers[levelKey].assigned--
            Card.assignedWorkers[levelKey]--
            break
          }
        }
      }
    }
  }

  return newState
}

// Updates resource production based on assigned workers.
export function updateResources(state: GameState): GameState {
  let foodProduced = 0
  let thoughtsProduced = 0

  for (const Card of Object.values(state.cards)) {
    if (Card.state === CardState.Discovered) {
      const totalAssigned =
        Card.assignedWorkers.level1 + Card.assignedWorkers.level2
      foodProduced += (Card.productionPerWorker.food ?? 0) * totalAssigned
      thoughtsProduced +=
        (Card.productionPerWorker.thoughts ?? 0) * totalAssigned
    }
  }

  const totalWorkers = state.workers.level1.total + state.workers.level2.total
  foodProduced -= totalWorkers // Each worker consumes 1 food/sec.

  return {
    ...state,
    resources: {
      food: state.resources.food + foodProduced,
    },
  }
}

// Progresses research on the currently selected research Card.
export function updateResearch(state: GameState): GameState {
  const newState = cloneDeep(state)
  const thoughtsProduced = Object.values(newState.cards).reduce(
    (sum, t) =>
      sum +
      (t.productionPerWorker.thoughts ?? 0) *
        (t.assignedWorkers.level1 + t.assignedWorkers.level2),
    0
  )

  // Handle actively researched Card (when clicking "Think About This")
  if (state.currentResearchcardId) {
    const researchCard = newState.cards[state.currentResearchcardId]
    if (researchCard.state === CardState.Imagined) {
      researchCard.researchProgress.toDiscoveredCurrent += thoughtsProduced
      if (
        researchCard.researchProgress.toDiscoveredCurrent >=
        researchCard.researchProgress.toDiscoveredRequired
      ) {
        researchCard.state = CardState.Discovered
      }
    }
  }

  // Handle focused Card
  const focusedcard = Object.values(newState.cards).find(
    (Card) => Card.isFocused
  )
  if (focusedcard) {
    if (focusedcard.state === CardState.Unthoughtof) {
      focusedcard.researchProgress.toImaginedCurrent += thoughtsProduced
      if (
        focusedcard.researchProgress.toImaginedCurrent >=
        focusedcard.researchProgress.toImaginedRequired
      ) {
        focusedcard.state = CardState.Imagined
      }
    } else if (focusedcard.state === CardState.Imagined) {
      focusedcard.researchProgress.toDiscoveredCurrent += thoughtsProduced
      if (
        focusedcard.researchProgress.toDiscoveredCurrent >=
        focusedcard.researchProgress.toDiscoveredRequired
      ) {
        focusedcard.state = CardState.Discovered
      }
    }
  }

  return newState
}

// Assigns a Card to be actively researched.
export function startResearch(state: GameState, cardId: string): GameState {
  if (state.cards[cardId].state !== CardState.Imagined) return state
  return { ...state, currentResearchcardId: cardId }
}

// Checks if prerequisites for cards are met and updates states.
export function updatecardAvailability(state: GameState): GameState {
  // No longer automatically transitioning cards to Imagined state
  return state
}

// Toggles focus state for a Card
export function togglecardFocus(state: GameState, cardId: string): GameState {
  const newState = cloneDeep(state)
  const targetcard = newState.cards[cardId]

  // If Card is already focused, just unfocus it
  if (targetcard.isFocused) {
    targetcard.isFocused = false
    return newState
  }

  // Otherwise, unfocus all cards and focus the target Card
  if (
    targetcard.state === CardState.Imagined ||
    targetcard.state === CardState.Unthoughtof
  ) {
    Object.values(newState.cards).forEach((Card) => {
      Card.isFocused = false
    })
    targetcard.isFocused = true
  }

  return newState
}

export function tickGame(state: GameState): GameState {
  let newState = updateResources(state)
  newState = updateResearch(newState)
  newState = updatecardAvailability(newState)
  return newState
}
