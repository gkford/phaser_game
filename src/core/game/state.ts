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
      level3: { total: 0, assigned: 0 },
      level4: { total: 0, assigned: 0 },
    },
    cards: intialCards,
    currentResearchcardId: null,
    foodShortageProtection: true,
    isPaused: false,
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
  const newState = cloneDeep(state);
  
  // Don't update if paused
  if (newState.isPaused) {
    return newState;
  }

  let foodProduced = 0
  
  // Calculate food production multiplier from persistent upgrades
  const foodMultiplier = Object.values(state.cards).reduce((mult, card) => {
    if (card.state === CardState.Discovered && 
        card.persistentUpgrade?.type === 'foodProduction') {
      return mult * card.persistentUpgrade.multiplier
    }
    return mult
  }, 1)

  for (const card of Object.values(state.cards)) {
    if (card.state === CardState.Discovered) {
      // Calculate total workers on this card (all levels)
      const totalWorkers = Object.values(card.assignedWorkers)
        .reduce((sum, count) => sum + count, 0);
      
      // Add food production if card produces food, applying multiplier
      if (card.productionPerWorker.food) {
        foodProduced += card.productionPerWorker.food * totalWorkers * foodMultiplier;
      }
    }
  }

  // Subtract food consumption (1 per worker)
  const totalWorkers = state.workers.level1.total + state.workers.level2.total;
  foodProduced -= totalWorkers; // Each worker consumes 1 food/sec.

  newState.resources.food += foodProduced;

  // Check for food shortage
  if (newState.resources.food <= 0 && newState.foodShortageProtection) {
    newState.resources.food = 0;
    newState.isPaused = true;
    newState = handleFoodShortage(newState);
  }

  return newState;
}

function handleFoodShortage(state: GameState): GameState {
  const newState = cloneDeep(state);
  
  // Remove all workers from their current tasks
  Object.values(newState.cards).forEach(card => {
    Object.entries(card.assignedWorkers).forEach(([level, count]) => {
      const levelKey = level as WorkerLevelKey;
      if (newState.workers[levelKey]) {
        newState.workers[levelKey].assigned -= count;
      }
      card.assignedWorkers[levelKey] = 0;
    });
  });

  // Assign all workers to food gathering
  const foodGatheringCard = newState.cards['foodGathering'];
  Object.entries(newState.workers).forEach(([level, workers]) => {
    const levelKey = level as WorkerLevelKey;
    if (foodGatheringCard.acceptedWorkerLevels.includes(parseInt(level.replace('level', '')))) {
      foodGatheringCard.assignedWorkers[levelKey] = workers.total;
      workers.assigned = workers.total;
    }
  });

  return newState;
}

// Progresses research on the currently selected research Card.
export function updateResearch(state: GameState): GameState {
  const newState = cloneDeep(state)
  
  // Calculate thoughts per level
  const thoughtsByLevel = Object.values(newState.cards).reduce((acc, card) => {
    if (card.id === 'thinkingL1') {
      // L1 thinking card: all workers contribute to L1 thoughts
      const totalWorkers = card.assignedWorkers.level1 + card.assignedWorkers.level2
      acc.level1 = (acc.level1 || 0) + (totalWorkers * (card.productionPerWorker.thoughts ?? 0))
    } else if (card.id === 'thinkingL2') {
      // L2 thinking card: only L2 workers contribute to L2 thoughts
      acc.level2 = (acc.level2 || 0) + 
        (card.assignedWorkers.level2 * (card.productionPerWorker.thoughts ?? 0))
    }
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
    Object.entries(card.assignedWorkers).forEach(([level, count]) => {
      const levelKey = level as WorkerLevelKey;
      // Only subtract from worker pool if that level exists
      if (newState.workers[levelKey]) {
        newState.workers[levelKey].assigned -= count;
      }
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
