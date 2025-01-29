import { cloneDeep } from "lodash";
import { GameState, Task, TaskState } from "./types";

// Initializes game state with predefined tasks.
export function createInitialGameState(): GameState {
  return {
    resources: {
      food: 0,
    },
    population: {
      total: 10,
      unassigned: 0,
    },
    tasks: {
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
          toImaginedRequired: 50,
          toDiscoveredCurrent: 0,
          toDiscoveredRequired: 100,
        },
        prerequisites: ["thinkingL1"],
        isFocused: false,
      },
    },
    currentResearchTaskId: null,
  };
}

// Reassigns a worker from one task to another.
export function reassignWorker(state: GameState, fromTaskId: string, toTaskId: string): GameState {
  const newState = cloneDeep(state);

  // Special handling for unassigned workers
  if (fromTaskId === "unassigned") {
    if (newState.population.unassigned <= 0) {
      console.error("No unassigned workers available");
      return state;
    }
    newState.tasks[toTaskId].assignedWorkers++;
    newState.population.unassigned--;
    return newState;
  }

  if (toTaskId === "unassigned") {
    if (newState.tasks[fromTaskId].assignedWorkers <= 0) {
      console.error(`No workers available in ${fromTaskId}`);
      return state;
    }
    newState.tasks[fromTaskId].assignedWorkers--;
    newState.population.unassigned++;
    return newState;
  }

  // Regular task to task reassignment
  if (newState.tasks[fromTaskId].assignedWorkers <= 0) {
    console.error(`No workers available in ${fromTaskId}`);
    return state;
  }

  newState.tasks[fromTaskId].assignedWorkers--;
  newState.tasks[toTaskId].assignedWorkers++;
  
  return newState;
}

// Updates resource production based on assigned workers.
export function updateResources(state: GameState): GameState {
  let foodProduced = 0;
  let thoughtsProduced = 0;

  for (const task of Object.values(state.tasks)) {
    if (task.state === TaskState.Discovered) {
      foodProduced += (task.productionPerWorker.food ?? 0) * task.assignedWorkers;
      thoughtsProduced += (task.productionPerWorker.thoughts ?? 0) * task.assignedWorkers;
    }
  }

  foodProduced -= state.population.total; // Each person consumes 1 food/sec.

  return {
    ...state,
    resources: {
      food: state.resources.food + foodProduced,
    },
  };
}

// Progresses research on the currently selected research task.
export function updateResearch(state: GameState): GameState {
  const newState = cloneDeep(state);
  const thoughtsProduced = Object.values(newState.tasks).reduce(
    (sum, t) => sum + (t.productionPerWorker.thoughts ?? 0) * t.assignedWorkers, 
    0
  );

  // Handle actively researched task (when clicking "Think About This")
  if (state.currentResearchTaskId) {
    const researchTask = newState.tasks[state.currentResearchTaskId];
    if (researchTask.state === TaskState.Imagined) {
      researchTask.researchProgress.toDiscoveredCurrent += thoughtsProduced;
      if (researchTask.researchProgress.toDiscoveredCurrent >= researchTask.researchProgress.toDiscoveredRequired) {
        researchTask.state = TaskState.Discovered;
      }
    }
  }

  // Handle focused task
  const focusedTask = Object.values(newState.tasks).find(task => task.isFocused);
  if (focusedTask) {
    if (focusedTask.state === TaskState.Unthoughtof) {
      focusedTask.researchProgress.toImaginedCurrent += thoughtsProduced;
      if (focusedTask.researchProgress.toImaginedCurrent >= focusedTask.researchProgress.toImaginedRequired) {
        focusedTask.state = TaskState.Imagined;
      }
    } else if (focusedTask.state === TaskState.Imagined) {
      focusedTask.researchProgress.toDiscoveredCurrent += thoughtsProduced;
      if (focusedTask.researchProgress.toDiscoveredCurrent >= focusedTask.researchProgress.toDiscoveredRequired) {
        focusedTask.state = TaskState.Discovered;
      }
    }
  }

  return newState;
}

// Assigns a task to be actively researched.
export function startResearch(state: GameState, taskId: string): GameState {
  if (state.tasks[taskId].state !== TaskState.Imagined) return state;
  return { ...state, currentResearchTaskId: taskId };
}

// Checks if prerequisites for tasks are met and updates states.
export function updateTaskAvailability(state: GameState): GameState {
  const newState = cloneDeep(state);

  for (const [taskId, task] of Object.entries(newState.tasks)) {
    if (task.state === TaskState.Unthoughtof && task.prerequisites.every(req => newState.tasks[req].state === TaskState.Discovered)) {
      task.state = TaskState.Imagined;
    }
  }

  return newState;
}

// Toggles focus state for a task
export function toggleTaskFocus(state: GameState, taskId: string): GameState {
  const newState = cloneDeep(state);
  const targetTask = newState.tasks[taskId];
  
  // If task is already focused, just unfocus it
  if (targetTask.isFocused) {
    targetTask.isFocused = false;
    return newState;
  }
  
  // Otherwise, unfocus all tasks and focus the target task
  if (targetTask.state === TaskState.Imagined || targetTask.state === TaskState.Unthoughtof) {
    Object.values(newState.tasks).forEach(task => {
      task.isFocused = false;
    });
    targetTask.isFocused = true;
  }
  
  return newState;
}

export function tickGame(state: GameState): GameState {
  let newState = updateResources(state);
  newState = updateResearch(newState);
  newState = updateTaskAvailability(newState);
  return newState;
}
