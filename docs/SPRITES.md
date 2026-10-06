# Making your own sprites

You can replace any character or prop with your own image. Anything you
haven't replaced keeps the built-in, code-drawn art — so start with one
thing (the player's **idle**) and add the rest later.

## How to add an image

1. Save a PNG in the right folder:

   | What | Folder | File name |
   |---|---|---|
   | Player (Tero) | `public/sprites/player/` | `idle.png`, `walk.png`, `jump.png`, `fall.png`, `duck.png`, `hurt.png`, `lose.png`, `win.png` |
   | Enemies | `public/sprites/enemies/` | `clerk`, `manager`, `guard`, `rat`, `pig`, `robot`, `plant`, `gorilla`, `vampire` + `.png` |
   | Props | `public/sprites/props/` | the prop's id + `.png`, e.g. `fridge_notes.png` (ids: `game/render/office/gags.ts`) |

2. List it in `game/customSprites.ts`:

   ```ts
   player: { idle: {} },          // public/sprites/player/idle.png
   enemies: { pig: {} },          // public/sprites/enemies/pig.png
   props: ['fridge_notes'],       // public/sprites/props/fridge_notes.png
   ```

3. Reload the game. If a file is missing the console says so and the
   built-in art is used.

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

## Readability rule

Keep **props and backgrounds muted**; the game mutes props automatically too.
Bright colours are for things the player can stand on, collect or must avoid.

## AI prompts

Generate **one frame first**, get the character right, then ask for the
animation in the same style. Always say "side view, facing right, full body,
transparent background, centred, feet at the bottom".

### Tero — idle, single frame
> Cute pixel-art game sprite of a baby dragon toddler, side view facing right,
> full body, standing upright on two stubby legs like a human toddler. Chubby
> green body, cream belly, oversized round head, big mismatched googly eyes
> (near eye bigger than far eye), tiny cream horn nubs, small orange back
> spikes, tiny useless orange wings, short tail with an orange spade tip.
> Wearing a white diaper with a gold safety pin and a light-blue pacifier.
> Around his neck an adult man's blue necktie with yellow diagonal stripes,
> far too long, trailing on the floor behind him. Rosy cheeks, innocent and
> funny. 1990s 16-bit SNES style, clean dark outlines, limited palette,
> centred, feet touching the bottom edge, transparent background, square canvas.

### Tero — idle, 8-frame sprite sheet
> Same baby dragon character, same style and colours. Horizontal sprite sheet,
> 8 square frames in one row, no gaps, transparent background. Idle breathing
> loop: belly rises and falls by a couple of pixels, frame 5 he blinks, frames
> 7–8 a tiny puff of smoke from his nostril. Character stays in exactly the
> same position and size in every frame, feet on the bottom edge.

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
