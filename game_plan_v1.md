# Game Plan - V1: Tech Tree Implementation

## Game Overview
Building on V0's resource management foundation, V1 adds:
- Task state progression system
- Research mechanics using thoughts
- Enhanced task types with varying efficiencies
- Visual progression through card states

## Initial Game State
- Starting population: 10 people (fixed)
- Food Gathering: Discovered state
- Thinking L1: Imagined state
- Hunting: Unthoughtof state
- Starting food: 0
- Starting thoughts: 0/sec

## Core Systems

### 1. Task States
Three progression levels:
1. Unthoughtof
   - Hidden mechanics
   - No interaction possible
   - "????" display

2. Imagined
   - Requirements visible
   - Research option available
   - Progress tracking

3. Discovered
   - Full functionality
   - Worker assignment enabled
   - Rate displays active

### 2. Research System
Prerequisites:
- Food Gathering: None (starts discovered)
- Thinking L1: Food > 0
- Hunting: 1 thought/sec + Thinking L1 discovered

Progress tracking:
- Research bars (30s base duration)
- Prerequisite validation
- State transition handling

### 3. Resource Generation
Per-second calculations:
1. Food
   - Food Gathering: +1.2/worker
   - Hunting: +2/worker
   - Consumption: -1/person

2. Thoughts
   - Thinking: +1/worker
   - Not stored (rate-based)

## Implementation Phases

### Phase 1: State Management
- Extend GameState interface
- Add task state tracking
- Implement validation system
- Set up prerequisite checks

### Phase 2: Research Mechanics
- Progress bar system
- State transition logic
- Prerequisite monitoring
- Research cancellation

### Phase 3: Enhanced UI
- Card templates per state
- Progress indicators
- State transition effects
- Prerequisite displays

### Phase 4: Emergency System
- Pause research during emergency
- Auto-reassign workers
- Visual state indicators
- Recovery handling

### Phase 5: Polish & Balance
- Smooth transitions
- Sound effects
- Tooltips
- Final validation

## Testing Strategy
1. State Transitions
   - Unthoughtof → Imagined
   - Imagined → Discovered
   - Emergency interrupts

2. Edge Cases
   - Multiple research projects
   - Prerequisite changes
   - Emergency timing

3. Balance Testing
   - Food sustainability
   - Research timing
   - Worker efficiency
