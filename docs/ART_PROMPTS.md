# WHERE IS DADA? — sprite prompts (text only)

35 sprite jobs for an image AI. Every job is one PNG file.

## Instructions for the image AI (read this first)

You are making the sprites for a 1993-style pixel-art platformer.
Work through the jobs below **one at a time, in order, starting with Job 1**.

For each job:

1. Create **one image** from the job's **Prompt**, exactly as written.
2. Match the job's **Size**: the frame count, frame size, total strip size and frame order. Frames sit side by side in ONE horizontal strip, touching, with no gaps, borders or labels.
3. Use a **truly transparent background**: no checkerboard, no floor and no shadow under the feet.
4. Below the image, write one line: `Job N done: <save as filename>`.
5. Then **go straight on to the next job** without waiting to be asked.

If you can only make one image per reply, end the reply with `NEXT: Job N+1`. When I write **continue**, do that job.

If you can't make the exact pixel size, make it at an exact whole multiple (2×, 4× or 8×) and say which one. Keep the frames evenly spaced so I can scale it down.

**Reference images.** Tero's jobs refer to **T1**: the approved single Tero idle frame I attach at the start. Use T1 as the character reference for every Tero job, and use the finished Tero idle and walk strips (Jobs 1–2) as extra references for the later Tero jobs. Never redesign him.

**Style for every non-Tero job:** Pixel art game sprite, SNES-era style, transparent background, 1-pixel dark outline, soft 3-tone shading, no anti-aliasing against the background, clean readable silhouette, side view.

---


## 1 · TERO

Priority 1. Tero is a two-year-old HUMAN BABY in a green dragon costume, not a real dragon. Every frame is 64×64. He is about 44 px tall; his feet are on y = 61–62 and his body is centred near x = 32. Once you have an approved idle frame (T1), give it and the walk strip to the image AI as references for every other animation.

### Job 1 of 35: Idle

- **Save as:** `public/sprites/player/idle.png`
- **Size:** 8 frames of 64×64, as one strip **512×64**
- **Frame order:** idle0, idle1, idle2, idle3, idle4, idle5, idle6, idle7
- **What it is:** Standing still, breathing. Breathing bob over the 8 frames, one blink, a small tail sway, and two frames where he chews on the pacifier.

**Prompt:**

```text
Use case: identity-preserve. Create EIGHT frames of an IDLE breathing loop of EXACTLY the approved Tero [T1] idle frame. The references show appearance and style, not poses to reproduce. Keep the exact character and the low-resolution chunky pixel density. Tero is a cute two-year-old HUMAN BABY dressed in a green dinosaur/dragon costume, not an actual dragon: exposed peach face in a round oversized dragon hood, rounded head, a big eye and a smaller far eye in the right-facing side view, a short costume snout, two cream horn nubs, an orange crest, tiny orange wing nubs, a cream ROUND BELLY PANEL with a dark ZIPPER and pull exactly as T1, a white cloth diaper with a gold safety pin, short legs with big floppy three-toed footie feet, a short padded green tail with an orange arrow tip, and a light-blue pacifier. Mandatory base colors: green costume #84cc64, orange costume parts #f88004, human face #fcd4ac, cream belly #f6e7b2, outline #1e2a2b. Match the reference highlight and shadow colors. Poses only: eight adjacent frames of a calm standing idle loop facing RIGHT: a gentle breathing bob (belly panel rises and falls), one blink in frames 5–6, a small tail sway, pacifier in the mouth, chewing it in two frames. Feet stay planted on the same baseline in every frame. Preserve the T1 human face, the round hood silhouette and the recognizable costume, no redesign. Intended export: exact 512x64 transparent PNG: EIGHT touching 64x64 cells horizontally, centered at a matching horizontal anchor, no clipping anywhere. Very chunky native 64px SNES sprite pixel art, crisp obvious square pixel clusters, strong ONE native pixel #1e2a2b outline, three-tone solid shading clusters. NO antialiasing, gradients, blur, painterly texture, tiny details, text or cell borders. TRUE TRANSPARENT RGBA background, NO checkerboard pattern or other background, no ground. Output only the sprites, not the reference strips.
```

When this image is done, start **Job 2**.

---

### Job 2 of 35: Walk

- **Save as:** `public/sprites/player/walk.png`
- **Size:** 8 frames of 64×64, as one strip **512×64**
- **Frame order:** walk0, walk1, walk2, walk3, walk4, walk5, walk6, walk7
- **What it is:** A toddler waddle. Side-to-side sway, big lifted steps, arms swinging opposite the legs, the costume tail bouncing. Contact (foot down) on frames 0 and 4. A 4-frame walk also works (256×64).

**Prompt:**

```text
Use case: identity-preserve. Create EIGHT frames of a WALK cycle of EXACTLY the approved Tero [T1] idle frame. The references show appearance and style, not poses to reproduce. Keep the exact character and the low-resolution chunky pixel density. Tero is a cute two-year-old HUMAN BABY dressed in a green dinosaur/dragon costume, not an actual dragon: exposed peach face in a round oversized dragon hood, rounded head, a big eye and a smaller far eye in the right-facing side view, a short costume snout, two cream horn nubs, an orange crest, tiny orange wing nubs, a cream ROUND BELLY PANEL with a dark ZIPPER and pull exactly as T1, a white cloth diaper with a gold safety pin, short legs with big floppy three-toed footie feet, a short padded green tail with an orange arrow tip, and a light-blue pacifier. Mandatory base colors: green costume #84cc64, orange costume parts #f88004, human face #fcd4ac, cream belly #f6e7b2, outline #1e2a2b. Match the reference highlight and shadow colors. Poses only: eight adjacent frames of a toddler waddle walk cycle facing RIGHT: side-to-side sway, big lifted steps with the floppy footie feet, arms swinging opposite the legs, the padded tail bouncing. Front foot touches down in frames 1 and 5. Same baseline in every frame. Preserve the T1 human face, the round hood silhouette and the recognizable costume, no redesign. Intended export: exact 512x64 transparent PNG: EIGHT touching 64x64 cells horizontally, centered at a matching horizontal anchor, no clipping anywhere. Very chunky native 64px SNES sprite pixel art, crisp obvious square pixel clusters, strong ONE native pixel #1e2a2b outline, three-tone solid shading clusters. NO antialiasing, gradients, blur, painterly texture, tiny details, text or cell borders. TRUE TRANSPARENT RGBA background, NO checkerboard pattern or other background, no ground. Output only the sprites, not the reference strips.
```

