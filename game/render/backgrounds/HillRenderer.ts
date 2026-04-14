// file: game/render/backgrounds/HillRenderer.ts

import { VIEWPORT_H, VIEWPORT_W } from '../../constants';
import { getTheme } from '../Theme';

export function drawHillLayer(
  ctx: CanvasRenderingContext2D,
  offset: number,
  variant: 'back' | 'front',
): void {
  const theme = getTheme();

  const baseY = VIEWPORT_H - 60;
  const repeat = 1300;

  const isBack = variant === 'back';
  const yBase = baseY + (isBack ? 15 : 0);
  const scaleOffset = isBack ? 0.7 : 1;
  const color = isBack ? theme.hills.back : theme.hills.front;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, VIEWPORT_H);

  for (let xi = -repeat; xi <= VIEWPORT_W + repeat; xi += 2) {
    const worldX = xi - ((offset * scaleOffset) % repeat);

    const sy =
      yBase
      - Math.sin(worldX * 0.015) * 30
      - Math.sin(worldX * 0.028 + 1.2) * 18
      - Math.sin(worldX * 0.009 + 0.5) * 22;

    ctx.lineTo(xi, sy);
  }

  ctx.lineTo(VIEWPORT_W, VIEWPORT_H);
  ctx.closePath();
  ctx.fill();
}