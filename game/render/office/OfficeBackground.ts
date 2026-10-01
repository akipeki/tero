// file: game/render/office/OfficeBackground.ts
//
// Three parallax layers, each pre-rendered once to an offscreen canvas:
//   wall      — static: beige wallpaper, mauve chair rail, teal wainscot
//   windows   — slow: dusk skyline windows, a SYNERGY poster, a 4:57 clock
//   cubicles  — faster: partition walls, beige CRTs, a ficus, paper stacks

import { VIEWPORT_H, VIEWPORT_W } from '../../constants';

const FAR_FACTOR = 0.15;
const MID_FACTOR = 0.4;
const FAR_W = 640;
const MID_W = 512;
const RAIL_Y = 168;

let wall: HTMLCanvasElement | null = null;
let far: HTMLCanvasElement | null = null;
let mid: HTMLCanvasElement | null = null;

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

function buildWall(): HTMLCanvasElement {
  const [c, ctx] = canvas(VIEWPORT_W, VIEWPORT_H);
  // wallpaper with faint vertical pinstripe
  rect(ctx, '#d6caae', 0, 0, VIEWPORT_W, RAIL_Y);
  for (let x = 0; x < VIEWPORT_W; x += 8) rect(ctx, '#cfc2a4', x, 0, 1, RAIL_Y);
  // chair rail
  rect(ctx, '#7c3b4a', 0, RAIL_Y, VIEWPORT_W, 4);
  rect(ctx, '#9b5566', 0, RAIL_Y, VIEWPORT_W, 1);
  // dusty teal wainscot
  rect(ctx, '#5f8a86', 0, RAIL_Y + 4, VIEWPORT_W, VIEWPORT_H - RAIL_Y - 4);
  for (let x = 0; x < VIEWPORT_W; x += 40) {
    rect(ctx, '#557d79', x + 4, RAIL_Y + 10, 32, 60);
    rect(ctx, '#6c9894', x + 4, RAIL_Y + 10, 32, 1);
  }
  return c;
}

function buildFar(): HTMLCanvasElement {
  const [c, ctx] = canvas(FAR_W, VIEWPORT_H);

  for (const wx of [40, 360]) {
    const wy = 44, ww = 96, wh = 92;
    // frame
    rect(ctx, '#8a8f96', wx - 4, wy - 4, ww + 8, wh + 8);
    rect(ctx, '#b4b9bf', wx - 4, wy - 4, ww + 8, 2);
    // dusk sky
    const g = ctx.createLinearGradient(0, wy, 0, wy + wh);
    g.addColorStop(0, '#2b3a67');
    g.addColorStop(0.6, '#c46a6a');
    g.addColorStop(1, '#f2a65a');
    ctx.fillStyle = g;
    ctx.fillRect(wx, wy, ww, wh);
    // skyline
    const towers = [[0, 40], [12, 58], [26, 34], [36, 66], [52, 46], [64, 72], [80, 38], [88, 52]];
    for (const [tx, th] of towers) {
      rect(ctx, '#1d2440', wx + tx, wy + wh - th, 12, th);
      for (let yy = wy + wh - th + 4; yy < wy + wh - 4; yy += 6) {
        for (let xx = 2; xx < 10; xx += 4) {
          if ((tx + yy + xx) % 3 === 0) rect(ctx, '#ffd27a', wx + tx + xx, yy, 2, 2);
        }
      }
    }
    // mullion + half-drawn venetian blinds
    rect(ctx, '#8a8f96', wx + ww / 2 - 1, wy, 3, wh);
    for (let yy = wy; yy < wy + 26; yy += 3) rect(ctx, '#e8e4d6', wx, yy, ww, 2);
    rect(ctx, '#c9c4b2', wx, wy + 26, ww, 1);
    // sill
    rect(ctx, '#bdb7a3', wx - 8, wy + wh + 4, ww + 16, 4);
  }

  // motivational poster: mountain + "SYNERGY"
  const px = 214, py = 52;
  rect(ctx, '#1b1b1b', px - 3, py - 3, 66, 82);
  rect(ctx, '#0d0d0d', px, py, 60, 76);
  ctx.fillStyle = '#4a5d8c';
  ctx.beginPath(); ctx.moveTo(px + 4, py + 50); ctx.lineTo(px + 26, py + 14);
  ctx.lineTo(px + 38, py + 32); ctx.lineTo(px + 46, py + 22); ctx.lineTo(px + 58, py + 50); ctx.fill();
  rect(ctx, '#e8eef5', px + 22, py + 18, 8, 3);
  drawTinyText(ctx, 'SYNERGY', px + 9, py + 60, '#e9d9a6');

  // wall clock — forever 4:57
  const cx = 302, cy = 70;
  ctx.fillStyle = '#2b2b2b'; ctx.beginPath(); ctx.arc(cx, cy, 13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f4f1e6'; ctx.beginPath(); ctx.arc(cx, cy, 11, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + 5, cy + 3); ctx.stroke();      // hour ≈ 5
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx - 2, cy - 9); ctx.stroke();      // minute ≈ 57
  rect(ctx, '#d83b3b', cx, cy, 1, 1);

  // ceiling light glow strip
  for (let x = 20; x < FAR_W; x += 160) rect(ctx, 'rgba(255,250,220,0.35)', x, 0, 80, 3);
  return c;
}

