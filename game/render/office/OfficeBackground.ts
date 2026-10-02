// file: game/render/office/OfficeBackground.ts
//
// Three parallax layers, each pre-rendered once per floor décor:
//   wall     — static: wallpaper, chair rail, wainscot (+ basement pipes)
//   windows  — slow: skyline windows with the floor's blinds, plus a poster,
//              clock, art or chandelier depending on the floor
//   mid      — faster: the cubicle-height strip — cubicles, shelving, glass
//              meeting rooms, binders, lab benches, CCTV, Memphis, marble
// Colours and choices come from decor.ts.

import { VIEWPORT_H, VIEWPORT_W } from '../../constants';
import { Raster } from '../pixel/Raster';
import { drawText, textWidth } from '../pixel/font';
import { getDecor, type Decor, type DecorId } from './decor';

const FAR_FACTOR = 0.15;
const MID_FACTOR = 0.4;
const FAR_W = 640;
const MID_W = 512;
const RAIL_Y = 168;
const MID_TOP = 176;

interface Layers { wall: HTMLCanvasElement; far: HTMLCanvasElement; mid: HTMLCanvasElement }
const cache = new Map<DecorId, Layers>();

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}

function rect(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function circle(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, r: number): void {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}

/** Pixel-font text, stamped via a Raster so it matches the gags. */
function text(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, color: string, scale = 1): void {
  const r = new Raster(textWidth(s, scale) + 1, 5 * scale + 1);
  drawText(r, s, 0, 0, color, scale);
  ctx.drawImage(r.toCanvas(), x, y);
}

// ─── Wall ────────────────────────────────────────────────────────────────────

function buildWall(d: Decor): HTMLCanvasElement {
  const [c, ctx] = canvas(VIEWPORT_W, VIEWPORT_H);
  rect(ctx, d.wall, 0, 0, VIEWPORT_W, RAIL_Y);
  if (d.id === 'basement') {
    // cinder blocks + overhead pipes
    for (let y = 8; y < RAIL_Y; y += 12) {
      rect(ctx, d.wallStripe, 0, y, VIEWPORT_W, 1);
      for (let x = (y / 12) % 2 ? 0 : 20; x < VIEWPORT_W; x += 40) rect(ctx, d.wallStripe, x, y - 11, 1, 11);
    }
    rect(ctx, '#5a5f68', 0, 36, VIEWPORT_W, 5); rect(ctx, '#7a7f88', 0, 36, VIEWPORT_W, 1);
    rect(ctx, '#8a4b2a', 0, 46, VIEWPORT_W, 3);
    for (let x = 60; x < VIEWPORT_W; x += 150) { rect(ctx, '#c8323a', x, 33, 6, 11); rect(ctx, '#5a5f68', x + 1, 30, 4, 3); }
  } else if (d.id === 'executive') {
    // Memphis confetti on teal
    const marks = ['#ff77a8', '#ffd23f', '#1d1d24', '#ffffff'];
    for (let i = 0; i < 140; i++) {
      const x = (i * 97) % VIEWPORT_W, y = 6 + ((i * 53) % (RAIL_Y - 12));
      const m = marks[i % 4];
      if (i % 3 === 0) rect(ctx, m, x, y, 3, 1);
      else if (i % 3 === 1) { rect(ctx, m, x, y, 1, 1); rect(ctx, m, x + 2, y + 1, 1, 1); rect(ctx, m, x + 4, y, 1, 1); }
      else rect(ctx, m, x, y, 2, 2);
    }
  } else {
    // pinstripe wallpaper (damask-ish double stripe in Legal)
    for (let x = 0; x < VIEWPORT_W; x += 8) rect(ctx, d.wallStripe, x, 0, 1, RAIL_Y);
    if (d.id === 'legal') for (let x = 4; x < VIEWPORT_W; x += 8) rect(ctx, d.wallStripe, x, 0, 1, RAIL_Y);
  }
  // chair rail
  rect(ctx, d.rail, 0, RAIL_Y, VIEWPORT_W, 4);
  rect(ctx, d.railLight, 0, RAIL_Y, VIEWPORT_W, 1);
  // wainscot panels
  rect(ctx, d.wainscot, 0, RAIL_Y + 4, VIEWPORT_W, VIEWPORT_H - RAIL_Y - 4);
  for (let x = 0; x < VIEWPORT_W; x += 40) {
    rect(ctx, d.wainscotPanel, x + 4, RAIL_Y + 10, 32, 60);
    rect(ctx, d.wainscotLight, x + 4, RAIL_Y + 10, 32, 1);
  }
  return c;
}

// ─── Windows strip ───────────────────────────────────────────────────────────

function buildFar(d: Decor): HTMLCanvasElement {
  const [c, ctx] = canvas(FAR_W, VIEWPORT_H);
  const ww = Math.round(96 * d.windowScale);
  const wh = Math.round(92 * d.windowScale);
  const wy = Math.max(26, 44 - Math.round((wh - 92) / 2));
  const frame = d.id === 'penthouse' ? '#c9a24a' : d.id === 'boardroom' || d.id === 'legal' ? '#4a2e18' : '#8a8f96';
  const frameLight = d.id === 'penthouse' ? '#f0d27a' : '#b4b9bf';

  for (const wx of [40, 360]) {
    rect(ctx, frame, wx - 4, wy - 4, ww + 8, wh + 8);
    rect(ctx, frameLight, wx - 4, wy - 4, ww + 8, 2);
    const g = ctx.createLinearGradient(0, wy, 0, wy + wh);
    g.addColorStop(0, d.sky[0]);
    g.addColorStop(0.6, d.sky[1]);
    g.addColorStop(1, d.sky[2]);
    ctx.fillStyle = g;
    ctx.fillRect(wx, wy, ww, wh);
    // skyline — from the top floors you look down on most of it
    const sink = d.id === 'penthouse' ? 0.45 : d.id === 'executive' ? 0.25 : 0;
    const towers = [[0, 40], [12, 58], [26, 34], [36, 66], [52, 46], [64, 72], [80, 38], [88, 52]];
    for (const [tx0, th0] of towers) {
      const tx = Math.round(tx0 * d.windowScale), th = Math.round(th0 * d.windowScale * (1 - sink));
      rect(ctx, '#1d2440', wx + tx, wy + wh - th, Math.round(12 * d.windowScale), th);
      for (let yy = wy + wh - th + 4; yy < wy + wh - 4; yy += 6) {
        for (let xx = 2; xx < 10; xx += 4) if ((tx + yy + xx) % 3 === 0) rect(ctx, '#ffd27a', wx + tx + xx, yy, 2, 2);
      }
    }
    rect(ctx, frame, wx + Math.floor(ww / 2) - 1, wy, 3, wh);   // mullion
    // venetian blinds, drawn down to the floor's level
    const blindH = Math.round(wh * d.blinds);
    for (let yy = wy; yy < wy + blindH; yy += 3) rect(ctx, '#e8e4d6', wx, yy, ww, 2);
    if (blindH > 0 && blindH < wh) rect(ctx, '#c9c4b2', wx, wy + blindH, ww, 1);
    if (d.blinds >= 1) {
      // fully shut — one slat bent open, somebody was peeking
      rect(ctx, '#1d2440', wx + 30, wy + 40, 14, 2);
      rect(ctx, '#ffd27a', wx + 36, wy + 40, 2, 1);
    }
    rect(ctx, frameLight, wx - 8, wy + wh + 4, ww + 16, 4);       // sill
  }

  // between the windows
  if (d.poster) {
    const px = 214, py = 52;
    rect(ctx, '#1b1b1b', px - 3, py - 3, 66, 82);
    rect(ctx, '#0d0d0d', px, py, 60, 76);
    ctx.fillStyle = '#4a5d8c';
    ctx.beginPath(); ctx.moveTo(px + 4, py + 50); ctx.lineTo(px + 26, py + 14);
    ctx.lineTo(px + 38, py + 32); ctx.lineTo(px + 46, py + 22); ctx.lineTo(px + 58, py + 50); ctx.fill();
    rect(ctx, '#e8eef5', px + 22, py + 18, 8, 3);
    text(ctx, 'SYNERGY', px + 17, py + 60, '#e9d9a6');
  } else if (d.id === 'legal') {
    // portrait of the founding partner
    rect(ctx, '#c9a24a', 218, 48, 52, 66); rect(ctx, '#2a1f18', 222, 52, 44, 58);
    circle(ctx, '#a8b394', 244, 74, 10); rect(ctx, '#111111', 230, 88, 28, 22);
    rect(ctx, '#e9e6dc', 242, 88, 4, 8); rect(ctx, '#d9d2c4', 234, 62, 20, 5);
    text(ctx, 'FOUNDER', 230, 118, '#c9a24a');
  } else if (d.id === 'executive') {
    // Memphis "art" canvas
    rect(ctx, '#1d1d24', 210, 50, 70, 70); rect(ctx, '#f4f1e6', 213, 53, 64, 64);
    ctx.fillStyle = '#ff77a8'; ctx.beginPath(); ctx.moveTo(220, 110); ctx.lineTo(245, 62); ctx.lineTo(262, 110); ctx.fill();
    circle(ctx, '#ffd23f', 258, 70, 9);
    for (let x = 216; x < 274; x += 6) rect(ctx, '#2f8f8a', x, 96 + ((x / 6) % 2) * 3, 4, 2);
  } else if (d.id === 'penthouse') {
    // gold chandelier
    rect(ctx, '#c9a24a', 249, 0, 2, 26);
    for (const [x, y] of [[226, 30], [238, 36], [250, 38], [262, 36], [274, 30]]) {
      rect(ctx, '#c9a24a', x - 1, 26, 2, y - 26); circle(ctx, '#fff6c8', x, y + 2, 3);
    }
    rect(ctx, '#c9a24a', 224, 26, 54, 2);
  } else if (d.id === 'security') {
    rect(ctx, '#f4f1e6', 212, 60, 66, 24); rect(ctx, '#c8323a', 212, 60, 66, 8);
    text(ctx, 'CCTV', 237, 62, '#ffffff');
    text(ctx, 'ALWAYS ON', 227, 72, '#1b1620');
  }
  if (d.poster || d.id === 'legal' || d.id === 'security' || d.id === 'basement') {
    // the wall clock — forever 4:57
    const cx = 302, cy = d.id === 'basement' ? 90 : 70;
    circle(ctx, '#2b2b2b', cx, cy, 13); circle(ctx, '#f4f1e6', cx, cy, 11);
    ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + 5, cy + 3); ctx.stroke();
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx - 2, cy - 9); ctx.stroke();
    rect(ctx, '#d83b3b', cx, cy, 1, 1);
  }

  // ceiling light glow strip
  for (let x = 20; x < FAR_W; x += 160) rect(ctx, 'rgba(255,250,220,0.35)', x, 0, 80, 3);
  return c;
}

