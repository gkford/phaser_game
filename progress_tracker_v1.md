markdown
Copy
# Game Plan V1 Implementation Progress

## Phase 0: Foundation ⏳
- [ ] Extend GameState interface:
  - [ ] Add `TaskState` enum (Unthoughtof/Imagined/Discovered)
  - [ ] Add `taskStates: Record<string, TaskState>`
  - [ ] Add `researchProgress: { current?: string; progress: number; total: number }`
  - [ ] Add `prerequisites: Record<string, string[]>`
- [ ] Implement base research system:
  - [ ] Add `startResearch(taskId: string)` function
  - [ ] Add `updateResearchProgress(delta: number)` in game loop
- [ ] Set up initial tasks in GameState:
  ```ts
  tasks: {
    'food-gathering': TaskState.Discovered,
    'thinking-l1': TaskState.Imagined,
    'hunting': TaskState.Unthoughtof
  }
Phase 1: Core Systems ⏳
Implement task state machine:

Add updateTaskStates() called every tick

Create prerequisite checks:

ts
Copy
function meetsPrerequisites(taskId: string): boolean {
  // Example for hunting:
  // thoughtsPerSecond >= 1 && taskStates['thinking-l1'] === Discovered
}
Add research mechanics:

Create research progress bar component

Implement pause/resume research during emergencies

Add state transition logic on research completion

Phase 2: UI Framework ⏳
Create card states:

Unthoughtof: Greyed out with ???? display

Imagined: Yellow glow + research button

Discovered: Full color + assignment controls

Implement progress bars:

Add research progress to imagined cards

Add animated thought progress to header

Create prerequisite displays:

Tooltip system for "Requires: X, Y"

Lock icon with hover text for unmet prerequisites

Phase 3: Research System ⏳
Implement research queue:

Only one active research at a time

Cancel research button with confirmation

Save partial progress when interrupted

Add research validation:

Prevent starting research if prerequisites unmet

Auto-cancel if prerequisites become invalid mid-research

Phase 4: Emergency Updates ⏳
Enhance emergency system:

Pause active research during food emergency

Auto-revert Thinking assignments to Hunting

Add flashing border to food counter

Update reassignment logic:

Block assignments to Imagined/Unthoughtof tasks

Prevent unassigning from Hunting during emergency

Phase 5: Polish ⏳
Add visual feedback:

Pulse animation on state transitions

Thought particles animation during research

Food icons animation during consumption/production

Implement audio:

Research complete sound

Emergency alarm sound

Button click sounds

Copy

This follows the V1 game plan structure while:
1. Breaking down complex systems into atomic tasks
2. Providing concrete implementation examples
3. Maintaining compatibility with existing code patterns
4. Including key spec requirements from game_design_spec_v1.md
5. Using checkboxes for clear progress tracking

Would you like me to provide implementation details for any specific item?