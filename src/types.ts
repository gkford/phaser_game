export enum TaskState {
  Unthoughtof = "UNTHOUGHTOF",
  Imagined = "IMAGINED",
  Discovered = "DISCOVERED",
}

export interface Task {
  id: string;
  state: TaskState;
  assignedWorkers: number;
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
}

export interface GameState {
  resources: {
    food: number;
  };
  population: {
    total: number;
    unassigned: number;
  };
  tasks: Record<string, Task>;
  currentResearchTaskId: string | null;
}
