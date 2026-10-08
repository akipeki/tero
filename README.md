# WHERE IS DADA? - Baby Dragon Strikes Back

A retro pixel-art platformer — Next.js 16 + TypeScript, 60 fps canvas
loop with a fixed time-step, tile-based AABB physics and a DOM-overlay
player sprite.

Six months ago the company asked Dad to "give a little bit more". He never
came home. Tero, a two-year-old in a green dragon costume, storms the
1993 office tower — full of short, zombie-ish humans and office-culture
parody — to bring him back. (The name lives in `game/title.ts`.)

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
| Fire / TANTRUM | X · F · Shift                | 🔥            |
| Shout "DADA!" | C                             | 📣            |
| Throw the grenade | G (once you have it)       | 💣            |

**Gamepads** work too (standard mapping): stick or d-pad moves, A jumps,
B/X breathe fire, Y shouts DADA, a shoulder button throws the grenade,
Start pauses.

**⚙ Settings** (title screen or pause menu): music and sound-effects
volume, screen shake (off by default if your OS asks for reduced motion),
speedrun timer, kid mode, and **language: English or Suomi**. Finnish lives
in `game/content/lang/fi.ts` as English → Finnish pairs (`t()` /
`tf()` in `game/i18n.ts`); a test checks that every story line has one.
Adding a language = one more dictionary file.
| Jump         | Arrow Up · W · Space           | ▲             |
| Pause/Resume | Esc · P                        | ‖             |
| Speedrun timer | T                            | —             |
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
  AudioManager.ts      — Web Audio chiptune band + SFX, mute, volume, floor mood
  music.ts             — The theme song's notes (edit me)
  ParticleSystem.ts    — Confetti / burst / pop, swap-and-pop update
  Camera.ts            — Smooth horizontal follow w/ clamp
  ScreenShake.ts       — Decaying random offset
  level/
    level1.ts          — The Mailroom (showcase floor: Monday rush, paper wall, secret stash)
    level2.ts          — Cubicle Farm (more vertical)
    level3.ts          — The Boardroom (hazard-dense)
    level4–8.ts        — Chapter 2 in play order: Legal (4), R&D (5),
                         Security (7), Executive Wing (8), The Sanctum (6)
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

### Your own sprites

Drop PNGs into `public/sprites/{player,enemies,props}/` and list them in
`game/customSprites.ts` — anything not listed keeps the built-in art. Specs
and AI prompts: [docs/SPRITES.md](docs/SPRITES.md).

### Characters are rigged, not hand-drawn

Baby Tero and Dad (`game/render/characters/dragon.ts`) and the humans
(`characters/humans.ts`) are drawn by small pixel rigs on a DOM-free
`Raster` (`render/pixel/Raster.ts`): each body part is a shaded ellipse,
capsule or triangle with its own outline. An animation is just a list of
poses (`DRAGON_ANIMS`).

- The dragon is rendered to PNG strips by `npm run sprites`
  → `public/images/dragon/*.png`. Re-run it after changing the rig; a test
  fails if `framePaths` and the PNGs drift apart. You can also repaint the
  PNGs by hand — keep the 64×64 frame size and frame counts.
- The humans are rendered to canvases at runtime (`office/OfficeSprites.ts`).
- The rest of the company lives in `characters/creatures.ts`: security
  guards, corporate rats, pigs and gorillas, vampires, walking robots and
  flesh-eating plants. Each is a Walker or Hopper variant
  (`creaturesAndObjects/enemyKinds.ts` sets size, speed and jump); levels
  spawn them by name, e.g. `{ type: 'pig', tx: 12, ty: 6 }`. Plants don't
  move and can't be stomped.

### The office theme

`theme: 'office'` switches every drawer to `game/render/office/`: carpet,
ceiling lights (one flickers), filing cabinets, desks and thumbtack pits
(`OfficeTiles.ts`); a parallax wall/window/cubicle background
(`OfficeBackground.ts`); and floppy-disk coins, coffee-mug power-ups,
computer "?" blocks, a water-cooler checkpoint and an elevator goal
(`OfficeSprites.ts`). The older `ember`/`mint`/`dusk` themes still work for
user levels.

### Every floor has its own décor