When this image is done, start **Job 3**.

---

### Job 3 of 35: Jump

- **Save as:** `public/sprites/player/jump.png`
- **Size:** 2 frames of 64×64, as one strip **128×64**
- **Frame order:** jump0, jump1
- **What it is:** Going up. Both arms raised, open happy mouth, wide excited eyes, wing nubs lifted, the pacifier popping out in front of his mouth.

**Prompt:**

```text
Use case: identity-preserve. Create TWO frames of an upward JUMP sprite animation of EXACTLY the approved Tero [T1] in the two supplied reference sprite sheets. Image1 idle and image2 walk are appearance/style references, not poses to reproduce. Keep exact character and low-resolution chunky pixel density. Tero is a cute two-year-old HUMAN BABY dressed in green dinosaur/dragon costume, exposed peach face in round oversized dragon hood, not an actual dragon. Rounded head, wide excited big eye and smaller far eye if visible in right-facing side view, short costume snout, two cream horn nubs, orange crest, tiny orange wing nubs, cream ROUND BELLY PANEL with dark ZIPPER and pull exactly as T1, white cloth diaper with gold safety pin, short legs and big floppy three-toed footie feet, short padded green tail with orange arrow tip. Mandatory base colors green costume #84cc64, orange costume parts #f88004, human face #fcd4ac, cream belly #f6e7b2, outline #1e2a2b. Match reference highlight and shadow colors. Poses only: two adjacent frames, frame1 early upward jump, frame2 higher upward jump with knees more tucked. Facing RIGHT in side view in both. Both arms raised overhead, open happy mouth and wide excited eyes, orange wing nubs lifted, feet lifted off ground. Light-blue pacifier POPS OUT and is airborne just in front of open mouth, distinct from mouth, within each cell. Preserve T1 human face, round hood silhouette and recognizable costume, no redesign. Intended export exact128x64 transparent PNG: TWO touching64x64 cells horizontally, centered at matching horizontal anchor, character slightly smaller within cell only to leave headroom for arms, no clipping anywhere. All airborne pacifier/tail parts inside each cell. Very chunky native64px SNES sprite pixel art, crisp obvious square pixel clusters, strong ONE native pixel #1e2a2b outline, three-tone solid shading clusters. NO antialiasing, gradients, blur, painterly texture, tiny details, text or cell borders. TRUE TRANSPARENT RGBA background, NO checkerboard pattern or other background, no ground. Output only the two sprites, not the reference idle or walk strips.
```

When this image is done, start **Job 4**.

---

### Job 4 of 35: Fall

- **Save as:** `public/sprites/player/fall.png`
- **Size:** 2 frames of 64×64, as one strip **128×64**
- **Frame order:** fall0, fall1
- **What it is:** Coming down. "Oh no" face (mouth an O), arms flailing, the hood's horns and the tail flipped up by the air.

**Prompt:**

```text
Use case: identity-preserve. Create TWO frames of a FALLING sprite animation of EXACTLY the approved Tero [T1] in the two supplied reference sprite sheets (idle and walk, appearance only, not poses). The references show appearance and style, not poses to reproduce. Keep the exact character and the low-resolution chunky pixel density. Tero is a cute two-year-old HUMAN BABY dressed in a green dinosaur/dragon costume, not an actual dragon: exposed peach face in a round oversized dragon hood, rounded head, a big eye and a smaller far eye in the right-facing side view, a short costume snout, two cream horn nubs, an orange crest, tiny orange wing nubs, a cream ROUND BELLY PANEL with a dark ZIPPER and pull exactly as T1, a white cloth diaper with a gold safety pin, short legs with big floppy three-toed footie feet, a short padded green tail with an orange arrow tip, and a light-blue pacifier. Mandatory base colors: green costume #84cc64, orange costume parts #f88004, human face #fcd4ac, cream belly #f6e7b2, outline #1e2a2b. Match the reference highlight and shadow colors. Poses only: two adjacent frames of falling facing RIGHT: an "oh no" face with a round O mouth and worried wide eyes, both arms flailing up and out (different arm positions in the two frames), legs dangling, the padded tail flipped up by the air. Pacifier still in the mouth or just popped out in front of it. Preserve the T1 human face, the round hood silhouette and the recognizable costume, no redesign. Intended export: exact 128x64 transparent PNG: TWO touching 64x64 cells horizontally, centered at a matching horizontal anchor, no clipping anywhere. Very chunky native 64px SNES sprite pixel art, crisp obvious square pixel clusters, strong ONE native pixel #1e2a2b outline, three-tone solid shading clusters. NO antialiasing, gradients, blur, painterly texture, tiny details, text or cell borders. TRUE TRANSPARENT RGBA background, NO checkerboard pattern or other background, no ground. Output only the sprites, not the reference strips.
```

When this image is done, start **Job 5**.

---

### Job 5 of 35: Duck

- **Save as:** `public/sprites/player/duck.png`
- **Size:** 1 frame of 64×64, as one strip **64×64**
- **Frame order:** duck
- **What it is:** Crouching. When he stays still, the game turns this into the cardboard box. Squashed down, eyes squeezed shut, arms over his hood.

**Prompt:**

```text
Use case: identity-preserve. Create ONE frame of a DUCKING sprite of EXACTLY the approved Tero [T1] in the supplied reference sprite sheets (appearance only). The references show appearance and style, not poses to reproduce. Keep the exact character and the low-resolution chunky pixel density. Tero is a cute two-year-old HUMAN BABY dressed in a green dinosaur/dragon costume, not an actual dragon: exposed peach face in a round oversized dragon hood, rounded head, a big eye and a smaller far eye in the right-facing side view, a short costume snout, two cream horn nubs, an orange crest, tiny orange wing nubs, a cream ROUND BELLY PANEL with a dark ZIPPER and pull exactly as T1, a white cloth diaper with a gold safety pin, short legs with big floppy three-toed footie feet, a short padded green tail with an orange arrow tip, and a light-blue pacifier. Mandatory base colors: green costume #84cc64, orange costume parts #f88004, human face #fcd4ac, cream belly #f6e7b2, outline #1e2a2b. Match the reference highlight and shadow colors. Poses only: a single frame facing RIGHT: crouched low and squashed down, eyes squeezed shut, both arms over the hood, tail curled on the ground. Preserve the T1 human face, the round hood silhouette and the recognizable costume, no redesign. Intended export: exact 64x64 transparent PNG: ONE touching 64x64 cell, centered, no clipping anywhere. Very chunky native 64px SNES sprite pixel art, crisp obvious square pixel clusters, strong ONE native pixel #1e2a2b outline, three-tone solid shading clusters. NO antialiasing, gradients, blur, painterly texture, tiny details, text or cell borders. TRUE TRANSPARENT RGBA background, NO checkerboard pattern or other background, no ground. Output only the sprite, not the reference strips.
```

