@AGENTS.md

# Quick map (see README.md for the full tour)

- Game loop, state machine, level orchestration → `game/Game.ts`
- All physics + tuning constants → `game/constants.ts`
- Level data + registry + validator → `game/level/levels.ts` + `level{1,2,3}.ts`
- Player physics (coyote/buffer/squash/duck) → `game/creaturesAndObjects/Player.ts`
- Player visuals → DOM `<img>` overlay in `components/GameContainer.tsx`
  (the canvas `Player.draw()` is intentionally a no-op)
- React → game UI bridge → `Game.signal('enter' | 'retry' | 'quit')`
  and `InputHandler.onUiAction(cb)` (no `window.__*` globals)
- Three themed palettes → `game/render/Theme.ts`; backgrounds cached
  to offscreen canvases per theme.
