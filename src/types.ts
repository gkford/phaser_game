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
        thinking: number;
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
        thinking: 0,
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
    return state.population.thinking;
}

export type Activity = 'hunting' | 'thinking' | 'unassigned';

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