When this image is done, start **Job 6**.

---

### Job 6 of 35: Hurt

- **Save as:** `public/sprites/player/hurt.png`
- **Size:** 2 frames of 64×64, as one strip **128×64**
- **Frame order:** hurt0, hurt1
- **What it is:** Taking a hit. Recoil left/right, eyes squeezed, mouth an O.

**Prompt:**

```text
Use case: identity-preserve. Create TWO frames of a HURT sprite animation of EXACTLY the approved Tero [T1] in the supplied reference sprite sheets (appearance only). The references show appearance and style, not poses to reproduce. Keep the exact character and the low-resolution chunky pixel density. Tero is a cute two-year-old HUMAN BABY dressed in a green dinosaur/dragon costume, not an actual dragon: exposed peach face in a round oversized dragon hood, rounded head, a big eye and a smaller far eye in the right-facing side view, a short costume snout, two cream horn nubs, an orange crest, tiny orange wing nubs, a cream ROUND BELLY PANEL with a dark ZIPPER and pull exactly as T1, a white cloth diaper with a gold safety pin, short legs with big floppy three-toed footie feet, a short padded green tail with an orange arrow tip, and a light-blue pacifier. Mandatory base colors: green costume #84cc64, orange costume parts #f88004, human face #fcd4ac, cream belly #f6e7b2, outline #1e2a2b. Match the reference highlight and shadow colors. Poses only: two adjacent frames facing RIGHT: knocked backwards by a hit, eyes squeezed shut, mouth an O, arms thrown out; frame2 leans back further than frame1. Feet on the same baseline. Preserve the T1 human face, the round hood silhouette and the recognizable costume, no redesign. Intended export: exact 128x64 transparent PNG: TWO touching 64x64 cells horizontally, centered at a matching horizontal anchor, no clipping anywhere. Very chunky native 64px SNES sprite pixel art, crisp obvious square pixel clusters, strong ONE native pixel #1e2a2b outline, three-tone solid shading clusters. NO antialiasing, gradients, blur, painterly texture, tiny details, text or cell borders. TRUE TRANSPARENT RGBA background, NO checkerboard pattern or other background, no ground. Output only the sprites, not the reference strips.
```

When this image is done, start **Job 7**.

---

### Job 7 of 35: Lose

- **Save as:** `public/sprites/player/lose.png`
- **Size:** 1 frame of 64×64, as one strip **64×64**
- **Frame order:** lose
- **What it is:** Knocked out (game over). Dizzy X eyes, tongue out, flopped on his bottom. Cartoon, not scary.

**Prompt:**

```text
Use case: identity-preserve. Create ONE frame of a KNOCKED-OUT sprite of EXACTLY the approved Tero [T1] in the supplied reference sprite sheets (appearance only). The references show appearance and style, not poses to reproduce. Keep the exact character and the low-resolution chunky pixel density. Tero is a cute two-year-old HUMAN BABY dressed in a green dinosaur/dragon costume, not an actual dragon: exposed peach face in a round oversized dragon hood, rounded head, a big eye and a smaller far eye in the right-facing side view, a short costume snout, two cream horn nubs, an orange crest, tiny orange wing nubs, a cream ROUND BELLY PANEL with a dark ZIPPER and pull exactly as T1, a white cloth diaper with a gold safety pin, short legs with big floppy three-toed footie feet, a short padded green tail with an orange arrow tip, and a light-blue pacifier. Mandatory base colors: green costume #84cc64, orange costume parts #f88004, human face #fcd4ac, cream belly #f6e7b2, outline #1e2a2b. Match the reference highlight and shadow colors. Poses only: a single cartoon frame facing RIGHT: sitting flopped on his bottom, dizzy X eyes, tongue out, pacifier on the floor beside him. Cute, not scary. Preserve the T1 human face, the round hood silhouette and the recognizable costume, no redesign. Intended export: exact 64x64 transparent PNG: ONE touching 64x64 cell, centered, no clipping anywhere. Very chunky native 64px SNES sprite pixel art, crisp obvious square pixel clusters, strong ONE native pixel #1e2a2b outline, three-tone solid shading clusters. NO antialiasing, gradients, blur, painterly texture, tiny details, text or cell borders. TRUE TRANSPARENT RGBA background, NO checkerboard pattern or other background, no ground. Output only the sprite, not the reference strips.
```

When this image is done, start **Job 8**.

---

### Job 8 of 35: Win

- **Save as:** `public/sprites/player/win.png`
- **Size:** 4 frames of 64×64, as one strip **256×64**
- **Frame order:** win0, win1, win2, win3
- **What it is:** Cheering at the end of a floor. Happy closed eyes, mouth open, arms up, a little hop.

**Prompt:**

```text
Use case: identity-preserve. Create FOUR frames of a CHEERING sprite animation of EXACTLY the approved Tero [T1] in the supplied reference sprite sheets (appearance only). The references show appearance and style, not poses to reproduce. Keep the exact character and the low-resolution chunky pixel density. Tero is a cute two-year-old HUMAN BABY dressed in a green dinosaur/dragon costume, not an actual dragon: exposed peach face in a round oversized dragon hood, rounded head, a big eye and a smaller far eye in the right-facing side view, a short costume snout, two cream horn nubs, an orange crest, tiny orange wing nubs, a cream ROUND BELLY PANEL with a dark ZIPPER and pull exactly as T1, a white cloth diaper with a gold safety pin, short legs with big floppy three-toed footie feet, a short padded green tail with an orange arrow tip, and a light-blue pacifier. Mandatory base colors: green costume #84cc64, orange costume parts #f88004, human face #fcd4ac, cream belly #f6e7b2, outline #1e2a2b. Match the reference highlight and shadow colors. Poses only: four adjacent frames facing RIGHT: happy closed eyes, wide open smiling mouth, both arms up; a little hop where frames 2–3 lift off the ground and frames 1 and 4 are on the baseline. Preserve the T1 human face, the round hood silhouette and the recognizable costume, no redesign. Intended export: exact 256x64 transparent PNG: FOUR touching 64x64 cells horizontally, centered at a matching horizontal anchor, no clipping anywhere. Very chunky native 64px SNES sprite pixel art, crisp obvious square pixel clusters, strong ONE native pixel #1e2a2b outline, three-tone solid shading clusters. NO antialiasing, gradients, blur, painterly texture, tiny details, text or cell borders. TRUE TRANSPARENT RGBA background, NO checkerboard pattern or other background, no ground. Output only the sprites, not the reference strips.
```

