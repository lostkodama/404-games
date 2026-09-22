Refactor the current src/main.ts without changing behavior. Keep the existing game logic and visuals identical. Move code into a small modular structure:
- game/Game.ts for game loop, game state, reset, score/difficulty orchestration
- game/player/player.ts, playerPhysics.ts, playerAnimation.ts
- game/input/input.ts
- game/obstacles/obstacles.ts
- game/collision/collision.ts
- game/render/renderer.ts
- game/constants.ts
- game/types.ts
Prefer plain functions and data objects. Only Game should be a class if useful. Avoid circular imports and global mutable state. Pass state into functions. Preserve current gameplay exactly. Do not add new features.
