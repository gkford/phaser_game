export enum CardState {
  Unthoughtof = 'UNTHOUGHTOF',
  Imagined = 'IMAGINED',
  Discovered = 'DISCOVERED',
}

export type WorkerLevelKey = 'level1' | 'level2'

export interface GameState {
  resources: {
    food: number
  }
  workers: Record<WorkerLevelKey, { total: number; assigned: number }>
  cards: Record<string, Card>
  currentResearchcardId: string | null
}

export interface Card {
  id: string
  title: string
  state: CardState
  assignedWorkers: Record<WorkerLevelKey, number>
  productionPerWorker: {
    food?: number
    thoughts?: number
  }
  researchProgress: {
    toImaginedCurrent: number
    toImaginedRequired: number
    toDiscoveredCurrent: number
    toDiscoveredRequired: number
  }
  prerequisites: string[]
  isFocused: boolean
  acceptedWorkerLevels: number[]
}