`game/render/office/decor.ts` gives each floor a look — wallpaper, chair
rail, carpet, desk style, window blinds and the background strip — and it
gets fancier as you climb: basement mailroom (concrete, pipes, leaking water
pits) → cubicle farm → wood-panelled boardroom → dark-green Legal → white
R&D lab → steel Security with blinds shut and a CCTV wall → 90s Memphis
Executive Wing → marble-and-gold penthouse. A level picks one with
`decor:` in the story script. Gags can be limited to some floors with
`floors: [...]` (e.g. the Ferrari only parks in the penthouse).

### Readability rule: scenery muted, gameplay bright

Background layers and gag props are desaturated once when cached
(`render/office/mute.ts`). Everything the player interacts with is drawn at
full colour: every surface you can stand on (desks, cabinets, mystery boxes)
carries the same yellow-and-black safety tape; "?" blocks are bright
cardboard boxes with a floppy-and-? shipping label; floppy pickups glow and
sparkle. Keep new gameplay objects bright and new scenery muted.

### Background gags

The office is a parody, so every screen should have something dumb on it.
`game/render/office/gags.ts` is the gag library: ceiling banners
("SYNERGY IS NOT OPTIONAL", "Q4 IS COMING"…) and floor props (a photocopier
slain with a two-handed sword, a money shrine, a supply closet with a sock on
the handle, a fridge full of passive-aggressive notes…).

- Place gags on purpose in `story/script.ts` with `scenery: [{ atTile, gag }]`
  — use them as hints about what happened in the office.
- Gags have a tier: 1 = everyday absurdity, 2 = the unhinged stuff (Project
  Orphanage, an axe in a PC, the VP-of-Sales poodle…). A level's `mood:
  'unhinged'` lets the auto-fill use tier 2, and use it first; levels are
  'tame' by default. `density: 'sparse'` spaces the random gags out (the
  first chapter uses it).
- Dad's trail (`dad_photo`, `dad_mug`, `dad_calendar`, `dad_cot`,
  `dad_desk`) is `storyOnly`: it appears only where the script places it.
  So is Tero's crayon wall writing (`crayon_power`, `crayon_unite`,
  `crayon_want`, `crayon_go_home`, `crayon_resource`).
- `Scenery.ts` fills the rest of each level automatically (seeded by level
  id, so it's stable), keeps floor props on flat floor and away from the
  elevator.
- New gag: add an entry to `GAGS`, then
  `npm run sprites -- --preview DIR` renders a contact sheet of all of them.

### Why a DOM-overlay player

We render Tero as an absolutely
positioned `<div>` (sprite drawn as its background image), synced to the
camera each frame via a `Game.onPlayerRender` callback. Positions are
interpolated between 60 Hz physics steps and snapped to device pixels, so
motion stays smooth on high-refresh displays. Frames wider than the sprite's
world size (64 px) are treated as hi-res art and filtered smoothly; smaller
frames are native pixel art and stay `pixelated`. Walk animation advances by
distance walked (`WALK_STRIDE_PX`), and squash/stretch is damped by
`SQUASH_STRENGTH` — both in `game/constants.ts`. The physics hitbox
(22×28 / 22×44 / 22×18) is independent of the displayed sprite size, so you
can swap in detailed art without re-tuning collisions.

### Adding a level

1. Copy `game/level/level1.ts` to `game/level/level4.ts`.
2. Edit the rows (`.` air, `#` solid, `=` desk/one-way platform,
   `^` hazard, `%` paperwork that fire burns away). The camera shows rows
   0–8; `game/level/level1.ts` is the example to copy.
3. Add spawns (`player`, `enemies`, `blocks`, `coins`, `checkpoints`, `goal`).
4. Register it in `game/level/levels.ts` with a theme (`ember`/`mint`/`dusk`).
5. The validator runs on import in development.

### Writing story

All built-in dialogue lives in `game/content/story/script.ts`, written as
plain lines (no ids):

```ts
levels: {
  '2': {
    intro:    [{ text: 'FLOOR 6 — THE CUBICLE FARM.' }],          // narration
    triggers: [{ atTile: 32, lines: [{ who: 'doris', text: 'Hi.' }] }],
    outro:    [{ who: 'tero', text: 'Onward!' }],
  },
},
```

- `who` must be a key in `cast` (a typo is a TypeScript error); leave it out
  for narration. `cast` entries can have a `portrait` sprite id.
- A chapter's `intro` plays before its first level, then the level `intro`.
  Intros don't replay on retry.
