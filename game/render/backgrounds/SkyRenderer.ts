// file: game/render/backgrounds/SkyRenderer.ts

import { VIEWPORT_H, VIEWPORT_W } from '../../constants';
import { getTheme } from '../Theme';

let cached: HTMLCanvasElement | null = null;
let cachedTheme: string | null = null;

function build(themeName: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = VIEWPORT_W;
  c.height = VIEWPORT_H;
  const ctx = c.getContext('2d')!;
  const theme = getTheme();
  const grad = ctx.createLinearGradient(0, 0, 0, VIEWPORT_H);
  grad.addColorStop(0, theme.sky.top);
  grad.addColorStop(0.55, theme.sky.mid);
  grad.addColorStop(1, theme.sky.bottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H);
  cachedTheme = themeName;
  return c;
}

export function drawSky(ctx: CanvasRenderingContext2D): void {
  const theme = getTheme();
  if (typeof document === 'undefined') {
    // SSR safety: do nothing (Background only ever draws client-side anyway).
    return;
  }
  if (!cached || cachedTheme !== theme.name) {
    cached = build(theme.name);
  }
  ctx.drawImage(cached, 0, 0);
}

export function invalidateSkyCache(): void {
  cached = null;
  cachedTheme = null;
}
