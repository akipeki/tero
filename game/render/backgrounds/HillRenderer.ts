// file: game/render/backgrounds/HillRenderer.ts
//
// Hill silhouettes are expensive to redraw every frame (~650 path
// vertices each). We bake each variant once per theme into a 2×viewport
// strip and pan that strip via drawImage — many times faster.

import { VIEWPORT_H, VIEWPORT_W } from '../../constants';
import { getTheme } from '../Theme';

const STRIP_W = VIEWPORT_W * 2;

type Variant = 'back' | 'front';

const caches: Record<Variant, { canvas: HTMLCanvasElement | null; theme: string | null }> = {
  back:  { canvas: null, theme: null },
  front: { canvas: null, theme: null },
};

function buildStrip(variant: Variant): HTMLCanvasElement {
  const theme = getTheme();
  const c = document.createElement('canvas');
  c.width = STRIP_W;
  c.height = VIEWPORT_H;
  const ctx = c.getContext('2d')!;

  const baseY = VIEWPORT_H - 60;
  const isBack = variant === 'back';
  const yBase = baseY + (isBack ? 15 : 0);
  const color = isBack ? theme.hills.back : theme.hills.front;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, VIEWPORT_H);
  for (let xi = 0; xi <= STRIP_W; xi += 2) {
    const sy =
      yBase
      - Math.sin(xi * 0.015) * 30
      - Math.sin(xi * 0.028 + 1.2) * 18
      - Math.sin(xi * 0.009 + 0.5) * 22;
    ctx.lineTo(xi, sy);
  }
  ctx.lineTo(STRIP_W, VIEWPORT_H);
  ctx.closePath();
  ctx.fill();

  return c;
}

export function drawHillLayer(
  ctx: CanvasRenderingContext2D,
  offset: number,
  variant: Variant,
): void {
  if (typeof document === 'undefined') return;
  const theme = getTheme();
  const entry = caches[variant];
  if (!entry.canvas || entry.theme !== theme.name) {
    entry.canvas = buildStrip(variant);
    entry.theme = theme.name;
  }

  const scaleOffset = variant === 'back' ? 0.7 : 1;
  // Wrap horizontally so a single strip tiles seamlessly.
  let panX = Math.floor((offset * scaleOffset) % STRIP_W);
  if (panX > 0) panX -= STRIP_W;
  ctx.drawImage(entry.canvas, panX, 0);
  ctx.drawImage(entry.canvas, panX + STRIP_W, 0);
}

export function invalidateHillCache(): void {
  caches.back  = { canvas: null, theme: null };
  caches.front = { canvas: null, theme: null };
}
