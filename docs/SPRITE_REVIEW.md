# Sprite review & Aseprite specs

*Written 2026-10-07, after Phases 1–3. What's good, what I already fixed in
code, and exact specs for anything worth redrawing by hand in Aseprite.*

> **Easiest way in:** open **`/art`** in the browser. Every slot is listed
> there with its exact size and frame order, and **Download template** saves
> the current art as a PNG at the right size: open it in Aseprite, paint
> over it, export to the path shown, and add the name to
> `game/customSprites.ts` (`player`, `enemies`, `props` or `art`). The game
> uses your file instead of the code-drawn version.

## The verdict in one paragraph

The code-drawn ("rig") art is **consistent, readable and on-tone**. Every
enemy reads at a glance, and the palette rule (muted office, bright
gameplay) holds. Nothing is broken. But the rig style has a ceiling: smooth
shaded ellipses, little texture, and limited acting. Three things would
gain the most from hand-drawn pixel art, in this order:

1. **Tero.** He's on screen 100% of the time, and his walk, fire and joy
   are the game's personality. A hand-animated Tero is the single biggest
   visual upgrade available.
2. **The two bosses.** The Board's heads are cropped from the 32 px enemy
   rigs and **scaled 2×**, so their pixels are twice the size of
   everything else ("mixels"). That's the one real visual flaw left.
   Halvorsen is fine, but would benefit from a proper walk cycle.
3. **Dad's things (9 icons).** They're all the same pink "D" box right now.
   Each one should be its own object (watch, drawing, photo…).

The enemies are good enough to ship. Redraw them only if you're restyling
everything.

## Already fixed in code (no action needed)

| Problem | Fix |
|---|---|
| Dad's tie (Tero's signature prop) read as a dark shadow | Brighter loud blue `#3d6be0` with yellow stripes, dragging behind him (the costume redesign drops the tie) |
| Walk cycle: feet hidden behind the diaper, looked like sliding | Bigger steps (±7 px, lift 5), bouncier head |
| No pose for breathing fire | New `breathe` strip (2 frames), used for puffs and tantrums |
| No pose for the golden parachute | New `glide` strip (2 frames), canopy drawn above |
| Dark enemies (gorilla, vampire, rat) vanished on dark floors | 1 px soft light rim around every rig character; the gorilla is lighter |
| Hawaiian shirts for Casual Friday | Palette swap on the suits (no new art needed) |

---

## Global rules for anything you draw

- **Native pixel art at 1×.** Draw at the sizes below and export at 1×. The
  game scales the whole screen up. Don't draw bigger and downscale: that
  blurs the pixels and mixes pixel sizes.
- **Face right.** The game mirrors for left.
- **Feet on the bottom edge**, character centred horizontally, **same
  anchor in every frame** (otherwise it jitters).
- **Transparent background**, one horizontal strip per animation, no gaps,
  square frames unless stated.
- **1 px dark outline** `#1e2a2b` (Tero) or `#1b1620` (everyone else). The
  game adds the light rim itself, so don't draw one.
- **Bright = gameplay, muted = scenery.** Characters and pickups are fully
  saturated; nothing you draw for gameplay should be beige or grey-brown.
- Export each strip as PNG. Hook-up for Tero and enemies is already built
  (`docs/SPRITES.md`, `game/customSprites.ts`). Bosses and gadgets need a
  small code hook, which I'll add once the files exist.

---

## 1. Tero (priority 1)

**Frame: 64 × 64 px.** Character about 44 px tall. Feet rest on
**y = 61–62** (2 px margin at the bottom); body centre around **x = 32**.
Collision is only 22 × 28 at the feet, so the tail can stick out freely.

**Character notes:** Tero is **not a real dragon**. He is a two-year-old
**human baby in a green dragon costume**. His peach face shows in a round,
oversized dragon hood, with a big eye and a smaller far eye in side view.
The costume has a short snout, two cream horn nubs, an orange crest, tiny
orange wing nubs, and a **cream round belly panel with a dark zipper and
pull**. He wears a **white cloth diaper with a gold safety pin** and big
floppy three-toed footie feet, and has a short padded tail with an orange
arrow tip. A light-blue pacifier pops out whenever his mouth opens. There
is no necktie any more.

Dad is the same idea, grown up: a tired man in a faded dragon costume.

### Palette (Tero)

| Use | Hex |
|---|---|
| outline, zipper | `#1e2a2b` |
| green costume | `#84cc64` (plus your own light and dark shades) |
| orange costume parts (crest, wing nubs, tail tip) | `#f88004` |
| face | `#fcd4ac` |
| round belly panel | `#f6e7b2` |
| horn nubs | `#fff0b8` `#d9c27a` |
| eyes / pupils | `#ffffff` `#1e2a2b` |
| blush | `#ff8ea0` |
| mouth / tongue | `#5a1f2b` `#ff6f86` |
| diaper / shade / pin | `#f7f7f2` `#d9d9cf` `#e8b72f` |
| pacifier / ring | `#8fd3ff` `#ff8ea0` |

