import { Task, TaskState } from "../../types";

export const initialTasks: Record<string, Task> = {
  foodGathering: {
    id: "foodGathering",
    title: "🌾 Food Gathering",
    state: TaskState.Discovered,
    assignedWorkers: {
      level1: 10,
      level2: 0
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
    id: "thinkingL1",
    title: "🤔 Thinking Level 1",
    state: TaskState.Discovered,
    assignedWorkers: {
      level1: 0,
      level2: 0
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
    id: "thinkingL2",
    title: "💡 Thinking Level 2",
    state: TaskState.Discovered,
    assignedWorkers: {
      level1: 0,
      level2: 0
    },
    productionPerWorker: { thoughts: 1.5 },
    researchProgress: {
      toImaginedCurrent: 0,
      toImaginedRequired: 0,
      toDiscoveredCurrent: 0,
      toDiscoveredRequired: 0
    },
    prerequisites: [],
    isFocused: false,
    acceptedWorkerLevels: [2],
  },
  hunting: {
    id: "hunting",
    title: "🏹 Hunting",
    state: TaskState.Unthoughtof,
    assignedWorkers: {
      level1: 0,
      level2: 0
    },
    productionPerWorker: { food: 1.5 },
    researchProgress: {
      toImaginedCurrent: 0,
      toImaginedRequired: 5,
      toDiscoveredCurrent: 0,
      toDiscoveredRequired: 10,
    },
    prerequisites: ["thinkingL1"],
    isFocused: false,
    acceptedWorkerLevels: [1, 2],
  },
};