// ─── Cubicle-height strip ────────────────────────────────────────────────────

function buildMid(d: Decor): HTMLCanvasElement {
  const [c, ctx] = canvas(MID_W, VIEWPORT_H);
  const top = MID_TOP, bottom = VIEWPORT_H;
  switch (d.mid) {
    case 'cubicles': midCubicles(ctx, top, bottom); break;
    case 'shelving': midShelving(ctx, top, bottom); break;
    case 'glass':    midGlass(ctx, top, bottom); break;
    case 'binders':  midBinders(ctx, top, bottom); break;
    case 'lab':      midLab(ctx, top, bottom); break;
    case 'monitors': midMonitors(ctx, top, bottom); break;
    case 'memphis':  midMemphis(ctx, top, bottom); break;
    case 'marble':   midMarble(ctx, top, bottom); break;
  }
  return c;
}

function crt(ctx: CanvasRenderingContext2D, mx: number, y: number): void {
  rect(ctx, '#1b1620', mx - 1, y - 1, 30, 24);
  rect(ctx, '#d8cfb8', mx, y, 28, 22);
  rect(ctx, '#efe8d4', mx, y, 28, 2);
  rect(ctx, '#1f3b2a', mx + 4, y + 4, 20, 13);
  rect(ctx, '#46e07a', mx + 6, y + 7, 9, 1);
  rect(ctx, '#46e07a', mx + 6, y + 10, 13, 1);
  rect(ctx, '#46e07a', mx + 6, y + 13, 6, 1);
}

