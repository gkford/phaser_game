# Prehistoric Technology Game - Implementation Progress

## Phase 1: Introduce the New Schema

- [ ] Define new Card interface
- [ ] Expand GameState to use cards Record
- [ ] Convert core cards to new format:
  - [ ] foodGathering
  - [ ] thinkingL1
  - [ ] hunting
- [ ] Initialize population.unassigned
- [ ] Test basic state initialization

## Phase 2: Migrate Assignments & Resource Calculations

- [ ] Remove old population role fields
- [ ] Update reassignWorker function
- [ ] Rewrite calculateFoodRate
- [ ] Rewrite calculateThoughtRate
- [ ] Implement emergency food logic
- [ ] Test worker reassignment
- [ ] Test resource calculations

## Phase 3: Migrate Research to Per-Card Progress

- [ ] Remove old researchProgress
- [ ] Add currentResearchcardId
- [ ] Implement thought distribution logic
- [ ] Add state transition logic:
  - [ ] Unthoughtof → Imagined
  - [ ] Imagined → Discovered
- [ ] Test research progression
- [ ] Test state transitions

## Phase 4: Clean-Up and Extension

- [ ] Remove redundant logic
- [ ] Add state validation tests:
  - [ ] Card assignment sums
  - [ ] Research transitions
  - [ ] Resource calculations
- [ ] Document new structure
- [ ] Prepare for future extensions:
  - [ ] Additional resources
  - [ ] New Card types
  - [ ] Enhanced prerequisites

## Current Status

- Phase 1: Not Started
- Phase 2: Not Started
- Phase 3: Not Started
- Phase 4: Not Started

Last Updated: 2025-01-29
