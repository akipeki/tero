# WHERE IS DADA? — sprite prompts (text only: Tero and Elvis)

12 sprite jobs for an image AI. Every job is one PNG file. Only Tero's animations and Elvis, the office dog he rides. Everything else is in ART_PROMPTS_without_Tero.md.

## Instructions for the image AI (read this first)

You are making the sprites for a 1993-style pixel-art platformer.
If I also attached **ART_MOOD.md**, read it first: it describes how the game should feel. If it ever disagrees with a job's prompt, the prompt wins.
Work through the jobs below **one at a time, in order, starting with Job 1**.

For each job:

1. Create **one image** from the job's **Prompt**, exactly as written.
2. Match the job's **Size**: the frame count, frame size, total strip size and frame order. Frames sit side by side in ONE horizontal strip, touching, with no gaps, borders or labels.
3. Use a **truly transparent background**: no checkerboard, no floor and no shadow under the feet.
4. Below the image, write one line: `Job N done: <save as filename>`.
5. Then **go straight on to the next job** without waiting to be asked.

If you can only make one image per reply, end the reply with `NEXT: Job N+1`. When I write **continue**, do that job.

If you can't make the exact pixel size, make it at an exact whole multiple (2×, 4× or 8×) and say which one. Keep the frames evenly spaced so I can scale it down.

**No reference image is needed.** Job 1 (Idle) creates Tero from the written description, and that idle strip becomes his reference: every later Tero job must match it exactly (same design, colours and pixel size). Never redesign him. If we continue in a new chat, I will attach the Job 1 idle strip again. Elvis (the last job) needs no reference, but make him big enough for Tero (about 44 px tall) to sit on his back.

**Style for every non-Tero job:** Pixel art game sprite, SNES-era style, transparent background, 1-pixel dark outline, soft 3-tone shading, no anti-aliasing against the background, clean readable silhouette, side view.

---


## 1 · TERO

Tero is a two-year-old HUMAN BABY in a green dragon costume, not a real dragon. Every frame is 64×64. He is about 44 px tall; his feet are on y = 61–62 and his body is centred near x = 32. Job 1 (Idle) sets his look; every later job uses that idle strip as its reference.

### Job 1 of 12: Idle

- **Save as:** `public/sprites/player/idle.png`
- **Size:** 8 frames of 64×64, as one strip **512×64**
- **Frame order:** idle0, idle1, idle2, idle3, idle4, idle5, idle6, idle7
- **What it is:** Standing still, breathing. Breathing bob over the 8 frames, one blink, a small tail sway, and two frames where he chews on the pacifier.

**Prompt:**

```text
Create EIGHT frames of an IDLE breathing loop of Tero, the hero of a 1993 pixel-art platformer. This sets his look for every later animation, so follow the description exactly. Tero is a cute two-year-old HUMAN BABY dressed in a green dinosaur/dragon costume, not an actual dragon: exposed peach face in a round oversized dragon hood, rounded head, a big eye and a smaller far eye in the right-facing side view, a short costume snout, two cream horn nubs, an orange crest, tiny orange wing nubs, a cream ROUND BELLY PANEL with a dark ZIPPER and pull, a white cloth diaper with a gold safety pin, short legs with big floppy three-toed footie feet, a short padded green tail with an orange arrow tip, and a light-blue pacifier. Mandatory base colors: green costume #84cc64, orange costume parts #f88004, human face #fcd4ac, cream belly #f6e7b2, outline #1e2a2b. Poses only: eight adjacent frames of a calm standing idle loop facing RIGHT: a gentle breathing bob (belly panel rises and falls), one blink in frames 5–6, a small tail sway, pacifier in the mouth, chewing it in two frames. Feet stay planted on the same baseline in every frame. Keep his human face, the round hood silhouette and the costume exactly the same in every frame, no redesign. Intended export: exact 512x64 transparent PNG: EIGHT touching 64x64 cells horizontally, centered at a matching horizontal anchor, no clipping anywhere. Very chunky native 64px SNES sprite pixel art, crisp obvious square pixel clusters, strong ONE native pixel #1e2a2b outline, three-tone solid shading clusters. NO antialiasing, gradients, blur, painterly texture, tiny details, text or cell borders. TRUE TRANSPARENT RGBA background, NO checkerboard pattern or other background, no ground. Output only the sprites.
```

