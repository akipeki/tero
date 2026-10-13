// file: game/interludes/pixtext.ts
//
// Drawing helpers for the interludes: the game's 3×5 pixel font straight onto
// the canvas (cached per string/colour/scale) and Win95-style windows.
// Every string goes through t(), so interludes speak Finnish too.

import { Raster } from '../render/pixel/Raster';
import { drawText, textWidth } from '../render/pixel/font';
import { t } from '../i18n';

const cache = new Map<string, HTMLCanvasElement>();

function line(text: string, color: string, scale: number): HTMLCanvasElement {
  const key = `${text}|${color}|${scale}`;
  let c = cache.get(key);
  if (!c) {
    const r = new Raster(Math.max(1, textWidth(text, scale)), 5 * scale);
    drawText(r, text, 0, 0, color, scale);
    c = r.toCanvas();
    if (cache.size > 600) cache.clear();
    cache.set(key, c);
  }
  return c;
}

export type Align = 'left' | 'center' | 'right';

/** Draws (translated, upper-cased) text; `\n` breaks lines. Returns the height. */
export function text(
  ctx: CanvasRenderingContext2D, s: string, x: number, y: number,
  color = '#ffffff', scale = 1, align: Align = 'left',
): number {
  const lines = t(s).toUpperCase().split('\n');
  const lh = 7 * scale;
  lines.forEach((l, i) => {
    const c = line(l, color, scale);
    const dx = align === 'center' ? -Math.floor(c.width / 2) : align === 'right' ? -c.width : 0;
    ctx.drawImage(c, Math.round(x + dx), Math.round(y + i * lh));
  });
  return lines.length * lh;
}

/** Width in px of the widest line (after translation). */
export function measure(s: string, scale = 1): number {
  return Math.max(...t(s).toUpperCase().split('\n').map((l) => textWidth(l, scale)));
}

/** Text with a 1 px dark drop shadow. */
export function shadowText(
  ctx: CanvasRenderingContext2D, s: string, x: number, y: number,
  color = '#ffffff', scale = 1, align: Align = 'left', shadow = '#0b0910',
): number {
  text(ctx, s, x + scale, y + scale, shadow, scale, align);
  return text(ctx, s, x, y, color, scale, align);
}

export const W95 = {
  face: '#c0c0c0', light: '#ffffff', shadow: '#808080', dark: '#000000',
  title: '#000080', titleText: '#ffffff', desk: '#008080',
};

/** A raised bevel box (buttons, windows). `pressed` sinks it. */
export function bevel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, pressed = false): void {
  ctx.fillStyle = W95.face; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = pressed ? W95.dark : W95.light;
  ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y, 1, h);
  ctx.fillStyle = pressed ? W95.light : W95.dark;
  ctx.fillRect(x, y + h - 1, w, 1); ctx.fillRect(x + w - 1, y, 1, h);
  ctx.fillStyle = W95.shadow;
  if (!pressed) { ctx.fillRect(x + 1, y + h - 2, w - 2, 1); ctx.fillRect(x + w - 2, y + 1, 1, h - 2); }
}

/** A Win95 window with a title bar; returns the client area's top-left. */
export function win95(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, title: string,
  titleColor = W95.title,
): { cx: number; cy: number } {
  x = Math.round(x); y = Math.round(y);
  bevel(ctx, x, y, w, h);
  ctx.fillStyle = titleColor; ctx.fillRect(x + 3, y + 3, w - 6, 11);
  text(ctx, title, x + 6, y + 6, W95.titleText);
  // the close box
  bevel(ctx, x + w - 14, y + 4, 10, 9);
  text(ctx, 'X', x + w - 10, y + 6, W95.dark);
  return { cx: x + 6, cy: y + 18 };
}

/** A Win95 push button with a centred label. */
export function button(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, label: string, pressed = false): void {
  bevel(ctx, Math.round(x), Math.round(y), w, 13, pressed);
  text(ctx, label, Math.round(x + w / 2) + (pressed ? 1 : 0), Math.round(y) + 4 + (pressed ? 1 : 0), W95.dark, 1, 'center');
}

/** Hash-noise in 0..1 for deterministic sparkle/static. */
export function noise(i: number): number {
  const s = Math.sin(i * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}
