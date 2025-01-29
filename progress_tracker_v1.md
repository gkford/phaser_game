# Game Plan V1 Implementation Progress

## Foundation ⏳
- [ ] Extend GameState interface:
  - [ ] Add `TaskState` enum (Unthoughtof/Imagined/Discovered)
  - [ ] Add `taskStates: Record<string, TaskState>`
  - [ ] Add `researchProgress: { current?: string; progress: number; total: number }`
  - [ ] Add `prerequisites: Record<string, string[]>`
- [ ] Implement base research system:
  - [ ] Add `startResearch(taskId: string)` function
  - [ ] Add `updateResearchProgress(delta: number)` in game loop
- [ ] Set up initial tasks in GameState:
  - [ ] Configure food-gathering as Discovered
  - [ ] Configure thinking-l1 as Imagined
  - [ ] Configure hunting as Unthoughtof

## Core Systems ⏳
- [ ] Implement task state machine:
  - [ ] Add updateTaskStates() called every tick
  - [ ] Create prerequisite checks
  - [ ] Add research mechanics
- [ ] Create research progress bar component
- [ ] Implement pause/resume research during emergencies
- [ ] Add state transition logic on research completion

## UI Framework ⏳
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

## Research System ⏳
- [ ] Implement research queue:
  - [ ] Only one active research at a time
  - [ ] Cancel research button with confirmation
  - [ ] Save partial progress when interrupted
- [ ] Add research validation:
  - [ ] Prevent starting research if prerequisites unmet
  - [ ] Auto-cancel if prerequisites become invalid mid-research

## Emergency Updates ⏳
- [ ] Enhance emergency system:
  - [ ] Pause active research during food emergency
  - [ ] Auto-revert Thinking assignments to Hunting
  - [ ] Add flashing border to food counter
- [ ] Update reassignment logic:
  - [ ] Block assignments to Imagined/Unthoughtof tasks
  - [ ] Prevent unassigning from Hunting during emergency

## Polish ⏳
- [ ] Add visual feedback:
  - [ ] Pulse animation on state transitions
  - [ ] Thought particles animation during research
  - [ ] Food icons animation during consumption/production
