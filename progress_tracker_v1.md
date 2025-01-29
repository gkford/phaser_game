# Game Plan V1 Implementation Progress

## Phase 0: Foundation ⏳
- [x] Extend GameState interface:
  - [x] Add `TaskState` enum (Unthoughtof/Imagined/Discovered)
  - [x] Add `taskStates: Record<string, TaskState>`
  - [x] Add `researchProgress: { taskId: string | null; progress: number; total: number }`
  - [x] Add `prerequisites: Record<string, string[]>`
- [x] Implement base research system:
  - [x] Add `startResearch(taskId: string)` function
  - [x] Add `updateResearch(delta: number)` function
- [x] Set up initial tasks in GameState:
  - [x] Configure food-gathering as Discovered
  - [x] Configure thinking-l1 as Imagined
  - [x] Configure hunting as Unthoughtof

## Phase 1: Core Systems ⏳
- [ ] Implement task state machine:
  - [ ] Add updateTaskStates() called every tick
  - [ ] Create prerequisite checks
  - [ ] Add research mechanics
- [ ] Create research progress bar component
- [ ] Implement pause/resume research during emergencies
- [ ] Add state transition logic on research completion

## Phase 2: UI Framework ⏳
- [ ] Create card states:
  - [ ] Unthoughtof: Greyed out with ???? display
  - [ ] Imagined: Yellow glow + research button
  - [ ] Discovered: Full color + assignment controls
- [ ] Implement progress bars:
  - [ ] Add research progress to imagined cards
  - [ ] Add animated thought progress to header
- [ ] Create prerequisite displays:
  - [ ] Tooltip system for "Requires: X, Y"
  - [ ] Lock icon with hover text for unmet prerequisites

## Phase 3: Research System ⏳
- [ ] Implement research queue:
  - [ ] Only one active research at a time
  - [ ] Cancel research button with confirmation
  - [ ] Save partial progress when interrupted
- [ ] Add research validation:
  - [ ] Prevent starting research if prerequisites unmet
  - [ ] Auto-cancel if prerequisites become invalid mid-research

## Phase 4: Emergency Updates ⏳
- [ ] Enhance emergency system:
  - [ ] Pause active research during food emergency
  - [ ] Auto-revert Thinking assignments to Hunting
  - [ ] Add flashing border to food counter
- [ ] Update reassignment logic:
  - [ ] Block assignments to Imagined/Unthoughtof tasks
  - [ ] Prevent unassigning from Hunting during emergency

## Phase 5: Polish ⏳
- [ ] Add visual feedback:
  - [ ] Pulse animation on state transitions
  - [ ] Thought particles animation during research
  - [ ] Food icons animation during consumption/production
