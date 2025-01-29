# Game Plan

## 2. Core State Management
### Create GameState Interface

```typescript
interface GameState {
  food: number
  foodRate: number
  thoughtRate: number
  population: {
    total: number
    hunting: number
    thinking: number
    unassigned: number
  }
}
```

- Implement state update system
- Basic state mutation functions
- Pure calculation functions for rates
- Emergency state detection

## 3. Core Game Loop
- Implement time-based updates
- Phaser's fixed timestep (using time.addEvent)
- Food accumulation/depletion system
- Emergency check system

## 4. UI Foundation
- Create basic UI layer
- Separate from game scene camera
- Responsive layout foundations
- Text rendering system for numbers

## 5. Interactive Components
- Build button system
- Reusable button component
- Click handlers with sound/visual feedback
- State update propagation

## 6. Core Gameplay Implementation Order
1. Basic resource display (food counter + rates)
2. Assignment buttons with basic +/- functionality
3. Population distribution logic
4. Rate calculation system
5. Food depletion/accumulation
6. Emergency state handling
7. Popup system

## Critical Early Technical Risks
- State synchronization - Ensure UI always reflects game state
- Time management - Avoid using setInterval (use Phaser's time system)
- Button debouncing - Prevent rapid clicks from breaking assignment math
- Emergency state transitions - Test edge case when food hits exactly 0

## Recommended First Milestones
1. Barebones UI showing numbers that change when clicking buttons
2. Working food counter that automatically updates each second
3. Emergency state that triggers when manually setting food to 0
4. Complete assignment flow (buttons → state → rates → food)

## Key Learning Requirements
- Phaser's scene lifecycle
- TypeScript interfaces/type safety
- State management patterns
- Phaser's input handling
- Delta-time vs fixed timestep

## Development Strategy
Start with the smallest working system (even just a single button that makes a number go up), then expand incrementally while maintaining working state.