function buildMid(): HTMLCanvasElement {
  const [c, ctx] = canvas(MID_W, VIEWPORT_H);
  const top = 176;
  const bottom = VIEWPORT_H;

  // partition panels
  for (let x = 0; x < MID_W; x += 64) {
    rect(ctx, '#7a8290', x, top, 64, bottom - top);
    rect(ctx, '#a3abb8', x + 3, top + 5, 58, bottom - top - 5);
    for (let yy = top + 8; yy < bottom; yy += 4) rect(ctx, '#98a0ad', x + 3, yy, 58, 1);
    rect(ctx, '#c9c6bb', x, top, 64, 4);
    rect(ctx, '#e0ddd2', x, top, 64, 1);
  }

  // CRT monitors peeking over the walls
  for (const mx of [24, 176, 330, 440]) {
    rect(ctx, '#1b1620', mx - 1, top - 23, 30, 24);
    rect(ctx, '#d8cfb8', mx, top - 22, 28, 22);
    rect(ctx, '#efe8d4', mx, top - 22, 28, 2);
    rect(ctx, '#1f3b2a', mx + 4, top - 18, 20, 13);
    rect(ctx, '#46e07a', mx + 6, top - 15, 9, 1);
    rect(ctx, '#46e07a', mx + 6, top - 12, 13, 1);
    rect(ctx, '#46e07a', mx + 6, top - 9, 6, 1);
  }

  // ficus in a terracotta pot
  const fx = 110;
  rect(ctx, '#8a4b2a', fx, top - 12, 16, 12);
  rect(ctx, '#a65f37', fx, top - 12, 16, 2);
  for (const [lx, ly, r] of [[8, -22, 9], [2, -30, 7], [14, -32, 7], [8, -40, 6]]) {
    ctx.fillStyle = '#2f6e33'; ctx.beginPath(); ctx.arc(fx + lx, top + ly, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4f9a48'; ctx.beginPath(); ctx.arc(fx + lx - 2, top + ly - 2, r - 3, 0, Math.PI * 2); ctx.fill();
  }

  // paper stacks
  for (const [sx, n] of [[260, 4], [395, 6]]) {
    for (let i = 0; i < n; i++) rect(ctx, i % 2 ? '#f4f1e6' : '#e3dfd2', sx + (i % 2), top - 2 - i * 2, 18, 2);
  }
  return c;
}

/** 3×5 pixel font for the few words painted on the background. */
const GLYPHS: Record<string, string[]> = {
  S: ['111', '100', '111', '001', '111'],
  Y: ['101', '101', '010', '010', '010'],
  N: ['101', '111', '111', '111', '101'],
  E: ['111', '100', '110', '100', '111'],
  R: ['110', '101', '110', '101', '101'],
  G: ['111', '100', '101', '101', '111'],
};
function drawTinyText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string): void {
  ctx.fillStyle = color;
  [...text].forEach((ch, i) => {
    GLYPHS[ch]?.forEach((row, ry) => {
      [...row].forEach((bit, rx) => { if (bit === '1') ctx.fillRect(x + i * 6 + rx, y + ry, 1, 1); });
    });
  });
}

function drawRepeating(ctx: CanvasRenderingContext2D, layer: HTMLCanvasElement, offset: number): void {
  const w = layer.width;
  let x = Math.round(((offset % w) + w) % w) - w;
  for (; x < VIEWPORT_W; x += w) ctx.drawImage(layer, x, 0);
}

export function drawOfficeBackground(ctx: CanvasRenderingContext2D, camX: number): void {
  if (typeof document === 'undefined') return;
  wall ??= buildWall();
  far  ??= buildFar();
  mid  ??= buildMid();
  ctx.drawImage(wall, 0, 0);
  drawRepeating(ctx, far, -camX * FAR_FACTOR);
  drawRepeating(ctx, mid, -camX * MID_FACTOR);
  // Haze pushes the scenery back so platforms and enemies read first.
  ctx.fillStyle = 'rgba(226,218,196,0.28)';
  ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H);
}