function midCubicles(ctx: CanvasRenderingContext2D, top: number, bottom: number): void {
  for (let x = 0; x < MID_W; x += 64) {
    rect(ctx, '#7a8290', x, top, 64, bottom - top);
    rect(ctx, '#a3abb8', x + 3, top + 5, 58, bottom - top - 5);
    for (let yy = top + 8; yy < bottom; yy += 4) rect(ctx, '#98a0ad', x + 3, yy, 58, 1);
    rect(ctx, '#c9c6bb', x, top, 64, 4);
    rect(ctx, '#e0ddd2', x, top, 64, 1);
  }
  for (const mx of [24, 176, 330, 440]) crt(ctx, mx, top - 22);
  const fx = 110;
  rect(ctx, '#8a4b2a', fx, top - 12, 16, 12);
  for (const [lx, ly, r] of [[8, -22, 9], [2, -30, 7], [14, -32, 7], [8, -40, 6]]) {
    circle(ctx, '#2f6e33', fx + lx, top + ly, r);
    circle(ctx, '#4f9a48', fx + lx - 2, top + ly - 2, r - 3);
  }
  for (const [sx, n] of [[260, 4], [395, 6]]) {
    for (let i = 0; i < n; i++) rect(ctx, i % 2 ? '#f4f1e6' : '#e3dfd2', sx + (i % 2), top - 2 - i * 2, 18, 2);
  }
}