When this image is done, start **Job 2**.

---

### Job 2 of 12: Walk

- **Save as:** `public/sprites/player/walk.png`
- **Size:** 8 frames of 64×64, as one strip **512×64**
- **Frame order:** walk0, walk1, walk2, walk3, walk4, walk5, walk6, walk7
- **What it is:** A toddler waddle. Side-to-side sway, big lifted steps, arms swinging opposite the legs, the costume tail bouncing. Contact (foot down) on frames 0 and 4. A 4-frame walk also works (256×64).

**Prompt:**

```text
Create EIGHT frames of a WALK cycle of Tero: the same character as in the idle strip from Job 1. Use that idle strip as the reference for his design, colours and pixel size only, not for the pose. Keep the low-resolution chunky pixel density. Tero is a cute two-year-old HUMAN BABY dressed in a green dinosaur/dragon costume, not an actual dragon: exposed peach face in a round oversized dragon hood, rounded head, a big eye and a smaller far eye in the right-facing side view, a short costume snout, two cream horn nubs, an orange crest, tiny orange wing nubs, a cream ROUND BELLY PANEL with a dark ZIPPER and pull, a white cloth diaper with a gold safety pin, short legs with big floppy three-toed footie feet, a short padded green tail with an orange arrow tip, and a light-blue pacifier. Mandatory base colors: green costume #84cc64, orange costume parts #f88004, human face #fcd4ac, cream belly #f6e7b2, outline #1e2a2b. Match the highlight and shadow colours of the Job 1 idle strip. Poses only: eight adjacent frames of a toddler waddle walk cycle facing RIGHT: side-to-side sway, big lifted steps with the floppy footie feet, arms swinging opposite the legs, the padded tail bouncing. Front foot touches down in frames 1 and 5. Same baseline in every frame. Keep his human face, the round hood silhouette and the costume exactly the same in every frame, no redesign. Intended export: exact 512x64 transparent PNG: EIGHT touching 64x64 cells horizontally, centered at a matching horizontal anchor, no clipping anywhere. Very chunky native 64px SNES sprite pixel art, crisp obvious square pixel clusters, strong ONE native pixel #1e2a2b outline, three-tone solid shading clusters. NO antialiasing, gradients, blur, painterly texture, tiny details, text or cell borders. TRUE TRANSPARENT RGBA background, NO checkerboard pattern or other background, no ground. Output only the sprites, not the reference.
```

When this image is done, start **Job 3**.

---

### Job 3 of 12: Jump

- **Save as:** `public/sprites/player/jump.png`
- **Size:** 2 frames of 64×64, as one strip **128×64**
- **Frame order:** jump0, jump1
- **What it is:** Going up. Both arms raised, open happy mouth, wide excited eyes, wing nubs lifted, the pacifier popping out in front of his mouth.

**Prompt:**

```text
Create TWO frames of an upward JUMP sprite animation of Tero: the same character as in the idle strip from Job 1. Use that idle strip as the reference for his design, colours and pixel size only, not for the pose. Keep the low-resolution chunky pixel density. Tero is a cute two-year-old HUMAN BABY dressed in green dinosaur/dragon costume, exposed peach face in round oversized dragon hood, not an actual dragon. Rounded head, wide excited big eye and smaller far eye if visible in right-facing side view, short costume snout, two cream horn nubs, orange crest, tiny orange wing nubs, cream ROUND BELLY PANEL with dark ZIPPER and pull, white cloth diaper with gold safety pin, short legs and big floppy three-toed footie feet, short padded green tail with orange arrow tip. Mandatory base colors green costume #84cc64, orange costume parts #f88004, human face #fcd4ac, cream belly #f6e7b2, outline #1e2a2b. Match the highlight and shadow colours of the Job 1 idle strip. Poses only: two adjacent frames, frame1 early upward jump, frame2 higher upward jump with knees more tucked. Facing RIGHT in side view in both. Both arms raised overhead, open happy mouth and wide excited eyes, orange wing nubs lifted, feet lifted off ground. Light-blue pacifier POPS OUT and is airborne just in front of open mouth, distinct from mouth, within each cell. Keep his human face, the round hood silhouette and the costume exactly the same in every frame, no redesign. Intended export exact128x64 transparent PNG: TWO touching64x64 cells horizontally, centered at matching horizontal anchor, character slightly smaller within cell only to leave headroom for arms, no clipping anywhere. All airborne pacifier/tail parts inside each cell. Very chunky native64px SNES sprite pixel art, crisp obvious square pixel clusters, strong ONE native pixel #1e2a2b outline, three-tone solid shading clusters. NO antialiasing, gradients, blur, painterly texture, tiny details, text or cell borders. TRUE TRANSPARENT RGBA background, NO checkerboard pattern or other background, no ground. Output only the two sprites, not the reference.
```

