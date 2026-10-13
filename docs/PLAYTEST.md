# Running a playtest

The goal of this phase: find out what's **fun**, what's **confusing** and
what's **too hard**, before any art gets redrawn. Five to ten people who
have never seen the game are enough. Most problems show up with the first
three.

## Before the session

1. **Run the game** where the tester can play it:
   - **Your computer:** `npm run dev`, then open `http://localhost:3000/game`
     (or whichever port it prints).
   - **Their computer:** deploy a preview (e.g. `npx vercel` once you've
     logged in) and send the link.
2. **Open `/playtest`** in the same browser and type the **tester's name**.
   Every session in that browser is logged under it.
3. **Don't explain anything.** Not the controls beyond what the title
   screen shows, not the tantrum, not the box. Seeing what people *don't*
   find is the point.
4. Decide up front whether they play with **Bring Your Kid to Work Day**
   (the assist mode on the title screen). Default: off, but tell them it
   exists if they're about to give up.

## During the session: watch, don't help

Sit next to them (or watch a screen share) and **write down**:

- **Laughs:** when, at what. These are your trailer moments.
- **"What do I do?" moments:** where, and how long they lasted.
- **Rage quits or sighs:** where.
- **Things they try that the game doesn't support.** These are feature
  ideas, and often better ones than mine.
- **Whether they read the story cards** or skip them.

The game logs on its own: deaths (with what killed them), quits, places
where they made no progress for 20 seconds ("stuck"), kid-mode rescues,
tantrums, quick syncs, alarms and Dad's things.

### What I'm unsure about: please watch these

| Floor | Question |
|---|---|
| 1 Mailroom | Do they press X when "TANTRUM READY! PRESS X" appears? Do they find the puff for the paper wall? Does anyone find the stash on the high shelf? |
| 6 Cubicles | Do they understand the quick sync is *not* damage? Do they ever discover hiding (hold DOWN)? |
| 12 Halvorsen | Do they realise the bullet points are platforms? Is the laser readable? How many tries? |
| 13 Legal | Do they figure out that a jump from inside red tape is weak, and that fire burns it? |
| 21 R&D | Do they find "press DOWN at the fax" without help? |
| 27 Security | Is the camera cone clear? Do they connect the box to the cameras? |
| 30 Executive | Do they pick up the parachute before chasm 1? Do they discover holding jump? |
| 33 The Board | Is "stomp the dizzy head" readable? How many tries? |
| The Way Home | Is 80 seconds too long, too short or right? |

## After the session: five questions

1. What was the funniest moment?
2. Where were you confused?
3. Was there a moment you wanted to stop?
4. What is the game about? (Do they get the Dad story?)
5. Would you show this to a friend? Who?

## Collecting the logs

- On the tester's machine: open `/playtest` → **Export my log** → send
  you the `.json` file.
- On yours: `/playtest` → **Import logs** (choose several files at once).
  Sessions are merged; importing the same file twice doesn't double count.
- **Clear** wipes this browser's log (it asks first).

## Reading the report

The table at the top, per floor:

| Signal | Means | Fix it when… |
|---|---|---|
| **Cleared %** | How many who started the floor finished it | under **60%** (shown red) |
| **Deaths / player** | How punishing it is | over **6** (shown red) on early floors; bosses can be higher |
| **Quits** | People leaving mid-floor | any cluster in the same spot |
| **Stuck** | 20 s without progress | a yellow cluster = a "what do I do?" spot: add a hint, a sign or a story line |
| **Top killers** | What did it | one cause dominating = tune that enemy or hazard |
| **Rescues** | Kid-mode pit saves | lots in one pit = the jump is too hard for normal mode |

The **heat maps** show every event on the floor's tile map. Red clusters
are where the difficulty is; yellow are where the clarity is missing.

Bring me the exported logs (or just the numbers) and your notes. I'll
tune the floors and write the final art list.

## The output: the art lock

After 5–10 sessions, decide for each mechanic: **keep / change / cut**.
Only "keep" gets hand-drawn art.

| Mechanic | Keep / change / cut | Notes |
|---|---|---|
| Tantrum + freed workers | | |
| Puff + paper walls | | |
| Quick syncs + hide box | | |
| Halvorsen (slides as platforms) | | |
| Red tape | | |
| Fax teleport | | |
| Synergy spring | | |
| CCTV cameras | | |
| Golden parachute | | |
| THE BOARD | | |
| The Way Home (escape) | | |
| Dad's things | | |

Then `docs/SPRITE_REVIEW.md` minus anything cut is your drawing list.
