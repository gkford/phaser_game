export enum TaskState {
    Unthoughtof = "UNTHOUGHTOF",
    Imagined = "IMAGINED", 
    Discovered = "DISCOVERED"
}

export interface ResearchProgress {
    taskId: string | null;
    progress: number;
    total: number;
}

export interface GameState {
    food: number;
    population: {
        total: number;
        hunting: number;
        thinkingL1: number;
        unassigned: number;
    };
    taskStates: Record<string, TaskState>;
    researchProgress: ResearchProgress;
    prerequisites: Record<string, string[]>;
}

export const INITIAL_STATE: GameState = {
    food: 0,
    population: {
        total: 10,
        hunting: 10,
        thinkingL1: 0,
        unassigned: 0
    },
    taskStates: {
        'foodGathering': TaskState.Discovered,
        'thinkingL1': TaskState.Imagined,
        'hunting': TaskState.Unthoughtof
    },
    researchProgress: {
        taskId: null,
        progress: 0,
        total: 0
    },
    prerequisites: {
        'foodGathering': [],
        'thinkingL1': ['foodPositive'],
        'hunting': ['thinkingL1', 'thoughtRate1']
    }
};

export function validateGameState(state: GameState): boolean {
    const { total, hunting, thinking, unassigned } = state.population;
    
    // Check if all numbers are non-negative
    if (hunting < 0 || thinking < 0 || unassigned < 0) {
        console.error('Population numbers cannot be negative');
        return false;
    }

    // Check if sum of assigned people equals total
    const sum = hunting + thinking + unassigned;
    if (sum !== total) {
        console.error(`Population sum (${sum}) does not match total (${total})`);
        return false;
    }

    // Check if total is exactly 10 (v0 requirement)
    if (total !== 10) {
        console.error('Total population must be 10');
        return false;
    }

    // Task state validation
    for (const [taskId, taskState] of Object.entries(state.taskStates)) {
        if (!Object.values(TaskState).includes(taskState)) {
            console.error(`Invalid task state for ${taskId}: ${taskState}`);
            return false;
        }
    }

    // Research progress validation
    if (state.researchProgress.progress < 0 || 
        state.researchProgress.total < 0 ||
        state.researchProgress.progress > state.researchProgress.total) {
        console.error('Invalid research progress values');
        return false;
    }

    return true;
}

export function calculateFoodRate(state: GameState): number {
    // Each hunter produces 2 food/sec
    const foodProduction = state.population.hunting * 2;
    
    // Each person (regardless of role) consumes 1 food/sec
    const foodConsumption = state.population.total;
    
    // Return net food rate
    return foodProduction - foodConsumption;
}

export function calculateThoughtRate(state: GameState): number {
    // Each thinker produces 1 thought/sec
    return state.population.thinkingL1;
}

// Check if a specific prerequisite is met
export function checkPrerequisite(state: GameState, prerequisite: string): boolean {
    switch (prerequisite) {
        case 'foodPositive':
            return state.food > 0;
        case 'thoughtRate1':
            return calculateThoughtRate(state) >= 1;
        case 'thinkingL1':
            return state.taskStates['thinkingL1'] === TaskState.Discovered;
        default:
            console.warn(`Unknown prerequisite: ${prerequisite}`);
            return false;
    }
}

// Check if all prerequisites for a task are met
export function checkAllPrerequisites(state: GameState, taskId: string): boolean {
    const prerequisites = state.prerequisites[taskId];
    if (!prerequisites) return true; // No prerequisites
    
    return prerequisites.every(prereq => checkPrerequisite(state, prereq));
}

// Update task states based on prerequisites
export function updateTaskStates(state: GameState): GameState {
    const newTaskStates = { ...state.taskStates };
    
    // Check each Unthoughtof task to see if it should become Imagined
    for (const [taskId, taskState] of Object.entries(state.taskStates)) {
        if (taskState === TaskState.Unthoughtof && checkAllPrerequisites(state, taskId)) {
            newTaskStates[taskId] = TaskState.Imagined;
        }
    }
    
    return {
        ...state,
        taskStates: newTaskStates
    };
}

export type Activity = 'hunting' | 'thinkingL1' | 'unassigned';

export function reassignWorker(state: GameState, from: Activity, to: Activity): GameState {
    const newState = {
        ...state,
        population: { ...state.population }
    };

    if (newState.population[from] <= 0) {
        console.error(`No workers available in ${from}`);
        return state;
    }

    newState.population[from]--;
    newState.population[to]++;

    if (!validateGameState(newState)) {
        console.error('Invalid state after reassignment');
        return state;
    }

    return newState;
}

export function startResearch(state: GameState, taskId: string): GameState {
    if (!state.taskStates[taskId] || state.taskStates[taskId] !== TaskState.Imagined) {
        return state;
    }

    return {
        ...state,
        researchProgress: {
            taskId,
            progress: 0,
            total: 30
        }
    };
}

export function updateResearch(state: GameState, delta: number): GameState {
    if (!state.researchProgress.taskId) {
        return state;
    }

    const newProgress = state.researchProgress.progress + delta;
    
    if (newProgress >= state.researchProgress.total) {
        const taskId = state.researchProgress.taskId;
        return {
            ...state,
            taskStates: {
                ...state.taskStates,
                [taskId]: TaskState.Discovered
            },
            researchProgress: {
                taskId: null,
                progress: 0,
                total: 0
            }
        };
    }

    return {
        ...state,
        researchProgress: {
            ...state.researchProgress,
            progress: newProgress
        }
    };
}

export function allToHunting(state: GameState): GameState {
    const newState = {
        ...state,
        population: {
            ...state.population,
            hunting: state.population.total,
            thinking: 0,
            unassigned: 0
        }
    };

    if (!validateGameState(newState)) {
        console.error('Invalid state after emergency reset');
        return state;
    }

    return newState;
}
