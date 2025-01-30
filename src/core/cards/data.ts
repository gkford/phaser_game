import { Card, CardState } from '../../types'
import { getThinkingTitle } from '../constants/workerLevels'

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
    title: `🤔 ${getThinkingTitle('level1')}`,
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
    title: `💡 ${getThinkingTitle('level2')}`,
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
  nonVerbalCommunication: {
    id: 'nonVerbalCommunication',
    title: '🤲 Non-verbal Communication',
    state: CardState.Unthoughtof,
    type: 'science',
    description: "The development of gestures and facial expressions allows for basic communication between individuals, enabling better coordination and teaching.",
    assignedWorkers: {
      level1: 0,
      level2: 0,
    },
    productionPerWorker: {},
    researchProgress: {
      toImaginedCurrent: 0,
      toImaginedRequired: 10,
      toDiscoveredCurrent: 0,
      toDiscoveredRequired: 15,
    },
    prerequisites: ['thinkingL1'],
    isFocused: false,
    acceptedWorkerLevels: [],
    onDiscovery: {
      type: 'workerUpgrade',
      fromLevel: 'level1',
      toLevel: 'level2',
      amount: 5,
      message: "Through non-verbal communication, 5 of your Hominids have evolved into Mimics!"
    }
  },
}