When this image is done, start **Job 9**.

---

### Job 9 of 35: Fire breath

- **Save as:** `public/sprites/player/breathe.png`
- **Size:** 2 frames of 64×64, as one strip **128×64**
- **Frame order:** breathe0, breathe1
- **What it is:** Puffs and tantrums. The game draws the flames itself, starting in front of the mouth at about x = 56, y = 36. Head thrust forward, mouth wide open in a tantrum scream, eyes squeezed and furious, wing nubs up, tail stiff. The pacifier is out.

**Prompt:**

```text
Use case: identity-preserve. Create TWO frames of a TANTRUM ROAR sprite animation of EXACTLY the approved Tero [T1] in the supplied reference sprite sheets (appearance only). The references show appearance and style, not poses to reproduce. Keep the exact character and the low-resolution chunky pixel density. Tero is a cute two-year-old HUMAN BABY dressed in a green dinosaur/dragon costume, not an actual dragon: exposed peach face in a round oversized dragon hood, rounded head, a big eye and a smaller far eye in the right-facing side view, a short costume snout, two cream horn nubs, an orange crest, tiny orange wing nubs, a cream ROUND BELLY PANEL with a dark ZIPPER and pull exactly as T1, a white cloth diaper with a gold safety pin, short legs with big floppy three-toed footie feet, a short padded green tail with an orange arrow tip, and a light-blue pacifier. Mandatory base colors: green costume #84cc64, orange costume parts #f88004, human face #fcd4ac, cream belly #f6e7b2, outline #1e2a2b. Match the reference highlight and shadow colors. Poses only: two adjacent frames facing RIGHT: a furious toddler tantrum roar, head and hood thrust forward, mouth wide open with the mouth opening at about x=56 y=36 of each cell, eyes squeezed shut and furious, fists clenched, wing nubs up, tail stiff. No pacifier. Do NOT draw any fire: the game adds it. Preserve the T1 human face, the round hood silhouette and the recognizable costume, no redesign. Intended export: exact 128x64 transparent PNG: TWO touching 64x64 cells horizontally, centered at a matching horizontal anchor, no clipping anywhere. Very chunky native 64px SNES sprite pixel art, crisp obvious square pixel clusters, strong ONE native pixel #1e2a2b outline, three-tone solid shading clusters. NO antialiasing, gradients, blur, painterly texture, tiny details, text or cell borders. TRUE TRANSPARENT RGBA background, NO checkerboard pattern or other background, no ground. Output only the sprites, not the reference strips.
```

When this image is done, start **Job 10**.

---

### Job 10 of 35: Glide

- **Save as:** `public/sprites/player/glide.png`
- **Size:** 2 frames of 64×64, as one strip **128×64**
- **Frame order:** glide0, glide1
- **What it is:** Hanging from the golden parachute (Floor 30). The canopy is drawn above him by the game. Both arms straight up gripping strings, footie feet dangling, a happy face.

**Prompt:**

```text
Use case: identity-preserve. Create TWO frames of a PARACHUTE GLIDE sprite animation of EXACTLY the approved Tero [T1] in the supplied reference sprite sheets (appearance only). The references show appearance and style, not poses to reproduce. Keep the exact character and the low-resolution chunky pixel density. Tero is a cute two-year-old HUMAN BABY dressed in a green dinosaur/dragon costume, not an actual dragon: exposed peach face in a round oversized dragon hood, rounded head, a big eye and a smaller far eye in the right-facing side view, a short costume snout, two cream horn nubs, an orange crest, tiny orange wing nubs, a cream ROUND BELLY PANEL with a dark ZIPPER and pull exactly as T1, a white cloth diaper with a gold safety pin, short legs with big floppy three-toed footie feet, a short padded green tail with an orange arrow tip, and a light-blue pacifier. Mandatory base colors: green costume #84cc64, orange costume parts #f88004, human face #fcd4ac, cream belly #f6e7b2, outline #1e2a2b. Match the reference highlight and shadow colors. Poses only: two adjacent frames facing RIGHT: floating down, both arms straight up gripping two thin strings that leave the top of the cell, footie feet dangling and swinging slightly between frames, happy face. Do NOT draw the parachute: the game adds it. Preserve the T1 human face, the round hood silhouette and the recognizable costume, no redesign. Intended export: exact 128x64 transparent PNG: TWO touching 64x64 cells horizontally, centered at a matching horizontal anchor, no clipping anywhere. Very chunky native 64px SNES sprite pixel art, crisp obvious square pixel clusters, strong ONE native pixel #1e2a2b outline, three-tone solid shading clusters. NO antialiasing, gradients, blur, painterly texture, tiny details, text or cell borders. TRUE TRANSPARENT RGBA background, NO checkerboard pattern or other background, no ground. Output only the sprites, not the reference strips.
```

When this image is done, start **Job 11**.

---

### Job 11 of 35: Dada

- **Save as:** `public/sprites/player/dad.png`
- **Size:** 1 frame of 64×64, as one strip **64×64**
- **Frame order:** dad
- **What it is:** Dad, found at the top of the tower. A grown HUMAN MAN in a dragon costume, the same costume idea as Tero's. Use your approved Tero frame (T1) as the style reference so father and son clearly match. Same costume, but faded and greyed out by six months at the office, worn over his work clothes: tired face, bags under his eyes, stubble, an office ID lanyard, a loosened necktie over the belly panel, a coffee stain. Standing slumped, much taller than Tero.

**Prompt:**

