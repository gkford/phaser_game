import { cloneDeep } from "lodash";
import { GameState, TaskState } from "./types";
import { initialTasks } from "./tasks";

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
    tasks: initialTasks,
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
  // No longer automatically transitioning tasks to Imagined state
  return state;
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
