// file: game/render/office/OfficeTiles.ts
//
// Tile art for the 1990s office. Solid tiles change look with their
// neighbours: carpeted floor on top, acoustic ceiling at the top edge of the
// map, filing cabinets when floating, plain slab underneath.

import { TILE_SIZE } from '../../constants';

const S = TILE_SIZE;

const C = {
  carpet:      '#5b6f8f',
  carpetLight: '#7184a3',
  carpetDark:  '#465874',
  slab:        '#8d8a80',
  slabDark:    '#6f6c63',
  slabLight:   '#a29f94',
  ceiling:     '#e7e3d6',
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
  desk:        '#a8743f',
  deskLight:   '#c99560',
  deskDark:    '#6e4a26',
  panel:       '#6f7480',
  panelDark:   '#555a64',
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

export function drawOfficeSolid(ctx: CanvasRenderingContext2D, sx: number, sy: number, n: SolidNeighbours): void {
  if (n.ty === 0) return drawCeiling(ctx, sx, sy, n.tx);
  if (n.openAbove && n.openBelow) return drawCabinet(ctx, sx, sy);

  // concrete slab with a seam
  ctx.fillStyle = C.slab;
  ctx.fillRect(sx, sy, S, S);
  ctx.fillStyle = C.slabDark;
  ctx.fillRect(sx, sy + S - 2, S, 2);
  ctx.fillRect(sx + S - 2, sy, 2, S);
  ctx.fillStyle = C.slabLight;
  ctx.fillRect(sx + 5, sy + 9, 2, 1);
  ctx.fillRect(sx + 20, sy + 21, 3, 1);

  if (n.openAbove) {
    // carpet with a speckle + baseboard shadow
    ctx.fillStyle = C.carpet;
    ctx.fillRect(sx, sy, S, 7);
    ctx.fillStyle = C.carpetLight;
    ctx.fillRect(sx, sy, S, 1);
    for (let i = 0; i < 6; i++) ctx.fillRect(sx + ((i * 11 + n.tx * 7) % 31), sy + 2 + (i % 3) * 2, 1, 1);
    ctx.fillStyle = C.carpetDark;
    ctx.fillRect(sx, sy + 7, S, 2);
  }
}

function drawCeiling(ctx: CanvasRenderingContext2D, sx: number, sy: number, tx: number): void {
  ctx.fillStyle = C.ceiling;
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

export function drawOfficePlatform(ctx: CanvasRenderingContext2D, sx: number, sy: number): void {
  // desk top
  ctx.fillStyle = C.desk;
  ctx.fillRect(sx, sy, S, 6);
  ctx.fillStyle = C.deskLight;
  ctx.fillRect(sx, sy, S, 2);
  ctx.fillStyle = C.deskDark;
  ctx.fillRect(sx, sy + 5, S, 1);
  // modesty panel
  ctx.fillStyle = C.panel;
  ctx.fillRect(sx + 1, sy + 6, S - 2, 10);
  ctx.fillStyle = C.panelDark;
  ctx.fillRect(sx + 1, sy + 14, S - 2, 2);
  ctx.fillRect(sx + S / 2, sy + 6, 1, 8);
}

export function drawOfficeHazard(ctx: CanvasRenderingContext2D, sx: number, sy: number, tx: number): void {
  // A floor gap full of upturned thumbtacks. Hazards sit in the ground row,
  // whose lower half is below the viewport, so the pins live in the top half.
  ctx.fillStyle = C.carpetDark;
  ctx.fillRect(sx, sy + 12, S, S - 12);
  ctx.fillStyle = C.carpet;
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
