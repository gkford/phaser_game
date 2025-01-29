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
