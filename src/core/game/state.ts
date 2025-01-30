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
  const card = newState.cards[cardId]

  if (action === 'add') {
    // Find the lowest accepted level that has available workers
    for (const lvl of card.acceptedWorkerLevels.sort((a, b) => a - b)) {
      const levelKey = ('level' + lvl) as WorkerLevelKey
      const workerPool = newState.workers[levelKey]
      if (workerPool.assigned < workerPool.total) {
        workerPool.assigned++
        card.assignedWorkers[levelKey]++
        break
      }
    }
  } else {
    // Remove from highest to lowest among assigned workers
    for (const lvl of card.acceptedWorkerLevels.sort((a, b) => b - a)) {
      const levelKey = ('level' + lvl) as WorkerLevelKey
      if (card.assignedWorkers[levelKey] > 0) {
        newState.workers[levelKey].assigned--
        card.assignedWorkers[levelKey]--
        break
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
  
  // Calculate thoughts per level
  const thoughtsByLevel = Object.values(newState.cards).reduce((acc, card) => {
    Object.entries(card.assignedWorkers).forEach(([level, count]) => {
      const levelKey = level as WorkerLevelKey
      const thoughtRate = card.productionPerWorker.thoughts ?? 0
      acc[levelKey] = (acc[levelKey] || 0) + (thoughtRate * count)
    })
    return acc
  }, {} as Record<WorkerLevelKey, number>)

  // Handle actively researched card
  if (state.currentResearchcardId) {
    const researchCard = newState.cards[state.currentResearchcardId]
    if (researchCard.state === CardState.Imagined) {
      // Only use thoughts from workers at or above minimum level
      const minLevel = researchCard.minimumThinkingLevel || 1
      const validThoughts = Object.entries(thoughtsByLevel).reduce((sum, [level, thoughts]) => {
        const levelNum = parseInt(level.replace('level', ''))
        return levelNum >= minLevel ? sum + thoughts : sum
      }, 0)

      researchCard.researchProgress.toDiscoveredCurrent += validThoughts
      if (researchCard.researchProgress.toDiscoveredCurrent >= 
          researchCard.researchProgress.toDiscoveredRequired) {
        researchCard.state = CardState.Discovered
      }
    }
  }

  // Handle focused card
  const focusedCard = Object.values(newState.cards).find(card => card.isFocused)
  if (focusedCard) {
    // Similar logic for focused cards
    const minLevel = focusedCard.minimumThinkingLevel || 1
    const validThoughts = Object.entries(thoughtsByLevel).reduce((sum, [level, thoughts]) => {
      const levelNum = parseInt(level.replace('level', ''))
      return levelNum >= minLevel ? sum + thoughts : sum
    }, 0)

    if (focusedCard.state === CardState.Unthoughtof) {
      focusedCard.researchProgress.toImaginedCurrent += validThoughts
      if (focusedCard.researchProgress.toImaginedCurrent >= 
          focusedCard.researchProgress.toImaginedRequired) {
        focusedCard.state = CardState.Imagined
      }
    } else if (focusedCard.state === CardState.Imagined) {
      focusedCard.researchProgress.toDiscoveredCurrent += validThoughts
      if (focusedCard.researchProgress.toDiscoveredCurrent >= 
          focusedCard.researchProgress.toDiscoveredRequired) {
        focusedCard.state = CardState.Discovered
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

export type WorkerAssignments = {
  cardId: string;
  workers: Record<WorkerLevelKey, number>;
}

export function captureWorkerAssignments(state: GameState): WorkerAssignments[] {
  return Object.entries(state.cards).map(([cardId, card]) => ({
    cardId,
    workers: { ...card.assignedWorkers }
  }));
}

export function removeAllWorkers(state: GameState): GameState {
  const newState = cloneDeep(state);
  
  // Reset all card worker assignments
  Object.values(newState.cards).forEach(card => {
    Object.keys(card.assignedWorkers).forEach(level => {
      const levelKey = level as WorkerLevelKey;
      // Add workers back to unassigned pool
      newState.workers[levelKey].assigned -= card.assignedWorkers[levelKey];
      // Clear card assignment
      card.assignedWorkers[levelKey] = 0;
    });
  });
  
  return newState;
}

export function performWorkerUpgrade(state: GameState, fromLevel: WorkerLevelKey, toLevel: WorkerLevelKey, amount: number): GameState {
  const newState = cloneDeep(state);
  
  // Remove workers from lower level
  newState.workers[fromLevel].total -= amount;
  // Add workers to higher level
  newState.workers[toLevel].total += amount;
  
  return newState;
}

export function redistributeWorkers(state: GameState, previousAssignments: WorkerAssignments[]): GameState {
  const newState = cloneDeep(state);
  
  // Sort assignments by card acceptedWorkerLevels (cards that only accept higher levels should go last)
  const sortedAssignments = [...previousAssignments].sort((a, b) => {
    const cardA = newState.cards[a.cardId];
    const cardB = newState.cards[b.cardId];
    return Math.min(...cardA.acceptedWorkerLevels) - Math.min(...cardB.acceptedWorkerLevels);
  });

  // For each previous assignment
  sortedAssignments.forEach(assignment => {
    const card = newState.cards[assignment.cardId];
    const totalWorkersNeeded = Object.values(assignment.workers).reduce((sum, count) => sum + count, 0);
    let workersAssigned = 0;

    // Try to assign workers, starting from lowest level the card accepts
    card.acceptedWorkerLevels.sort((a, b) => a - b).forEach(level => {
      const levelKey = (`level${level}` as WorkerLevelKey);
      while (
        workersAssigned < totalWorkersNeeded && 
        newState.workers[levelKey].assigned < newState.workers[levelKey].total
      ) {
        newState.workers[levelKey].assigned++;
        card.assignedWorkers[levelKey]++;
        workersAssigned++;
      }
    });
  });

  return newState;
}

export function tickGame(state: GameState): GameState {
  let newState = updateResources(state)
  newState = updateResearch(newState)
  newState = updatecardAvailability(newState)
  return newState
}