```text
Use case: identity-preserve (style). Create ONE frame of DADA, the father of the approved Tero [T1] in the supplied reference sprite sheets. The Tero references show the art style, pixel density and costume design only; Dada is a different, adult character. Dada is a tired adult HUMAN MAN dressed in a FADED dragon costume that matches his toddler son's: exposed tired human face #fcd4ac in a round dragon hood, two cream horn nubs, a short costume snout, a faded orange crest, a padded tail with a faded orange arrow tip, a cream ROUND BELLY PANEL with a dark ZIPPER and pull exactly like Tero's, big floppy three-toed footie feet. The costume is washed out and greyed by six months of office work: base green desaturated toward grey-green #8fa88a, orange parts dulled toward #c07a3a, belly #e6dcb8. Office details worn over the costume: an ID lanyard with a badge, a loosened dark necktie, a coffee stain on the belly panel. Heavy bags under his eyes, light stubble, a small tired smile. Pose: standing slumped, shoulders down, arms hanging, facing RIGHT in side view, feet on the bottom edge. About 56 px tall, so he is clearly a grown-up next to the 44 px tall Tero. Intended export exact 64x64 transparent PNG: ONE 64x64 cell, centered, no clipping anywhere. Very chunky native 64px SNES sprite pixel art, crisp obvious square pixel clusters, strong ONE native pixel #1e2a2b outline, three-tone solid shading clusters. NO antialiasing, gradients, blur, painterly texture, tiny details, text or cell borders. TRUE TRANSPARENT RGBA background, NO checkerboard pattern or other background, no ground. Output only the one sprite, not the reference strips.
```

When this image is done, start **Job 12**.

---


## 2 · BOSSES & ELVIS

Priority 2. These are art slots, so draw exactly the frames listed, in this order, at exactly this size.

### Job 12 of 35: Chad from Talent Acquisition

- **Save as:** `public/sprites/art/recruiter.png`
- **Size:** 5 frames of 40×48, as one strip **200×48**
- **Frame order:** walk0, walk1, throw, dash, hurt
- **What it is:** Floor 6 mini-boss: the recruiter who offers Tero the Junior Trainee Program. A pig in a slim-fit suit, TALENT lanyard, sunglasses pushed up on his head, a clipboard. walk0/walk1 = strut, throw = flinging a business card, dash = leaning forward charging, hurt = wince.

**Prompt:**

```text
Pixel art game sprite, SNES-era style, transparent background, 1-pixel dark outline, soft 3-tone shading, no anti-aliasing against the background, clean readable silhouette, side view. A smug corporate recruiter who is a pink pig, in a tight slim-fit navy suit, a TALENT lanyard, sunglasses pushed up on his head, holding a clipboard, facing right, feet on the bottom edge. 5 frames as a horizontal strip 200×48 (each 40×48): walk 1, walk 2, throwing a business card, dashing forward, hurt wince. Outline #1b1620.
```

When this image is done, start **Job 13**.

---

### Job 13 of 35: Mr. Halvorsen

- **Save as:** `public/sprites/art/halvorsen.png`
- **Size:** 5 frames of 40×60, as one strip **200×60**
- **Frame order:** walk0, walk1, present, throw, hurt
- **What it is:** Floor 12 boss: the PowerPoint presenter. Tall and gaunt, TED-talk headset mic, slicked combover, square glasses with red glowing pupils, navy pinstripe suit, a red tie down to his knees, a clicker in his hand. Keep his skin exactly #a8b394 / #c9d1b4 / #76826a and eyes #ff4848: the game swaps them for warm skin when he is freed.

**Prompt:**

```text
Pixel art game sprite, SNES-era style, transparent background, 1-pixel dark outline, soft 3-tone shading, no anti-aliasing against the background, clean readable silhouette, side view. A tall gaunt zombie-grey corporate presenter (skin exactly #a8b394, #c9d1b4, #76826a), slicked combover, square glasses with glowing red pupils (#ff4848), a TED-talk headset microphone, navy pinstripe suit (#26305a, #34407a, #181e3c), a red tie (#b8343a) hanging to his knees, a presentation clicker in hand, facing right, feet on the bottom edge. 5 frames as a horizontal strip 200×60 (each 40×60): walk 1, walk 2, presenting with the clicker arm out, throwing a pie chart, hurt with glasses askew. Outline #1b1620.
```

When this image is done, start **Job 14**.

---

### Job 14 of 35: THE BOARD (five heads)

- **Save as:** `public/sprites/art/board_heads.png`
- **Size:** 5 frames of 40×32, as one strip **200×32**
- **Frame order:** chairman, pig, vampire, gorilla, robot
- **What it is:** Floor 33 final boss: a hydra of five board members. Heads only; the necks, collars and ties are drawn by the game. Facing LEFT (towards Tero). Draw them natively at 40×32: the current ones are blown-up small enemy heads, which is why they look blocky. Chairman: bald, glasses, grey, liver spots. Pig: pink, cigar. Vampire: white, widow's peak, fangs. Gorilla: grey fur, brow ridge, red eyes. Robot: steel box head, red visor slit, antenna.

**Prompt:**

```text
Pixel art game sprite, SNES-era style, transparent background, 1-pixel dark outline, soft 3-tone shading, no anti-aliasing against the background, clean readable silhouette, side view. Five smug boss heads for a corporate hydra, heads only (no necks), facing LEFT, each 40×32, as one horizontal strip 200×32 in this order: a bald zombie-grey chairman with glasses and liver spots; a pink pig with a cigar; a pale white vampire with a widow's peak and fangs; a grey gorilla with a heavy brow ridge and red eyes; a steel box-headed robot with a red visor slit and an antenna. Outline #1b1620.
```

When this image is done, start **Job 15**.

---

### Job 15 of 35: Elvis the office dog

- **Save as:** `public/sprites/art/elvis.png`
- **Size:** 7 frames of 84×56, as one strip **588×56**
- **Frame order:** run0, run1, run2, run3, sit, jump, yelp
- **What it is:** The Vents: the abandoned office dog Tero rides. A big, kind golden dog with an old CHIEF HAPPINESS OFFICER badge on his collar. Tero sits on his back about 26 px above the paws, roughly in the middle, so leave a flat back there. run0–3 = gallop, sit = waiting and wagging, jump = leap, yelp = bumped.

**Prompt:**

```text
Pixel art game sprite, SNES-era style, transparent background, 1-pixel dark outline, soft 3-tone shading, no anti-aliasing against the background, clean readable silhouette, side view. A big friendly golden office dog with floppy ears and a red collar carrying an old CHIEF HAPPINESS OFFICER badge, slightly scruffy from living in air vents but happy, facing right, paws on the bottom edge, with a flat back where a small rider sits. 7 frames as a horizontal strip 588×56 (each 84×56): 4-frame gallop, sitting and wagging, jumping, yelping when bumped. Outline #1b1620.
```

