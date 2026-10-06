// file: game/render/office/OfficeSprites.ts
//
// Office versions of every entity sprite. Rig-drawn characters are rendered
// once to canvases (both facings) and blitted at native size.

import { TILE_SIZE } from '../../constants';
import { drawClerk, drawManager, drawSyncer, HUMAN_FRAME } from '../characters/humans';
import {
  drawGuard, drawRat, drawPig, drawRobot, drawPlant, drawGorilla, drawVampire,
} from '../characters/creatures';
import type { WalkerVariant, HopperVariant } from '../../creaturesAndObjects/enemyKinds';
import { customEnemy, type StripImage } from '../customImages';
import type { Raster } from '../pixel/Raster';
import type { WalkerSpriteProps } from '../sprites/WalkerSprite';
import type { HopperSpriteProps } from '../sprites/HopperSprite';
import type { CoinSpriteProps } from '../sprites/CoinSprite';
import type { MushroomSpriteProps } from '../sprites/MushroomSprite';
import type { QuestionBlockSpriteProps } from '../sprites/QuestionBlockSprite';
import { QUESTION_MARK_GLYPH, drawGlyph } from '../sprites/glyphs';
import { safetyEdge } from './OfficeTiles';
import { isCasualFriday } from '../../Mode';

// ─── Character cache ─────────────────────────────────────────────────────────

interface Facings { right: HTMLCanvasElement; left: HTMLCanvasElement }
const cache = new Map<string, Facings>();

function facings(key: string, make: () => Raster): Facings {
  const cf = isCasualFriday();
  const k = cf ? `cf:${key}` : key;
  let f = cache.get(k);
  if (!f) {
    const r = make();
    f = { right: r.toCanvas(), left: r.flipX().toCanvas() };
    if (cf) f = { right: recolor(f.right, HAWAII_SWAP), left: recolor(f.left, HAWAII_SWAP) };
    cache.set(k, f);
  }
  return f;
}

/** CASUAL FRIDAY: suit fabric → a loud Hawaiian print (the three shades of
 *  each jacket become three clashing colours). */
const HAWAII_SWAP: Record<string, string> = {
  '#3c4558': '#e8456a', '#566179': '#ffd23f', '#272d3b': '#2f9a8a',   // clerk suits
  '#7a6a52': '#ff8c3a', '#978566': '#fff0a0', '#57492f': '#3f7fd8',   // managers
  '#2c3a66': '#3fd84a', '#3f5090': '#ffd23f', '#1d2647': '#d83b3b',   // guards
  '#26305a': '#ff77a8', '#34407a': '#fff0a0', '#181e3c': '#2f9a8a',   // Halvorsen
  '#1d1d24': '#7b3fb8', '#33333f': '#ffd23f', '#101014': '#2f9a8a',   // vampires
};

// ─── Freed: colour comes back ────────────────────────────────────────────────
// Zombie greys → warm skin; glowing red eye sockets → ordinary eyes.
const FREED_SWAP: Record<string, string> = {
  '#a8b394': '#f2c29b', '#c9d1b4': '#ffdcbc', '#76826a': '#c98d66',   // human skin
  '#e6e2ea': '#f2c29b', '#b8b0c4': '#c98d66',                         // vampire pallor
  '#3b2a3f': '#c98d66', '#ff4848': '#1b1620', '#ffd0c0': '#ffffff',   // eyes
};

function hex(r: number, g: number, b: number): string {
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

function recolor(src: HTMLCanvasElement, swap: Record<string, string> = FREED_SWAP): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  const g = c.getContext('2d')!;
  g.drawImage(src, 0, 0);
  const img = g.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const to = swap[hex(d[i], d[i + 1], d[i + 2])];
    if (!to) continue;
    d[i]     = parseInt(to.slice(1, 3), 16);
    d[i + 1] = parseInt(to.slice(3, 5), 16);
    d[i + 2] = parseInt(to.slice(5, 7), 16);
  }
  g.putImageData(img, 0, 0);
  return c;
}

function freedFacings(key: string, make: () => Raster): Facings {
  const k = `freed:${isCasualFriday() ? 'cf:' : ''}${key}`;
  let f = cache.get(k);
  if (!f) {
    const base = facings(key, make);
    f = { right: recolor(base.right), left: recolor(base.left) };
    cache.set(k, f);
  }
  return f;
}