When this image is done, start **Job 4**.

---

### Job 4 of 12: Fall

- **Save as:** `public/sprites/player/fall.png`
- **Size:** 2 frames of 64×64, as one strip **128×64**
- **Frame order:** fall0, fall1
- **What it is:** Coming down. "Oh no" face (mouth an O), arms flailing, the hood's horns and the tail flipped up by the air.

**Prompt:**

```text
Create TWO frames of a FALLING sprite animation of Tero: the same character as in the idle strip from Job 1. Use that idle strip as the reference for his design, colours and pixel size only, not for the pose. Keep the low-resolution chunky pixel density. Tero is a cute two-year-old HUMAN BABY dressed in a green dinosaur/dragon costume, not an actual dragon: exposed peach face in a round oversized dragon hood, rounded head, a big eye and a smaller far eye in the right-facing side view, a short costume snout, two cream horn nubs, an orange crest, tiny orange wing nubs, a cream ROUND BELLY PANEL with a dark ZIPPER and pull, a white cloth diaper with a gold safety pin, short legs with big floppy three-toed footie feet, a short padded green tail with an orange arrow tip, and a light-blue pacifier. Mandatory base colors: green costume #84cc64, orange costume parts #f88004, human face #fcd4ac, cream belly #f6e7b2, outline #1e2a2b. Match the highlight and shadow colours of the Job 1 idle strip. Poses only: two adjacent frames of falling facing RIGHT: an "oh no" face with a round O mouth and worried wide eyes, both arms flailing up and out (different arm positions in the two frames), legs dangling, the padded tail flipped up by the air. Pacifier still in the mouth or just popped out in front of it. Keep his human face, the round hood silhouette and the costume exactly the same in every frame, no redesign. Intended export: exact 128x64 transparent PNG: TWO touching 64x64 cells horizontally, centered at a matching horizontal anchor, no clipping anywhere. Very chunky native 64px SNES sprite pixel art, crisp obvious square pixel clusters, strong ONE native pixel #1e2a2b outline, three-tone solid shading clusters. NO antialiasing, gradients, blur, painterly texture, tiny details, text or cell borders. TRUE TRANSPARENT RGBA background, NO checkerboard pattern or other background, no ground. Output only the sprites, not the reference.
```

When this image is done, start **Job 5**.

---

### Job 5 of 12: Duck

- **Save as:** `public/sprites/player/duck.png`
- **Size:** 1 frame of 64×64, as one strip **64×64**
- **Frame order:** duck
- **What it is:** Crouching. When he stays still, the game turns this into the cardboard box. Squashed down, eyes squeezed shut, arms over his hood.

**Prompt:**