When this image is done, start **Job 16**.

---


## 3 · ENEMIES

Optional, but they are all over the screen. All 32×32, facing right, feet on the bottom edge. Walkers have 4 walk frames; the plant and the hoppers have 2. They are office workers the job has turned into zombies or animals, all bipedal and in suits.

### Job 16 of 35: Clerk

- **Save as:** `public/sprites/enemies/clerk.png`
- **Size:** 4 frames of 32×32, as one strip **128×32**
- **Frame order:** walk0, walk1, walk2, walk3
- **What it is:** The basic zombie office worker. Grey-green skin, red eyes, dark suit, shambling walk with an arm out.

**Prompt:**

```text
Pixel art game sprite, SNES-era style, transparent background, 1-pixel dark outline, soft 3-tone shading, no anti-aliasing against the background, clean readable silhouette, side view. A small zombie office clerk, grey-green skin, tired red eyes, dark suit and tie, shambling with one arm reaching forward, facing right. 4-frame walk as a horizontal strip 128×32 (each 32×32). Outline #1b1620.
```

When this image is done, start **Job 17**.

---

### Job 17 of 35: Quick-sync guy

- **Save as:** `public/sprites/enemies/syncer.png`
- **Size:** 4 frames of 32×32, as one strip **128×32**
- **Frame order:** walk0, walk1, walk2, walk3
- **What it is:** Floor 6: wants a "quick sync". Shirt sleeves, a lanyard, a coffee mug held out, and a grin that means a calendar invite.

**Prompt:**

```text
Pixel art game sprite, SNES-era style, transparent background, 1-pixel dark outline, soft 3-tone shading, no anti-aliasing against the background, clean readable silhouette, side view. A small zombie office worker in rolled-up shirt sleeves with a lanyard, holding a coffee mug out in front of him, wearing an eager meeting-invite grin, facing right. 4-frame walk as a horizontal strip 128×32 (each 32×32). Outline #1b1620.
```

When this image is done, start **Job 18**.

---

### Job 18 of 35: Guard

- **Save as:** `public/sprites/enemies/guard.png`
- **Size:** 4 frames of 32×32, as one strip **128×32**
- **Frame order:** walk0, walk1, walk2, walk3
- **What it is:** Security; chases Tero. Navy uniform, peaked cap, a radio or baton.

**Prompt:**

```text
Pixel art game sprite, SNES-era style, transparent background, 1-pixel dark outline, soft 3-tone shading, no anti-aliasing against the background, clean readable silhouette, side view. A small zombie security guard in a navy uniform and peaked cap, holding a radio, facing right. 4-frame determined walk as a horizontal strip 128×32 (each 32×32). Outline #1b1620.
```

When this image is done, start **Job 19**.

---

### Job 19 of 35: Corporate rat

- **Save as:** `public/sprites/enemies/rat.png`
- **Size:** 4 frames of 32×32, as one strip **128×32**
- **Frame order:** walk0, walk1, walk2, walk3
- **What it is:** Steals things. Tiny, so give it a bright tie or a briefcase for contrast.

**Prompt:**

```text
Pixel art game sprite, SNES-era style, transparent background, 1-pixel dark outline, soft 3-tone shading, no anti-aliasing against the background, clean readable silhouette, side view. A small grey rat walking upright in a brown suit with a bright red tie and a little briefcase, long pink tail, sneaky expression, facing right. 4-frame walk as a horizontal strip 128×32 (each 32×32). Outline #1b1620.
```

When this image is done, start **Job 20**.

---

### Job 20 of 35: Corporate pig

- **Save as:** `public/sprites/enemies/pig.png`
- **Size:** 4 frames of 32×32, as one strip **128×32**
- **Frame order:** walk0, walk1, walk2, walk3
- **What it is:** Bribes. Pink, pinstripe suit, cigar. Already strong.

**Prompt:**

```text
Pixel art game sprite, SNES-era style, transparent background, 1-pixel dark outline, soft 3-tone shading, no anti-aliasing against the background, clean readable silhouette, side view. A small pink pig executive walking upright in a black pinstripe suit with gold buttons, smoking a cigar, facing right. 4-frame walk as a horizontal strip 128×32 (each 32×32). Outline #1b1620.
```

When this image is done, start **Job 21**.

---

### Job 21 of 35: Robot

- **Save as:** `public/sprites/enemies/robot.png`
- **Size:** 4 frames of 32×32, as one strip **128×32**
- **Frame order:** walk0, walk1, walk2, walk3
- **What it is:** Copies Tero's jumps. Steel box head, red visor, a red tie on its chest plate.

**Prompt:**

```text
Pixel art game sprite, SNES-era style, transparent background, 1-pixel dark outline, soft 3-tone shading, no anti-aliasing against the background, clean readable silhouette, side view. A small boxy steel office robot with a red visor slit, a red tie painted on its chest plate, stiff legs, one arm out, facing right. 4-frame walk as a horizontal strip 128×32 (each 32×32). Outline #1b1620.
```

When this image is done, start **Job 22**.

---

### Job 22 of 35: Office plant

- **Save as:** `public/sprites/enemies/plant.png`
- **Size:** 2 frames of 32×32, as one strip **64×32**
- **Frame order:** closed, open
- **What it is:** Stands still and chomps. A flesh-eating plant in an office pot with a label. Closed, then mouth wide open with teeth.

**Prompt:**

```text
Pixel art game sprite, SNES-era style, transparent background, 1-pixel dark outline, soft 3-tone shading, no anti-aliasing against the background, clean readable silhouette, side view. A small flesh-eating office plant in a terracotta pot with a little label, red venus-flytrap head with white teeth, green leaves. 2 frames as a horizontal strip 64×32 (each 32×32): mouth closed, mouth wide open. Outline #1b1620.
```

When this image is done, start **Job 23**.

---

### Job 23 of 35: Manager (hopper)

- **Save as:** `public/sprites/enemies/manager.png`
- **Size:** 2 frames of 32×32, as one strip **64×32**
- **Frame order:** ground, air
- **What it is:** Hops after Tero. Bald zombie manager with a briefcase. Crouched on the ground, then mid-hop with the briefcase raised.

