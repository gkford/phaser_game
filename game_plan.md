# Game Plan: Tribal Resource Management

## I. Context & Objectives

### Core Purpose
Create a resource management game where players balance tribal labor allocation between:
- Food production (hunting)
- Research (thinking)

### Key V0 Requirements
- Track food storage (+/- per second) and thought generation
- Allow player to reassign workers via UI buttons
- Auto-reassign all to hunting during food emergencies
- Display real-time resource metrics

### Non-Negotiables
- Fixed population of 10
- No persistent progression (reset on refresh)
- Desktop browser focus

## II. Risks & Mitigation

### Critical Risks
#### State Desync
- **Risk:** UI failing to reflect true game state after interactions
- **Mitigation:** Implement unidirectional data flow (state → UI updates)

#### Time Mismanagement
- **Risk:** Accumulating errors from improper delta-time handling
- **Mitigation:** Use Phaser's fixed timestep (`this.time.addEvent`)

#### Input Flood
- **Risk:** Rapid button clicks breaking assignment logic
- **Mitigation:** Implement button cooldowns (200ms debounce)

### Emergency State Edge Cases
- Food exactly at 0 while rates are positive
- Multiple emergency triggers

### General Advice
- Start with hardcoded state values before implementing dynamic systems
- Validate each system in isolation before combining them
- Use debug overlays for rates/assignments during development

## III. Phased Implementation

### Phase 0: Foundation
Create `GameState` interface representing all trackable values:

```typescript
GameState {
  food: number
  population: {
    total: number
    hunting: number
    thinking: number
    unassigned: number
  }
}
```

Initialize state manager with:
- Default starting values
- Basic validation (total never exceeds 10)
- Set up core game loop using Phaser's clock:
  - 1-second interval timer
  - Empty update callback (to be filled later)

### Phase 1: Core Systems
Implement rate calculations:
- `calculateFoodRate(state)` → net food/sec
- `calculateThoughtRate(state)` → thoughts/sec

Build state transition system:
- `reassignWorker(fromActivity, toActivity)`
- Emergency reset function (`allToHunting()`)

Create basic debug UI:
- Text labels showing raw state values
- Rate displays (+3 food/sec style)

### Phase 2: UI & Interaction
Build activity cards with:
- Assignment count displays
- +/- buttons (disabled when unavailable)
- Net contribution labels (+2 food/worker)

Implement button handlers:
- Click → Update state → Recalculate rates → Refresh UI

Create emergency detection system:
- Check food ≤ 0 AND negative food rate
- Trigger auto-reassignment
- Prevent non-hunting assignments

### Phase 3: Emergency System
Create popup overlay:
- Semi-transparent background
- Warning text + "Understood" button

Implement:
- State restrictions (disable all buttons except popup dismissal)
- Visual warning in food display
- Emergency exit condition:
  - Continuous check for positive food rate
  - Auto-close popup when resolved

### Phase 4: Polishing
Implement:
- Smooth animations:
  - Food counter ticks (gradual increments)
  - Button hover/press states

Final validation:
- Test all assignment combinations
- Verify negative food prevention
- Stress-test rapid button mashing

## IV. Conclusion

### Implementation Order
1. Foundation
2. Calculation Systems
3. Interactive UI
4. Emergency Logic
5. Polish

### Critical Path
- State management → Assignment logic → Food simulation → Emergency handling

### Validation Approach
Start by proving core systems work in isolation (e.g., "Can I manually trigger an emergency state?"), then combine incrementally. Validate with extreme allocations (10 thinkers, 0 hunters) early.
