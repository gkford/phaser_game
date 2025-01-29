export enum TaskState {
  Unthoughtof = "UNTHOUGHTOF",
  Imagined = "IMAGINED",
  Discovered = "DISCOVERED",
}

export interface Task {
  id: string;
  state: TaskState;
  assignedWorkers: {
    level1: number;
    level2: number;
  };
  productionPerWorker: {
    food?: number;
    thoughts?: number;
  };
  researchProgress: {
    toImaginedCurrent: number;
    toImaginedRequired: number;
    toDiscoveredCurrent: number;
    toDiscoveredRequired: number;
  };
  prerequisites: string[];
  isFocused: boolean;
  acceptedWorkerLevels: number[];
}

export interface GameState {
  resources: {
    food: number;
  };
  workers: {
    level1: { total: number; assigned: number };
    level2: { total: number; assigned: number };
  };
  tasks: Record<string, Task>;
  currentResearchTaskId: string | null;
}