**Prompt:**

```text
Pixel art game sprite, SNES-era style, transparent background, 1-pixel dark outline, soft 3-tone shading, no anti-aliasing against the background, clean readable silhouette, side view. A small bald zombie middle manager in a brown suit carrying a briefcase, facing right. 2 frames as a horizontal strip 64×32 (each 32×32): crouched ready to hop, then mid-air with the briefcase raised. Outline #1b1620.
```

When this image is done, start **Job 24**.

---

### Job 24 of 35: Gorilla (hopper)

- **Save as:** `public/sprites/enemies/gorilla.png`
- **Size:** 2 frames of 32×32, as one strip **64×32**
- **Frame order:** ground, air
- **What it is:** Shakes the floor when it lands. Gorilla in a suit; silverback grey would help it read.

**Prompt:**

```text
Pixel art game sprite, SNES-era style, transparent background, 1-pixel dark outline, soft 3-tone shading, no anti-aliasing against the background, clean readable silhouette, side view. A small silverback gorilla in a dark business suit, grey fur, frowning, facing right. 2 frames as a horizontal strip 64×32 (each 32×32): hunched on the ground, then leaping with one fist raised. Outline #1b1620.
```

When this image is done, start **Job 25**.

---

### Job 25 of 35: Vampire (hopper)

- **Save as:** `public/sprites/enemies/vampire.png`
- **Size:** 2 frames of 32×32, as one strip **64×32**
- **Frame order:** ground, air
- **What it is:** A blood-sucking executive. Pale face, widow's peak; give the cape a red lining so it reads against dark floors.

**Prompt:**

```text
Pixel art game sprite, SNES-era style, transparent background, 1-pixel dark outline, soft 3-tone shading, no anti-aliasing against the background, clean readable silhouette, side view. A small pale vampire executive with a widow's peak and fangs, in a black suit and a cape with a bright red lining, facing right. 2 frames as a horizontal strip 64×32 (each 32×32): standing, then leaping with the cape spread. Outline #1b1620.
```

When this image is done, start **Job 26**.

---


## 4 · GADGETS & PICKUPS

Priority 3. All bright (they are gameplay), outline #1b1620. Exact sizes and frame order.

### Job 26 of 35: Dad's things (12 icons)