```text
Create ONE frame of a DUCKING sprite of Tero: the same character as in the idle strip from Job 1. Use that idle strip as the reference for his design, colours and pixel size only, not for the pose. Keep the low-resolution chunky pixel density. Tero is a cute two-year-old HUMAN BABY dressed in a green dinosaur/dragon costume, not an actual dragon: exposed peach face in a round oversized dragon hood, rounded head, a big eye and a smaller far eye in the right-facing side view, a short costume snout, two cream horn nubs, an orange crest, tiny orange wing nubs, a cream ROUND BELLY PANEL with a dark ZIPPER and pull, a white cloth diaper with a gold safety pin, short legs with big floppy three-toed footie feet, a short padded green tail with an orange arrow tip, and a light-blue pacifier. Mandatory base colors: green costume #84cc64, orange costume parts #f88004, human face #fcd4ac, cream belly #f6e7b2, outline #1e2a2b. Match the highlight and shadow colours of the Job 1 idle strip. Poses only: a single frame facing RIGHT: crouched low and squashed down, eyes squeezed shut, both arms over the hood, tail curled on the ground. Keep his human face, the round hood silhouette and the costume exactly the same in every frame, no redesign. Intended export: exact 64x64 transparent PNG: ONE touching 64x64 cell, centered, no clipping anywhere. Very chunky native 64px SNES sprite pixel art, crisp obvious square pixel clusters, strong ONE native pixel #1e2a2b outline, three-tone solid shading clusters. NO antialiasing, gradients, blur, painterly texture, tiny details, text or cell borders. TRUE TRANSPARENT RGBA background, NO checkerboard pattern or other background, no ground. Output only the sprite, not the reference.
```

When this image is done, start **Job 6**.

---

### Job 6 of 12: Hurt

- **Save as:** `public/sprites/player/hurt.png`
- **Size:** 2 frames of 64×64, as one strip **128×64**
- **Frame order:** hurt0, hurt1
- **What it is:** Taking a hit. Recoil left/right, eyes squeezed, mouth an O.

**Prompt:**

```text
Create TWO frames of a HURT sprite animation of Tero: the same character as in the idle strip from Job 1. Use that idle strip as the reference for his design, colours and pixel size only, not for the pose. Keep the low-resolution chunky pixel density. Tero is a cute two-year-old HUMAN BABY dressed in a green dinosaur/dragon costume, not an actual dragon: exposed peach face in a round oversized dragon hood, rounded head, a big eye and a smaller far eye in the right-facing side view, a short costume snout, two cream horn nubs, an orange crest, tiny orange wing nubs, a cream ROUND BELLY PANEL with a dark ZIPPER and pull, a white cloth diaper with a gold safety pin, short legs with big floppy three-toed footie feet, a short padded green tail with an orange arrow tip, and a light-blue pacifier. Mandatory base colors: green costume #84cc64, orange costume parts #f88004, human face #fcd4ac, cream belly #f6e7b2, outline #1e2a2b. Match the highlight and shadow colours of the Job 1 idle strip. Poses only: two adjacent frames facing RIGHT: knocked backwards by a hit, eyes squeezed shut, mouth an O, arms thrown out; frame2 leans back further than frame1. Feet on the same baseline. Keep his human face, the round hood silhouette and the costume exactly the same in every frame, no redesign. Intended export: exact 128x64 transparent PNG: TWO touching 64x64 cells horizontally, centered at a matching horizontal anchor, no clipping anywhere. Very chunky native 64px SNES sprite pixel art, crisp obvious square pixel clusters, strong ONE native pixel #1e2a2b outline, three-tone solid shading clusters. NO antialiasing, gradients, blur, painterly texture, tiny details, text or cell borders. TRUE TRANSPARENT RGBA background, NO checkerboard pattern or other background, no ground. Output only the sprites, not the reference.
```

When this image is done, start **Job 7**.

---

### Job 7 of 12: Lose

- **Save as:** `public/sprites/player/lose.png`
- **Size:** 1 frame of 64×64, as one strip **64×64**
- **Frame order:** lose
- **What it is:** Knocked out (game over). Dizzy X eyes, tongue out, flopped on his bottom. Cartoon, not scary.

**Prompt:**

