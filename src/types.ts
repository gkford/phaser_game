export interface GameState {
    food: number;
    population: {
        total: number;
        hunting: number;
        thinking: number;
        unassigned: number;
    };
}

export const INITIAL_STATE: GameState = {
    food: 0,
    population: {
        total: 10,
        hunting: 10,
        thinking: 0,
        unassigned: 0
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