/** Cached left/right canvases for any rig drawing; `freed` gives it the
 *  colour-back recolour. Used by bosses, which are drawn outside the
 *  32×32 human frame. */
export function riggedFacings(key: string, make: () => Raster, freed = false): Facings {
  return freed ? freedFacings(key, make) : facings(key, make);
}

/** Draws a 32×32 human frame with its feet on the hitbox's bottom-centre. */
function blitHuman(
  ctx: CanvasRenderingContext2D, img: Facings, p: { x: number; y: number; w: number; h: number; camX: number; facingRight: boolean; scaleY: number },
): void {
  const footX = Math.round(p.x - p.camX + p.w / 2);
  const footY = Math.round(p.y + p.h);
  ctx.save();
  ctx.translate(footX, footY);
  ctx.scale(1, p.scaleY);
  ctx.drawImage(p.facingRight ? img.right : img.left, -HUMAN_FRAME / 2, -HUMAN_FRAME);
  ctx.restore();
}

/** Draws frame `f` of a custom enemy strip, scaled so a frame is as tall as
 *  the built-in 32px art, feet on the hitbox's bottom-centre. */
function blitCustom(
  ctx: CanvasRenderingContext2D, s: StripImage, f: number,
  p: { x: number; y: number; w: number; h: number; camX: number; facingRight: boolean; scaleY: number },
): void {
  const k = HUMAN_FRAME / s.fh;
  const dw = s.fw * k, dh = HUMAN_FRAME;
  ctx.save();
  ctx.translate(Math.round(p.x - p.camX + p.w / 2), Math.round(p.y + p.h));
  ctx.scale(p.facingRight ? 1 : -1, p.scaleY);
  if (k < 1) { ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; }
  ctx.drawImage(s.img, (f % s.frames) * s.fw, 0, s.fw, s.fh, -dw / 2, -dh, dw, dh);
  ctx.restore();
}

const WALKER_ART: Record<WalkerVariant, (f: number) => Raster> = {
  clerk: drawClerk,
  guard: drawGuard,
  rat:   drawRat,
  pig:   drawPig,
  robot: drawRobot,
  plant: (f) => drawPlant(f % 2 === 1),
  syncer: (f) => drawSyncer(f),
};

const HOPPER_ART: Record<HopperVariant, (air: boolean) => Raster> = {
  manager: drawManager,
  gorilla: drawGorilla,
  vampire: drawVampire,
};

export function drawOfficeWalker(ctx: CanvasRenderingContext2D, p: WalkerSpriteProps): void {
  const variant = p.variant ?? 'clerk';
  // Walk frames follow distance walked, so the feet never skate; the plant
  // stays put and chomps on a timer instead.
  const f = p.dying ? 0
    : variant === 'plant' ? Math.floor((p.animTick ?? 0) / 20) % 2
    : Math.floor(Math.abs(p.x) / 6) % 4;
  const custom = customEnemy(variant);
  if (custom) return blitCustom(ctx, custom, f, p);
  const pick = p.freed ? freedFacings : facings;
  if (p.talking) {
    const tf = Math.floor((p.animTick ?? 0) / 12) % 2;
    return blitHuman(ctx, pick(`syncer-talk${tf}`, () => drawSyncer(tf, true)), p);
  }
  blitHuman(ctx, pick(`${variant}${f}`, () => WALKER_ART[variant](f)), p);
}

export function drawOfficeHopper(ctx: CanvasRenderingContext2D, p: HopperSpriteProps): void {
  const variant = p.variant ?? 'manager';
  const air = p.airborne && !p.dying;
  if (air && p.groundY != null) {
    // shadow on the floor below, shrinking the higher it hops
    const height = p.groundY - (p.y + p.h);
    const w = Math.max(6, Math.round(p.w - height / 4));
    ctx.fillStyle = 'rgba(20,16,24,0.35)';
    ctx.fillRect(Math.round(p.x - p.camX + p.w / 2 - w / 2), p.groundY - 2, w, 3);
  }
  const custom = customEnemy(variant);
  if (custom) return blitCustom(ctx, custom, air ? Math.min(1, custom.frames - 1) : 0, p);
  const pick = p.freed ? freedFacings : facings;
  blitHuman(ctx, pick(`${variant}${air ? 1 : 0}`, () => HOPPER_ART[variant](air)), p);
}

