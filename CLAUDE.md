@AGENTS.md

# Quick map (see README.md for the full tour)

- Game loop, state machine, level orchestration → `game/Game.ts`
- All physics + tuning constants → `game/constants.ts`
- Level data + registry + validator → `game/level/levels.ts` + `level{1,2,3}.ts`
- Player physics (coyote/buffer/squash/duck) → `game/creaturesAndObjects/Player.ts`
- Player visuals → DOM `<div>` overlay (background-image) in `components/GameContainer.tsx`;
  frame/walk-cycle choice + interpolation in `Game.syncPlayerOverlay`
  (the canvas `Player.draw()` is intentionally a no-op)
- React → game UI bridge → `Game.signal('enter' | 'retry' | 'quit')`
  and `InputHandler.onUiAction(cb)` (no `window.__*` globals)
- Story → write in `game/content/story/script.ts`; compiled into pack
  cards/chapters; played by `StoryPlayer` via the `STORY` game state and
  shown by `components/StoryBox.tsx`
- Game name → `game/title.ts`
- Enemy variants (guard, rat, pig, robot, plant, gorilla, vampire) →
  `creaturesAndObjects/enemyKinds.ts` + art in `render/characters/creatures.ts`
- Characters are pixel rigs → `game/render/characters/` (baby Tero + Dad, humans) on
  `render/pixel/Raster.ts`; `npm run sprites` regenerates the dragon PNGs
- Office theme (default for built-in levels) → `game/render/office/`; each
  sprite/tile drawer delegates there when `isOffice()`
- Per-floor décor (wallpaper, carpet, desks, blinds, background strip) →
  `render/office/decor.ts`, set from `decor:` in the story script
- Readability: scenery muted via `render/office/mute.ts`; standable surfaces
  get `safetyEdge()` (yellow/black tape) in `OfficeTiles.ts`
- Background gags → `render/office/gags.ts` (library) + `Scenery.ts`
  (authored `scenery` from the story script + seeded auto-fill)
- Palettes → `game/render/Theme.ts`; backgrounds cached to offscreen canvases.