```text
Create ONE frame of a KNOCKED-OUT sprite of Tero: the same character as in the idle strip from Job 1. Use that idle strip as the reference for his design, colours and pixel size only, not for the pose. Keep the low-resolution chunky pixel density. Tero is a cute two-year-old HUMAN BABY dressed in a green dinosaur/dragon costume, not an actual dragon: exposed peach face in a round oversized dragon hood, rounded head, a big eye and a smaller far eye in the right-facing side view, a short costume snout, two cream horn nubs, an orange crest, tiny orange wing nubs, a cream ROUND BELLY PANEL with a dark ZIPPER and pull, a white cloth diaper with a gold safety pin, short legs with big floppy three-toed footie feet, a short padded green tail with an orange arrow tip, and a light-blue pacifier. Mandatory base colors: green costume #84cc64, orange costume parts #f88004, human face #fcd4ac, cream belly #f6e7b2, outline #1e2a2b. Match the highlight and shadow colours of the Job 1 idle strip. Poses only: a single cartoon frame facing RIGHT: sitting flopped on his bottom, dizzy X eyes, tongue out, pacifier on the floor beside him. Cute, not scary. Keep his human face, the round hood silhouette and the costume exactly the same in every frame, no redesign. Intended export: exact 64x64 transparent PNG: ONE touching 64x64 cell, centered, no clipping anywhere. Very chunky native 64px SNES sprite pixel art, crisp obvious square pixel clusters, strong ONE native pixel #1e2a2b outline, three-tone solid shading clusters. NO antialiasing, gradients, blur, painterly texture, tiny details, text or cell borders. TRUE TRANSPARENT RGBA background, NO checkerboard pattern or other background, no ground. Output only the sprite, not the reference.
```

When this image is done, start **Job 8**.

---

### Job 8 of 12: Win

- **Save as:** `public/sprites/player/win.png`
- **Size:** 4 frames of 64×64, as one strip **256×64**
- **Frame order:** win0, win1, win2, win3
- **What it is:** Cheering at the end of a floor. Happy closed eyes, mouth open, arms up, a little hop.

**Prompt:**

```text
Create FOUR frames of a CHEERING sprite animation of Tero: the same character as in the idle strip from Job 1. Use that idle strip as the reference for his design, colours and pixel size only, not for the pose. Keep the low-resolution chunky pixel density. Tero is a cute two-year-old HUMAN BABY dressed in a green dinosaur/dragon costume, not an actual dragon: exposed peach face in a round oversized dragon hood, rounded head, a big eye and a smaller far eye in the right-facing side view, a short costume snout, two cream horn nubs, an orange crest, tiny orange wing nubs, a cream ROUND BELLY PANEL with a dark ZIPPER and pull, a white cloth diaper with a gold safety pin, short legs with big floppy three-toed footie feet, a short padded green tail with an orange arrow tip, and a light-blue pacifier. Mandatory base colors: green costume #84cc64, orange costume parts #f88004, human face #fcd4ac, cream belly #f6e7b2, outline #1e2a2b. Match the highlight and shadow colours of the Job 1 idle strip. Poses only: four adjacent frames facing RIGHT: happy closed eyes, wide open smiling mouth, both arms up; a little hop where frames 2–3 lift off the ground and frames 1 and 4 are on the baseline. Keep his human face, the round hood silhouette and the costume exactly the same in every frame, no redesign. Intended export: exact 256x64 transparent PNG: FOUR touching 64x64 cells horizontally, centered at a matching horizontal anchor, no clipping anywhere. Very chunky native 64px SNES sprite pixel art, crisp obvious square pixel clusters, strong ONE native pixel #1e2a2b outline, three-tone solid shading clusters. NO antialiasing, gradients, blur, painterly texture, tiny details, text or cell borders. TRUE TRANSPARENT RGBA background, NO checkerboard pattern or other background, no ground. Output only the sprites, not the reference.
```

When this image is done, start **Job 9**.

---

### Job 9 of 12: Fire breath

- **Save as:** `public/sprites/player/breathe.png`
- **Size:** 2 frames of 64×64, as one strip **128×64**
- **Frame order:** breathe0, breathe1
- **What it is:** Puffs and tantrums. The game draws the flames itself, starting in front of the mouth at about x = 56, y = 36. Head thrust forward, mouth wide open in a tantrum scream, eyes squeezed and furious, wing nubs up, tail stiff. The pacifier is out.

**Prompt:**

