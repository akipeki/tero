# Launch kit

Everything needed to put **WHERE IS DADA? – Baby Dragon Strikes Back** in front
of people. Nothing here has been published. Every outward step below is yours
to take.

> ✏️ Check before you use it. `/press` says **Free** and **Made in Finland**.
> Both are guesses, so edit `app/press/page.tsx` if either is wrong.

---

## 1. Build a web version

```bash
npm run build:web     # static site → out/
npm run serve:web     # try it on http://localhost:3005
```

`out/` is a plain static site with no server code, so any static host can serve it.

| Host | How | Notes |
|---|---|---|
| **Vercel** | Import the repo, then `npm run build` | Easiest. The normal Next build works, no export needed. |
| **Netlify / Cloudflare Pages** | Build `npm run build:web`, publish `out` | |
| **GitHub Pages** | Push `out/` to `gh-pages` | Needs a **custom domain** or a `user.github.io` root (see below). |
| **itch.io** | Make a "Play in browser" page that **links** to your hosted URL | See the caveat below. |

**Root path only.** The game loads art from absolute paths (`/images/…`,
`/sprites/…`, `/_next/…`). It must therefore live at the **root** of a domain,
not in a sub-folder. itch.io's embedded HTML5 player serves uploads from a
sub-folder, so an `out/` zip will **not** run there as-is. For now, use itch
as the store page and link to the hosted game. Making every path relative is
about a day's work, and is worth it only if itch embedding matters.

Set `SITE_URL` when you build, so the share cards point at the real domain:

```bash
SITE_URL=https://yourdomain.example npm run build:web
```

What's already in place:
- `/opengraph-image` and `/twitter-image`: a 1200×630 share card with Tero.
- `/icon.png` and `/apple-icon.png`: Tero's win frame.
- `/manifest.webmanifest`: lets players install it to their home screen, fullscreen and landscape.
- `/press`: the press kit page.

---

## 2. Store copy

### English

**Short (≤ 140 chars)**
> A two-year-old in a dragon costume storms an office tower to bring his overworked dad home. Tantrum fire. Office satire. A dog called Elvis.

**Long**
> Dada went to work six months ago. He never came home.
>
> Tero is two. Tero is a dragon (the costume says so). Tero is going up there.
>
> *Where Is Dada?* is a short, weird, openly anti-capitalist pixel platformer.
> Climb an office tower floor by floor. Free the staff from their desks. Throw
> a tantrum so big the whole floor catches fire. On the way:
>
> - Every floor has its own rule: fax machines, security cameras, a stairwell you have to run.
> - Bosses: the Board, Halvorsen, and Chad from Recruitment, who thinks two is old enough for the Junior Trainee Program.
> - The Vents: a secret, happy place where you ride Elvis, the office dog they stopped feeding.
> - Dada's lost things are hidden on every floor. Find them all.
> - Original chiptune lullaby. Every floor plays it differently.
> - Assist mode, Casual Friday, gamepad support, English and Suomi.

### Suomi

**Lyhyt**
> Kaksivuotias lohikäärmepukuinen vauva valtaa toimistotornin hakeakseen ylityöllistetyn isänsä kotiin. Kiukkutulta, toimistosatiiria ja Elvis-niminen koira.

**Pitkä**
> Isi lähti töihin kuusi kuukautta sitten. Hän ei koskaan tullut kotiin.
>
> Tero on kaksi. Tero on lohikäärme (puku sanoo niin). Tero menee sinne.
>
> *Where Is Dada?* on lyhyt, outo ja avoimesti antikapitalistinen pikselitasohyppely.
> Kiipeä toimistotorni kerros kerrokselta. Vapauta työntekijät pöytiensä äärestä.
> Heitä niin iso kiukkukohtaus, että koko kerros syttyy tuleen.
>
> - Joka kerroksella omat sääntönsä: faksit, valvontakamerat, portaikko, jossa on juostava.
> - Pomot: Hallitus, Halvorsen ja rekrytoinnin Chad, jonka mielestä kaksivuotias on tarpeeksi vanha Junior Trainee -ohjelmaan.
> - Ilmastointikanavat: salainen, iloinen paikka, jossa ratsastat Elviksellä, toimiston koiralla, jolta lopetettiin ruoka.
> - Isin kadonneet tavarat on piilotettu joka kerrokseen.
> - Alkuperäinen chiptune-tuutulaulu, joka kerroksessa eri sovituksella.
> - Helpotustila, Casual Friday, peliohjainten tuki, englanti ja suomi.