- **Save as:** `public/sprites/art/dad_things.png`
- **Size:** 12 frames of 16×16, as one strip **192×16**
- **Frame order:** watch, drawing, photo, letter, slipper, buspass, book, remote, key, sandwich, badge, slipper2
- **What it is:** One hidden on each floor (two on Floor 13). There is no real art yet: the current ones are pink placeholders. watch (stopped) · Tero's crayon drawing · wedding photo · a resignation letter · one slipper · bus pass (expired 1991) · paperback "HOW TO SAY NO" · TV remote · house key · half a sandwich wrapper ("FOR THE DOG") · his old ID badge (the photo is from before: he's smiling) · the other slipper (a mirror image of the first: it's the pair). The pink glow behind them is drawn by the game.

**Prompt:**

```text
Pixel art game sprite, SNES-era style, transparent background, 1-pixel dark outline, soft 3-tone shading, no anti-aliasing against the background, clean readable silhouette, side view. Twelve tiny 16×16 pixel-art item icons in one horizontal strip 192×16, in this order: a stopped wristwatch, a child's crayon drawing, a framed wedding photo, a folded letter, one fluffy slipper, a bus pass card, a small paperback book, a TV remote, a house key, a crumpled sandwich wrapper, an office ID badge on a lanyard with a tiny smiling photo, and the matching other slipper (a mirror image of the fifth icon). Bright, readable, outline #1b1620.
```

When this image is done, start **Job 27**.

---

### Job 27 of 35: Baby dragon fire

- **Save as:** `public/sprites/art/fireball.png`
- **Size:** 4 frames of 24×24, as one strip **96×24**
- **Frame order:** spark, full, fading, smoke
- **What it is:** One flame, from birth to smoke. The game scales it from 12 to 32 px. Should read as BABY fire: round, cute, a bit wobbly. Right now it is just squares.

**Prompt:**

```text
Pixel art game sprite, SNES-era style, transparent background, 1-pixel dark outline, soft 3-tone shading, no anti-aliasing against the background, clean readable silhouette, side view. A cute round wobbly baby-dragon fireball, life cycle in 4 frames as a horizontal strip 96×24 (each 24×24): a small spark, a full round fireball (red #e8452c, orange #ffb347, yellow core #fff6b0), a fading smaller flame, a little grey smoke puff. Outline #1b1620.
```

When this image is done, start **Job 28**.

---

### Job 28 of 35: Hiding box

- **Save as:** `public/sprites/art/hide_box.png`
- **Size:** 1 frame of 34×24, as one strip **34×24**
- **Frame order:** box
- **What it is:** The cardboard box Tero hides in. Open side down, with a peephole and a shipping label.

**Prompt:**

```text
Pixel art game sprite, SNES-era style, transparent background, 1-pixel dark outline, soft 3-tone shading, no anti-aliasing against the background, clean readable silhouette, side view. A cardboard box upside down (open side down), brown tape strip, a shipping label, a little peephole on the front. Single frame 34×24. Outline #1b1620.
```

When this image is done, start **Job 29**.

---

### Job 29 of 35: Fax machine

- **Save as:** `public/sprites/art/fax.png`
- **Size:** 2 frames of 28×26, as one strip **56×26**
- **Frame order:** idle, printing
- **What it is:** Floor 21 teleporter. The FAX/OUT label and the DOWN prompt are drawn by the game. Bright beige-white 90s fax with a green light; frame 2 has paper sticking out.

**Prompt:**

```text
Pixel art game sprite, SNES-era style, transparent background, 1-pixel dark outline, soft 3-tone shading, no anti-aliasing against the background, clean readable silhouette, side view. A chunky 1990s office fax machine, front-side view, light beige with a green status light. 2 frames as a horizontal strip 56×26 (each 28×26): idle, then printing with a sheet of paper sticking out of the top. Outline #1b1620.
```

When this image is done, start **Job 30**.

---

### Job 30 of 35: Synergy Spring

- **Save as:** `public/sprites/art/spring.png`
- **Size:** 2 frames of 26×14, as one strip **52×14**
- **Frame order:** ready, squashed
- **What it is:** Floor 21 bounce pad. Yellow-and-black safety tape on top, because you stand on it.

**Prompt:**

```text
Pixel art game sprite, SNES-era style, transparent background, 1-pixel dark outline, soft 3-tone shading, no anti-aliasing against the background, clean readable silhouette, side view. A small office trampoline spring pad, red coil under a flat top with yellow-and-black hazard tape. 2 frames as a horizontal strip 52×14 (each 26×14): ready, squashed flat. Outline #1b1620.
```

When this image is done, start **Job 31**.

---

### Job 31 of 35: Golden parachute pickup

- **Save as:** `public/sprites/art/chute.png`
- **Size:** 1 frame of 20×22, as one strip **20×22**
- **Frame order:** sack
- **What it is:** Floor 30 pickup. The glow and bobbing are drawn by the game. A gold sack with a $ and a "CEO EXIT" tag.

**Prompt:**

```text
Pixel art game sprite, SNES-era style, transparent background, 1-pixel dark outline, soft 3-tone shading, no anti-aliasing against the background, clean readable silhouette, side view. A shiny golden money sack with a dollar sign and a small "CEO EXIT" tag, tied at the top. Single frame 20×22. Outline #1b1620.
```

When this image is done, start **Job 32**.

---

### Job 32 of 35: Golden parachute canopy

- **Save as:** `public/sprites/art/canopy.png`
- **Size:** 1 frame of 50×40, as one strip **50×40**
- **Frame order:** open
- **What it is:** Above Tero while he glides. Gold gores; the strings meet at the bottom centre, which sits just above Tero's head.

**Prompt:**

```text
Pixel art game sprite, SNES-era style, transparent background, 1-pixel dark outline, soft 3-tone shading, no anti-aliasing against the background, clean readable silhouette, side view. An open golden parachute canopy seen from the side, gold and darker gold gores, strings converging to one point at the bottom centre. Single frame 50×40, transparent background. Outline #1b1620.
```

When this image is done, start **Job 33**.

---

### Job 33 of 35: Security camera (1990s)

- **Save as:** `public/sprites/art/cctv.png`
- **Size:** 1 frame of 32×16, as one strip **32×16**
- **Frame order:** camera
- **What it is:** Floors 3 and 27: over 50 of them. The game flips and tilts your one picture to point anywhere, and draws the ceiling pole, wall bracket or pillar clamp, the light cone and the lens light. A chunky 1990s CCTV housing seen from the side, pointing RIGHT: a long grey box with a sun hood on top, a few ribs, a black lens bezel at the right end, a red REC light at the back. The mount point is about 12 px from the left end.

**Prompt:**

```text
Pixel art game sprite, SNES-era style, transparent background, 1-pixel dark outline, soft 3-tone shading, no anti-aliasing against the background, clean readable silhouette, side view. A chunky 1990s CCTV security camera seen from the side, pointing right: a long light-grey rectangular housing with a darker sun hood on top that sticks out over the lens, a few ribs on the side, a black lens bezel with a dark blue glass at the right end, a small red recording light at the back. Single frame 32×16, no mount or pole. Outline #1b1620.
```

When this image is done, start **Job 34**.

---


## 5 · INTERLUDE CHARACTERS

The two characters who only appear in the genre-break interludes. They are art slots too: exact size, exact frame order. Optional, but they are in the best clips.

### Job 34 of 35: Clippo, the paperclip assistant

- **Save as:** `public/sprites/art/clippo.png`
- **Size:** 4 frames of 32×44, as one strip **128×44**
- **Frame order:** idle, talk, hurt, broken
- **What it is:** Blue Screen (Floor 33): the desktop assistant who locks DADA.EXE and throws tips at Tero. His speech bubble and the paper tips are drawn by the game. A bent silver paperclip with huge googly eyes, floating, centred in the frame, about 20 px wide. idle = smug, eyes looking at you. talk = small mouth open ("It looks like you're trying to rescue your father"). hurt = X eyes, wire wobbling. broken = bent straight and twisted, X eyes (he has stopped working).

**Prompt:**

```text
Pixel art game sprite, SNES-era style, transparent background, 1-pixel dark outline, soft 3-tone shading, no anti-aliasing against the background, clean readable silhouette, side view. A cheerful-but-sinister office paperclip assistant character: a bent silver paperclip with two big googly eyes, floating upright, centred, about 20 px wide in a 32×44 frame. 4 frames as a horizontal strip 128×44 (each 32×44): idle (smug, eyes looking sideways), talking (small open mouth), hurt (X eyes, the wire wobbling), broken (the wire bent straight and twisted, X eyes). Silver #c9ccd1 wire with an outline #1b1620, white eyes. Do not copy any real brand mascot: an original paperclip character.
```

When this image is done, start **Job 35**.

---

### Job 35 of 35: THE PERFORMANCE REVIEW

- **Save as:** `public/sprites/art/review_form.png`
- **Size:** 4 frames of 132×116, as one strip **528×116**
- **Frame order:** idle, attack, hurt, defeated
- **What it is:** The Quarterly Review (after Floor 12): the enemy in the RPG battle. A sentient performance-review form with opinions and a red pen. The form (about 90 × 110) sits in the right part of the frame; the red pen arm sticks out to the LEFT (towards Tero). Title "PERFORMANCE REVIEW Q3", a 1-of-5 star rating, text lines, an angry face. idle = glaring, pen bobbing. attack = brows down, mouth wider, pen raised. hurt = eyes squeezed shut. defeated = crumpled and tilting over, eyes shut, pen drooping.

**Prompt:**

```text
Pixel art game sprite, SNES-era style, transparent background, 1-pixel dark outline, soft 3-tone shading, no anti-aliasing against the background, clean readable silhouette, side view. A sentient office performance-review form as an RPG enemy: an A4 sheet of paper about 90×110 px on the right of a 132×116 frame, with the header "PERFORMANCE REVIEW Q3", a star rating with only 1 of 5 stars filled, grey text lines, a dog-eared corner, an angry face (heavy black eyebrows, small eyes with red pupils, a zig-zag mouth) and one arm holding a red pen pointing LEFT. 4 frames as a horizontal strip 528×116 (each 132×116): idle (glaring), attack (eyebrows down, mouth wider, pen raised high), hurt (eyes squeezed shut), defeated (crumpled and tilting, eyes shut, pen drooping). Paper #f4f1e6, outline #1b1620, red #d83b3b.
```

**That was the last job.** List every file you made, with its job number.

---
