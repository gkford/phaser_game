# Game Plan: Early Human Tech Tree (V1)

## I. Context & Objectives

### Core Purpose
Expand the resource management game with a tech tree progression system, introducing:
- Task states (Unthoughtof → Imagined → Discovered)
- Thought-based research requirements
- New task types with varying efficiency
- Visual progression through card states

### Key V1 Requirements
- Implement 3 task states with distinct UI/UX
- Add research system with progress bars
- Introduce new task types (Food Gathering, Thinking L1, Hunting)
- Maintain emergency food system from V0
- Add thought generation as a rate-based resource

### Non-Negotiables
- Fixed population of 10
- No persistent progression (reset on refresh)
- Desktop browser focus
- Maintain core V0 functionality while adding new systems

## II. Risks & Mitigation

### Critical Risks
#### State Complexity
- **Risk:** Multiple task states and prerequisites creating hard-to-track bugs
- **Mitigation:** Use finite state machine pattern for task states

#### Research Timing
- **Risk:** Progress bars desyncing from actual research time
- **Mitigation:** Use Phaser's tween system for smooth progress bars

#### UI Overload
- **Risk:** Too many visual elements overwhelming the player
- **Mitigation:** Progressive disclosure (only show relevant info per state)

### Edge Cases
- Research completing while in food emergency
- Prerequisites being met/unmet during active research
- Multiple simultaneous research projects

### General Advice
- Build state validation helpers early
- Use debug overlays for task states and prerequisites
- Implement systems in this order: State → Logic → UI

## III. Phased Implementation

### Phase 0: Foundation
Extend `GameState` interface:

```typescript
GameState {
  food: number
  thoughtsPerSecond: number
  population: {
    total: number
    foodGathering: number
    thinking: number
    hunting: number
    unassigned: number
  }
  tasks: {
    foodGathering: 'discovered'
    thinking: 'imagined' | 'discovered'
    hunting: 'unthoughtof' | 'imagined' | 'discovered'
  }
  activeResearch: null | {
    task: 'hunting'
    progress: number // 0-100
  }
}
Phase 1: Core Systems
Implement new systems:

Task State Manager

Handle state transitions

Validate prerequisites

Manage research progress

Thought Generation

Calculate thoughts/sec from Thinking workers

Trigger state changes when thresholds met

Enhanced Food System

Different rates per task type

Maintain emergency protocols

Phase 2: UI Framework
Build card templates for each state:

Unthoughtof

Greyed out background

"????" placeholder

Imagined

Yellow glow effect

Prerequisite display

Research button

Discovered

Color-coded border

Assignment controls

Rate displays

Phase 3: Research System
Implement:

Research progress bars

State transition animations

Prerequisite validation

Research cancellation (if prerequisites unmet)

Phase 4: Emergency System
Update emergency logic:

Pause active research

Auto-reassign to Food Gathering

Disable Thinking tasks

Visual indicators for paused research

Phase 5: Polishing
Add:

State transition animations

Hover tooltips for prerequisites

Sound effects for:

State changes

Research completion

Emergency state

IV. Conclusion
Implementation Order
Extended state management

Task state system

Research mechanics

Enhanced UI

Emergency system updates

Polish

Critical Path
State tracking → Research system → UI integration → Emergency handling

Validation Approach
Test each state transition independently:

Unthoughtof → Imagined (meet prerequisites)

Imagined → Discovered (complete research)

Emergency state behavior

Use debug tools to:

Force state changes

Simulate research completion

Trigger edge cases