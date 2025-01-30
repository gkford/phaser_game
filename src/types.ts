export enum CardState {
  Unthoughtof = 'UNTHOUGHTOF',
  Imagined = 'IMAGINED',
  Discovered = 'DISCOVERED',
}

export type WorkerLevelKey = 'level1' | 'level2' | 'level3' | 'level4'

export interface GameState {
  resources: {
    food: number
  }
  workers: Record<WorkerLevelKey, { total: number; assigned: number }>
  cards: Record<string, Card>
  currentResearchcardId: string | null
}

export type CardEffect = {
  type: 'workerUpgrade'
  fromLevel: WorkerLevelKey
  toLevel: WorkerLevelKey
  amount: number
  message: string
}

export interface Card {
  id: string
  title: string
  state: CardState
  type: 'task' | 'thinking' | 'science'
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
  onDiscovery?: CardEffect
  minimumThinkingLevel?: number
  description?: string
}
