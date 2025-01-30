# **Prehistoric Technology Game - Roadmap to a Scalable Game State**

This document outlines the current state of our Prehistoric Technology Game (covering both _V0_ and _V1_ specifications) and then describes a phased approach to restructure the game state and logic for future scalability.

---

## **1. Current Context**

### 1.1 Existing Specs (V0 and V1)

1. **V0**:

   - Fixed population of 10
   - Simple resource management (food rate, thought rate)
   - All population initially assigned to hunting
   - Basic cards:
     - _Food Gathering_ (discovered)
     - _Thinking L1_ (discovered)
     - _Hunting_ (unthoughtof)

2. **V1**:
   - Tech tree with `Unthoughtof → Imagined → Discovered` states
   - Prerequisites unlock cards
   - Research required to “imagine” a Card and “discover” a Card
   - Additional details on resource production rates, including a new rate for _Food Gathering_ (`1.2 food/human/sec`)
   - Emergency protocol at 0 food

### 1.2 Current Implementation (Excerpt: `game.ts`)

- **Global `GameState`** with fields for:

  - `food`
  - `population` (total, hunting, thinkingL1, unassigned, foodGathering)
  - `cardStates` (mapping of Card ID to `CardState`)
  - `researchProgress` (a single structure to track the currently researched Card)
  - `prerequisites` (mapping from Card → array of prerequisite strings)

- **Functions**:
  - `validateGameState` checks for negative populations, sums, etc.
  - `calculateFoodRate` and `calculateThoughtRate` each do specialized logic based on roles (hunting vs. thinking).
  - `checkAllPrerequisites`, `updatecardStates`, `reassignWorker`, `startResearch`, `updateResearch`, etc.

**Issue:** As we add more cards, states, resources, and complexities, the current structure becomes harder to maintain. We want a more flexible schema that places each card’s data (assigned workers, production rates, research costs, etc.) within that Card itself.

---

## **2. Ideal Future State**

Below is a summary of the recommended structure for a highly scalable approach:

1. **Global resources** in `state.resources`, e.g.:
   ```ts
   resources: {
     food: number
     // In the future: wood, stone, etc.
   }
   ```
2. **Population** holds:
   ```ts
   population: {
     total: number
     unassigned: number
   }
   ```
3. **cards** stored in a dictionary of `Card` objects:
   ```ts
   cards: Record<string, Card>
   ```
   Each `Card` might have:
   ```ts
   interface Card {
     id: string
     state: CardState // UNTHOUGHTOF | IMAGINED | DISCOVERED
     assignedWorkers: number
     productionPerWorker: {
       food?: number
       thoughts?: number
       // Additional resources in future
     }
     researchProgress: {
       toImaginedCurrent: number
       toImaginedRequired: number
       toDiscoveredCurrent: number
       toDiscoveredRequired: number
     }
     prerequisites: string[]
   }
   ```
4. **Single `currentResearchcardId`** (if only one Card can be researched at once):
   ```ts
   currentResearchcardId: string | null
   ```
5. **Update logic** each “tick”:
   1. Sum up all production from discovered cards.
   2. Subtract consumption for the total population.
   3. Update stored resources (e.g. `food`).
   4. Distribute the total thought output to the `currentResearchcardId` (if any).
   5. Check for transitions (Unthoughtof → Imagined, Imagined → Discovered) if research thresholds are met.
   6. Check emergency conditions (e.g., `food <= 0`) and auto-assign if needed.

---

## **3. Phased Transition Plan**

Below is a step-by-step guide to **refactor** the existing code into the new model. Each phase should be tested before moving on.

### **Phase 1: Introduce the New Schema**

- Define the new `Card` interface.
- Expand `GameState` to use `cards: Record<string, Card>`.
- Convert core cards (`foodGathering`, `thinkingL1`, `hunting`) to this new format.
- Initialize `population.unassigned = 0`.

### **Phase 2: Migrate Assignments & Resource Calculations**

- Remove old population role fields (hunting, thinkingL1, etc.).
- Adjust assignment functions (`reassignWorker`, etc.) to modify `cards[cardId].assignedWorkers` instead.
- Rewrite `calculateFoodRate` and `calculateThoughtRate` to iterate over `cards`.
- Implement emergency food logic (`resources.food <= 0`).

### **Phase 3: Migrate Research to Per-Card Progress**

- Remove old `researchProgress`.
- Introduce `currentResearchcardId`.
- Distribute thoughts to the correct research Card each tick.
- Implement `Unthoughtof → Imagined` and `Imagined → Discovered` transitions based on progress thresholds.

### **Phase 4: Clean-Up and Extend**

- Remove old redundant logic.
- Test state consistency (validate Card assignment sums, research transitions, etc.).
- Add more cards easily using the new structured format.
- Expand to additional resources (wood, stone, etc.).

---

## **4. Example State & Code Snippet**

```ts
export function createInitialGameState(): GameState {
  return {
    resources: {
      food: 0,
    },
    population: {
      total: 10,
      unassigned: 0,
    },
    cards: {
      foodGathering: {
        id: "foodGathering",
        state: CardState.Discovered,
        assignedWorkers: 10,
        productionPerWorker: { food: 1.2 },
        researchProgress: { ... },
        prerequisites: [],
      },
      thinkingL1: {
        id: "thinkingL1",
        state: CardState.Discovered,
        assignedWorkers: 0,
        productionPerWorker: { thoughts: 1 },
        researchProgress: { ... },
        prerequisites: [],
      },
      hunting: {
        id: "hunting",
        state: CardState.Unthoughtof,
        assignedWorkers: 0,
        productionPerWorker: { food: 1.5 },
        researchProgress: { ... },
        prerequisites: ["thinkingL1"],
      },
    },
    currentResearchcardId: null,
  };
}
```

This structure makes the game **easier to scale** while maintaining clarity and consistency.

---

### **End of Document**

Use this roadmap to steer your migration from the current per-activity approach to a more generalized, scalable cards-based system.
