// file: game/render/office/OfficeTiles.ts
//
// Tile art for the 1990s office. Solid tiles change look with their
// neighbours: carpeted floor on top, acoustic ceiling at the top edge of the
// map, filing cabinets when floating, plain slab underneath.

import { TILE_SIZE } from '../../constants';
import { getDecor, type DeskStyle } from './decor';

const S = TILE_SIZE;

// Floor-independent colours. Carpet, slab, ceiling and desks come from the
// current floor's décor (decor.ts).
const C = {
  ceilingDot:  '#c3bfb1',
  ceilingGrid: '#b3ae9e',
  lamp:        '#fdfbe8',
  lampFrame:   '#9c9888',
  lampOff:     '#cfcbb8',
  cabinet:     '#b9b39f',
  cabinetLight:'#d2cdb9',
  cabinetDark: '#8a846f',
  handle:      '#5d5a50',
  label:       '#f4f1e6',
  pinSteel:    '#dfe3e8',
  pinShadow:   '#2f3440',
  pinColors:   ['#d83b3b', '#ffd23f', '#3f7fd8'],
} as const;

export interface SolidNeighbours {
  tx: number;
  ty: number;
  /** Tile above is not solid. */
  openAbove: boolean;
  /** Tile below is not solid. */
  openBelow: boolean;
}

/** Yellow-and-black safety tape along a surface you can stand on — the one
 *  bright cue every floor shares. Stripes are aligned to world tiles (`tx`)
 *  so they don't crawl while the camera scrolls. */
