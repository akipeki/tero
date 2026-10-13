# Making your own sprites

You can replace any character or prop with your own image. Anything you
haven't replaced keeps the built-in, code-drawn art — so start with one
thing (the player's **idle**) and add the rest later.

## How to add an image

1. Save a PNG in the right folder:

   | What | Folder | File name |
   |---|---|---|
   | Player (Tero) | `public/sprites/player/` | `idle.png`, `walk.png`, `jump.png`, `fall.png`, `duck.png`, `hurt.png`, `lose.png`, `win.png`, `breathe.png`, `glide.png` |
   | Enemies | `public/sprites/enemies/` | `clerk`, `manager`, `syncer`, `guard`, `rat`, `pig`, `robot`, `plant`, `gorilla`, `vampire` + `.png` |
   | Props | `public/sprites/props/` | the prop's id + `.png`, e.g. `fridge_notes.png` (ids: `game/render/office/gags.ts`) |

2. List it in `game/customSprites.ts`:

   ```ts
   player: { idle: {} },          // public/sprites/player/idle.png
   enemies: { pig: {} },          // public/sprites/enemies/pig.png
   props: ['fridge_notes'],       // public/sprites/props/fridge_notes.png
   ```

3. Reload the game. If a file is missing the console says so and the
   built-in art is used.

## Dad

Save Dad as **`public/sprites/player/dad.png`**: one square frame (64 × 64
is native; bigger is fine), facing right, feet on the bottom edge. Then set
`dad: true` in `game/customSprites.ts`. He's used everywhere at once: the
escape run, the story portraits, the share card, Nap Time, the Office Chair
GP and the CAPTCHA. (Don't overwrite `public/images/dragon/dad.png`:
`npm run sprites` regenerates that file.)

## Image rules

- **PNG with a transparent background.** (AI tools often give a white
  background — remove it first, e.g. with remove.bg or Photoshop.)
- **Animations are one row of frames, side by side, no gaps.**
- **Frames are square.** The game counts frames as width ÷ height:
  512 × 64 = 8 frames, 2048 × 256 = 8 frames, 256 × 256 = 1 frame.
  (Not square? Write `{ frames: 4 }` in the list.)
- **Characters face RIGHT**, feet on the **bottom edge**, **centred**.
- **Any resolution.** The game scales your image down to game size, smoothly.
  Bigger source = cleaner downscale; 256–512 px per frame is plenty.
- **Same size and position in every frame** of an animation, or it jitters.

## Sizes on screen

The game world is 480 × 270, one floor tile is 32 × 32.

| What | Shown as | Notes |
|---|---|---|
| Tero | 64 × 64 per frame | Character fills most of the frame; collision is only 22 × 28 at the feet. Coffee makes him 1.5× automatically. |
| Enemies | 32 px tall | Width follows your frame. |
| Floor props | fitted into the built-in prop's box | Bottom edge = floor. |
| Hanging banners / posters | fitted into the built-in box | Top edge = ceiling. |

## Tero's animations

Start with **idle**. A single frame works (it just won't breathe); add more
frames when you're ready.

| Animation | Frames (suggested) | Speed |
|---|---|---|
| idle | 1 → 8 | 6 fps |
| walk | 8 | follows walking distance |
| jump | 2 | 12 fps |
| fall | 2 | 12 fps |
| duck | 1 | – |
| hurt | 2 | 14 fps |
| lose | 1 | – |
| win | 4 | 8 fps |
| breathe | 2 | 14 fps (fire: puffs and tantrums) |
| glide | 2 | 6 fps (golden parachute) |

For a full review of the current art and exact Aseprite specs (palettes,
anchors, bosses, gadgets), see [SPRITE_REVIEW.md](SPRITE_REVIEW.md).

## Readability rule

Keep **props and backgrounds muted**; the game mutes props automatically too.
Bright colours are for things the player can stand on, collect or must avoid.

## AI prompts

Generate **one frame first**, get the character right, then ask for the
animation in the same style. Always say "side view, facing right, full body,
transparent background, centred, feet at the bottom".

### Tero — idle, single frame
> Pixel art game sprite, 64×64 canvas, transparent background, side view
> facing right, full body, feet on the bottom edge. Tero is a cute
> two-year-old HUMAN BABY dressed in a green dinosaur/dragon costume, not an
> actual dragon: peach face showing in a round oversized dragon hood, a big
> eye and a smaller far eye, a short costume snout, two cream horn nubs, an
> orange crest, tiny orange wing nubs, a cream round belly panel with a dark
> zipper and pull, a white cloth diaper with a gold safety pin, big floppy
> three-toed footie feet, a short padded tail with an orange arrow tip and a
> light-blue pacifier. Colours: green costume #84cc64, orange parts #f88004,
> face #fcd4ac, belly #f6e7b2, outline #1e2a2b. Very chunky native 64px SNES
> sprite pixel art, one-pixel outline, three-tone solid shading, no
> antialiasing, true transparent background.

### Tero — idle, 8-frame sprite sheet
> Use case: identity-preserve. EIGHT frames of an idle breathing loop of
> EXACTLY the approved Tero [T1]. Horizontal strip 512×64, eight touching
> 64×64 cells, no gaps, transparent background. The belly panel rises and
> falls by a couple of pixels, he blinks in frames 5–6 and chews the
> pacifier in two frames. Same position and size in every frame, feet on
> the bottom edge.

More prompts (one per animation) are on the art to-do page.

### Enemy — corporate pig (template for every enemy)
> Pixel-art game enemy sprite, side view facing right, full body, standing on
> two legs. A fat pink pig in a tight dark pinstripe business suit with a gold
> tie and gold watch chain, smoking a cigar, smug half-closed eyes. Short and
> stocky. 1990s 16-bit style, dark outlines, slightly desaturated colours.
> Horizontal sprite sheet, 4 square frames: a waddling walk cycle. Same size
> and position in each frame, feet on the bottom edge, transparent background.

Swap the description for the others: *zombie office clerk with grey skin and
glowing red eyes, arms stretched forward* · *bald screaming manager with
glasses and a briefcase* (2 frames: crouched, mid-hop) · *security guard
with peaked cap, sunglasses, baton* · *rat in a tiny brown suit* · *boxy grey
robot with one red eye and a painted tie* · *flesh-eating office plant in a
pot, wearing a tiny tie* (2 frames: jaws closed, jaws open) · *gorilla in a
black suit* (2 frames) · *pale vampire in a suit with a red-lined cape*
(2 frames: cape folded, cape spread).

### Prop — the office fridge (template for props)
> Pixel-art background prop, front view, 1990s office fridge, off-white,
> one handwritten sticky note that says "WHO ATE MY SUSHI?". Muted,
> slightly desaturated colours, dark outlines, no background, single image,
> bottom edge is the floor.

Tip: AI is bad at small text — leave text off and keep the built-in joke
text, or add the text yourself afterwards.