// ─── Floppy disk (coin) ──────────────────────────────────────────────────────

export function drawOfficeCoin(ctx: CanvasRenderingContext2D, p: CoinSpriteProps): void {
  const sx = Math.floor(p.x - p.camX);
  const sy = Math.floor(p.y);
  const W = 14, H = 14;
  if (p.collected) ctx.globalAlpha = Math.max(0, 1 - p.collectAnim / 18);

  // spin = squash horizontally; show the label side only when facing us
  const k = Math.abs(Math.cos(p.spinPhase * Math.PI * 2));
  const w = Math.max(2, Math.round(k * W));
  const x = sx + Math.floor((W - w) / 2);
  const y = sy + 1;
  const bob = Math.round(Math.sin(p.spinPhase * Math.PI * 2) * 1);

  // pickup glow: a warm halo so floppies read as "collect me" on any floor
  ctx.fillStyle = 'rgba(255,226,110,0.75)';
  ctx.fillRect(x - 3, y - 3 + bob, w + 6, H + 6);
  ctx.fillStyle = '#141824';
  ctx.fillRect(x - 1, y - 1 + bob, w + 2, H + 2);
  ctx.fillStyle = '#3f62d8';
  ctx.fillRect(x, y + bob, w, H);
  if (w >= 8) {
    const s = w / W;
    // metal shutter
    ctx.fillStyle = '#c9ced6';
    ctx.fillRect(x + Math.round(3 * s), y + bob, Math.round(8 * s), 5);
    ctx.fillStyle = '#2b3f8c';
    ctx.fillRect(x + Math.round(8 * s), y + 1 + bob, Math.max(1, Math.round(2 * s)), 3);
    // label
    ctx.fillStyle = '#f4f1e6';
    ctx.fillRect(x + Math.round(2 * s), y + 7 + bob, Math.round(10 * s), 6);
    ctx.fillStyle = '#d83b3b';
    ctx.fillRect(x + Math.round(3 * s), y + 9 + bob, Math.round(7 * s), 1);
    ctx.fillStyle = '#6b7280';
    ctx.fillRect(x + Math.round(3 * s), y + 11 + bob, Math.round(5 * s), 1);
  }
  // blinking sparkle
  if (Math.floor(p.spinPhase * 4) % 2 === 0) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx + W + 1, sy - 2, 1, 3);
    ctx.fillRect(sx + W, sy - 1, 3, 1);
  }
  ctx.globalAlpha = 1;
}

// ─── Baby bottle of coffee (power-up) ────────────────────────────────────────

export function drawOfficeMug(ctx: CanvasRenderingContext2D, p: MushroomSpriteProps): void {
  const sx = Math.floor(p.x - p.camX);
  const sy = Math.floor(p.y);
  ctx.save();
  if (p.collected) ctx.globalAlpha = Math.max(0, 1 - p.collectAnim / 20);

  const rect = (c: string, x: number, y: number, w: number, h: number) => {
    ctx.fillStyle = c;
    ctx.fillRect(sx + x, sy + y, w, h);
  };
  // steam curling off the teat
  const t = Math.floor(performance.now() / 180) % 3;
  ctx.fillStyle = 'rgba(240,240,240,0.85)';
  for (let i = 0; i < 2; i++) ctx.fillRect(sx + 8 + i * 4 + ((i + t) % 2), sy - 6 - ((i + t) % 3), 1, 3);

  // outline
  rect('#1b1620', 8, -2, 5, 4);
  rect('#1b1620', 5, 2, 11, 18);
  // rubber teat + collar
  rect('#e0b77a', 9, -1, 3, 3);
  rect('#3f7fd8', 6, 3, 9, 3);
  rect('#7fb0f0', 6, 3, 9, 1);
  // bottle: clear plastic, mostly coffee
  rect('#e8f4fa', 6, 6, 9, 13);
  rect('#6b3f22', 6, 10, 9, 9);
  rect('#8a5a33', 6, 10, 9, 1);
  rect('rgba(255,255,255,0.6)', 7, 7, 1, 11);
  // measuring ticks
  for (const y of [8, 11, 14]) rect('#1b1620', 13, y, 2, 1);
  ctx.restore();
}