function midShelving(ctx: CanvasRenderingContext2D, top: number, bottom: number): void {
  for (let x = 0; x < MID_W; x += 72) {
    rect(ctx, '#5a5f68', x + 2, top - 30, 3, bottom - top + 30);
    rect(ctx, '#5a5f68', x + 66, top - 30, 3, bottom - top + 30);
    for (const sy of [top - 30, top + 10, top + 50]) {
      rect(ctx, '#8a8f96', x + 2, sy, 67, 3);
      // cardboard boxes and mail bins, with gaps where things went missing
      for (let bx = x + 6; bx < x + 62; bx += 18) {
        if ((bx * 7 + sy) % 5 < 2) continue;
        const h = 10 + ((bx + sy) % 3) * 4;
        rect(ctx, (bx / 18) % 2 ? '#b0874e' : '#9a7340', bx, sy - h, 15, h);
        rect(ctx, '#7a5a32', bx, sy - h, 15, 1);
        if ((bx + sy) % 5 === 0) rect(ctx, '#f4f1e6', bx + 4, sy - h + 3, 7, 3);
      }
    }
  }
}

function midGlass(ctx: CanvasRenderingContext2D, top: number, bottom: number): void {
  for (let x = 0; x < MID_W; x += 128) {
    rect(ctx, '#3e2614', x, top - 40, 128, 4);
    rect(ctx, '#3e2614', x, top - 40, 4, bottom - top + 40);
    // tinted glass with a long table and empty chairs behind it
    rect(ctx, '#9fb8c8', x + 4, top - 36, 124, bottom - top + 36);
    rect(ctx, '#5e3b1f', x + 20, top + 12, 90, 5);
    for (let cx = x + 24; cx < x + 106; cx += 16) rect(ctx, '#1d1d24', cx, top + 2, 8, 10);
    // half-drawn blinds
    for (let yy = top - 36; yy < top - 14; yy += 3) rect(ctx, '#e8e4d6', x + 4, yy, 124, 2);
    rect(ctx, '#d8eef7', x + 10, top - 10, 2, 30);   // glare
  }
}

function midBinders(ctx: CanvasRenderingContext2D, top: number, bottom: number): void {
  const spines = ['#2c4a8a', '#c8323a', '#e8b72f', '#2f6e33', '#f4f1e6', '#1b1620'];
  for (let x = 0; x < MID_W; x += 96) {
    rect(ctx, '#3e2614', x, top - 44, 96, bottom - top + 44);
    for (const sy of [top - 40, top - 10, top + 20, top + 50]) {
      rect(ctx, '#2a1a0e', x + 4, sy, 88, 26);
      for (let bx = x + 6; bx < x + 90; bx += 5) {
        const col = spines[(bx * 7 + sy) % spines.length];
        rect(ctx, col, bx, sy + 4 + ((bx + sy) % 3), 4, 22 - ((bx + sy) % 3));
        rect(ctx, '#f4f1e6', bx + 1, sy + 8, 2, 2);
      }
      rect(ctx, '#5e3b1f', x + 2, sy + 26, 92, 3);
    }
  }
}

function midLab(ctx: CanvasRenderingContext2D, top: number, bottom: number): void {
  for (let x = 0; x < MID_W; x += 128) {
    // whiteboard with an indecipherable plan
    rect(ctx, '#8a8f96', x + 8, top - 42, 70, 44);
    rect(ctx, '#ffffff', x + 10, top - 40, 66, 40);
    ctx.strokeStyle = ['#c8323a', '#2c4a8a', '#2f6e33'][(x / 128) % 3];
    ctx.beginPath(); ctx.moveTo(x + 14, top - 10);
    for (let k = 0; k < 8; k++) ctx.lineTo(x + 18 + k * 7, top - 30 + ((k * 13) % 20));
    ctx.stroke();
    text(ctx, '???', x + 56, top - 36, '#c8323a');
    // lab bench with beakers
    rect(ctx, '#d8dee3', x + 84, top + 4, 40, 4);
    rect(ctx, '#aeb8c0', x + 86, top + 8, 4, bottom - top - 8);
    rect(ctx, '#aeb8c0', x + 118, top + 8, 4, bottom - top - 8);
    for (const [bx, col] of [[88, '#46e07a'], [98, '#ff77a8'], [110, '#3f7fd8']] as const) {
      rect(ctx, '#e8f4fa', x + bx, top - 6, 7, 10);
      rect(ctx, col, x + bx + 1, top - 1, 5, 4);
    }
  }
}

