// file: game/render/office/bossArt.ts
//
// Art for boss fights: Mr. Halvorsen, his projector screen, the things he
// throws, and the "IN A MEETING" sign that keeps the elevator shut. Gameplay
// objects are bright; the screen is a big readable sign of what slide we're on.

import { Raster } from '../pixel/Raster';
import { drawText, drawTextCentered, textWidth } from '../pixel/font';
import { drawHalvorsen, HALVORSEN_W, HALVORSEN_H, type HalvorsenPose } from '../characters/humans';
import { riggedFacings } from './OfficeSprites';

const INK = '#1b1620';

const canvases = new Map<string, HTMLCanvasElement>();
function cached(key: string, make: () => Raster): HTMLCanvasElement {
  let c = canvases.get(key);
  if (!c) { c = make().toCanvas(); canvases.set(key, c); }
  return c;
}

// ─── Halvorsen ───────────────────────────────────────────────────────────────

/** Feet at (footX, footY) in screen px. */
export function drawHalvorsenAt(
  ctx: CanvasRenderingContext2D, footX: number, footY: number,
  pose: HalvorsenPose, facingRight: boolean, freed: boolean, flash: boolean,
): void {
  const f = riggedFacings(`halvorsen:${pose}`, () => drawHalvorsen(pose), freed);
  if (flash) ctx.globalAlpha *= 0.5;
  ctx.drawImage(facingRight ? f.right : f.left, Math.round(footX - HALVORSEN_W / 2), Math.round(footY - HALVORSEN_H));
  if (flash) ctx.globalAlpha *= 2;
}

// ─── Projector screen ────────────────────────────────────────────────────────

/** Wraps `title` into lines of at most `max` characters. */
function wrap(title: string, max: number): string[] {
  const lines: string[] = [];
  let cur = '';
  for (const w of title.split(' ')) {
    if (cur && (cur + ' ' + w).length > max) { lines.push(cur); cur = w; }
    else cur = cur ? cur + ' ' + w : w;
  }
  if (cur) lines.push(cur);
  return lines;
}

export const SCREEN_W = 200;
export const SCREEN_H = 92;

/** The pull-down screen with the current slide. */
export function drawProjectorScreen(
  ctx: CanvasRenderingContext2D, sx: number, sy: number, header: string, title: string,
): void {
  const c = cached(`screen:${header}:${title}`, () => {
    const r = new Raster(SCREEN_W, SCREEN_H);
    r.rect(0, 0, SCREEN_W, 4, '#5a5f68');                         // the roller
    r.rect(4, 4, SCREEN_W - 8, SCREEN_H - 8, INK);
    r.rect(5, 5, SCREEN_W - 10, SCREEN_H - 10, '#f7f9fb');
    r.rect(5, 5, SCREEN_W - 10, 12, '#22336b');                   // slide header bar
    drawText(r, header, 9, 9, '#ffd23f');
    const lines = wrap(title, 15);
    lines.forEach((l, i) => drawTextCentered(r, l, 5, SCREEN_W - 10, 26 + i * 14, '#22336b', 2));
    // company logo, bottom right: a swoosh going up
    r.line(SCREEN_W - 30, SCREEN_H - 12, SCREEN_W - 14, SCREEN_H - 20, '#d83b3b');
    r.line(SCREEN_W - 30, SCREEN_H - 11, SCREEN_W - 14, SCREEN_H - 19, '#d83b3b');
    r.rect(SCREEN_W / 2 - 1, SCREEN_H - 4, 2, 4, '#5a5f68');      // pull cord
    return r;
  });
  ctx.drawImage(c, Math.round(sx), Math.round(sy));
}

// ─── Projectiles ─────────────────────────────────────────────────────────────

/** A spinning pie chart. `spin` 0..3 picks which way the red slice faces. */
export function drawPie(ctx: CanvasRenderingContext2D, cx: number, cy: number, spin: number): void {
  const c = cached(`pie:${spin}`, () => {
    const r = new Raster(16, 16);
    r.part(INK, (t) => t.ellipse(7.5, 7.5, 6.5, 6.5, '#ffd23f'));
    const [dx, dy] = [[1, 0], [0, 1], [-1, 0], [0, -1]][spin];
    r.tri(7.5, 7.5, 7.5 + dx * 6 - dy * 4, 7.5 + dy * 6 + dx * 4, 7.5 + dx * 6 + dy * 3, 7.5 + dy * 6 - dx * 3, '#d83b3b');
    r.tri(7.5, 7.5, 7.5 - dy * 6, 7.5 + dx * 6, 7.5 - dx * 3 - dy * 5, 7.5 - dy * 3 + dx * 5, '#3f7fd8');
    return r;
  });
  ctx.drawImage(c, Math.round(cx - 8), Math.round(cy - 8));
}

/** A falling "?" from the Q&A. */
export function drawQuestion(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  const c = cached('question', () => {
    const r = new Raster(14, 16);
    r.rect(1, 1, 12, 14, INK);
    r.rect(2, 2, 10, 12, '#ff77a8');
    drawText(r, '?', 3, 3, '#ffffff', 2);
    return r;
  });
  ctx.drawImage(c, Math.round(cx - 7), Math.round(cy - 8));
}

/** The laser-pointer dot on the floor, plus its beam from the clicker. */
export function drawLaser(
  ctx: CanvasRenderingContext2D, fromX: number, fromY: number, dotX: number, dotY: number,
): void {
  ctx.strokeStyle = 'rgba(255,60,60,0.55)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(fromX + 0.5, fromY + 0.5);
  ctx.lineTo(dotX + 0.5, dotY + 0.5);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,60,60,0.35)';
  ctx.fillRect(Math.round(dotX - 6), Math.round(dotY - 3), 12, 6);
  ctx.fillStyle = '#ff3b3b';
  ctx.fillRect(Math.round(dotX - 3), Math.round(dotY - 2), 6, 4);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(Math.round(dotX - 1), Math.round(dotY - 1), 2, 2);
}

// ─── Signs ───────────────────────────────────────────────────────────────────

/** Red "IN A MEETING" sign hung on the elevator doors (centre-top at x, y). */
export function drawMeetingSign(ctx: CanvasRenderingContext2D, cx: number, y: number): void {
  const c = cached('meeting', () => {
    const text = ['IN A', 'MEETING'];
    const w = Math.max(...text.map((t) => textWidth(t))) + 8;
    const r = new Raster(w + 2, 24);
    r.line(Math.floor(w / 2), 0, 3, 6, '#5a5f68');
    r.line(Math.floor(w / 2), 0, w - 2, 6, '#5a5f68');
    r.rect(0, 6, w + 2, 18, INK);
    r.rect(1, 7, w, 16, '#d83b3b');
    text.forEach((t, i) => drawTextCentered(r, t, 1, w, 9 + i * 7, '#ffffff'));
    return r;
  });
  ctx.drawImage(c, Math.round(cx - c.width / 2), Math.round(y));
}
