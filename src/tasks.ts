import { Task, TaskState } from "./types";

export const initialTasks: Record<string, Task> = {
  foodGathering: {
    id: "foodGathering",
    state: TaskState.Discovered,
    assignedWorkers: 10,
    productionPerWorker: { food: 1.2 },
    researchProgress: {
      toImaginedCurrent: 0,
      toImaginedRequired: 0,
      toDiscoveredCurrent: 0,
      toDiscoveredRequired: 0,
    },
    prerequisites: [],
    isFocused: false,
  },
  thinkingL1: {
    id: "thinkingL1",
    state: TaskState.Discovered,
    assignedWorkers: 0,
    productionPerWorker: { thoughts: 1 },
    researchProgress: {
      toImaginedCurrent: 0,
      toImaginedRequired: 0,
      toDiscoveredCurrent: 0,
      toDiscoveredRequired: 0,
    },
    prerequisites: [],
    isFocused: false,
  },
  hunting: {
    id: "hunting",
    state: TaskState.Unthoughtof,
    assignedWorkers: 0,
    productionPerWorker: { food: 1.5 },
    researchProgress: {
      toImaginedCurrent: 0,
      toImaginedRequired: 5,
      toDiscoveredCurrent: 0,
      toDiscoveredRequired: 10,
    },
    prerequisites: ["thinkingL1"],
    isFocused: false,
  },
};

// Task title formatting map
export const taskTitles: Record<string, string> = {
  foodGathering: "🌾 Food Gathering",
  thinkingL1: "🤔 Thinking Level 1",
  hunting: "🏹 Hunting",
};