**Tags:** pixel art, platformer, 2D, retro, satire, comedy, cute, short, dragon, costume,
dog, office, anti-capitalist, singleplayer, controller support, browser

---

## 3. Trailer (60 s)

| t | Shot | Sound |
|---|---|---|
| 0–4 | Black. Memo: *"DAD WENT TO WORK SIX MONTHS AGO."* | Office hum, a phone ringing |
| 4–8 | Tero on the title screen. Hold one beat, then he roars | Lullaby kicks in |
| 8–16 | Fast cuts: a jump, a fax shot, freeing workers who cheer | Melody |
| 16–22 | Tantrum: fire spreads across the floor | Metal layer, screen shake |
| 22–30 | Chad: *"Junior Trainee Program! Only 10-hour days!"*, then Tero's reply (censored) | Record scratch, then boss song |
| 30–34 | The JOB_APPLICATION.EXE window: A–D shake red, E turns green | Error buzz ×4, then a "ding" |
| 34–44 | The Vents: riding Elvis past rainbows and slogans | Vents song, "woof" |
| 44–50 | Grenade from the resistance, BOOM | |
| 50–56 | The top floor, a door, a silhouette | Music drops out |
| 56–60 | Logo + *"WHERE IS DADA?"* + URL | Tero: "Da-da?" |

## 4. Social clips (5–15 s each, vertical crop of the canvas)

1. **The job application:** four wrong answers shaking red, then "Good vibes only." (the best hook)
2. **Chad's pitch** and the censored reply.
3. **Elvis's story** in the vents. Sad, then the ride starts.
4. **A tantrum setting a whole floor on fire**, with screen shake on.
5. **Hiding in a box from a CCTV camera:** the "?" bubble.
6. **Speedrun timer splits** for a floor.
7. **The exit interview (HR-404)** questions.

Post the clips one at a time, a few days apart. Use the same caption template:
*"my platformer about a toddler in a dragon suit vs. late capitalism — [one-line joke]"*.

---

## 5. Steam Next Fest (optional, later)

Next Fest runs three times a year (Feb, Jun, Oct). Check Steamworks for the
exact dates and the registration deadline, which is usually about 6 weeks
before the fest.

- **−12 weeks:** Steam page live (the Steam app fee applies) with a capsule, 5+ screenshots and the trailer.
- **−8 weeks:** a demo build: Floors 1–2 plus The Vents. A desktop wrapper (Electron/Tauri) is needed.
- **−6 weeks:** register for Next Fest.
- **−4 weeks:** send keys and links to streamers and press using `/press`.
- **Fest week:** a livestream, and replies to every review.

## 6. Pre-launch checklist

- [ ] Playtest with 5+ people who've never seen it (`docs/PLAYTEST.md`), then tune.
- [ ] Final sprites in (`/art`, `docs/SPRITES.md`).
- [ ] Check `/press` facts (price, country, length).
- [ ] `SITE_URL=… npm run build:web`, then deploy `out/`.
- [ ] Open the URL on a phone, a tablet, Firefox, Safari and with a gamepad.
- [ ] Paste the URL into Discord or Bluesky and check the share card.
- [ ] itch.io page: copy from section 2, screenshots, link to the game.
- [ ] First social clip.

## 7. Age-rating notes

- Cartoon violence: fire, a grenade, bosses "defeated", nobody dies on screen.
- Mild language: one censored "F*** OFF".
- Political satire: anti-capitalist themes.
- No gambling, no ads, no data collection (everything stays in `localStorage`).

For IARC (needed on most stores) this is roughly **PEGI 7 / ESRB E10+**, with
the language possibly pushing it to PEGI 12. Answer the questionnaire honestly
about the censored swear.
