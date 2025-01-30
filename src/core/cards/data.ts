import { Card, CardState } from '../../types'

export const intialCards: Record<string, Card> = {
  foodGathering: {
    id: 'foodGathering',
    title: '🌾 Food Gathering',
    state: CardState.Discovered,
    type: 'task',
    assignedWorkers: {
      level1: 10,
      level2: 0,
    },
    productionPerWorker: { food: 1.2 },
    researchProgress: {
      toImaginedCurrent: 0,
      toImaginedRequired: 0,
      toDiscoveredCurrent: 0,
      toDiscoveredRequired: 0,
    },
    prerequisites: [],
    isFocused: false,
    acceptedWorkerLevels: [1, 2],
  },
  thinkingL1: {
    id: 'thinkingL1',
    title: '🤔 Thinking Level 1',
    state: CardState.Discovered,
    type: 'thinking',
    assignedWorkers: {
      level1: 0,
      level2: 0,
    },
    productionPerWorker: { thoughts: 1 },
    researchProgress: {
      toImaginedCurrent: 0,
      toImaginedRequired: 0,
      toDiscoveredCurrent: 0,
      toDiscoveredRequired: 0,
    },
    prerequisites: [],
    isFocused: false,
    acceptedWorkerLevels: [1, 2],
  },
  thinkingL2: {
    id: 'thinkingL2',
    title: '💡 Thinking Level 2',
    state: CardState.Discovered,
    type: 'thinking',
    assignedWorkers: {
      level1: 0,
      level2: 0,
    },
    productionPerWorker: { thoughts: 1.5 },
    researchProgress: {
      toImaginedCurrent: 0,
      toImaginedRequired: 0,
      toDiscoveredCurrent: 0,
      toDiscoveredRequired: 0,
    },
    prerequisites: [],
    isFocused: false,
    acceptedWorkerLevels: [2],
  },
  hunting: {
    id: 'hunting',
    title: '🏹 Hunting',
    state: CardState.Unthoughtof,
    type: 'task',
    assignedWorkers: {
      level1: 0,
      level2: 0,
    },
    productionPerWorker: { food: 1.5 },
    researchProgress: {
      toImaginedCurrent: 0,
      toImaginedRequired: 5,
      toDiscoveredCurrent: 0,
      toDiscoveredRequired: 10,
    },
    prerequisites: ['thinkingL1'],
    isFocused: false,
    acceptedWorkerLevels: [1, 2],
  },
}