### Animations (file name → frames)

| File | Frames | Strip size | fps | Notes |
|---|---|---|---|---|
| `idle.png` | 8 | 512 × 64 | 6 | Breathing bob, a small tail sway, one blink, chewing the pacifier |
| `walk.png` | 8 | 512 × 64 | by distance (1 frame per 9 px) | **Toddler waddle**: side-to-side sway, big lifted steps, arms swinging opposite the legs, padded tail bouncing. Contact frames 0 and 4. |
| `jump.png` | 2 | 128 × 64 | 12 | Arms up, open happy mouth, wide eyes, wing nubs up, the pacifier popping out in front of the mouth |
| `fall.png` | 2 | 128 × 64 | 12 | "Oh no" face (mouth O), arms flailing, tail flipped up |
| `duck.png` | 1 | 64 × 64 | – | Squashed down, eyes squeezed shut, arms over the hood (in-game this becomes a cardboard box when he's still) |
| `hurt.png` | 2 | 128 × 64 | 14 | Recoil, eyes squeezed, mouth O |
| `lose.png` | 1 | 64 × 64 | – | Dizzy X eyes, tongue out, flopped on his bottom |
| `win.png` | 4 | 256 × 64 | 8 | Happy-closed eyes, mouth open, arms up, little hop |
| `breathe.png` | 2 | 128 × 64 | 14 | **Tantrum roar.** Head thrust forward, mouth wide open (the game draws the flames in front of the mouth, from x ≈ 56, y ≈ 36), eyes squeezed and furious, fists clenched, tail stiff. No pacifier. |
| `glide.png` | 2 | 128 × 64 | 6 | **Golden parachute.** Both arms straight up gripping strings (the canopy is drawn above at y ≈ −14), footie feet dangling, happy face |

**Nice-to-have extras** (need a small code hook from me):
`sync.png` (2 frames: bored, glazed eyes, while trapped in a quick sync),
`faxed.png` (1 frame, a deliberately smeared photocopy), `big_*` versions
for coffee (right now the game scales him 1.5×, which is fine).

### Prompts

The art to-do page has a ready prompt for every animation. They follow
this "identity-preserve" pattern: get one idle frame approved (T1), then
give it and the walk strip to the image AI as references.

> Use case: identity-preserve. Create TWO frames of an upward JUMP sprite
> animation of EXACTLY the approved Tero [T1] in the two supplied reference
> sprite sheets. Image1 idle and image2 walk are appearance/style
> references, not poses to reproduce. Tero is a cute two-year-old HUMAN
> BABY dressed in green dinosaur/dragon costume, exposed peach face in round
> oversized dragon hood, not an actual dragon. […] cream ROUND BELLY PANEL
> with dark ZIPPER and pull exactly as T1 […]. Mandatory base colors green
> costume #84cc64, orange costume parts #f88004, human face #fcd4ac, cream
> belly #f6e7b2, outline #1e2a2b. Poses only: […]. Intended export exact
> 128x64 transparent PNG: TWO touching 64x64 cells horizontally […]. Very
> chunky native 64px SNES sprite pixel art, strong ONE native pixel #1e2a2b
> outline, three-tone solid shading clusters. NO antialiasing, gradients,
> blur […]. TRUE TRANSPARENT RGBA background.

---

## 2. Bosses (priority 2)

### Mr. Halvorsen (Floor 12)

**Frame: 40 × 60 px**, feet on the bottom edge, facing right. Tall, gaunt,
TED-talk headset mic, slicked combover, square glasses with red glowing
pupils, navy pinstripe suit (`#26305a` / `#34407a` / `#181e3c`, stripes
`#3a4878`), a red tie (`#b8343a`) hanging to his knees, a presentation
clicker in his hand. Zombie-grey skin `#a8b394` / `#c9d1b4` / `#76826a`.
**Keep exactly these skin and eye colours**: the game swaps them to warm
skin when he's freed.

| Pose | Frames | Notes |
|---|---|---|
| walk | 4 (was 2) | Long confident strides (he's pacing a stage) |
| present | 2 | Clicker arm out; frame 2 = "click" with a red dot |
| throw | 2 | Wind-up holding a pie chart behind his head → release |
| hurt | 1 | Wince, glasses askew |
| freed | 1 | Same person, relieved, tie loosened (colours swapped by the game) |

One strip: `halvorsen.png`, 10 frames × 40 px = **400 × 60**, order as
listed.

### THE BOARD (Floor 33): fixes the mixel problem

Draw the heads **natively at 40 × 32** (don't upscale the small enemy
heads). Five heads, facing **left** (towards Tero). Each has 3 frames:
**idle** (smug), **shout** (mouth wide, shouting their buzzword), **dizzy**
(eyes spirals, tongue out).

| Head | Character | Buzzword |
|---|---|---|
| Chairman | bald, glasses, grey skin, liver spots | SYNERGY! |
| Pig | pink, cigar | DIVIDENDS! |
| Vampire | white, widow's peak, fangs | RESTRUCTURE! |
| Gorilla | grey fur, brow ridge, red eyes | GROWTH!! |
| Robot | steel box head, red visor slit, antenna | OPTIMIZE. |

`board_heads.png`: 5 rows × 3 frames → **120 × 160** (rows in the order
above). Plus:
- `board_neck.png`: one **14 × 14** tileable pinstripe neck segment
  (navy, collar and tie are drawn by code)
- `board_table.png`: **160 × 72** mahogany boardroom table, front view,
  gold plaque area left blank (the game writes THE BOARD / RESIGNED on it)

---

## 2b. Characters added after the first review

| Slot (`art`) | Frame | Frames | Notes |
|---|---|---|---|
| `recruiter` (Chad, Floor 6) | 40 × 48 | walk0, walk1, throw, dash, hurt | A pig in a slim-fit suit, TALENT lanyard, sunglasses up, clipboard |
| `elvis` (The Vents) | 84 × 56 | run0–run3, sit, jump, yelp | Big kind golden office dog; old CHIEF HAPPINESS OFFICER badge on the collar; Tero rides on his back |
| enemy `syncer` (Floor 6) | 32 × 32 | 4 walk frames | Shirt sleeves, lanyard, mug held out, a grin that means a calendar invite |

The resistance members in the Vents reuse the enemy sprites with the
colour back in their faces, so they need no extra art.

## 3. Gameplay objects (priority 3)

All bright, 1 px dark outline `#1b1620`.

| Object | Size | Frames | Notes |
|---|---|---|---|
| **Dad's things** (10 icons) | 16 × 16 each | 1 | watch (stopped), crayon drawing, wedding photo, letter, slipper, bus pass, paperback "HOW TO SAY NO", TV remote, house key, sandwich wrapper ("FOR THE DOG"). One strip `art/dad_things.png` **160 × 16** in that order. Soft pink glow is drawn by code. |
| Fireball | 24 × 24 | 4 | Spark → full fireball → fading → smoke. `fireball.png` 96 × 24. Should read as **baby** fire: round, cute, a bit wobbly. |
| Puff (hiccup) | 16 × 16 | 3 | A sad little smoke ring with one ember |
| Cardboard hide box | 34 × 24 | 2 | Frame 2: the peephole blinks |
| Paperwork tile | 32 × 32 | 1 | Bright white stacks, red URGENT stamp, twine (burnable, so it should look flammable) |
| Red tape tile | 32 × 32 | 2 | Tileable on all four sides; criss-cross red tape with SEALED tags; 2 sway frames |
| Bullet-point platform | 32 × 16 | 3 | Left end (with the bullet), middle, right end; projected-light blue, safety tape on top |
| Fax machine | 28 × 26 | 2 | Idle / printing (paper sticking out) |
| Synergy spring | 26 × 14 | 2 | Normal / squashed |
| Golden parachute pickup | 20 × 22 | 1 | Gold sack, "CEO EXIT" tag, $ |
| Parachute canopy | 50 × 40 | 1 | Gold gores + strings converging at the bottom centre |
| CCTV camera | 16 × 12 | 3 | Lens left / centre / right (the cone is drawn by code) |
| Falling ceiling tile | 24 × 12 | 1 | Acoustic tile, with dots |

## 4. Enemies (optional)

All **32 × 32**, feet on the bottom edge, facing right, palette swap
colours as they are now. Walkers have **4** walk frames, hoppers **2**
(ground, air), the plant **2** (closed, open), the syncer **4 + 2**
(walk, then talking). File names and the hook-up are in `docs/SPRITES.md`.

| Enemy | Notes for a redraw |
|---|---|
| clerk | Good as is. Could use a more pronounced shamble. |
| manager | Good. The briefcase reads well. |
| syncer | New. The mug and lanyard are the point; keep the grin. |
| guard | Good. |
| rat | Tiny; give it a bright tie or a briefcase for contrast. |
| pig | Strong. Cigar and pinstripes. |
| robot | Strong. |
| plant | Strong; it reads as dangerous. |
| gorilla | Lightened tonight. A hand-drawn version could add silverback grey. |
| vampire | Good face, dark body; the cape could be red-lined for contrast. |

---

*When the files exist, drop them in `public/sprites/…` and tell me. I'll
add the hooks for bosses, gadgets and Dad's things, and check them in the
game.*