```text
Create TWO frames of a TANTRUM ROAR sprite animation of Tero: the same character as in the idle strip from Job 1. Use that idle strip as the reference for his design, colours and pixel size only, not for the pose. Keep the low-resolution chunky pixel density. Tero is a cute two-year-old HUMAN BABY dressed in a green dinosaur/dragon costume, not an actual dragon: exposed peach face in a round oversized dragon hood, rounded head, a big eye and a smaller far eye in the right-facing side view, a short costume snout, two cream horn nubs, an orange crest, tiny orange wing nubs, a cream ROUND BELLY PANEL with a dark ZIPPER and pull, a white cloth diaper with a gold safety pin, short legs with big floppy three-toed footie feet, a short padded green tail with an orange arrow tip, and a light-blue pacifier. Mandatory base colors: green costume #84cc64, orange costume parts #f88004, human face #fcd4ac, cream belly #f6e7b2, outline #1e2a2b. Match the highlight and shadow colours of the Job 1 idle strip. Poses only: two adjacent frames facing RIGHT: a furious toddler tantrum roar, head and hood thrust forward, mouth wide open with the mouth opening at about x=56 y=36 of each cell, eyes squeezed shut and furious, fists clenched, wing nubs up, tail stiff. No pacifier. Do NOT draw any fire: the game adds it. Keep his human face, the round hood silhouette and the costume exactly the same in every frame, no redesign. Intended export: exact 128x64 transparent PNG: TWO touching 64x64 cells horizontally, centered at a matching horizontal anchor, no clipping anywhere. Very chunky native 64px SNES sprite pixel art, crisp obvious square pixel clusters, strong ONE native pixel #1e2a2b outline, three-tone solid shading clusters. NO antialiasing, gradients, blur, painterly texture, tiny details, text or cell borders. TRUE TRANSPARENT RGBA background, NO checkerboard pattern or other background, no ground. Output only the sprites, not the reference.
```

When this image is done, start **Job 10**.

---

### Job 10 of 12: Glide

- **Save as:** `public/sprites/player/glide.png`
- **Size:** 2 frames of 64×64, as one strip **128×64**
- **Frame order:** glide0, glide1
- **What it is:** Hanging from the golden parachute (Floor 30). The canopy is drawn above him by the game. Both arms straight up gripping strings, footie feet dangling, a happy face.

**Prompt:**

```text
Create TWO frames of a PARACHUTE GLIDE sprite animation of Tero: the same character as in the idle strip from Job 1. Use that idle strip as the reference for his design, colours and pixel size only, not for the pose. Keep the low-resolution chunky pixel density. Tero is a cute two-year-old HUMAN BABY dressed in a green dinosaur/dragon costume, not an actual dragon: exposed peach face in a round oversized dragon hood, rounded head, a big eye and a smaller far eye in the right-facing side view, a short costume snout, two cream horn nubs, an orange crest, tiny orange wing nubs, a cream ROUND BELLY PANEL with a dark ZIPPER and pull, a white cloth diaper with a gold safety pin, short legs with big floppy three-toed footie feet, a short padded green tail with an orange arrow tip, and a light-blue pacifier. Mandatory base colors: green costume #84cc64, orange costume parts #f88004, human face #fcd4ac, cream belly #f6e7b2, outline #1e2a2b. Match the highlight and shadow colours of the Job 1 idle strip. Poses only: two adjacent frames facing RIGHT: floating down, both arms straight up gripping two thin strings that leave the top of the cell, footie feet dangling and swinging slightly between frames, happy face. Do NOT draw the parachute: the game adds it. Keep his human face, the round hood silhouette and the costume exactly the same in every frame, no redesign. Intended export: exact 128x64 transparent PNG: TWO touching 64x64 cells horizontally, centered at a matching horizontal anchor, no clipping anywhere. Very chunky native 64px SNES sprite pixel art, crisp obvious square pixel clusters, strong ONE native pixel #1e2a2b outline, three-tone solid shading clusters. NO antialiasing, gradients, blur, painterly texture, tiny details, text or cell borders. TRUE TRANSPARENT RGBA background, NO checkerboard pattern or other background, no ground. Output only the sprites, not the reference.
```

When this image is done, start **Job 11**.

---

### Job 11 of 12: Riding Elvis

