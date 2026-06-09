# TERO

A retro pixel-art platformer — Next.js 16 + TypeScript, 60 fps canvas
loop with a fixed time-step, tile-based AABB physics, three themed levels,
and a DOM-overlay player sprite so the hero stays crisp at any screen size.

## Run locally

```bash
npm install
npm run dev
# → http://localhost:3000  (auto-redirects to /game)
```

## Controls

| Action       | Keyboard                       | Mobile        |
|--------------|--------------------------------|---------------|
| Move L/R     | Arrow Left/Right · A/D         | D-pad         |
| Duck         | Arrow Down · S                 | ▼             |
| Jump         | Arrow Up · W · Space           | ▲             |
| Pause/Resume | Esc · P                        | ‖             |
| Mute         | M                              | 🔊 button     |
| Start / next | Enter                          | tap PLAY      |
| Restart run  | R (game over)                  | RETRY button  |

## Architecture

```
app/
  layout.tsx           — Press Start 2P font, preloads critical sprites
  game/page.tsx        — Mounts <GameContainer/> inside <ErrorBoundary/>
components/
  GameContainer.tsx    — React shell: canvas + DOM sprite overlay + HUD + overlays
  ErrorBoundary.tsx    — Catches runtime errors, shows a retry screen
game/
  Game.ts              — State machine: TITLE → PLAYING → PAUSED → GAME_OVER → WIN
  Stats.ts             — Score, coins, stomps, timer, best-time persistence
  constants.ts         — All physics & tuning values
  InputHandler.ts      — Keyboard + mobile bits; UI-edge callbacks (no window globals)
  AudioManager.ts      — Web Audio chiptune music + SFX, mute, volume
  ParticleSystem.ts    — Confetti / burst / pop, swap-and-pop update
  Camera.ts            — Smooth horizontal follow w/ clamp
  ScreenShake.ts       — Decaying random offset
  level/
    level1.ts          — Ember Hills (110 wide)
    level2.ts          — Mint Meadow (70 wide, more vertical)
    level3.ts          — Dusk Citadel (90 wide, hazard-dense)
    levels.ts          — Registry + per-level validator
    Tilemap.ts         — Stored 1D, queried 2D
  physics/
    AABB.ts            — overlap / stomp / penetration helpers
    Physics.ts         — Sweeping integrator: gravity, X then Y collision
  creaturesAndObjects/
    Player.ts          — Coyote/buffer/variable-jump/squash/duck/chain-stomp
    Walker.ts          — Patrols ledges; turns at walls and cliffs
    Hopper.ts          — Stationary periodic leap
    Mushroom.ts        — Power-up; grows to Big TERO
    QuestionBlock.ts   — Bumps when struck from below
    Goal.ts            — Castle at level end; triggers WIN
    Coin.ts            — Score pickup, spin animation
    Checkpoint.ts      — Re-anchors player spawn mid-level
  render/
    Renderer.ts        — Main entity loop
    Background.ts      — Sky + stars + parallax hills + buildings (cached to offscreen)
    Theme.ts           — Three palettes (ember / mint / dusk)
    sprites/           — Each entity's draw function lives here
```

### Why a DOM-overlay player

The character art is high-res (200×200 px). Drawing it to the 480×270 canvas
would force ugly downsampling. Instead, we render Tero as an absolutely
positioned `<img>` with `image-rendering: pixelated`, synced to the camera
each frame via a `Game.onPlayerRender` callback. The physics hitbox
(22×28 / 22×44 / 22×18) is independent of the displayed sprite size, so you
can swap in detailed art without re-tuning collisions.

### Adding a level

1. Copy `game/level/level1.ts` to `game/level/level4.ts`.
2. Edit the `RAW` tile array (0=air, 1=solid, 2=platform, 3=hazard).
3. Add spawns (`player`, `enemies`, `blocks`, `coins`, `checkpoints`, `goal`).
4. Register it in `game/level/levels.ts` with a theme (`ember`/`mint`/`dusk`).
5. The validator runs on import in development.

### Tuning game feel

All numbers live in [`game/constants.ts`](game/constants.ts). The settings
players notice first:

- `JUMP_FORCE`, `JUMP_CUT`, `GRAVITY` — jump arc
- `WALK_SPEED`, `RUN_ACCEL`, `FRICTION` — ground responsiveness
- `COYOTE_TIME`, `JUMP_BUFFER` — forgiveness windows
- `STOMP_BOUNCE`, `CHAIN_BONUS` — combo scoring
- `DEAD_TIMER_FRAMES` — how long the death animation locks input

### Scripts

```bash
npm run dev        # next dev
npm run build      # production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```
