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
import type { DecorId } from './decor';
import { drawText, drawTextCentered, textWidth } from '../pixel/font';

export type GagKind = 'hang' | 'floor';

export interface Gag {
  kind: GagKind;
  /** 1 = everyday office absurdity, 2 = the unhinged later floors. */
  tier: 1 | 2;
  /** Clues on Dad's trail: only placed by the story, never by auto-fill. */
  storyOnly?: boolean;
  /** Only auto-fill on these floor décors (e.g. the Ferrari on the penthouse). */
  floors?: DecorId[];
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

/** A dark silhouette standing on `foot`, `h` px tall. */
function silhouette(r: Raster, x: number, foot: number, h: number, color: string): void {
  const head = Math.max(3, Math.round(h * 0.13));
  r.ellipse(x, foot - h + head, head, head, color);
  r.rect(x - Math.round(h * 0.16), foot - h + head * 2, Math.round(h * 0.32), Math.round(h * 0.45), color);
  r.rect(x - Math.round(h * 0.14), foot - Math.round(h * 0.33), Math.round(h * 0.1) + 1, Math.round(h * 0.33), color);
  r.rect(x + Math.round(h * 0.04), foot - Math.round(h * 0.33), Math.round(h * 0.1) + 1, Math.round(h * 0.33), color);
}

type RoomScene = 'review' | 'motivate' | 'team' | 'feedback' | null;

/** Glass meeting room seen from the corridor: plaque on top, window with
 *  blinds, a door. With a scene, the room is lit and you can just make out
 *  what's happening through the slats. */
function meetingRoom(line1: string, line2: string, scene: RoomScene): Raster {
  const r = new Raster(104, 100);
  const fl = 99;
  const lit = scene !== null;
  const shadow = '#2a1a10';
  // frame + plaque
  box(r, 2, fl - 84, 98, 84, '#8a8f96');
  r.rect(4, fl - 84, 94, 14, C.navy);
  drawTextCentered(r, line1, 4, 94, fl - 82, C.white);
  drawTextCentered(r, line2, 4, 94, fl - 76, C.yellow);
  // window
  const wx = 6, wy = fl - 66, ww = 64, wh = 60;
  r.rect(wx, wy, ww, wh, lit ? '#ffcf70' : '#d8d4c4');
  if (lit) {
    r.rect(wx, wy + wh - 10, ww, 10, '#e8a850');                   // warm floor glow
    const s = shadow, foot = wy + wh - 4;
    switch (scene) {
      case 'review': {
        // the reviewer, paddle raised; the reviewed, bent over the desk
        silhouette(r, wx + 16, foot, 34, s);
        r.capsule(wx + 20, foot - 26, wx + 30, foot - 44, 1.5, s);
        r.rect(wx + 26, foot - 52, 9, 12, s);
        r.rect(wx + 36, foot - 14, 24, 3, s);                       // desk
        r.rect(wx + 38, foot - 11, 2, 11, s); r.rect(wx + 56, foot - 11, 2, 11, s);
        r.ellipse(wx + 40, foot - 20, 4, 4, s);                     // bent figure
        r.rect(wx + 42, foot - 22, 12, 7, s);
        r.rect(wx + 50, foot - 15, 3, 15, s); r.rect(wx + 54, foot - 15, 3, 15, s);
        for (const [x, y] of [[wx + 30, foot - 56], [wx + 36, foot - 54]]) r.px(x, y, '#ffffff');
        break;
      }
      case 'motivate': {
        // someone tied to a chair; someone else with a giant megaphone
        r.rect(wx + 40, foot - 22, 3, 22, s); r.rect(wx + 40, foot - 10, 14, 3, s);
        r.rect(wx + 52, foot - 10, 2, 10, s);
        r.ellipse(wx + 47, foot - 27, 4, 4, s); r.rect(wx + 43, foot - 23, 9, 12, s);
        for (const y of [foot - 20, foot - 15]) r.line(wx + 41, y, wx + 54, y, '#ffcf70');   // ropes
        silhouette(r, wx + 12, foot, 32, s);
        r.tri(wx + 18, foot - 24, wx + 34, foot - 32, wx + 34, foot - 16, s);              // megaphone
        for (let k = 0; k < 3; k++) r.line(wx + 36 + k * 2, foot - 30 + k * 6, wx + 38 + k * 2, foot - 26 + k * 6, s);
        break;
      }
      case 'team': {
        // kneeling in a circle around a glowing dollar sign
        r.rect(wx + 24, foot - 12, 16, 3, s);
        drawText(r, '$', wx + 28, foot - 26, '#fff6c8', 2);
        for (const cx of [wx + 22, wx + 42]) { r.rect(cx, foot - 18, 1, 5, '#fff6c8'); r.px(cx, foot - 19, '#ff8a3d'); }
        for (const [x, dir] of [[wx + 8, 1], [wx + 16, 1], [wx + 48, -1], [wx + 56, -1]] as const) {
          r.ellipse(x + dir * 2, foot - 16, 3, 3, s);
          r.rect(x - 3, foot - 13, 7, 7, s);
          r.rect(x - 4, foot - 6, 9, 3, s);
          r.line(x + dir * 3, foot - 12, x + dir * 6, foot - 20, s);    // arms raised
        }
        break;
      }
      case 'feedback': {
        // one hangs upside down from the ceiling; one points at the chart
        r.line(wx + 18, wy, wx + 18, wy + 8, s);
        r.rect(wx + 14, wy + 8, 3, 12, s); r.rect(wx + 19, wy + 8, 3, 12, s);
        r.rect(wx + 12, wy + 20, 12, 14, s);
        r.ellipse(wx + 18, wy + 38, 4, 4, s);
        r.rect(wx + 36, foot - 40, 22, 16, s);
        r.line(wx + 38, foot - 37, wx + 56, foot - 28, '#ffcf70');
        silhouette(r, wx + 30, foot, 30, s);
        r.line(wx + 33, foot - 22, wx + 40, foot - 32, s);
        break;
      }
    }
  }
  // the blinds: solid when shut, thin slats you can see between when lit
  for (let y = wy; y < wy + wh; y += lit ? 4 : 3) {
    r.rect(wx, y, ww, lit ? 1 : 2, lit ? '#f4ecd2' : '#e8e4d6');
  }
  r.rect(wx, wy, ww, 1, '#5a5f68');
  // door with a glow underneath
  box(r, 74, fl - 66, 24, 66, '#6e4a2c');
  r.rect(76, fl - 62, 20, 26, '#7e5a3a');
  r.rect(76, fl - 32, 20, 26, '#7e5a3a');
  r.rect(77, fl - 36, 3, 2, C.gold);
  if (lit) r.rect(74, fl - 1, 24, 1, '#ffcf70');
  return r;
}

type Hair = 'blonde' | 'brunette' | 'redhead';

/** Penthouse hostess: white shirt, dark suit jacket, pencil skirt, white
 *  gloves, a silver tray held high — each with her own drink. */
function hostess(hair: Hair): Raster {
  const r = new Raster(36, 62);
  const fl = 61;
  const skin = '#f1c9a5', skinDark = '#d9a882';
  const suit = '#1d1d24', suitLight = '#33333f';
  const HAIR = {
    blonde:   { base: '#f2d36b', light: '#fff0a0', dark: '#c9a43a' },
    brunette: { base: '#5a3418', light: '#7a4a26', dark: '#3e2210' },
    redhead:  { base: '#c8452a', light: '#e8683e', dark: '#8e2a18' },
  }[hair];

  // long hair falls behind the shoulders
  if (hair === 'redhead') r.part(C.ink, (t) => t.rect(10, fl - 52, 12, 22, HAIR.base));
  // heels + legs
  r.part(C.ink, (t) => {
    t.rect(13, fl - 14, 3, 12, skin);
    t.rect(18, fl - 14, 3, 12, skin);
    t.rect(12, fl - 2, 5, 2, suit); t.rect(18, fl - 2, 5, 2, suit);
  });
  r.rect(13, fl - 1, 1, 1, suit); r.rect(22, fl - 1, 1, 1, suit);   // heels
  // pencil skirt: wide at the hips, narrow at the knee
  r.part(C.ink, (t) => {
    t.ellipse(17, fl - 22, 7.5, 6, suit);
    t.rect(11, fl - 22, 13, 9, suit);
  });
  r.rect(17, fl - 17, 1, 4, suitLight);                              // slit
  // waist + fitted jacket over a white shirt
  r.part(C.ink, (t) => {
    t.ellipse(17, fl - 36, 7, 8, suit);
    t.rect(13, fl - 30, 9, 4, suit);
  });
  r.tri(15, fl - 44, 20, fl - 44, 17, fl - 33, C.white);
  r.rect(16, fl - 43, 3, 2, C.red);                                  // bow tie
  r.px(17, fl - 32, C.gold); r.px(17, fl - 29, C.gold);
  // left arm resting at the hip, white glove
  r.part(C.ink, (t) => { t.capsule(11, fl - 40, 8, fl - 31, 1.6, suit); t.ellipse(10, fl - 28, 2, 2, C.white); });
  // right arm up, holding the tray
  r.part(C.ink, (t) => {
    t.capsule(22, fl - 40, 26, fl - 34, 1.6, suit);
    t.capsule(26, fl - 34, 27, fl - 44, 1.5, suit);
    t.ellipse(27, fl - 46, 2, 2, C.white);
  });
  r.part(C.greyDark, (t) => t.ellipse(27, fl - 48, 8, 1.5, '#dfe3e8'));
  // the drink
  if (hair === 'blonde') {
    // martini: V glass, olive on a stick
    r.tri(23, fl - 56, 31, fl - 56, 27, fl - 51, '#e8f4fa');
    r.rect(27, fl - 51, 1, 2, '#e8f4fa'); r.rect(25, fl - 49, 5, 1, '#e8f4fa');
    r.ellipse(26, fl - 55, 1, 1, C.green); r.line(26, fl - 55, 29, fl - 58, C.woodDark);
  } else if (hair === 'brunette') {
    // champagne flute with bubbles
    r.rect(26, fl - 60, 3, 9, '#f0d27a');
    r.rect(27, fl - 51, 1, 2, '#e8f4fa'); r.rect(25, fl - 49, 5, 1, '#e8f4fa');
    r.px(27, fl - 58, C.white); r.px(26, fl - 55, C.white); r.px(28, fl - 53, C.white);
  } else {
    // pink coupe with a cherry and a paper umbrella
    r.ellipse(27, fl - 53, 4, 1.5, '#ff77a8');
    r.rect(27, fl - 52, 1, 3, '#e8f4fa'); r.rect(25, fl - 49, 5, 1, '#e8f4fa');
    r.px(25, fl - 55, C.red);
    r.line(29, fl - 53, 31, fl - 59, C.woodDark);
    r.tri(28, fl - 59, 35, fl - 59, 31, fl - 62, C.teal);
  }
  // head
  r.part(C.ink, (t) => t.shadedEllipse(17, fl - 50, 5, 5.5, skin, '#ffe0c4', skinDark));
  r.line(18, fl - 51, 19, fl - 51, C.ink);                           // eye, lashes
  r.px(20, fl - 52, C.ink);
  r.rect(19, fl - 47, 2, 1, C.red);                                  // lipstick
  r.px(20, fl - 49, '#e8a090');                                      // blush
  // hairstyles
  if (hair === 'blonde') {
    // big 90s blow-out
    r.part(C.ink, (t) => {
      t.ellipse(15, fl - 55, 7, 5, HAIR.base);
      t.ellipse(10, fl - 49, 3.5, 5, HAIR.base);
    });
    r.rect(12, fl - 58, 6, 1, HAIR.light); r.px(9, fl - 48, HAIR.dark);
  } else if (hair === 'brunette') {
    // sleek bun
    r.part(C.ink, (t) => { t.ellipse(15, fl - 54, 6, 3.5, HAIR.base); t.ellipse(10, fl - 55, 3, 3, HAIR.base); });
    r.px(14, fl - 56, HAIR.light); r.px(9, fl - 55, HAIR.light);
  } else {
    // long and straight, side part
    r.part(C.ink, (t) => { t.ellipse(15, fl - 54, 6.5, 4, HAIR.base); t.rect(10, fl - 54, 4, 12, HAIR.base); });
    r.line(12, fl - 56, 17, fl - 57, HAIR.light); r.line(11, fl - 50, 11, fl - 44, HAIR.light);
  }
  return r;
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

/** Floors with glass meeting rooms (not the basement, not the penthouse). */
const ROOM_FLOORS: DecorId[] = ['boardroom', 'legal', 'lab', 'security', 'executive'];

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

  // ═══ Floors 27 & 30 — late-stage capitalism ═══════════════════════════════

  /** HARDER, BETTER, STRONGER — over a graph that only goes down. */
  poster_harder: hang2(() => {
    const w = 100, h = 64;
    const r = new Raster(w + 2, h + 8);
    r.line(20, 0, 20, 6, C.greyDark); r.line(w - 18, 0, w - 18, 6, C.greyDark);
    box(r, 1, 6, w, h, C.white);
    r.rect(1, 6, w, 10, C.navy);
    drawTextCentered(r, 'HARDER, BETTER,', 1, w, 8, C.yellow);
    drawTextCentered(r, 'STRONGER', 1, w, 18, C.navy, 2);
    // axes + the graph sliding diagonally down
    r.line(10, 32, 10, 64, C.ink); r.line(10, 64, 92, 64, C.ink);
    for (let x = 12; x < 88; x++) {
      const y = 34 + Math.round((x - 12) * 0.36 + Math.sin(x * 0.8) * 1.5);
      r.px(x, y, C.red); r.px(x, y + 1, C.red);
    }
    r.tri(84, 63, 92, 63, 90, 56, C.red);
    drawText(r, 'YOU', 72, 40, C.greyDark);
    return r;
  }),

  banner_loan: hang2(() => banner(
    ['WORK HARD FOR 30 YEARS', 'AND YOU MIGHT PAY OFF', 'YOUR STUDENT LOAN'], C.teal, C.paper)),

  /** A cheerful IT poster. Read the two big words together. */
  poster_skynet: hang2(() => {
    const w = 84, h = 54;
    const r = new Raster(w + 2, h + 8);
    r.line(Math.floor(w / 2), 0, Math.floor(w / 2), 6, C.greyDark);
    box(r, 1, 6, w, h, '#dff0ff');
    // network: nodes + links around a little cloud
    const nodes = [[10, 14], [24, 11], [62, 12], [76, 15], [8, 27], [78, 27]];
    for (const [x0, y0] of nodes) r.line(x0, y0, 43, 30, '#9fc4ea');
    r.part('#7fa8d8', (t) => { t.ellipse(38, 30, 6, 4, C.white); t.ellipse(46, 28, 7, 5, C.white); });
    for (const [x, y] of nodes) r.part(C.navy, (t) => t.ellipse(x, y, 2, 2, '#3f7fd8'));
    // SKY NET, close together, big and blue
    drawText(r, 'SKY', 10, 36, '#1f5fd0', 3);
    drawText(r, 'NET', 46, 36, '#1f5fd0', 3);
    drawTextCentered(r, 'IS WORKING', 1, w, 53, C.navy);
    return r;
  }),

  /** The huge portrait in the lobby of floor 30. */
  portrait_senior: hang2(() => {
    const lines = ["I WORKED 18 HOURS A DAY FOR 10 YEARS.", "NOW I'M SENIOR JUNIOR LEVEL", 'PRODUCT MANAGER ASSISTANT.'];
    const pw = Math.max(...lines.map((l) => textWidth(l))) + 10;
    const r = new Raster(pw + 2, 96);
    const fx = Math.floor((pw - 44) / 2);
    r.line(fx + 22, 0, fx + 22, 5, C.greyDark);
    // gold frame + portrait of a hollow-eyed employee
    box(r, fx, 5, 44, 52, C.gold);
    r.rect(fx, 5, 44, 2, C.goldLight);
    box(r, fx + 4, 9, 36, 44, '#3d4a63');
    r.part(C.ink, (t) => t.shadedEllipse(fx + 22, 52, 14, 9, C.suit, '#566179', '#272d3b'));
    r.tri(fx + 19, 44, fx + 25, 44, fx + 22, 52, C.paper);
    r.rect(fx + 21, 45, 2, 6, C.red);
    r.part(C.ink, (t) => t.shadedEllipse(fx + 22, 31, 9, 10, C.skin, '#c9d1b4', C.skinDark));
    r.rect(fx + 13, 21, 18, 3, '#3d3330');
    for (const ex of [fx + 18, fx + 26]) {
      r.rect(ex - 2, 29, 4, 3, '#3b2a3f');
      r.px(ex - 1, 30, C.white);
      r.line(ex - 2, 33, ex + 1, 33, C.skinDark);      // eye bags
      r.line(ex - 2, 34, ex + 1, 34, C.skinDark);
    }
    r.rect(fx + 19, 37, 6, 1, C.ink);                    // forced smile
    r.px(fx + 18, 36, C.ink); r.px(fx + 25, 36, C.ink);
    // brass plaque
    box(r, 1, 62, pw, 30, C.goldDark);
    r.rect(2, 63, pw - 2, 28, C.gold);
    lines.forEach((l, i) => drawTextCentered(r, l, 1, pw, 66 + i * 8, C.ink));
    return r;
  }),

  sign_results: hang2(() => {
    const w = 78, h = 50;
    const r = new Raster(w + 2, h + 8);
    r.line(Math.floor(w / 2), 0, 6, 6, C.greyDark); r.line(Math.floor(w / 2), 0, w - 5, 6, C.greyDark);
    box(r, 1, 6, w, h, C.paper);
    r.rect(1, 6, w, 9, C.ink);
    drawTextCentered(r, 'Q4 RESULTS', 1, w, 8, C.yellow);
    // profits: rocket; wages: flatline
    drawText(r, 'PROFITS', 4, 18, C.green);
    r.line(6, 50, 34, 26, C.green); r.line(7, 50, 35, 26, C.green);
    r.tri(31, 25, 37, 25, 36, 31, C.green);
    drawText(r, 'WAGES', 46, 18, C.red);
    r.line(44, 46, 74, 46, C.red); r.line(44, 47, 74, 47, C.red);
    r.line(40, 52, 40, 22, C.greyDark);
    return r;
  }),

  banner_pto:         hang2(() => banner(['UNLIMITED PTO*', '*NEVER APPROVED'], C.yellow, C.ink)),
  banner_ceo:         hang2(() => banner(['THE CEO EARNS 400X YOU.', 'BE GRATEFUL.'], C.navy, C.paper)),
  banner_replaceable: hang2(() => banner(['YOU ARE REPLACEABLE ♥'], C.pink, C.navy)),
  banner_grind:       hang2(() => banner(['RISE AND GRIND.', 'GRIND. GRIND. GRIND.'], C.ink, C.yellow)),
  banner_pizza:       hang2(() => banner(['PIZZA FRIDAY', 'IS YOUR RAISE'], C.red, C.yellow)),
  banner_overtime:    hang2(() => banner(['OVERTIME IS ITS', 'OWN REWARD'], C.purple, C.paper)),

  /** Here lies the pension. */
  pension_grave: floor2(() => {
    const r = new Raster(44, 50);
    const fl = 49;
    r.part(C.ink, (t) => { t.rect(8, fl - 34, 28, 34, C.greyLight); t.ellipse(22, fl - 34, 14, 8, C.greyLight); });
    r.rect(8, fl - 30, 2, 30, C.grey);
    drawTextCentered(r, 'R.I.P.', 8, 28, fl - 36, C.greyDark);
    drawTextCentered(r, 'PENSION', 8, 28, fl - 28, C.ink);
    drawTextCentered(r, '1950-', 8, 28, fl - 20, C.greyDark);
    drawTextCentered(r, '1993', 8, 28, fl - 13, C.greyDark);
    // wilted flowers + grass
    r.line(38, fl, 41, fl - 7, C.greenDark); r.px(41, fl - 8, C.brown); r.px(42, fl - 7, C.brown);
    for (let x = 2; x < 44; x += 3) r.px(x, fl, C.green);
    return r;
  }),

  /** One jar is doing great. */
  bonus_jars: floor2(() => {
    const r = new Raster(60, 44);
    const fl = 43;
    box(r, 2, fl - 14, 56, 3, C.woodLight);
    r.rect(5, fl - 11, 3, 11, C.woodDark); r.rect(52, fl - 11, 3, 11, C.woodDark);
    // CEO jar: overflowing gold
    r.part(C.ink, (t) => t.rect(6, fl - 36, 20, 22, '#d8eef7'));
    for (let y = fl - 32; y < fl - 14; y += 3) for (let x = 7; x < 25; x += 4) r.ellipse(x + ((y >> 1) % 2), y, 1.6, 1.2, C.gold);
    for (const [x, y] of [[8, fl - 38], [14, fl - 40], [21, fl - 38], [27, fl - 16]]) r.ellipse(x, y, 1.6, 1.2, C.gold);
    box(r, 6, fl - 28, 20, 6, C.paper);
    drawTextCentered(r, 'CEO', 6, 20, fl - 27, C.ink);
    // your raise: empty, one moth
    r.part(C.ink, (t) => t.rect(34, fl - 30, 16, 16, '#d8eef7'));
    box(r, 30, fl - 24, 24, 6, C.paper);
    drawTextCentered(r, 'RAISE', 30, 24, fl - 23, C.ink);
    r.px(41, fl - 34, C.greyDark); r.px(40, fl - 35, C.grey); r.px(42, fl - 35, C.grey);
    return r;
  }),

  /** Displayed with pride. */
  golden_parachute: floor2(() => {
    const r = new Raster(48, 62);
    const fl = 61;
    // plinth + glass case
    box(r, 6, fl - 16, 36, 16, C.greyLight);
    drawTextCentered(r, 'CEO EXIT', 6, 36, fl - 13, C.ink);
    drawTextCentered(r, 'PACKAGE', 6, 36, fl - 7, C.ink);
    r.part(C.ink, (t) => t.rect(8, fl - 58, 32, 41, '#e6f4fa'));
    // the parachute
    r.part(C.goldDark, (t) => t.shadedEllipse(24, fl - 44, 12, 8, C.gold, C.goldLight, C.goldDark));
    r.rect(12, fl - 44, 25, 4, '#e6f4fa');
    for (const x of [13, 24, 35]) r.line(x, fl - 44, 24, fl - 28, C.goldDark);
    r.rect(22, fl - 28, 5, 5, C.goldDark);
    r.px(11, fl - 55, C.white); r.px(12, fl - 54, C.white);   // glass glint
    return r;
  }),

  /** Trickle-down economics, as installed. */
  trickle_down: floor2(() => {
    const r = new Raster(80, 66);
    const fl = 65;
    // giant golden tap on a pipe
    r.part(C.ink, (t) => {
      t.rect(4, fl - 62, 6, 40, C.goldDark);
      t.rect(4, fl - 62, 36, 7, C.gold);
      t.rect(34, fl - 58, 7, 8, C.gold);
      t.rect(18, fl - 68 + 4, 10, 3, C.gold);
    });
    // one drop, falling toward a tiny cup
    r.ellipse(37, fl - 40, 1, 1.5, '#7fc8f0');
    r.part(C.ink, (t) => t.rect(33, fl - 8, 8, 8, C.paper));
    box(r, 2, fl - 20, 28, 12, C.paper);
    drawTextCentered(r, 'TRICKLE', 2, 28, fl - 19, C.ink);
    drawTextCentered(r, 'DOWN', 2, 28, fl - 13, C.ink);
    stickyNote(r, 30, fl - 30, 'ANY DAY NOW', C.sticky);
    return r;
  }),

  // ═══ Office clichés — every floor ═════════════════════════════════════════

  /** Water dispenser with the big upside-down plastic canister. */
  water_dispenser: floor(() => {
    const r = new Raster(34, 66);
    const fl = 65;
    box(r, 6, fl - 34, 20, 34, C.paper);
    r.rect(22, fl - 34, 4, 34, C.paperDim);
    r.rect(9, fl - 26, 4, 3, C.red); r.rect(17, fl - 26, 4, 3, '#3f7fd8');
    r.rect(8, fl - 18, 16, 2, C.greyDark);
    // the canister
    r.part(C.ink, (t) => {
      t.rect(8, fl - 60, 16, 24, '#a9d8f0');
      t.rect(12, fl - 37, 8, 3, '#a9d8f0');
      t.ellipse(16, fl - 60, 8, 3, '#a9d8f0');
    });
    r.rect(9, fl - 50, 14, 13, '#6fb8e0');
    r.rect(10, fl - 58, 2, 18, '#e8f6ff');
    for (const [x, y] of [[15, fl - 44], [18, fl - 47], [14, fl - 41]]) r.px(x, y, '#e8f6ff');
    // paper cone cups on the side
    r.part(C.ink, (t) => t.rect(26, fl - 30, 4, 10, C.white));
    r.tri(26, fl - 20, 30, fl - 20, 28, fl - 16, C.white);
    return r;
  }),

  /** Snack machine. One bag of crisps stuck forever. */
  vending_snacks: floor(() => {
    const r = new Raster(44, 72);
    const fl = 71;
    box(r, 2, fl - 70, 40, 70, C.red);
    r.rect(2, fl - 70, 40, 3, '#e85a60');
    box(r, 6, fl - 64, 24, 44, '#1d2440');
    const snacks = [C.yellow, C.green, '#3f7fd8', C.pink, C.flame, C.purple];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 3; col++) {
        const x = 8 + col * 7, y = fl - 62 + row * 11;
        r.rect(x, y, 5, 7, snacks[(row * 3 + col) % snacks.length]);
        r.line(x - 1, y + 8, x + 5, y + 8, C.greyLight);
      }
    }
    // the stuck bag, dangling at an angle
    r.part(C.ink, (t) => t.tri(15, fl - 29, 22, fl - 27, 17, fl - 22, C.yellow));
    // keypad + slot
    box(r, 33, fl - 60, 6, 14, C.greyLight);
    for (let y = fl - 58; y < fl - 47; y += 3) r.rect(34, y, 4, 1, C.greyDark);
    r.rect(34, fl - 42, 4, 2, C.ink);
    box(r, 8, fl - 14, 20, 6, C.ink);
    stickyNote(r, 1, fl - 20, 'NO REFUNDS', C.sticky);
    return r;
  }),

  /** Christmas was months ago. Nobody took the tree down. */
  dead_xmas_tree: floor(() => {
    const r = new Raster(44, 66);
    const fl = 65;
    const dead = '#8a5a2a', deadDark = '#5e3b1f', dry = '#b07a3a';
    r.part(C.ink, (t) => {
      t.tri(22, fl - 60, 8, fl - 38, 36, fl - 38, dead);
      t.tri(22, fl - 48, 5, fl - 22, 39, fl - 22, dead);
      t.tri(22, fl - 36, 3, fl - 8, 41, fl - 8, dead);
    });
    for (let i = 0; i < 18; i++) r.px(6 + ((i * 7) % 32), fl - 54 + ((i * 11) % 44), i % 2 ? deadDark : dry);
    // droopy star, sad ornaments, half the tinsel
    r.part(C.ink, (t) => t.tri(20, fl - 62, 27, fl - 60, 22, fl - 66, C.yellow));
    for (const [x, y, c] of [[14, fl - 30, C.red], [28, fl - 20, '#3f7fd8'], [20, fl - 44, C.gold], [32, fl - 34, C.red]] as const) {
      r.part(C.ink, (t) => t.ellipse(x, y, 1.6, 1.6, c));
    }
    r.line(10, fl - 26, 30, fl - 32, C.greyLight);
    // trunk, pot, needles on the floor
    r.rect(19, fl - 8, 6, 3, deadDark);
    box(r, 14, fl - 6, 16, 6, C.red);
    for (let x = 0; x < 44; x += 3) r.px(x, fl, x % 2 ? dry : deadDark);
    stickyNote(r, 0, fl - 18, "IT'S JULY", C.sticky);
    return r;
  }),

  /** Bob's plant. Water me. Nobody did. */
  dead_plant: floor(() => {
    const r = new Raster(38, 46);
    const fl = 45;
    box(r, 8, fl - 12, 14, 12, '#8a4b2a');
    r.rect(8, fl - 12, 14, 2, '#a65f37');
    // drooping brown stalks
    for (const [x1, y1, x2, y2] of [[15, fl - 12, 6, fl - 26], [15, fl - 12, 15, fl - 34], [15, fl - 12, 24, fl - 24], [15, fl - 12, 21, fl - 30]]) {
      r.line(x1, y1, x2, y2, '#7a5a2a');
    }
    for (const [x, y] of [[5, fl - 25], [14, fl - 35], [24, fl - 23], [22, fl - 31], [4, fl - 27]]) {
      r.part(C.ink, (t) => t.ellipse(x, y, 2, 1.2, '#9a7a3a'));
    }
    r.px(9, fl, '#9a7a3a'); r.px(23, fl, '#9a7a3a');
    stickyNote(r, 2, fl - 8, 'WATER ME', C.paperDim);
    return r;
  }),

  /** Even the cactus gave up. */
  dead_cactus: floor(() => {
    const r = new Raster(24, 34);
    const fl = 33;
    box(r, 6, fl - 9, 12, 9, '#c96a3a');
    r.part(C.ink, (t) => {
      t.capsule(12, fl - 10, 16, fl - 22, 2.6, '#8a7a4a');
      t.capsule(16, fl - 22, 20, fl - 20, 1.5, '#8a7a4a');
    });
    r.px(13, fl - 16, '#5e5232'); r.px(15, fl - 20, '#5e5232');
    return r;
  }),

  /** Meeting room, blinds shut, door shut, since forever. */
  room_closed: { ...floor(() => meetingRoom('MEETING IN PROGRESS', 'SINCE 1991', null)), floors: ROOM_FLOORS },

  // ═══ 90s office tech ══════════════════════════════════════════════════════

  /** A brick phone the size of a brick, in its charging cradle. */
  brick_phone: floor(() => {
    const r = new Raster(54, 52);
    const fl = 51;
    box(r, 2, fl - 20, 50, 3, C.woodLight);
    r.rect(5, fl - 17, 3, 17, C.woodDark); r.rect(46, fl - 17, 3, 17, C.woodDark);
    // the cradle
    box(r, 14, fl - 25, 22, 5, C.greyDark);
    r.rect(30, fl - 24, 3, 2, C.green);                               // charging light
    // the phone itself, standing in the cradle
    r.part(C.ink, (t) => {
      t.rect(18, fl - 50, 12, 26, '#2a2e35');
      t.rect(26, fl - 60 + 4, 3, 8, '#2a2e35');                       // antenna
    });
    r.rect(20, fl - 47, 8, 5, '#9fd09f');                             // green LCD
    drawText(r, '12', 21, fl - 47, '#2a4a2a');
    for (let y = fl - 40; y < fl - 28; y += 3) for (let x = 20; x < 28; x += 3) r.rect(x, y, 2, 2, C.greyLight);
    stickyNote(r, 32, fl - 34, 'CEO', C.sticky);
    return r;
  }),

  /** The fax machine, mid-fax, forever. */
  fax_machine: floor(() => {
    const r = new Raster(58, 54);
    const fl = 53;
    box(r, 2, fl - 20, 54, 3, C.paper);
    r.rect(5, fl - 17, 3, 17, C.greyDark); r.rect(50, fl - 17, 3, 17, C.greyDark);
    box(r, 10, fl - 32, 34, 12, C.beige);
    r.rect(10, fl - 32, 34, 2, C.beigeLight);
    r.rect(14, fl - 28, 10, 4, '#9fd09f');
    for (let x = 28; x < 40; x += 3) r.rect(x, fl - 27, 2, 2, C.greyDark);
    // handset on the side
    r.part(C.ink, (t) => t.capsule(6, fl - 26, 12, fl - 34, 2, C.beige));
    // paper curling out of the top: URGENT
    r.part(C.ink, (t) => { t.rect(20, fl - 48, 16, 16, C.white); t.rect(36, fl - 40, 6, 8, C.white); });
    drawText(r, 'URGENT', 18 + 2, fl - 45, C.red);
    for (let y = fl - 38; y < fl - 33; y += 2) r.line(22, y, 34, y, C.greyLight);
    return r;
  }),

  /** The copier. Every 90s office's nemesis. */
  copier_jam: floor(() => {
    const r = new Raster(66, 54);
    const fl = 53;
    box(r, 6, fl - 36, 44, 36, C.beige);
    r.rect(6, fl - 36, 44, 4, C.beigeLight);
    r.rect(8, fl - 28, 40, 2, C.greyDark);
    box(r, 32, fl - 24, 14, 7, '#1d2440');
    drawText(r, 'ERR', 33, fl - 23, '#ff8a3d');
    r.rect(10, fl - 18, 16, 14, C.paperDim);                           // paper trays
    r.rect(10, fl - 11, 16, 1, C.beigeDark);
    // jammed paper sticking out of every gap
    r.part(C.ink, (t) => { t.tri(50, fl - 30, 58, fl - 34, 56, fl - 24, C.white); t.tri(4, fl - 14, 10, fl - 16, 8, fl - 8, C.white); });
    box(r, 2, fl - 46, 60, 8, C.paper);
    drawTextCentered(r, 'PC LOAD LETTER', 2, 60, fl - 45, C.red);
    return r;
  }),

  /** Where the 1980s go to wait for a VCR. */
  vhs_archive: { floors: ['basement', 'boardroom', 'legal', 'lab', 'security'], ...floor(() => {
    const r = new Raster(96, 100);
    const fl = 99;
    box(r, 2, fl - 84, 80, 84, '#8a8f96');
    r.rect(4, fl - 84, 76, 12, C.ink);
    drawTextCentered(r, 'VHS ARCHIVE', 4, 76, fl - 81, C.yellow);
    // open door showing shelves of tapes
    r.rect(6, fl - 70, 50, 70, '#2a2e35');
    const labels = [C.white, C.yellow, C.red, '#3f7fd8', C.paperDim];
    for (let sy = fl - 66; sy < fl - 6; sy += 14) {
      r.rect(8, sy + 10, 46, 2, '#5a5f68');
      for (let x = 9; x < 53; x += 4) {
        r.rect(x, sy, 3, 10, C.ink);
        r.rect(x, sy + 3, 3, 3, labels[(x + sy) % labels.length]);
      }
    }
    // the door, swung open
    box(r, 58, fl - 70, 20, 70, '#6e4a2c');
    r.rect(60, fl - 36, 2, 3, C.gold);
    stickyNote(r, 59, fl - 62, 'BE KIND', C.sticky);
    stickyNote(r, 59, fl - 54, 'REWIND', C.sticky);
    return r;
  }) },

  /** Caution: wet floor. Usually standing in a dry spot. */
  wet_floor_sign: floor(() => {
    const r = new Raster(24, 30);
    const fl = 29;
    r.part(C.ink, (t) => { t.tri(4, fl, 12, fl - 28, 12, fl, C.yellow); t.tri(12, fl - 28, 20, fl, 12, fl, '#e8b72f'); });
    r.part(C.ink, (t) => t.ellipse(10, fl - 14, 1.5, 1.5, C.ink));
    r.line(10, fl - 12, 8, fl - 6, C.ink); r.line(10, fl - 12, 13, fl - 8, C.ink);   // falling stick figure
    r.line(7, fl - 4, 14, fl - 3, C.ink);
    drawText(r, '!', 15, fl - 22, C.ink);
    return r;
  }),

  // ═══ Later floors — what is going on in there? ════════════════════════════

  room_review: { ...floor2(() => meetingRoom('PERFORMANCE', 'REVIEW', 'review')), floors: ROOM_FLOORS },
  room_motivate: { ...floor2(() => meetingRoom('MOTIVATION', 'ROOM', 'motivate')), floors: ROOM_FLOORS },
  room_team: { ...floor2(() => meetingRoom('TEAM', 'BUILDING', 'team')), floors: ROOM_FLOORS },
  room_feedback: { ...floor2(() => meetingRoom('360', 'FEEDBACK', 'feedback')), floors: ROOM_FLOORS },

  // ═══ The money floors — executive wing & penthouse ════════════════════════

  /** 90s Memphis-pattern sofa. */
  sofa_memphis: { ...floor(() => {
    const r = new Raster(70, 36);
    const fl = 35;
    r.part(C.ink, (t) => {
      t.rect(4, fl - 28, 62, 14, C.ink);
      t.rect(4, fl - 16, 62, 10, C.ink);
      t.rect(0, fl - 22, 8, 16, C.pink);
      t.rect(62, fl - 22, 8, 16, C.pink);
    });
    // squiggles + triangles
    for (let x = 8; x < 60; x += 9) {
      r.rect(x, fl - 25, 4, 1, C.yellow);
      r.px(x + 2, fl - 21, C.teal); r.px(x + 5, fl - 12, C.pink);
      r.tri(x + 1, fl - 9, x + 5, fl - 9, x + 3, fl - 13, '#3f7fd8');
    }
    // cushions + triangular legs
    r.part(C.ink, (t) => { t.rect(10, fl - 20, 22, 5, C.yellow); t.rect(38, fl - 20, 22, 5, C.teal); });
    for (const lx of [6, 58]) r.part(C.ink, (t) => t.tri(lx, fl - 6, lx + 6, fl - 6, lx + 3, fl, C.yellow));
    return r;
  }), floors: ['executive', 'penthouse'] },

  /** Birch table, tapered legs, a red egg chair and a PH-style lamp. */
  scandi_set: { ...floor(() => {
    const r = new Raster(86, 60);
    const fl = 59;
    const birch = '#e3c89a', birchDark = '#b89a68';
    // floor lamp
    r.rect(8, fl - 50, 2, 50, C.greyDark);
    r.rect(4, fl - 2, 10, 2, C.greyDark);
    r.part(C.ink, (t) => { t.ellipse(9, fl - 52, 7, 3, C.white); t.ellipse(9, fl - 48, 5, 2, C.white); t.ellipse(9, fl - 45, 3, 1.5, C.white); });
    // table
    box(r, 18, fl - 22, 36, 3, birch);
    for (const [x0, x1] of [[22, 20], [50, 52]]) r.line(x0, fl - 19, x1, fl, birchDark);
    r.part(C.ink, (t) => t.rect(28, fl - 28, 6, 6, C.white));       // espresso cup
    r.rect(36, fl - 25, 10, 3, '#6fb8e0');                           // design book
    // red egg chair
    r.part(C.ink, (t) => {
      t.ellipse(70, fl - 26, 12, 15, '#c8323a');
      t.rect(66, fl - 14, 8, 4, '#c8323a');
    });
    r.ellipse(72, fl - 24, 7, 10, '#a8242c');
    r.rect(69, fl - 10, 2, 8, C.greyLight);
    r.rect(63, fl - 2, 14, 2, C.greyLight);
    return r;
  }), floors: ['executive', 'penthouse'] },

  /** A red Ferrari. Inside. On the top floor. Velvet ropes. */
  ferrari: { ...floor(() => {
    const r = new Raster(140, 50);
    const fl = 49;
    const red = '#d4111c', redLight = '#ff4a50', redDark = '#8e0a12';
    // velvet rope stanchions
    for (const x of [2, 136]) { r.rect(x, fl - 18, 2, 18, C.gold); r.part(C.ink, (t) => t.ellipse(x + 1, fl - 19, 2, 2, C.gold)); }
    r.line(3, fl - 16, 20, fl - 12, '#9c1f2b'); r.line(120, fl - 12, 137, fl - 16, '#9c1f2b');
    // body: low wedge, Testarossa side strakes
    r.part(C.ink, (t) => {
      t.tri(14, fl - 14, 128, fl - 22, 128, fl - 10, red);
      t.rect(14, fl - 16, 114, 10, red);
      t.tri(46, fl - 18, 64, fl - 32, 96, fl - 32, red);
      t.tri(46, fl - 18, 96, fl - 32, 104, fl - 20, red);
    });
    r.tri(56, fl - 20, 66, fl - 30, 92, fl - 30, '#24303c');      // windscreen
    r.tri(56, fl - 20, 92, fl - 30, 98, fl - 21, '#24303c');
    r.line(68, fl - 29, 88, fl - 29, '#8fb0c8');
    for (let y = fl - 15; y < fl - 9; y += 2) r.line(72, y, 100, y, redDark);   // strakes
    r.line(16, fl - 15, 126, fl - 20, redLight);
    r.rect(122, fl - 17, 6, 2, '#ffd23f');                          // tail light side
    r.rect(14, fl - 14, 4, 2, '#f4f1e6');                           // pop-up headlight
    // wheels
    for (const wx of [36, 108]) {
      r.part(C.ink, (t) => t.ellipse(wx, fl - 6, 7, 6, '#1b1620'));
      r.ellipse(wx, fl - 6, 3.5, 3, C.greyLight);
      r.px(wx, fl - 6, C.greyDark);
    }
    // plate
    box(r, 114, fl - 13, 13, 6, C.white);
    drawText(r, 'CEO', 115, fl - 12, C.ink);
    return r;
  }), floors: ['penthouse'] },

  /** A tiered gold fountain with a cherub spitting water. */
  fountain: { ...floor(() => {
    const r = new Raster(64, 66);
    const fl = 65;
    const water = '#7fc8f0', waterLight = '#d8f0ff';
    // basin
    r.part(C.ink, (t) => { t.ellipse(32, fl - 8, 30, 7, '#ece6d8'); t.rect(4, fl - 8, 56, 8, '#ece6d8'); });
    r.ellipse(32, fl - 10, 26, 4, water);
    r.rect(6, fl - 4, 52, 1, C.gold);
    // column + upper bowl
    r.part(C.ink, (t) => { t.rect(28, fl - 34, 8, 26, '#ece6d8'); t.ellipse(32, fl - 34, 14, 4, C.gold); });
    r.ellipse(32, fl - 35, 11, 2, water);
    // cherub
    r.part(C.ink, (t) => {
      t.ellipse(32, fl - 44, 5, 6, '#f1c9a5');
      t.ellipse(32, fl - 53, 4.5, 4.5, '#f1c9a5');
      t.tri(25, fl - 48, 20, fl - 54, 27, fl - 44, C.white);    // wing
    });
    r.rect(29, fl - 57, 7, 2, C.gold);                           // curls
    r.px(34, fl - 53, C.ink);
    // the arc of water from its mouth
    for (let k = 0; k < 16; k++) r.px(36 + k, fl - 52 + Math.round((k * k) / 7), k % 2 ? water : waterLight);
    for (let k = 0; k < 12; k++) r.px(18 + k, fl - 33 + Math.round(((k - 6) * (k - 6)) / 5), water);
    return r;
  }), floors: ['penthouse'] },

  hostess_blonde:   { ...floor(() => hostess('blonde')),   floors: ['penthouse'] },
  hostess_brunette: { ...floor(() => hostess('brunette')), floors: ['penthouse'] },
  hostess_redhead:  { ...floor(() => hostess('redhead')),  floors: ['penthouse'] },

  // ═══ Tero's crayon on the walls — story-only ══════════════════════════════

  crayon_power:    clueHang(() => crayonWall(['POWER TO', 'THE DADAS!'], [CRAYON.red, CRAYON.purple])),
  crayon_unite:    clueHang(() => crayonWall(['DADAS OF THE WORLD,', 'UNITE!'], [CRAYON.purple, CRAYON.red])),
  crayon_want:     clueHang(() => crayonWall(['WHAT DO WE WANT? DADA!', 'WHEN DO WE WANT HIM?', 'AFTER NAP!'], [CRAYON.blue, CRAYON.orange, CRAYON.red])),
  crayon_go_home:  clueHang(() => crayonWall(['WORKERS OF THE WORLD —', 'GO HOME'], [CRAYON.green, CRAYON.red])),
  crayon_resource: clueHang(() => crayonWall(['DADA IS NOT A', 'HUMAN RESOURCE'], [CRAYON.orange, CRAYON.purple])),
  crayon_whose:    clueHang(() => crayonWall(['WHOSE DADA?', 'OUR DADA!'], [CRAYON.blue, CRAYON.red])),
  crayon_no_peace: clueHang(() => crayonWall(['NO DADA,', 'NO PEACE!'], [CRAYON.green, CRAYON.purple])),

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