function midMonitors(ctx: CanvasRenderingContext2D, top: number, bottom: number): void {
  rect(ctx, '#2a2e35', 0, top - 48, MID_W, bottom - top + 48);
  for (let x = 4; x < MID_W; x += 36) {
    for (const y of [top - 44, top - 14]) {
      rect(ctx, '#111111', x, y, 32, 26);
      rect(ctx, '#3a4a3a', x + 2, y + 2, 28, 20);
      // grainy CCTV: an empty corridor, a desk, a figure
      for (let k = 0; k < 12; k++) rect(ctx, '#5a6a5a', x + 3 + ((k * 7 + y) % 26), y + 3 + ((k * 5) % 18), 2, 1);
      if ((x + y) % 3 === 0) rect(ctx, '#1b1b1b', x + 14, y + 8, 4, 12);
      rect(ctx, '#c8323a', x + 26, y + 3, 2, 2);   // REC
    }
  }
  rect(ctx, '#4a505a', 0, top + 14, MID_W, 6);      // console desk
}

function midMemphis(ctx: CanvasRenderingContext2D, top: number, bottom: number): void {
  rect(ctx, '#1d1d24', 0, top, MID_W, bottom - top);
  for (let x = 0; x < MID_W; x += 16) {
    rect(ctx, '#ffd23f', x + 2, top + 6 + (x % 32 ? 0 : 4), 6, 2);
    rect(ctx, '#ff77a8', x + 8, top + 18, 2, 2);
    rect(ctx, '#2f8f8a', x + 4, top + 30 + ((x / 16) % 2) * 3, 8, 2);
  }
  rect(ctx, '#ff77a8', 0, top, MID_W, 3);
  // potted palms
  for (const px of [60, 300]) {
    rect(ctx, '#f4f1e6', px, top - 14, 14, 14);
    for (const [dx, dy] of [[-10, -26], [10, -28], [0, -34], [-14, -18], [16, -18]]) {
      ctx.strokeStyle = '#2f6e33'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(px + 7, top - 14); ctx.lineTo(px + 7 + dx, top + dy); ctx.stroke();
    }
    ctx.lineWidth = 1;
  }
}

function midMarble(ctx: CanvasRenderingContext2D, top: number, bottom: number): void {
  rect(ctx, '#ece6d8', 0, top + 10, MID_W, bottom - top - 10);
  for (let x = 0; x < MID_W; x += 40) {
    // balustrade columns with gold caps
    rect(ctx, '#f6f2e8', x + 10, top - 20, 14, 34);
    rect(ctx, '#d9d2c4', x + 21, top - 20, 3, 34);
    rect(ctx, '#c9a24a', x + 8, top - 24, 18, 4);
    rect(ctx, '#c9a24a', x + 8, top + 12, 18, 3);
    rect(ctx, '#b8b0a2', x + 13, top - 10, 6, 1);
  }
  rect(ctx, '#f6f2e8', 0, top - 30, MID_W, 6);
  rect(ctx, '#c9a24a', 0, top - 30, MID_W, 1);
  for (const ux of [100, 340]) {
    // gold urns
    circle(ctx, '#c9a24a', ux, top - 40, 8);
    rect(ctx, '#a07e2e', ux - 3, top - 32, 6, 2);
  }
}

// ─── Draw ────────────────────────────────────────────────────────────────────

function drawRepeating(ctx: CanvasRenderingContext2D, layer: HTMLCanvasElement, offset: number): void {
  const w = layer.width;
  let x = Math.round(((offset % w) + w) % w) - w;
  for (; x < VIEWPORT_W; x += w) ctx.drawImage(layer, x, 0);
}

export function drawOfficeBackground(ctx: CanvasRenderingContext2D, camX: number): void {
  if (typeof document === 'undefined') return;
  const d = getDecor();
  let layers = cache.get(d.id);
  if (!layers) {
    layers = { wall: buildWall(d), far: buildFar(d), mid: buildMid(d) };
    cache.set(d.id, layers);
  }
  ctx.drawImage(layers.wall, 0, 0);
  drawRepeating(ctx, layers.far, -camX * FAR_FACTOR);
  drawRepeating(ctx, layers.mid, -camX * MID_FACTOR);
  // Haze pushes the scenery back so platforms and enemies read first.
  ctx.fillStyle = d.haze;
  ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H);
}
