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
import { drawText, drawTextCentered, textWidth } from '../pixel/font';

export type GagKind = 'hang' | 'floor';

export interface Gag {
  kind: GagKind;
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

const hang = (draw: () => Raster): Gag => ({ kind: 'hang', draw });
const floor = (draw: () => Raster): Gag => ({ kind: 'floor', draw });

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
} satisfies Record<string, Gag>;

export type GagId = keyof typeof GAGS;
export const GAG_IDS = Object.keys(GAGS) as GagId[];

export function isGagId(id: string): id is GagId {
  return id in GAGS;
}