// ─── Mystery package box ("?" block) ─────────────────────────────────────────

/** A bright cardboard box with a shipping label: floppy-disk icon and a "?".
 *  Bright on purpose — everything you can hit, stand on or collect is; the
 *  office around it is muted. Once opened it's a dull, empty, torn box. */
export function drawOfficeBox(ctx: CanvasRenderingContext2D, p: QuestionBlockSpriteProps): void {
  const S = TILE_SIZE;
  const sx = Math.floor(p.x - p.camX);
  const sy = Math.floor(p.y + p.bumpOffset);
  const rect = (c: string, x: number, y: number, w: number, h: number) => {
    ctx.fillStyle = c;
    ctx.fillRect(sx + x, sy + y, w, h);
  };

  if (p.state === 'open') {
    rect('#1b1620', 0, 0, S, S);
    rect('#8a6a48', 1, 4, S - 2, S - 5);
    rect('#6e5236', 1, S - 4, S - 2, 3);
    // flaps torn open, nothing inside
    rect('#7a5c3c', 1, 1, 12, 4);
    rect('#7a5c3c', S - 13, 1, 12, 4);
    rect('#3a2a1a', 4, 5, S - 8, 3);
    return;
  }

  rect('#1b1620', 0, 0, S, S);
  rect('#e0a050', 1, 1, S - 2, S - 2);
  rect('#f4c47a', 1, 1, S - 2, 2);
  rect('#f4c47a', 1, 1, 2, S - 2);
  rect('#b0743a', S - 3, 2, 2, S - 3);
  rect('#b0743a', 2, S - 3, S - 3, 2);
  rect('#b0743a', S / 2, 4, 1, 4);                    // flap seam

  // shipping label: floppy disk + a "?" that pulses
  const pulse = p.animFrame === 3 ? 1 : 0;
  rect('#1b1620', 6, 9 - pulse, 20, 16);
  rect('#ffffff', 7, 10 - pulse, 18, 14);
  rect('#2b3f8c', 9, 12 - pulse, 7, 8);               // disk
  rect('#c9ced6', 10, 12 - pulse, 5, 3);
  rect('#f4f1e6', 10, 16 - pulse, 5, 3);
  drawGlyph(ctx, QUESTION_MARK_GLYPH, sx + 18, sy + 13 - pulse, 1, '#e8323a');

  // the same safety tape as every standable surface
  safetyEdge(ctx, sx, sy, S, Math.floor(p.x / S));
}

// ─── Water cooler (checkpoint) ───────────────────────────────────────────────

export function drawOfficeCooler(
  ctx: CanvasRenderingContext2D, x: number, y: number, camX: number, triggered: boolean, wave: number,
): void {
  // Entity box is 8 wide × 64 tall; the cooler stands on its bottom edge.
  const cx = Math.floor(x - camX) + 4;
  const base = Math.floor(y) + TILE_SIZE * 2;
  const bx = cx - 8;

  // cabinet
  ctx.fillStyle = '#1b1620';
  ctx.fillRect(bx - 1, base - 30, 18, 30);
  ctx.fillStyle = '#e6e2d6';
  ctx.fillRect(bx, base - 29, 16, 29);
  ctx.fillStyle = '#c4bfb0';
  ctx.fillRect(bx + 12, base - 29, 4, 29);
  // taps
  ctx.fillStyle = '#d83b3b'; ctx.fillRect(bx + 3, base - 22, 3, 3);
  ctx.fillStyle = '#3f7fd8'; ctx.fillRect(bx + 10, base - 22, 3, 3);
  // drip tray
  ctx.fillStyle = '#8a8f96'; ctx.fillRect(bx + 2, base - 14, 12, 2);
  // status light
  ctx.fillStyle = triggered ? '#46e07a' : '#5a5446';
  ctx.fillRect(bx + 7, base - 27, 2, 2);

  // jug
  const jy = base - 48;
  ctx.fillStyle = '#1b1620';
  ctx.fillRect(bx, jy - 1, 16, 20);
  ctx.fillStyle = triggered ? '#7fc8f0' : '#cfe3ec';
  ctx.fillRect(bx + 1, jy, 14, 18);
  ctx.fillStyle = triggered ? '#4ea6d8' : '#b5ccd6';
  ctx.fillRect(bx + 1, jy + 6, 14, 12);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillRect(bx + 3, jy + 2, 2, 12);
  ctx.fillStyle = '#3f7fd8';
  ctx.fillRect(bx + 5, jy - 4, 6, 4);

  if (triggered) {
    // bubbles glug upward
    ctx.fillStyle = '#e8f6ff';
    for (let i = 0; i < 3; i++) {
      const by = jy + 16 - ((wave * 0.4 + i * 6) % 15);
      ctx.fillRect(bx + 6 + (i % 2) * 3, Math.floor(by), 2, 2);
    }
  }
}

