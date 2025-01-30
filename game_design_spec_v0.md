# Prehistoric Technology Game - V0 Specification

## Game Overview

A resource management game where players balance food production against technological advancement through assigning tribal members to different cards.

## Initial Game State

- Starting population: 10 people
- All people initially assigned to hunting
- Starting food storage: 0
- Initial food rate: +10 food/second (20 produced - 10 consumed)
- Initial thought rate: 0 thoughts/second

## Core Game State

1. Resources

   - Food (stored resource, can accumulate or deplete)
   - Thoughts (instantaneous rate, not stored)

2. Population
   - Total number of people (fixed at 10 for v0)
   - Number assigned to hunting
   - Number assigned to thinking
   - Number unassigned

## Resource Mechanics

### Per-Second Rates

Each person in the tribe:

- Always consumes 1 food/second regardless of activity
- When hunting: Produces 2 food/second (net +1 food/second)
- When thinking: Produces 1 thought/second (net -1 food/second)
- When unassigned: Just consumes food (net -1 food/second)

### Emergency Food Situation

When food storage reaches 0:

1. Emergency popup appears warning of food shortage
2. All people automatically reassigned to hunting
3. Popup can be dismissed but situation remains until food is being generated

### Example Configurations

With all 10 people:

- All hunting (initial state): +10 food/second (20 produced - 10 consumed)
- All thinking: -10 food/second and +10 thoughts/second
- 5 hunting, 5 thinking: +0 food/second (10 produced - 10 consumed) and +5 thoughts/second

## User Interface

### Main Display Elements

1. Resource Counters

   - Current food storage (number)
   - Net food per second (number with + or - sign)
   - Current thoughts per second (number)
   - Total population (number)

2. Activity Cards

   - Hunting Card

     - Shows number of people assigned
     - +/- buttons for assignment
     - Shows net food contribution

   - Thinking Card
     - Shows number of people assigned
     - +/- buttons for assignment
     - Shows thoughts being generated

3. Emergency Elements
   - Popup warning when food reaches 0
   - Clear warning message explaining automatic reassignment
   - Dismissable popup (but situation remains until resolved)

### Expected Interactions

1. Player can click + or - on either card to assign/unassign people
2. Resource numbers update every second
3. Food storage accumulates or depletes based on net food rate
4. Thought rate immediately updates with assignment changes
5. Emergency reassignment happens automatically at 0 food