- **Save as:** `public/sprites/player/ride.png`
- **Size:** 2 frames of 64×64, as one strip **128×64**
- **Frame order:** ride0, ride1
- **What it is:** Riding Elvis the office dog (The Vents). Tero only: the game draws him on top of Elvis, whose own run, jump and yelp frames keep playing underneath. Sitting astride, legs bent forward around the dog's back, both hands gripping the neck fur, a huge grin. Frame 1 sits down, frame 2 bounces up on the gallop (also used in the air). Keep his feet on the usual baseline: the game puts that line on the dog's back.

**Prompt:**

```text
Create TWO frames of a RIDING sprite animation of Tero: the same character as in the idle strip from Job 1. Use that idle strip as the reference for his design, colours and pixel size only, not for the pose. Keep the low-resolution chunky pixel density. Tero is a cute two-year-old HUMAN BABY dressed in a green dinosaur/dragon costume, not an actual dragon: exposed peach face in a round oversized dragon hood, rounded head, a big eye and a smaller far eye in the right-facing side view, a short costume snout, two cream horn nubs, an orange crest, tiny orange wing nubs, a cream ROUND BELLY PANEL with a dark ZIPPER and pull, a white cloth diaper with a gold safety pin, short legs with big floppy three-toed footie feet, a short padded green tail with an orange arrow tip, and a light-blue pacifier. Mandatory base colors: green costume #84cc64, orange costume parts #f88004, human face #fcd4ac, cream belly #f6e7b2, outline #1e2a2b. Match the highlight and shadow colours of the Job 1 idle strip. Poses only: two adjacent frames facing RIGHT of Tero sitting astride an invisible big dog: knees bent and legs forward around its back, the near floppy footie foot hanging down, both hands reaching forward gripping neck fur, leaning forward with a huge open-mouth grin (pacifier out). Frame 1 seated low; frame 2 bounced up about 2 px with the hood horns, crest and padded tail flying back. Do NOT draw the dog or a saddle: the game draws Tero on top of the dog. The lowest pixels (the dangling foot) sit on the same baseline as every other Tero frame. Keep his human face, the round hood silhouette and the costume exactly the same in every frame, no redesign. Intended export: exact 128x64 transparent PNG: TWO touching 64x64 cells horizontally, centered at a matching horizontal anchor, no clipping anywhere. Very chunky native 64px SNES sprite pixel art, crisp obvious square pixel clusters, strong ONE native pixel #1e2a2b outline, three-tone solid shading clusters. NO antialiasing, gradients, blur, painterly texture, tiny details, text or cell borders. TRUE TRANSPARENT RGBA background, NO checkerboard pattern or other background, no ground. Output only the sprites, not the reference.
```

When this image is done, start **Job 12**.

---


## 2 · ELVIS

The office dog Tero rides in the vents. An art slot: draw exactly the frames listed, in this order, at exactly this size. Tero's riding frames are drawn on top of him by the game, so leave his back flat and empty.

### Job 12 of 12: Elvis the office dog

- **Save as:** `public/sprites/art/elvis.png`
- **Size:** 7 frames of 84×56, as one strip **588×56**
- **Frame order:** run0, run1, run2, run3, sit, jump, yelp
- **What it is:** The Vents: the abandoned office dog Tero rides. A big, kind golden dog with an old CHIEF HAPPINESS OFFICER badge on his collar. Tero sits on his back about 26 px above the paws, roughly in the middle, so leave a flat back there. run0–3 = gallop, sit = waiting and wagging, jump = leap, yelp = bumped.

**Prompt:**

```text
Pixel art game sprite, SNES-era style, transparent background, 1-pixel dark outline, soft 3-tone shading, no anti-aliasing against the background, clean readable silhouette, side view. A big friendly golden office dog with floppy ears and a red collar carrying an old CHIEF HAPPINESS OFFICER badge, slightly scruffy from living in air vents but happy, facing right, paws on the bottom edge, with a flat back where a small rider sits. 7 frames as a horizontal strip 588×56 (each 84×56): 4-frame gallop, sitting and wagging, jumping, yelping when bumped. Outline #1b1620.
```

**That was the last job.** List every file you made, with its job number.

---
