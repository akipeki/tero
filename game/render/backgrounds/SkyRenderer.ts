// file: game/render/backgrounds/SkyRenderer.ts

import { VIEWPORT_H, VIEWPORT_W } from '../../constants';
import { getTheme } from '../Theme';

export function drawSky(ctx: CanvasRenderingContext2D): void {
  const theme = getTheme();

  const grad = ctx.createLinearGradient(0, 0, 0, VIEWPORT_H);
  grad.addColorStop(0, theme.sky.top);
  grad.addColorStop(0.55, theme.sky.mid);
  grad.addColorStop(1, theme.sky.bottom);

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H);
}