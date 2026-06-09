// file: game/render/sprites/CheckpointSprite.ts

import { TILE_SIZE } from '../../constants';
import { getTheme } from '../Theme';

export function drawCheckpointSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  camX: number,
  triggered: boolean,
  flagWave: number,
): void {
  const theme = getTheme();
  const sx = Math.floor(x - camX);
  const sy = Math.floor(y);
  const poleH = TILE_SIZE * 2;

  // Pole
  ctx.fillStyle = theme.castle.pole;
  ctx.fillRect(sx + 2, sy, 4, poleH);

  // Flag
  const flagColor = triggered ? theme.hills.front : theme.castle.shade;
  ctx.fillStyle = flagColor;
  const wave = triggered ? Math.sin(flagWave * 0.15) * 3 : 0;

  ctx.beginPath();
  ctx.moveTo(sx + 6, sy + 4);
  ctx.lineTo(sx + 22 + wave, sy + 10);
  ctx.lineTo(sx + 6, sy + 16);
  ctx.closePath();
  ctx.fill();
}