export function safetyEdge(ctx: CanvasRenderingContext2D, sx: number, sy: number, w: number, tx: number): void {
  ctx.fillStyle = '#ffd23f';
  ctx.fillRect(sx, sy, w, 3);
  ctx.fillStyle = '#1b1620';
  const offset = (tx * S) % 8;
  for (let x = -offset; x < w; x += 8) {
    const x0 = Math.max(0, x), x1 = Math.min(w, x + 4);
    if (x1 > x0) ctx.fillRect(sx + x0, sy, x1 - x0, 3);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillRect(sx, sy, w, 1);
}

export function drawOfficeSolid(ctx: CanvasRenderingContext2D, sx: number, sy: number, n: SolidNeighbours): void {
  if (n.ty === 0) return drawCeiling(ctx, sx, sy, n.tx);
  if (n.openAbove && n.openBelow) {
    drawCabinet(ctx, sx, sy);
    safetyEdge(ctx, sx, sy, S, n.tx);
    return;
  }

  const d = getDecor();
  const [slab, slabLight, slabDark] = d.slab;
  // slab with a seam
  ctx.fillStyle = slab;
  ctx.fillRect(sx, sy, S, S);
  ctx.fillStyle = slabDark;
  ctx.fillRect(sx, sy + S - 2, S, 2);
  ctx.fillRect(sx + S - 2, sy, 2, S);
  ctx.fillStyle = slabLight;
  ctx.fillRect(sx + 5, sy + 9, 2, 1);
  ctx.fillRect(sx + 20, sy + 21, 3, 1);

  if (n.openAbove) {
    // carpet with a speckle + baseboard shadow
    const [carpet, carpetLight, carpetDark] = d.carpet;
    ctx.fillStyle = carpet;
    ctx.fillRect(sx, sy, S, 7);
    ctx.fillStyle = carpetLight;
    ctx.fillRect(sx, sy, S, 1);
    for (let i = 0; i < 6; i++) ctx.fillRect(sx + ((i * 11 + n.tx * 7) % 31), sy + 2 + (i % 3) * 2, 1, 1);
    if (d.id === 'penthouse') {
      // gold carpet runner trim
      ctx.fillStyle = '#c9a24a';
      ctx.fillRect(sx, sy + 1, S, 1);
      ctx.fillRect(sx, sy + 5, S, 1);
    }
    ctx.fillStyle = carpetDark;
    ctx.fillRect(sx, sy + 7, S, 2);
  }
}

function drawCeiling(ctx: CanvasRenderingContext2D, sx: number, sy: number, tx: number): void {
  ctx.fillStyle = getDecor().ceiling;
  ctx.fillRect(sx, sy, S, S);
  ctx.fillStyle = C.ceilingGrid;
  ctx.fillRect(sx, sy + S - 2, S, 2);
  ctx.fillRect(sx, sy, 1, S);

  if (tx % 3 === 1) {
    // fluorescent panel — every 7th one has a dying tube
    const flicker = tx % 7 === 4 && Math.sin(performance.now() / 37) + Math.sin(performance.now() / 113) > 1.2;
    ctx.fillStyle = C.lampFrame;
    ctx.fillRect(sx + 3, sy + S - 10, S - 6, 8);
    ctx.fillStyle = flicker ? C.lampOff : C.lamp;
    ctx.fillRect(sx + 4, sy + S - 9, S - 8, 6);
    ctx.fillStyle = C.lampFrame;
    ctx.fillRect(sx + 4, sy + S - 6, S - 8, 1);
  } else {
    ctx.fillStyle = C.ceilingDot;
    for (let i = 0; i < 8; i++) ctx.fillRect(sx + 3 + ((i * 9) % 26), sy + 8 + ((i * 5) % 18), 1, 1);
  }
}

function drawCabinet(ctx: CanvasRenderingContext2D, sx: number, sy: number): void {
  ctx.fillStyle = C.cabinet;
  ctx.fillRect(sx, sy, S, S);
  ctx.fillStyle = C.cabinetLight;
  ctx.fillRect(sx, sy, S, 2);
  ctx.fillRect(sx, sy, 2, S);
  ctx.fillStyle = C.cabinetDark;
  ctx.fillRect(sx + S - 2, sy, 2, S);
  ctx.fillRect(sx, sy + S - 2, S, 2);
  // two drawers
  for (const dy of [3, 17]) {
    ctx.fillStyle = C.cabinetDark;
    ctx.fillRect(sx + 3, sy + dy, S - 6, 1);
    ctx.fillStyle = C.label;
    ctx.fillRect(sx + 7, sy + dy + 3, 7, 4);
    ctx.fillStyle = C.handle;
    ctx.fillRect(sx + 17, sy + dy + 5, 8, 2);
  }
}

const DESKS: Record<DeskStyle, { top: string; light: string; dark: string; panel: string; panelDark: string }> = {
  metal:    { top: '#8a8f96', light: '#a9aeb5', dark: '#5a5f68', panel: '#6b7078', panelDark: '#4f545c' },
  laminate: { top: '#a8743f', light: '#c99560', dark: '#6e4a26', panel: '#6f7480', panelDark: '#555a64' },
  wood:     { top: '#5e3b1f', light: '#7a5232', dark: '#3e2614', panel: '#4a2e18', panelDark: '#341f10' },
  white:    { top: '#f2f4f5', light: '#ffffff', dark: '#b9c3cb', panel: '#d8dee3', panelDark: '#aeb8c0' },
  steel:    { top: '#4a505a', light: '#6a707a', dark: '#2a2e35', panel: '#3a3f48', panelDark: '#2a2e35' },
  glass:    { top: '#bfe6ec', light: '#e8f8fa', dark: '#7fb8c0', panel: '#ff77a8', panelDark: '#d8558a' },
  marble:   { top: '#f2ede2', light: '#ffffff', dark: '#c9c2b2', panel: '#c9a24a', panelDark: '#a07e2e' },
};

export function drawOfficePlatform(ctx: CanvasRenderingContext2D, sx: number, sy: number, tx = 0): void {
  const style = getDecor().desk;
  const D = DESKS[style];
  // desk top
  ctx.fillStyle = D.top;
  ctx.fillRect(sx, sy, S, 6);
  ctx.fillStyle = D.light;
  ctx.fillRect(sx, sy, S, 2);
  ctx.fillStyle = D.dark;
  ctx.fillRect(sx, sy + 5, S, 1);

  switch (style) {
    case 'glass':
      // see-through top on chrome legs, Memphis-pink crossbar
      ctx.fillStyle = '#c9ced6';
      ctx.fillRect(sx + 2, sy + 6, 2, 10); ctx.fillRect(sx + S - 4, sy + 6, 2, 10);
      ctx.fillStyle = D.panel;
      ctx.fillRect(sx + 4, sy + 11, S - 8, 2);
      break;
    case 'marble':
      // veined marble slab on a gold plinth
      ctx.fillStyle = '#b8b0a2';
      ctx.fillRect(sx + 6, sy + 2, 9, 1); ctx.fillRect(sx + 18, sy + 3, 7, 1);
      ctx.fillStyle = D.panel;
      ctx.fillRect(sx + 3, sy + 6, S - 6, 10);
      ctx.fillStyle = D.panelDark;
      ctx.fillRect(sx + 3, sy + 14, S - 6, 2);
      ctx.fillStyle = '#f0d27a';
      ctx.fillRect(sx + 3, sy + 6, S - 6, 1);
      break;
    case 'metal':
    case 'steel':
      // drawer pedestal with riveted edges
      ctx.fillStyle = D.panel;
      ctx.fillRect(sx + 1, sy + 6, S - 2, 10);
      ctx.fillStyle = D.panelDark;
      ctx.fillRect(sx + 1, sy + 14, S - 2, 2);
      ctx.fillStyle = D.light;
      for (const x of [4, S - 6]) ctx.fillRect(sx + x, sy + 8, 2, 1);
      ctx.fillRect(sx + S / 2 - 4, sy + 10, 8, 1);
      break;
    default:
      // modesty panel
      ctx.fillStyle = D.panel;
      ctx.fillRect(sx + 1, sy + 6, S - 2, 10);
      ctx.fillStyle = D.panelDark;
      ctx.fillRect(sx + 1, sy + 14, S - 2, 2);
      ctx.fillRect(sx + S / 2, sy + 6, 1, 8);
  }
  safetyEdge(ctx, sx, sy, S, tx);
}

/** Basement hazard: a pool of leaked water under a broken, dripping pipe. */
function drawLeak(ctx: CanvasRenderingContext2D, sx: number, sy: number, tx: number): void {
  const t = performance.now();
  // the burst pipe end on the wall, right above the pool
  ctx.fillStyle = '#5a5f68';
  ctx.fillRect(sx + 6, 36, 20, 5);
  ctx.fillStyle = '#3a3f48';
  ctx.fillRect(sx + 24, 35, 3, 7);
  // falling drips (the pool is in the ground row; drips fall the whole way)
  ctx.fillStyle = '#9fd8f8';
  for (let k = 0; k < 3; k++) {
    const period = 900 + ((tx * 131 + k * 271) % 500);
    const phase = ((t + k * 337 + tx * 97) % period) / period;
    const y = 42 + phase * (sy + 4 - 42);
    ctx.fillRect(sx + 10 + k * 6, Math.round(y), 1, 3);
  }
  // the pool: dark water, a lighter surface line, rings where drips land
  ctx.fillStyle = '#1f3a52';
  ctx.fillRect(sx, sy + 3, S, S - 3);
  ctx.fillStyle = '#3f6e94';
  ctx.fillRect(sx, sy + 3, S, 2);
  const ring = Math.floor((t / 160 + tx * 3) % 6);
  ctx.fillStyle = '#9fd8f8';
  ctx.fillRect(sx + 14 - ring, sy + 4, 1, 1);
  ctx.fillRect(sx + 14 + ring, sy + 4, 1, 1);
  ctx.fillRect(sx + 4 + ((tx * 5) % 20), sy + 9, 4, 1);
  ctx.fillRect(sx + 18 - ((tx * 3) % 12), sy + 12, 3, 1);
}

export function drawOfficeHazard(ctx: CanvasRenderingContext2D, sx: number, sy: number, tx: number): void {
  if (getDecor().id === 'basement') return drawLeak(ctx, sx, sy, tx);
  if (getDecor().id === 'vents') return drawFan(ctx, sx, sy, tx);
  // A floor gap full of upturned thumbtacks. Hazards sit in the ground row,
  // whose lower half is below the viewport, so the pins live in the top half.
  const [carpet, , carpetDark] = getDecor().carpet;
  ctx.fillStyle = carpetDark;
  ctx.fillRect(sx, sy + 12, S, S - 12);
  ctx.fillStyle = carpet;
  ctx.fillRect(sx, sy + 12, S, 2);
  for (let i = 0; i < 3; i++) {
    const px = sx + 4 + i * 10 + ((tx + i) % 2);
    const color = C.pinColors[(tx + i) % 3];
    ctx.fillStyle = C.pinShadow;
    ctx.fillRect(px - 4, sy + 13, 10, 1);
    ctx.fillStyle = color;
    ctx.fillRect(px - 3, sy + 10, 8, 3);       // cap
    ctx.fillRect(px - 1, sy + 7, 4, 3);        // grip
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(px - 2, sy + 10, 2, 1);       // shine
    ctx.fillStyle = C.pinSteel;
    ctx.fillRect(px, sy + 1, 2, 6);            // needle
    ctx.fillRect(px, sy, 1, 1);                // tip
  }
}

/** A wall of paperwork: bright (it's gameplay — fire burns it), with
 *  slightly crooked sheets, twine and a red URGENT stamp. */
export function drawPaperTile(ctx: CanvasRenderingContext2D, sx: number, sy: number, tx: number, ty: number): void {
  // shadowy gap behind the stack
  ctx.fillStyle = '#4a4438';
  ctx.fillRect(sx, sy, S, S);
  // four bundles of sheets, each nudged sideways a little
  for (let b = 0; b < 4; b++) {
    const nudge = ((tx * 7 + ty * 3 + b * 5) % 5) - 2;
    const y = sy + b * 8;
    ctx.fillStyle = '#fbf8ee';
    ctx.fillRect(sx + 2 + nudge, y, S - 4, 7);
    ctx.fillStyle = '#d9d2bd';
    ctx.fillRect(sx + 2 + nudge, y + 6, S - 4, 1);
    // page edges
    ctx.fillStyle = '#e8e2cf';
    ctx.fillRect(sx + 2 + nudge, y + 2, S - 4, 1);
    ctx.fillRect(sx + 2 + nudge, y + 4, S - 4, 1);
  }
  // twine
  ctx.fillStyle = '#b07a3a';
  ctx.fillRect(sx + 15, sy, 2, S);
  // URGENT stamp on alternate tiles
  if ((tx + ty) % 2 === 0) {
    ctx.fillStyle = '#d83b3b';
    ctx.fillRect(sx + 5, sy + 11, 9, 5);
    ctx.fillStyle = '#fbf8ee';
    ctx.fillRect(sx + 6, sy + 12, 7, 1);
    ctx.fillRect(sx + 6, sy + 14, 5, 1);
  }
  ctx.fillStyle = '#1b1620';
  ctx.fillRect(sx, sy + S - 1, S, 1);
}

/** A slide bullet point projected into the air: a glowing bar with a bullet
 *  and a squiggle of "text". Bright — it's what you stand on in the boss
 *  fight. `first`/`last` = ends of the bar. */
export function drawBulletTile(
  ctx: CanvasRenderingContext2D, sx: number, sy: number, tx: number, first: boolean, last: boolean,
): void {
  const flicker = Math.sin(performance.now() / 90 + sx) > 0.96 ? 0.6 : 1;
  ctx.globalAlpha = flicker;
  ctx.fillStyle = 'rgba(160,220,255,0.35)';
  ctx.fillRect(sx, sy + 3, S, 9);                    // the projected glow
  ctx.fillStyle = '#e8f6ff';
  ctx.fillRect(sx, sy, S, 4);                        // the surface
  ctx.fillStyle = '#7fc4f0';
  ctx.fillRect(sx, sy + 4, S, 1);
  if (first) {
    ctx.fillStyle = '#22336b';
    ctx.fillRect(sx + 3, sy + 6, 4, 4);              // the bullet
  }
  ctx.fillStyle = '#22336b';
  const x0 = first ? sx + 10 : sx;
  const x1 = last ? sx + S - 4 : sx + S;
  for (let x = x0; x < x1; x += 3) ctx.fillRect(x, sy + 7 + ((x >> 2) % 2), 2, 1);
  ctx.globalAlpha = 1;
  safetyEdge(ctx, sx, sy, S, tx);
}

/** Red tape: criss-crossed bright red strands with little SEALED tags.
 *  Bright because it's gameplay (sticky, burnable). */
export function drawTapeTile(ctx: CanvasRenderingContext2D, sx: number, sy: number, tx: number, ty: number): void {
  const sway = Math.round(Math.sin(performance.now() / 700 + tx * 1.3 + ty) * 1.5);
  ctx.fillStyle = 'rgba(216,59,59,0.12)';
  ctx.fillRect(sx, sy, S, S);
  ctx.fillStyle = '#d83b3b';
  // three diagonal strands each way, built from 2×2 steps
  for (let k = 0; k < 3; k++) {
    const o = k * 11 + ((tx * 5 + ty * 3) % 6);
    for (let i = 0; i < S; i += 2) {
      const y1 = (i + o) % S, y2 = (S - 1 - i + o) % S;
      ctx.fillRect(sx + i + sway, sy + y1, 2, 2);
      ctx.fillRect(sx + i - sway, sy + y2, 2, 1);
    }
  }
  ctx.fillStyle = '#8f1f24';
  ctx.fillRect(sx, sy + 15 + sway, S, 1);
  if ((tx + ty * 2) % 3 === 0) {
    // a SEALED tag
    ctx.fillStyle = '#f4f1e6';
    ctx.fillRect(sx + 9, sy + 12 + sway, 12, 7);
    ctx.fillStyle = '#d83b3b';
    ctx.fillRect(sx + 10, sy + 14 + sway, 10, 1);
    ctx.fillRect(sx + 10, sy + 16 + sway, 7, 1);
  }
}

/** The vents' hazard: a floor fan grille, blades spinning underneath. */
function drawFan(ctx: CanvasRenderingContext2D, sx: number, sy: number, tx: number): void {
  ctx.fillStyle = '#1b1620';
  ctx.fillRect(sx, sy + 8, S, S - 8);
  const a = performance.now() / 60 + tx;
  ctx.fillStyle = '#d83b3b';
  for (let k = 0; k < 3; k++) {
    const ang = a + (k * Math.PI * 2) / 3;
    ctx.fillRect(Math.round(sx + 16 + Math.cos(ang) * 8) - 3, Math.round(sy + 20 + Math.sin(ang) * 4) - 1, 6, 3);
  }
  ctx.fillStyle = '#c9ced6';
  for (let x = 1; x < S; x += 5) ctx.fillRect(sx + x, sy + 8, 2, S - 8);   // the grille
  ctx.fillStyle = '#ffd23f';
  ctx.fillRect(sx, sy + 7, S, 2);
}
