// file: game/render/backgrounds/BuildingRenderer.ts

import { VIEWPORT_H, VIEWPORT_W } from '../../constants';
import { getTheme } from '../Theme';

interface BuildingSeed {
  x: number;
  w: number;
  h: number;
}

const BUILDING_SEEDS: BuildingSeed[] = [
  { x: 0, w: 30, h: 60 },
  { x: 60, w: 20, h: 45 },
  { x: 110, w: 40, h: 80 },
  { x: 170, w: 25, h: 55 },
  { x: 220, w: 35, h: 70 },
  { x: 280, w: 15, h: 40 },
  { x: 330, w: 45, h: 90 },
  { x: 400, w: 20, h: 50 },
  { x: 450, w: 30, h: 65 },
  { x: 510, w: 40, h: 85 },
];

const BUILDING_REPEAT_W = 560;

export function drawBuildingLayer(
  ctx: CanvasRenderingContext2D,
  offset: number,
): void {
  const theme = getTheme();
  const groundY = VIEWPORT_H - 30;

  for (let rep = -1; rep <= 2; rep++) {
    const repOff = rep * BUILDING_REPEAT_W + (offset % BUILDING_REPEAT_W);

    for (const b of BUILDING_SEEDS) {
      const sx = b.x + repOff;
      if (sx + b.w < 0 || sx > VIEWPORT_W) continue;

      const sy = groundY - b.h;

      // Body
      ctx.fillStyle = theme.buildings.body;
      ctx.fillRect(sx, sy, b.w, b.h);

      // Battlements
      const merlonW = 5;
      const merlonH = 6;
      for (let m = 0; m < b.w; m += merlonW * 2) {
        ctx.fillRect(sx + m, sy - merlonH, merlonW, merlonH);
      }

      // Window
      if (b.h > 50) {
        ctx.fillStyle = theme.buildings.window;
        ctx.fillRect(sx + b.w / 2 - 3, sy + 10, 6, 8);
      }
    }
  }
}