// ─── Elevator (goal) ─────────────────────────────────────────────────────────

export function drawOfficeElevator(
  ctx: CanvasRenderingContext2D, camX: number, x: number, y: number, w: number, h: number, wave: number,
): void {
  const sx = Math.floor(x - camX);
  const bottom = Math.floor(y) + h;
  const dw = 60, dh = 84;
  const dx = sx + Math.floor((w - dw) / 2);
  const dy = bottom - dh;

  // marble surround
  ctx.fillStyle = '#1b1620';
  ctx.fillRect(dx - 9, dy - 25, dw + 18, dh + 25);
  ctx.fillStyle = '#bfb7a6';
  ctx.fillRect(dx - 8, dy - 24, dw + 16, dh + 24);
  ctx.fillStyle = '#d6cfbf';
  ctx.fillRect(dx - 8, dy - 24, dw + 16, 2);
  ctx.fillStyle = '#a69e8b';
  for (const [vx, vy] of [[-4, 8], [dw + 3, 30], [10, -18], [dw - 14, -16]]) ctx.fillRect(dx + vx, dy + vy, 3, 1);

  // floor indicator with blinking ▲
  ctx.fillStyle = '#1b1620';
  ctx.fillRect(dx + dw / 2 - 14, dy - 19, 28, 12);
  const lit = Math.floor(wave / 20) % 2 === 0;
  ctx.fillStyle = lit ? '#ffb347' : '#6b4a20';
  const ax = dx + dw / 2 - 8, ay = dy - 16;
  ctx.fillRect(ax + 2, ay, 1, 1); ctx.fillRect(ax + 1, ay + 1, 3, 1); ctx.fillRect(ax, ay + 2, 5, 1);
  // "12"
  ctx.fillStyle = '#ffb347';
  ctx.fillRect(dx + dw / 2 + 2, dy - 16, 1, 5);
  ctx.fillRect(dx + dw / 2 + 4, dy - 16, 3, 1); ctx.fillRect(dx + dw / 2 + 6, dy - 15, 1, 1);
  ctx.fillRect(dx + dw / 2 + 4, dy - 14, 3, 1); ctx.fillRect(dx + dw / 2 + 4, dy - 13, 1, 1);
  ctx.fillRect(dx + dw / 2 + 4, dy - 12, 3, 1);

  // steel doors
  ctx.fillStyle = '#6b7480';
  ctx.fillRect(dx, dy, dw, dh);
  for (const half of [0, 1]) {
    const hx = dx + 2 + half * (dw / 2);
    ctx.fillStyle = '#a9b3bd';
    ctx.fillRect(hx, dy + 2, dw / 2 - 3, dh - 2);
    ctx.fillStyle = '#c9d1d9';
    ctx.fillRect(hx + 4, dy + 2, 3, dh - 2);
    ctx.fillStyle = '#8b94a0';
    ctx.fillRect(hx + dw / 2 - 6, dy + 2, 1, dh - 2);
  }
  ctx.fillStyle = '#1b1620';
  ctx.fillRect(dx + dw / 2 - 1, dy, 1, dh);

  // call button
  ctx.fillStyle = '#1b1620';
  ctx.fillRect(dx + dw + 2, dy + 36, 5, 10);
  ctx.fillStyle = '#c9c2a8';
  ctx.fillRect(dx + dw + 3, dy + 37, 3, 8);
  ctx.fillStyle = lit ? '#ffb347' : '#d8cfb8';
  ctx.fillRect(dx + dw + 3, dy + 39, 3, 3);
}