- `triggers` play once per attempt when the player walks past tile column
  `atTile`; `outro` plays at the goal, before the results screen.
- Enter / Space / tap advances (first press finishes the typing), Esc skips.

The script compiles into the pack's `StoryCard` / `Chapter` data
(`story/compile.ts`), so user packs can carry story too; dangling card
references are logged at startup (`story/validate.ts`).

### Tantrum: the core verb

Tero is two and wears a dragon costume, so as far as he's concerned he
breathes fire. In this game, he does. Anger fills the **tantrum
meter** (HUD: GRR → X!): getting hurt, dying (so struggling players get
help), stomping, floppies and burning paperwork. Story triggers can fill it
outright (`effect: 'tantrum'`; on Floor 1 it's Dad's desk with a sticky
note where his face was).

- **FIRE with a full meter** starts a 5-second TANTRUM: a stream of fire,
  invincibility, faster feet, red screen edges, and the muzak turns into
  metal (`AudioManager.setTantrum`).
- **FIRE otherwise** is a tiny hiccup puff. It only burns paperwork.
- **Paperwork** (`%` in level rows, `TileType.PAPER`) is solid until fire
  touches it, which makes it good for walls, shortcuts and secret stashes.
- **Workers are freed, not killed.** Stomping, burning or tantrum-bumping a
  worker brings the colour back to their face; they drop the tie, shout
  something ("IS IT 5?") and skip off home. The HUD's ⌂ counts them and the
  results screen reports how many went home to their kids. Robots and
  plants aren't people, so they just break. See `creaturesAndObjects/freed.ts`.
- Hits land with **hit-stop** (a few frozen frames) and screen shake.

All the numbers are in the Tantrum section of `game/constants.ts`.

### Every floor has its own mechanic (Phase 2)

| Floor | Mechanic | Where |
|---|---|---|
| 1 Mailroom | the tantrum (Dad's desk fills the meter), the Monday rush, paperwork walls, a secret stash | `level1.ts` |
| 6 Cubicles | **quick syncs**: syncers who see you trap you in a conversation; duck to hide in a cardboard box. **Mini-boss: Chad from Talent Acquisition** — asks Tero's age, offers the Junior Trainee Program ("only 10-hour days"), makes him fill in `JOB_APPLICATION.EXE` (only answer E is accepted), gets told off, then fights | `Walker` (`sees`), `Recruiter.ts`, `JobApplication` in `GameContainer.tsx`, `level2.ts` |
| The Vents (between 6 and 12) | Floor 6's elevator is OUT OF ORDER, so Tero jumps into a pipe. **Ride Elvis**, the abandoned office dog (faster, higher jumps, bumps don't hurt), through the hidden happy place nobody upstairs knows about. **The Resistance** (they resist *leaving*) gives Tero a **hand grenade** full of resignation letters: G throws it, everyone in the blast resigns and goes home, bosses take a hit. No enemies, no pits | `level10.ts`, `ElvisNpc`/`Npc` in `Gadgets.ts`, `Grenade.ts`, `ventArt.ts`, decor `vents` |
| 12 Boardroom | **boss: Mr. Halvorsen's Q3 review** — slides' bullet points are the platforms | `Halvorsen.ts`, `level3.ts` |
| 13 Legal | **red tape** (`~`): sticky, slow, flammable | `TileType.TAPE`, `level4.ts` |
| 21 R&D | **fax teleporters** and the **synergy spring** | `Gadgets.ts`, `level5.ts` |
| 27 Security | **CCTV cones**: get seen and guards drop from the vents; a box is just a box | `Cctv.ts`, `level7.ts` |
| 30 Executive | the **golden parachute**: hold jump to glide over chasms | `Gadgets.ts`, `level8.ts` |
| 33 Sanctum | **final boss: THE BOARD**, a five-headed hydra of executives | `Board.ts`, `level6.ts` |
| The way home | **the escape**: 33 floors of stairs before Monday, Dad following, ceiling falling | `Escape.ts`, `level9.ts` |

