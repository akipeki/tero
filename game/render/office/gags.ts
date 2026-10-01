// file: game/render/office/gags.ts
//
// The background gag library — office-culture parody you walk past.
// Two kinds:
//   hang  — banners/signs hanging from the ceiling (top edge = attach point)
//   floor — props standing on the floor (bottom edge = floor)
//
// Some are plain jokes; some are "what happened here?" hints the story can
// place on purpose (see `scenery` in game/content/story/script.ts).
// Every gag is drawn on a DOM-free Raster, so `npm run sprites -- --preview`
// can render them all to one contact sheet.

import { Raster } from '../pixel/Raster';
import { drawDad } from '../characters/dragon';
import { drawText, drawTextCentered, textWidth } from '../pixel/font';

export type GagKind = 'hang' | 'floor';

export interface Gag {
  kind: GagKind;
  /** 1 = everyday office absurdity, 2 = the unhinged later floors. */
  tier: 1 | 2;
  /** Clues on Dad's trail: only placed by the story, never by auto-fill. */
  storyOnly?: boolean;
  draw: () => Raster;
}

const C = {
  ink:      '#1b1620',
  paper:    '#f4f1e6',
  paperDim: '#dcd6c4',
  red:      '#d83b3b',
  redDark:  '#9c2424',
  navy:     '#22336b',
  yellow:   '#ffd23f',
  gold:     '#e8b72f',
  goldDark: '#a87b12',
  goldLight:'#fff0a0',
  beige:    '#d8cfb8',
  beigeDark:'#a99f86',
  beigeLight:'#efe8d4',
  grey:     '#8a8f96',
  greyDark: '#5a5f68',
  greyLight:'#c9ced6',
  steel:    '#dfe3e8',
  wood:     '#8a5a33',
  woodDark: '#5e3b1f',
  woodLight:'#a8743f',
  green:    '#3f9a48',
  greenDark:'#2f6e33',
  bottle:   '#2f7a3e',
  brown:    '#7a4a22',
  skin:     '#a8b394',
  skinDark: '#76826a',
  suit:     '#3c4558',
  pink:     '#ff8ea0',
  purple:   '#6a3d9a',
  flame:    '#ffb347',
  white:    '#ffffff',
  teal:     '#2f8f8a',
  sticky:   '#fff27a',
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** A box with a 1px ink outline. */
function box(r: Raster, x: number, y: number, w: number, h: number, fill: string): void {
  r.rect(x - 1, y - 1, w + 2, h + 2, C.ink);
  r.rect(x, y, w, h, fill);
}

/** Hanging cloth banner: two strings from the top, text lines centred. */
function banner(lines: string[], bg: string, fg: string, accent?: (r: Raster, w: number) => void): Raster {
  const w = Math.max(...lines.map((l) => textWidth(l))) + 12;
  const h = 6 + lines.length * 7 + 4;
  const r = new Raster(w + 2, h + 2);
  r.line(4, 0, 4, 5, C.greyDark);
  r.line(w - 3, 0, w - 3, 5, C.greyDark);
  box(r, 1, 6, w, h - 6, bg);
  r.rect(1, 6, w, 1, fg);
  r.rect(1, h - 1, w, 1, fg);
  lines.forEach((l, i) => drawTextCentered(r, l, 1, w, 9 + i * 7, fg));
  accent?.(r, w);
  return r;
}

/** Rigid hanging sign board (white with a colored header). */
function signBoard(header: string, lines: string[], headColor: string): Raster {
  const all = [header, ...lines];
  const w = Math.max(...all.map((l) => textWidth(l))) + 10;
  const h = 6 + 9 + lines.length * 7 + 3;
  const r = new Raster(w + 2, h + 2);
  r.line(Math.floor(w / 2), 0, 5, 6, C.greyDark);
  r.line(Math.floor(w / 2), 0, w - 4, 6, C.greyDark);
  box(r, 1, 6, w, h - 6, C.paper);
  r.rect(1, 6, w, 8, headColor);
  drawTextCentered(r, header, 1, w, 8, C.white);
  lines.forEach((l, i) => drawTextCentered(r, l, 1, w, 17 + i * 7, C.ink));
  return r;
}

function stickyNote(r: Raster, x: number, y: number, text: string, color: string = C.sticky): void {
  const w = textWidth(text) + 4;
  r.rect(x, y, w, 8, color);
  r.rect(x, y + 7, w, 1, C.beigeDark);
  drawText(r, text, x + 2, y + 2, C.ink);
}

/** Tero's crayon: wobbly baseline, one colour per line, centred lines. */
function crayonWall(lines: string[], colors: string[]): Raster {
  const scale = 2;
  const w = Math.max(...lines.map((l) => textWidth(l, scale))) + 8;
  const top = 26;                          // hangs below the ceiling, on the wall
  const r = new Raster(w, top + lines.length * 13 + 6);
  lines.forEach((line, li) => {
    const lw = textWidth(line, scale);
    let x = Math.floor((w - lw) / 2);
    [...line].forEach((ch, i) => {
      const wobble = ((i * 7 + li * 3) % 5) === 0 ? -1 : ((i * 5 + li) % 7) === 0 ? 1 : 0;
      drawText(r, ch, x, top + li * 13 + wobble, colors[li % colors.length], scale);
      x += 4 * scale;
    });
  });
  // a scribbled underline under the last line
  const uy = top + lines.length * 13;
  for (let x = 4; x < w - 4; x += 2) r.px(x, uy + ((x >> 2) % 2), colors[colors.length - 1]);
  // pale halo so it reads over posters and windows behind it
  return r.outline('#f4ecd2');
}

/** Party balloon on a string; `sad` ones are half deflated and sag. */
function balloon(r: Raster, x: number, y: number, color: string, sad: boolean): void {
  r.part(C.ink, (t) => (sad ? t.ellipse(x, y + 4, 3, 2, color) : t.ellipse(x, y, 3.5, 4.5, color)));
  r.px(x - 1, y - (sad ? -3 : 2), C.white);
  r.line(x, y + (sad ? 6 : 5), x + 1, y + 16, C.greyDark);
}

/** Simple zombie office worker, standing or kneeling, facing right. */
function worker(r: Raster, x: number, floor: number, kneeling: boolean): void {
  const legH = kneeling ? 3 : 7;
  const top = floor - legH - 9 - 8;
  // legs
  if (kneeling) {
    r.rect(x - 1, floor - 3, 9, 3, C.ink);
    r.rect(x, floor - 3, 7, 2, '#272d3b');
  } else {
    r.rect(x + 1, floor - legH, 2, legH, '#272d3b');
    r.rect(x + 4, floor - legH, 2, legH, '#272d3b');
    r.rect(x, floor - 1, 3, 1, C.ink); r.rect(x + 4, floor - 1, 3, 1, C.ink);
  }
  // body (bowed forward when kneeling)
  const bx = kneeling ? x + 2 : x;
  box(r, bx, top + 8, 8, 9, C.suit);
  r.rect(bx + 5, top + 8, 1, 4, C.red);
  // head
  const hx = kneeling ? x + 6 : x + 1;
  const hy = kneeling ? top + 6 : top;
  box(r, hx, hy, 7, 7, C.skin);
  r.rect(hx, hy, 7, 2, '#3d3330');
  r.px(hx + 5, hy + 3, C.red);
  r.rect(hx + 4, hy + 5, 2, 1, C.ink);
  // arms raised in worship / hanging
  if (kneeling) {
    r.line(bx + 7, top + 10, bx + 11, top + 4, C.suit);
    r.line(bx + 8, top + 10, bx + 12, top + 4, C.suit);
    r.rect(bx + 11, top + 2, 2, 2, C.skin);
  }
}

// ─── Banners & signs (hang) ──────────────────────────────────────────────────

const hang  = (draw: () => Raster): Gag => ({ kind: 'hang',  tier: 1, draw });
const floor = (draw: () => Raster): Gag => ({ kind: 'floor', tier: 1, draw });
const hang2  = (draw: () => Raster): Gag => ({ kind: 'hang',  tier: 2, draw });
const floor2 = (draw: () => Raster): Gag => ({ kind: 'floor', tier: 2, draw });
const clueHang  = (draw: () => Raster): Gag => ({ kind: 'hang',  tier: 1, storyOnly: true, draw });
const clueFloor = (draw: () => Raster): Gag => ({ kind: 'floor', tier: 1, storyOnly: true, draw });

const CRAYON = { purple: '#7b3fb8', red: '#d8323a', orange: '#f07a1a', blue: '#2f62d8', green: '#2f9a3a' } as const;

export const GAGS = {
  banner_synergy:   hang(() => banner(['SYNERGY IS NOT OPTIONAL'], C.navy, C.yellow)),
  banner_mondays:   hang(() => banner(['WE ♥ MONDAYS'], C.red, C.white)),
  banner_blame:     hang(() => banner(['TEAMWORK:', 'BLAME SOMEONE ELSE'], C.teal, C.white)),
  banner_meetings:  hang(() => banner(['MEETINGS ARE OUR PRODUCT'], C.paper, C.navy)),
  banner_ideas:     hang(() => banner(['100% SYNERGY', '0% IDEAS'], C.yellow, C.ink)),
  banner_pivot:     hang(() => banner(['LEVERAGE. ALIGN.', 'PIVOT. NAP.'], C.purple, C.yellow)),
  banner_q4:        hang(() => banner(['Q4 IS COMING'], C.ink, C.red)),
  banner_fun:       hang(() => banner(['MANDATORY FUN', 'FRIDAY 4:55 PM'], C.pink, C.ink)),
  banner_retire:    hang(() => banner(['HAPPY RETIREMENT', 'BOB'], C.paper, C.navy, (r, w) => {
    // BOB crossed out, "DAVE?" scrawled next to it
    const bx = 1 + Math.floor((w - textWidth('BOB')) / 2);
    r.line(bx - 1, 18, bx + textWidth('BOB'), 18, C.red);
    drawText(r, 'DAVE?', bx + textWidth('BOB') + 3, 15, C.red);
  })),
  sign_incident:    hang(() => signBoard('SAFETY FIRST', ['DAYS WITHOUT', 'INCIDENT: 0'], C.red)),
  sign_hr:          hang(() => signBoard('HR', ['NOW CLOSED', 'FOREVER'], C.navy)),

  // ─── Floor props ───────────────────────────────────────────────────────────

  /** Somebody slew the photocopier with a huge two-handed sword. */
  copier_slain: floor(() => {
    const r = new Raster(66, 78);
    const fl = 77;
    // scattered paper
    for (const [px, py] of [[2, fl - 1], [12, fl - 2], [48, fl - 1], [58, fl - 2], [30, fl - 1]]) r.rect(px, py, 7, 2, C.paper);
    // left half of copier, tilted apart
    box(r, 8, fl - 28, 20, 28, C.beige);
    r.rect(8, fl - 28, 20, 3, C.beigeLight);
    r.rect(10, fl - 20, 12, 3, C.greyDark);
    // right half
    box(r, 33, fl - 26, 20, 26, C.beige);
    r.rect(33, fl - 26, 20, 3, C.beigeLight);
    r.rect(43, fl - 21, 4, 2, C.red);                // dead status light
    r.rect(36, fl - 12, 14, 2, C.greyDark);
    // sparks from the cut
    for (const [sx, sy] of [[29, fl - 30], [31, fl - 24], [30, fl - 18]]) r.px(sx, sy, C.yellow);
    // the sword, plunged in at an angle
    r.part(C.ink, (t) => {
      t.capsule(31, fl - 14, 37, fl - 62, 2, C.steel);       // blade
      t.line(32, fl - 18, 37, fl - 60, C.greyLight);
      t.capsule(32, fl - 64, 44, fl - 62, 1.6, C.gold);      // crossguard
      t.capsule(38, fl - 64, 40, fl - 74, 1.6, C.purple);    // grip
      t.ellipse(40, fl - 75, 2.5, 2.5, C.gold);              // pommel
    });
    // smoke + sticky note
    r.part(C.greyDark, (t) => { t.ellipse(18, fl - 34, 3, 2, C.greyLight); t.ellipse(22, fl - 38, 2, 2, C.greyLight); });
    stickyNote(r, 2, fl - 42, 'OUT OF ORDER');
    return r;
  }),

  /** Employees worshipping a golden dollar sign. */
  money_shrine: floor(() => {
    const r = new Raster(72, 64);
    const fl = 63;
    // pedestal + idol
    box(r, 23, fl - 16, 26, 16, C.greyLight);
    r.rect(23, fl - 16, 26, 2, C.white);
    drawTextCentered(r, 'PRAISE', 23, 26, fl - 12, C.ink);
    drawTextCentered(r, 'Q4', 23, 26, fl - 6, C.red);
    r.part(C.goldDark, (t) => {
      drawText(t, 'S', 30, fl - 46, C.gold, 4);
      t.rect(35, fl - 50, 2, 28, C.gold);
    });
    r.rect(31, fl - 45, 2, 1, C.goldLight);
    // glow rays
    for (const [x0, y0, x1, y1] of [[24, fl - 40, 18, fl - 46], [48, fl - 40, 54, fl - 46], [36, fl - 54, 36, fl - 60]]) r.line(x0, y0, x1, y1, C.goldLight);
    // candles
    for (const cx of [20, 50]) {
      box(r, cx, fl - 10, 3, 10, C.paper);
      r.rect(cx + 1, fl - 13, 1, 2, C.flame);
      r.px(cx + 1, fl - 14, C.yellow);
    }
    // worshippers, one on each side, both facing the idol
    worker(r, 2, fl, true);
    const other = new Raster(r.w, r.h);
    worker(other, 2, fl, true);
    return r.draw(other.flipX());
  }),

  /** Sock on the supply closet door handle. Nobody asks. */
  supply_closet: floor(() => {
    const r = new Raster(50, 64);
    const fl = 63;
    box(r, 8, fl - 58, 32, 58, C.woodDark);
    box(r, 11, fl - 55, 26, 55, C.wood);
    r.rect(11, fl - 55, 26, 2, C.woodLight);
    // sign
    box(r, 11, fl - 51, 26, 12, C.paper);
    drawTextCentered(r, 'SUPPLY', 11, 26, fl - 50, C.ink);
    drawTextCentered(r, 'CLOSET', 11, 26, fl - 44, C.ink);
    // handle + sock
    r.rect(32, fl - 28, 3, 2, C.gold);
    r.part(C.ink, (t) => {
      t.rect(33, fl - 26, 4, 9, C.white);
      t.rect(33, fl - 18, 7, 3, C.white);
    });
    r.rect(33, fl - 24, 4, 1, C.red);
    r.rect(33, fl - 22, 4, 1, C.red);
    // "do not disturb" hanger and a dropped tie
    stickyNote(r, 13, fl - 36, 'BUSY', C.pink);
    r.capsule(41, fl - 1, 48, fl - 2, 0.8, C.red);
    // floating hearts
    for (const [hx, hy] of [[42, fl - 46], [45, fl - 54]]) {
      r.rect(hx, hy, 1, 1, C.pink); r.rect(hx + 2, hy, 1, 1, C.pink);
      r.rect(hx, hy + 1, 3, 1, C.pink); r.px(hx + 1, hy + 2, C.pink);
    }
    return r;
  }),

  /** The copier, the sign, and the evidence on the output tray. */
  copier_butt: floor(() => {
    const r = new Raster(62, 52);
    const fl = 51;
    box(r, 6, fl - 30, 34, 30, C.beige);
    r.rect(6, fl - 30, 34, 4, C.beigeLight);
    r.rect(9, fl - 22, 18, 3, C.greyDark);
    r.rect(32, fl - 24, 4, 2, C.yellow);
    // output tray + the photocopy
    r.rect(40, fl - 18, 10, 2, C.greyDark);
    box(r, 42, fl - 30, 13, 12, C.paper);
    r.ellipse(46, fl - 23, 2.5, 3.5, C.greyDark);
    r.ellipse(51, fl - 23, 2.5, 3.5, C.greyDark);
    r.line(48, fl - 26, 49, fl - 21, C.paper);
    // the sign (taped on, then amended)
    box(r, 1, fl - 50, 56, 14, C.paper);
    drawTextCentered(r, 'DO NOT SIT', 1, 56, fl - 48, C.red);
    drawTextCentered(r, 'ON THE COPIER', 1, 56, fl - 42, C.red);
    stickyNote(r, 8, fl - 34, 'AGAIN!!', C.sticky);
    return r;
  }),

  /** Remains of last night's "team building". */
  party_aftermath: floor(() => {
    const r = new Raster(72, 44);
    const fl = 43;
    // bottles
    for (const [bx, color] of [[4, C.bottle], [10, C.brown], [16, C.bottle]] as const) {
      box(r, bx, fl - 10, 4, 10, color);
      r.rect(bx + 1, fl - 14, 2, 4, color);
      r.rect(bx + 1, fl - 7, 2, 3, C.paper);
    }
    r.part(C.ink, (t) => t.capsule(22, fl - 2, 32, fl - 2, 1.6, C.bottle));   // one rolled away
    // red cups
    box(r, 36, fl - 5, 4, 5, C.red);
    r.part(C.ink, (t) => t.rect(42, fl - 3, 6, 3, C.red));
    // lampshade somebody wore
    r.part(C.ink, (t) => t.tri(52, fl, 66, fl, 59, fl - 12, C.beigeLight));
    r.rect(56, fl - 6, 7, 1, C.beigeDark);
    // deflated balloon "40"
    r.part(C.ink, (t) => t.ellipse(30, fl - 30, 4, 3, C.purple));
    r.line(30, fl - 27, 28, fl - 6, C.greyDark);
    drawText(r, '40', 27, fl - 32, C.yellow);
    // party hat
    r.part(C.ink, (t) => t.tri(44, fl - 8, 52, fl - 8, 48, fl - 18, C.yellow));
    r.px(48, fl - 19, C.pink);
    return r;
  }),

  /** Strategy whiteboard. */
  whiteboard: floor(() => {
    const r = new Raster(76, 64);
    const fl = 63;
    // stand + wheels
    r.rect(8, fl - 20, 2, 18, C.greyDark); r.rect(66, fl - 20, 2, 18, C.greyDark);
    r.rect(4, fl - 2, 10, 2, C.ink); r.rect(62, fl - 2, 10, 2, C.ink);
    box(r, 2, fl - 62, 72, 42, C.white);
    r.rect(2, fl - 62, 72, 2, C.greyLight);
    drawTextCentered(r, 'STRATEGY 1993', 2, 72, fl - 58, C.navy);
    // the graph
    r.line(8, fl - 26, 8, fl - 50, C.ink); r.line(8, fl - 26, 34, fl - 26, C.ink);
    r.line(9, fl - 48, 16, fl - 40, C.red); r.line(16, fl - 40, 22, fl - 44, C.red); r.line(22, fl - 44, 32, fl - 28, C.red);
    drawText(r, 'MORALE', 12, fl - 33, C.red);
    // the plan
    drawText(r, '1. MEET', 38, fl - 50, C.ink);
    drawText(r, '2. ???', 38, fl - 43, C.ink);
    drawText(r, '3. PROFIT', 38, fl - 36, C.green);
    drawText(r, 'PIVOT!', 40, fl - 28, C.red);
    return r;
  }),

  /** The ficus got promoted. */
  ficus_manager: floor(() => {
    const r = new Raster(36, 58);
    const fl = 57;
    box(r, 10, fl - 12, 16, 12, '#8a4b2a');
    r.rect(10, fl - 12, 16, 2, '#a65f37');
    for (const [lx, ly, rr] of [[18, 26, 9], [11, 33, 6], [25, 33, 6], [18, 40, 7]] as const) {
      r.part(C.ink, (t) => t.shadedEllipse(lx, fl - ly, rr, rr, C.green, '#5cb85c', C.greenDark));
    }
    // the tie
    r.part(C.ink, (t) => { t.rect(17, fl - 20, 3, 2, C.red); t.tri(16, fl - 18, 21, fl - 18, 18, fl - 12, C.red); });
    // name plate
    box(r, 2, fl - 7, 32, 6, C.gold);
    drawTextCentered(r, 'MANAGER', 2, 32, fl - 6, C.ink);
    return r;
  }),

  /** The office fridge and its passive-aggressive notes. */
  fridge_notes: floor(() => {
    const r = new Raster(44, 66);
    const fl = 65;
    box(r, 4, fl - 62, 30, 62, C.paper);
    r.rect(4, fl - 40, 30, 1, C.beigeDark);
    r.rect(30, fl - 56, 2, 10, C.greyDark);
    r.rect(30, fl - 34, 2, 14, C.greyDark);
    stickyNote(r, 1, fl - 60, 'WHO ATE', C.sticky);
    stickyNote(r, 1, fl - 52, 'MY YOGURT', C.sticky);
    stickyNote(r, 6, fl - 36, 'LABEL', C.pink);
    stickyNote(r, 6, fl - 28, 'YOUR FOOD', C.pink);
    stickyNote(r, 10, fl - 18, '!!!', '#9fe3ff');
    // a mysterious smell
    r.line(36, fl - 14, 38, fl - 18, C.green); r.line(38, fl - 18, 36, fl - 22, C.green);
    r.line(40, fl - 10, 42, fl - 14, C.green); r.line(42, fl - 14, 40, fl - 18, C.green);
    return r;
  }),

  /** Employee of the month: the stapler. */
  employee_month: floor(() => {
    const r = new Raster(60, 66);
    const fl = 65;
    // easel
    r.line(14, fl, 22, fl - 30, C.woodDark); r.line(46, fl, 38, fl - 30, C.woodDark); r.line(30, fl, 30, fl - 30, C.woodDark);
    box(r, 3, fl - 64, 54, 40, C.gold);
    box(r, 11, fl - 58, 38, 22, C.teal);
    // the stapler, proudly
    r.part(C.ink, (t) => {
      t.rect(17, fl - 44, 26, 4, C.red);
      t.rect(17, fl - 49, 24, 4, C.redDark);
      t.rect(39, fl - 48, 4, 4, C.greyLight);
    });
    drawTextCentered(r, 'EMPLOYEE', 3, 54, fl - 34, C.ink);
    drawTextCentered(r, 'OF THE MONTH', 3, 54, fl - 28, C.ink);
    return r;
  }),

  /** Face-down in the keyboard since Tuesday. */
  sleeping_worker: floor(() => {
    const r = new Raster(62, 50);
    const fl = 49;
    // desk
    box(r, 2, fl - 22, 56, 4, C.woodLight);
    r.rect(4, fl - 18, 3, 18, C.woodDark); r.rect(53, fl - 18, 3, 18, C.woodDark);
    // CRT with screensaver
    box(r, 30, fl - 40, 22, 18, C.beige);
    box(r, 33, fl - 37, 16, 11, '#10261a');
    drawText(r, 'ZZZ', 35, fl - 34, '#46e07a');
    // sleeping zombie, face on keyboard
    box(r, 10, fl - 20, 9, 12, C.suit);             // body on chair
    box(r, 16, fl - 27, 9, 6, C.skin);               // head down
    r.rect(16, fl - 27, 9, 2, '#3d3330');
    box(r, 22, fl - 24, 10, 2, C.greyLight);         // keyboard
    r.rect(8, fl - 8, 13, 2, C.ink);                 // chair
    r.rect(13, fl - 6, 2, 6, C.greyDark);
    drawText(r, 'Z', 14, fl - 36, C.navy);
    drawText(r, 'Z', 18, fl - 42, C.navy, 1);
    return r;
  }),

  /** Overflowing shredder, last folder half-way through. */
  shredder: floor(() => {
    const r = new Raster(34, 48);
    const fl = 47;
    box(r, 6, fl - 26, 22, 26, C.greyDark);
    r.rect(6, fl - 26, 22, 2, C.grey);
    // paper strips spilling out
    for (let i = 0; i < 7; i++) r.rect(4 + i * 4, fl - 3 - (i % 3), 2, 3 + (i % 2), C.paper);
    // folder going in
    box(r, 1, fl - 44, 32, 16, '#e3b55c');
    drawTextCentered(r, 'EVIDENCE', 1, 32, fl - 40, C.red);
    r.rect(6, fl - 28, 22, 2, C.ink);
    return r;
  }),

  // ═══ Tier 2 — the later floors, where things got weird ═════════════════════

  banner_capitalism: hang2(() => banner(['CAPITALISM IS 4 EVER'], C.ink, C.gold)),
  banner_growth:     hang2(() => banner(['♥ ENDLESS GROWTH ♥'], C.pink, C.redDark)),
  banner_family:     hang2(() => banner(['WE ARE A FAMILY*', '*TERMS APPLY'], C.paper, C.navy)),
  banner_layoffs:    hang2(() => banner(['LAYOFFS = SELF-CARE'], C.teal, C.paper)),
  banner_soul:       hang2(() => banner(['YOUR SOUL IS A KPI'], C.purple, C.paper)),
  banner_crush:      hang2(() => banner(['CRUSH Q4.', 'CRUSH HOPE.'], C.red, C.ink)),

  /** Party garland that outlived the party. */
  banner_fun_lasted: hang2(() => {
    const r = banner(['IT WAS FUN AS LONG AS IT LASTED'], C.yellow, C.purple);
    const out = new Raster(r.w + 20, r.h + 26);
    out.draw(r, 10, 0);
    // balloons dangling from each end: one proud, one deflated
    balloon(out, 6, r.h + 4, C.red, false);
    balloon(out, 14, r.h + 10, C.teal, false);
    balloon(out, out.w - 8, r.h + 12, C.purple, true);
    return out;
  }),

  sign_shareholders: hang2(() => {
    const r = signBoard('NOTICE', ['THE SHAREHOLDERS', 'ARE WATCHING', ''], C.ink);
    // an eye on the blank last line
    const cx = Math.floor(r.w / 2), cy = r.h - 7;
    r.part(C.ink, (t) => t.ellipse(cx, cy, 6, 2.5, C.white));
    r.rect(cx - 1, cy - 1, 2, 3, C.red);
    return r;
  }),

  /** The business plan nobody should have written down. */
  orphan_plan: floor2(() => {
    const r = new Raster(96, 70);
    const fl = 69;
    // flip chart on an easel
    r.line(18, fl, 28, fl - 30, C.woodDark); r.line(78, fl, 68, fl - 30, C.woodDark);
    box(r, 4, fl - 68, 88, 46, C.white);
    r.rect(4, fl - 68, 88, 3, C.greyDark);
    drawTextCentered(r, 'PROJECT ORPHANAGE', 4, 88, fl - 63, C.red);
    drawText(r, '1. BUY ORPHANAGE', 8, fl - 55, C.ink);
    drawText(r, '2. EVICT ORPHANS', 8, fl - 48, C.ink);
    drawText(r, '3. LUXURY CONDOS', 8, fl - 41, C.ink);
    drawText(r, '4. $$$', 8, fl - 34, C.green);
    // the tiny house, crossed out
    box(r, 76, fl - 52, 9, 7, C.paper);
    r.tri(75, fl - 52, 86, fl - 52, 80, fl - 57, C.red);
    r.line(74, fl - 58, 87, fl - 43, C.red); r.line(74, fl - 43, 87, fl - 58, C.red);
    // profit arrow
    r.line(40, fl - 30, 86, fl - 39, C.green);
    r.line(86, fl - 39, 82, fl - 39, C.green); r.line(86, fl - 39, 84, fl - 35, C.green);
    stickyNote(r, 2, fl - 18, 'GREAT IDEA!', C.sticky);
    return r;
  }),

  /** Somebody got told about the restructuring. */
  smashed_pc: floor2(() => {
    const r = new Raster(64, 52);
    const fl = 51;
    // desk
    box(r, 2, fl - 20, 58, 3, C.woodLight);
    r.rect(5, fl - 17, 3, 17, C.woodDark); r.rect(54, fl - 17, 3, 17, C.woodDark);
    // CRT split open
    box(r, 16, fl - 40, 13, 19, C.beige);
    box(r, 31, fl - 38, 13, 17, C.beige);
    r.rect(18, fl - 37, 9, 10, '#10261a');
    r.rect(31, fl - 35, 9, 10, '#10261a');
    // the axe, buried in it
    r.part(C.ink, (t) => {
      t.capsule(29, fl - 34, 44, fl - 50, 1.3, C.woodLight);  // handle
      t.tri(24, fl - 36, 32, fl - 44, 34, fl - 30, C.steel);   // blade
    });
    // shards, sparks, a flying key
    for (const [x, y] of [[10, fl - 1], [46, fl - 2], [52, fl - 1], [14, fl - 3]]) r.rect(x, y, 2, 1, C.greyLight);
    for (const [x, y] of [[30, fl - 44], [36, fl - 42], [28, fl - 26]]) r.px(x, y, C.yellow);
    r.part(C.ink, (t) => t.rect(48, fl - 30, 5, 4, C.paperDim));
    drawText(r, 'F1', 48, fl - 36, C.red);
    // keyboard snapped in two
    r.part(C.ink, (t) => { t.rect(4, fl - 24, 10, 3, C.greyLight); t.rect(46, fl - 23, 11, 3, C.greyLight); });
    return r;
  }),

  /** Desk flipped, chair through the partition, note left behind. */
  flipped_desk: floor2(() => {
    const r = new Raster(70, 40);
    const fl = 39;
    // upside-down desk, legs in the air
    box(r, 6, fl - 6, 44, 5, C.woodLight);
    r.rect(9, fl - 18, 3, 12, C.woodDark); r.rect(44, fl - 18, 3, 12, C.woodDark);
    // spilled papers + mug
    for (let i = 0; i < 6; i++) r.rect(2 + i * 9, fl - 1 - (i % 2), 7, 2, C.paper);
    r.part(C.ink, (t) => t.rect(52, fl - 4, 5, 4, C.white));
    r.rect(56, fl - 1, 6, 1, C.brown);
    // chair on its side
    r.part(C.ink, (t) => { t.rect(58, fl - 14, 10, 3, C.greyDark); t.rect(62, fl - 22, 3, 9, C.greyDark); });
    stickyNote(r, 14, fl - 30, 'I QUIT', C.red);
    drawText(r, 'I QUIT', 16, fl - 28, C.white);
    return r;
  }),

  /** The VP of Sales. Nobody questions it. */
  poodle_desk: floor2(() => {
    const r = new Raster(56, 56);
    const fl = 55;
    // desk
    box(r, 2, fl - 22, 52, 3, C.woodLight);
    r.rect(5, fl - 19, 3, 19, C.woodDark); r.rect(48, fl - 19, 3, 19, C.woodDark);
    box(r, 10, fl - 17, 36, 6, C.gold);
    drawTextCentered(r, 'VP SALES', 10, 36, fl - 16, C.ink);
    // white trimmed poodle: pom-poms everywhere
    const poof = (x: number, y: number, rr: number) => r.part(C.greyDark, (t) => t.ellipse(x, y, rr, rr, C.white));
    r.rect(10, fl - 30, 2, 7, C.paperDim); r.rect(22, fl - 30, 2, 7, C.paperDim);   // skinny legs
    poof(11, fl - 25, 2.5); poof(23, fl - 25, 2.5);                                   // ankle pom-poms
    r.rect(12, fl - 34, 12, 4, C.paperDim);                                           // shaved body
    poof(22, fl - 36, 4.5);                                                           // chest mane
    poof(8, fl - 35, 3.5);                                                            // hip pom
    poof(4, fl - 41, 2.5);                                                            // tail pom
    r.line(6, fl - 36, 5, fl - 39, C.paperDim);
    poof(26, fl - 43, 4);                                                             // head
    poof(25, fl - 49, 3);                                                             // top-knot
    r.rect(29, fl - 43, 4, 3, C.paperDim);                                            // snout
    r.px(32, fl - 43, C.ink); r.px(27, fl - 44, C.ink);
    r.rect(23, fl - 40, 3, 4, C.paperDim);                                            // ear
    // tiny tie
    r.rect(25, fl - 38, 2, 1, C.red); r.rect(25, fl - 37, 2, 3, C.red);
    return r;
  }),

  /** Lost & Found, after the offsite. */
  lost_and_found: floor2(() => {
    const r = new Raster(56, 66);
    const fl = 65;
    // coat rack
    r.rect(24, fl - 60, 2, 58, C.woodDark);
    r.rect(17, fl - 2, 16, 2, C.woodDark);
    r.line(25, fl - 56, 16, fl - 50, C.woodDark); r.line(25, fl - 56, 34, fl - 50, C.woodDark);
    // a bra, boxers with hearts, a tie
    r.part(C.ink, (t) => {
      t.ellipse(12, fl - 46, 3, 2.5, C.pink);
      t.ellipse(19, fl - 46, 3, 2.5, C.pink);
    });
    r.line(15, fl - 49, 16, fl - 51, C.pink);
    r.part(C.ink, (t) => { t.rect(30, fl - 50, 10, 6, C.white); t.rect(30, fl - 44, 4, 4, C.white); t.rect(36, fl - 44, 4, 4, C.white); });
    for (const [hx, hy] of [[32, fl - 48], [37, fl - 46]]) { r.px(hx, hy, C.red); r.px(hx + 1, hy, C.red); }
    r.capsule(25, fl - 40, 26, fl - 30, 0.8, C.red);
    // the box
    box(r, 2, fl - 16, 49, 15, C.brown);
    r.rect(2, fl - 16, 49, 2, '#9a6a3a');
    drawTextCentered(r, 'LOST & FOUND', 2, 49, fl - 11, C.paper);
    // one high heel next to it
    r.part(C.ink, (t) => { t.rect(50, fl - 3, 5, 2, C.red); t.rect(53, fl - 5, 1, 3, C.red); });
    return r;
  }),

  /** The cake from the farewell party. */
  layoff_cake: floor2(() => {
    const r = new Raster(66, 54);
    const fl = 53;
    // table
    box(r, 2, fl - 18, 62, 3, C.paper);
    r.rect(6, fl - 15, 2, 15, C.greyDark); r.rect(58, fl - 15, 2, 15, C.greyDark);
    // cake
    box(r, 9, fl - 35, 48, 16, C.paper);
    r.rect(9, fl - 35, 48, 2, C.pink);
    for (let x = 10; x < 57; x += 4) r.px(x, fl - 33, C.pink);
    drawTextCentered(r, 'CONGRATS ON', 9, 48, fl - 31, C.red);
    drawTextCentered(r, 'YOUR LAYOFF', 9, 48, fl - 25, C.red);
    // one candle, the knife
    r.rect(32, fl - 40, 2, 5, C.teal); r.px(32, fl - 41, C.flame);
    r.part(C.ink, (t) => t.capsule(52, fl - 33, 60, fl - 41, 0.8, C.steel));
    // balloons tied to the table
    balloon(r, 6, fl - 44, C.red, false);
    balloon(r, 60, fl - 40, C.purple, true);
    return r;
  }),

  /** The CEO's throne of money bags. */
  money_throne: floor2(() => {
    const r = new Raster(58, 64);
    const fl = 63;
    // pile of bags
    for (const [bx, by] of [[6, 10], [20, 10], [34, 10], [48, 10], [13, 22], [27, 22], [41, 22]] as const) {
      r.part(C.ink, (t) => { t.ellipse(bx, fl - by + 4, 6, 5, C.beige); t.rect(bx - 2, fl - by - 3, 4, 3, C.beige); });
      drawText(r, '$', bx - 1, fl - by + 2, C.green);
    }
    // golden chair on top
    r.part(C.ink, (t) => {
      t.rect(18, fl - 58, 22, 26, C.gold);
      t.rect(14, fl - 36, 30, 6, C.gold);
    });
    r.rect(21, fl - 55, 16, 18, C.red);
    r.rect(18, fl - 58, 22, 2, C.goldLight);
    // crown on the backrest
    r.part(C.ink, (t) => {
      t.rect(23, fl - 63, 12, 3, C.gold);
      t.tri(23, fl - 63, 26, fl - 63, 24, fl - 67, C.gold);
      t.tri(28, fl - 63, 31, fl - 63, 29, fl - 67, C.gold);
      t.tri(32, fl - 63, 35, fl - 63, 34, fl - 67, C.gold);
    });
    return r;
  }),

  /** HR's newest onboarding form. */
  soul_contract: floor2(() => {
    const r = new Raster(48, 58);
    const fl = 57;
    // lectern
    r.part(C.ink, (t) => { t.rect(18, fl - 26, 12, 26, C.woodDark); t.rect(12, fl - 2, 24, 2, C.woodDark); });
    r.part(C.ink, (t) => t.tri(4, fl - 30, 44, fl - 36, 44, fl - 26, C.woodLight));
    // the contract
    box(r, 8, fl - 56, 32, 24, C.paper);
    drawTextCentered(r, 'SOUL', 8, 32, fl - 53, C.ink);
    drawTextCentered(r, 'TRANSFER', 8, 32, fl - 47, C.ink);
    r.rect(12, fl - 41, 24, 1, C.greyDark);
    drawText(r, 'SIGN', 12, fl - 39, C.red);
    r.rect(30, fl - 39, 1, 4, C.red); r.rect(30, fl - 35, 2, 1, C.red);   // the drip
    // quill
    r.part(C.ink, (t) => t.capsule(38, fl - 40, 46, fl - 54, 1, C.white));
    r.line(39, fl - 42, 37, fl - 38, C.red);
    return r;
  }),

  /** Renewable energy initiative. */
  intern_wheel: floor2(() => {
    const r = new Raster(64, 58);
    const fl = 57;
    // the wheel
    r.part(C.ink, (t) => t.ellipse(22, fl - 22, 20, 20, C.greyLight));
    r.ellipse(22, fl - 22, 17, 17, '#e9e6dc');
    for (let a = 0; a < 8; a++) r.line(22, fl - 22, 22 + Math.cos(a * Math.PI / 4) * 17, fl - 22 + Math.sin(a * Math.PI / 4) * 17, C.grey);
    r.rect(20, fl - 2, 5, 2, C.greyDark);
    // the intern, running
    worker(r, 17, fl - 5, false);
    for (const [sx, sy] of [[30, fl - 30], [32, fl - 26]]) r.px(sx, sy, '#9fe3ff');     // sweat
    // cable to a glowing monitor
    r.line(42, fl - 6, 48, fl - 6, C.ink);
    box(r, 46, fl - 22, 16, 14, C.beige);
    box(r, 48, fl - 20, 12, 8, '#10261a');
    r.rect(49, fl - 18, 8, 1, '#46e07a');
    stickyNote(r, 10, fl - 54, 'INTERN POWER', C.sticky);
    return r;
  }),

  /** Productivity station: coffee straight into the vein. */
  coffee_iv: floor2(() => {
    const r = new Raster(36, 66);
    const fl = 65;
    // IV stand
    r.rect(17, fl - 62, 2, 60, C.greyDark);
    r.rect(10, fl - 2, 16, 2, C.greyDark);
    r.rect(12, fl - 62, 12, 2, C.greyDark);
    // bag of coffee
    r.part(C.ink, (t) => t.rect(6, fl - 60, 10, 14, C.brown));
    r.rect(7, fl - 54, 8, 7, '#5a3418');
    drawText(r, 'JOE', 7, fl - 59, C.paper);
    r.line(11, fl - 46, 26, fl - 20, C.brown);
    // empty office chair waiting
    r.part(C.ink, (t) => { t.rect(22, fl - 22, 12, 3, C.greyDark); t.rect(31, fl - 34, 3, 12, C.greyDark); t.rect(27, fl - 19, 2, 17, C.greyDark); });
    stickyNote(r, 0, fl - 40, '24/7', C.sticky);
    return r;
  }),

  // ═══ Tero's crayon on the walls — story-only ══════════════════════════════

  crayon_power:    clueHang(() => crayonWall(['POWER TO', 'THE DADAS!'], [CRAYON.red, CRAYON.purple])),
  crayon_unite:    clueHang(() => crayonWall(['DADAS OF THE WORLD,', 'UNITE!'], [CRAYON.purple, CRAYON.red])),
  crayon_want:     clueHang(() => crayonWall(['WHAT DO WE WANT? DADA!', 'WHEN DO WE WANT HIM?', 'AFTER NAP!'], [CRAYON.blue, CRAYON.orange, CRAYON.red])),
  crayon_go_home:  clueHang(() => crayonWall(['WORKERS OF THE WORLD —', 'GO HOME'], [CRAYON.green, CRAYON.red])),
  crayon_resource: clueHang(() => crayonWall(['DADA IS NOT A', 'HUMAN RESOURCE'], [CRAYON.orange, CRAYON.purple])),

  // ═══ Dad's trail — story-only clues ═══════════════════════════════════════

  /** Dad's desk on floor 1: the family photo, his face under a sticky note. */
  dad_photo: clueFloor(() => {
    const r = new Raster(62, 48);
    const fl = 47;
    box(r, 2, fl - 20, 58, 3, C.woodLight);
    r.rect(5, fl - 17, 3, 17, C.woodDark); r.rect(54, fl - 17, 3, 17, C.woodDark);
    // framed photo: big green dragon + tiny green dragon
    box(r, 8, fl - 40, 26, 20, C.gold);
    box(r, 10, fl - 38, 22, 15, '#9fd0ff');
    r.part(C.ink, (t) => { t.ellipse(17, fl - 30, 4, 5, '#6cc24a'); t.ellipse(26, fl - 27, 3, 3, '#6cc24a'); });
    r.px(27, fl - 28, C.ink);
    stickyNote(r, 9, fl - 36, 'TBD', C.sticky);          // over Dad's face
    // name plate
    box(r, 36, fl - 26, 23, 5, C.greyLight);
    drawTextCentered(r, '#4471', 36, 23, fl - 25, C.ink);
    return r;
  }),

  /** Cold coffee in Dad's mug. */
  dad_mug: clueFloor(() => {
    const r = new Raster(64, 56);
    const fl = 55;
    box(r, 2, fl - 20, 60, 3, C.woodLight);
    r.rect(5, fl - 17, 3, 17, C.woodDark); r.rect(56, fl - 17, 3, 17, C.woodDark);
    r.part(C.ink, (t) => {
      t.rect(10, fl - 52, 44, 32, C.white);
      t.rect(54, fl - 46, 6, 18, C.white);
    });
    r.rect(55, fl - 43, 3, 12, C.paperDim);
    r.rect(10, fl - 52, 44, 3, '#5a3418');
    drawTextCentered(r, "WORLD'S", 10, 44, fl - 47, C.navy);
    drawTextCentered(r, 'OKAYEST', 10, 44, fl - 40, C.navy);
    drawTextCentered(r, 'DAD', 10, 44, fl - 33, C.red);
    stickyNote(r, 22, fl - 27, 'COLD', '#9fe3ff');
    return r;
  }),

  /** Six months, crossed out one day at a time. */
  dad_calendar: clueHang(() => {
    const w = 44, h = 44;
    const r = new Raster(w + 2, h + 6);
    r.line(Math.floor(w / 2), 0, Math.floor(w / 2), 4, C.greyDark);
    box(r, 1, 5, w, h, C.paper);
    r.rect(1, 5, w, 8, C.red);
    drawTextCentered(r, '1993', 1, w, 7, C.white);
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 7; col++) {
        const x = 4 + col * 6, y = 15 + row * 6;
        if (row === 3 && col === 6) {
          r.part(C.red, (t) => t.ellipse(x + 1, y + 1, 2.5, 2.5, C.paper));
          continue;
        }
        r.line(x, y, x + 3, y + 3, C.red);
        r.line(x, y + 3, x + 3, y, C.red);
      }
    }
    drawText(r, 'HOME?', 22, 42, C.red);
    return r;
  }),

  /** Dad has been living under his desk. */
  dad_cot: clueFloor(() => {
    const r = new Raster(76, 42);
    const fl = 41;
    box(r, 2, fl - 24, 72, 3, C.woodLight);
    r.rect(4, fl - 21, 3, 21, C.woodDark); r.rect(69, fl - 21, 3, 21, C.woodDark);
    // sleeping bag + pillow underneath
    r.part(C.ink, (t) => { t.rect(10, fl - 8, 50, 7, C.teal); t.ellipse(14, fl - 7, 5, 3, C.white); });
    r.rect(20, fl - 8, 1, 7, '#246e6a');
    // slippers
    r.part(C.ink, (t) => { t.ellipse(62, fl - 2, 3, 1.5, C.pink); t.ellipse(66, fl - 1, 3, 1.5, C.pink); });
    // sign taped to the desk
    box(r, 8, fl - 38, 60, 13, C.paper);
    drawTextCentered(r, 'DO NOT DISTURB', 8, 60, fl - 36, C.red);
    drawTextCentered(r, 'Q3 CLOSE', 8, 60, fl - 30, C.ink);
    return r;
  }),

  /** Floor 33: Dad himself, at his laptop, next to the elevator. */
  dad_desk: clueFloor(() => {
    const r = new Raster(84, 66);
    const fl = 65;
    // Dad behind the desk
    r.draw(drawDad({ frontArm: 0.3, backArm: 0.4 }), 4, fl - 64);
    // desk + laptop glow
    box(r, 30, fl - 22, 52, 3, C.woodLight);
    r.rect(33, fl - 19, 3, 19, C.woodDark); r.rect(76, fl - 19, 3, 19, C.woodDark);
    r.part(C.ink, (t) => { t.rect(52, fl - 34, 18, 11, C.greyDark); t.rect(48, fl - 24, 24, 2, C.grey); });
    r.rect(54, fl - 32, 14, 7, '#9fe3ff');
    drawText(r, 'Q4', 57, fl - 31, C.navy);
    // paper mountain
    for (let i = 0; i < 5; i++) r.rect(72 - (i % 2), fl - 24 - i * 2, 9, 2, i % 2 ? C.paper : C.paperDim);
    return r;
  }),
} satisfies Record<string, Gag>;

export type GagId = keyof typeof GAGS;
export const GAG_IDS = Object.keys(GAGS) as GagId[];

export function isGagId(id: string): id is GagId {
  return id in GAGS;
}