Story triggers can also open the job application with `effect: 'quiz'` (the
world waits in `GameState.QUIZ` until it's submitted). Bosses share the `Boss` interface (`creaturesAndObjects/Boss.ts`): a
one-screen arena from `arenaTx` that locks the camera and shuts the door;
the elevator wears an IN A MEETING sign until the boss walks out. Story
triggers can start them with `effect: 'boss'`. Gadgets (faxes, springs,
cameras, the parachute) are listed in a level's `gadgets` spawns.

### Made to be shared (Phase 3)

- **The whole run** (`game/Run.ts`): splits per floor, workers sent home,
  deaths, tantrums, quick syncs, faxes, alarms — saved to localStorage so a
  reload doesn't lose it. Starting Floor 1 from the title starts a new run.
- **The end card** (`game/ShareCard.ts`): after the last floor, "YOU GOT
  DAD BACK." and a 960×540 PNG ("DAD WAS AT THE OFFICE FOR 4,380 HOURS.
  TERO GOT HIM BACK IN 14:32.07.") with SAVE IMAGE and SHARE (the Web
  Share API with the image where supported, otherwise the text is copied).
- **Speedrun timer**: T toggles it; splits and the best full run are on
  the end screen.
- **Dad's things**: one per floor, hidden a little out of the way
  (`DAD_THINGS` in `Gadgets.ts`). Each tells you something about Dad.
- **Casual Friday** (`game/Mode.ts`): unlocked by finishing the game.
  Every suit becomes a loud Hawaiian shirt and the muzak goes ukulele.

### The weird stuff (Phase 5)

- **Systems that touch:** fire spreads through paperwork and red tape like a
  fuse (`level/FireSpread.ts`); a tantrum makes everyone nearby panic and run
  ("HR!!", "NOT MY JOB").
- **Everyone does their job** (`Game.updateJobs`): pigs throw floppies as
  bribes, guards chase you for your badge, robots copy your jumps, rats steal
  floppies (and drop them when sent home), gorillas shake the floor when they
  land.
- **Tero talks** during play in short toddler barks ("Owie!", "Bye bye!",
  "Shh.", "Dada?" when he's left standing). **C shouts "DADA!!"**: enemies
  turn round, and Dad's things nearby sparkle back (a hot/cold hint).
- **Everyone you've freed waits by each elevator, cheering.**
- **The pause menu is PAUSED.EXE** (quitting: "Your manager will see this");
  **game over is an HR exit interview** with the cause of death.
- **A secret ending** if you find all nine of Dad's things.

### Playtesting (Phase 4)

- **`/playtest`**: a report of where players die (and to what), quit, get
  stuck (20 s without progress) and get rescued, as a table per floor and a
  heat map on each floor's tiles. It's all local (`game/Playtest.ts`, in
  localStorage); testers **export** their log as a file and you **import**
  several at once. How to run a session: [docs/PLAYTEST.md](docs/PLAYTEST.md).
- **Bring Your Kid to Work Day** (title screen or pause menu): dying costs
  no lives, pits put you back on the last safe ground, the tantrum meter
  fills twice as fast and the escape clock runs 1.5× longer. Assisted runs
  say so on the share card and don't set speedrun records.

### Music

The theme song is written as plain note names in
[`game/music.ts`](game/music.ts) (8 eighth-notes per bar, `'-'` holds,
`'.'` rests, `'da:G5'` makes Tero sing "da"). `AudioManager.ts` plays it
with Web Audio: square lead, triangle bass, arpeggio, noise drums and a
formant-filtered toddler voice for the "Da-da!" hook. The higher the floor,
the worse the muzak: slower, tape-warbly, overdriven and muffled
(`setFloorMood`), and the penthouse plays a semitone flat.

Every floor also has its own **arrangement** of the theme (`ARRANGEMENTS` in
`music.ts`: lead instrument, key, tempo, drum groove: a boiler-room lullaby
in the basement, a bossa nova in the boardroom, lounge music in the
executive wing, a sprint in the stairwell). Bosses switch to the **boss
theme**; the vents play **Elvis's song**. Music and sound effects have
separate volume sliders.

**Real recordings** (a toddler actually saying "dada", a composer's
soundtrack): put the files in `public/audio/` and list them in
`game/customSounds.ts`. A listed song loops instead of the sequencer
(still muffled on the high floors); a listed sound effect replaces the
synth one.

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
npm run build:web  # static site in out/ (any static host)
npm run serve:web  # serve out/ on http://localhost:3005
```

### Launching

`/press` is the press kit, and the share card, icon and install manifest are
built automatically. Hosting options, store copy (EN and FI), the trailer
shot list and the launch checklist are in [docs/LAUNCH.md](docs/LAUNCH.md).
