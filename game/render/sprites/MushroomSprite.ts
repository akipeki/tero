// file: game/render/sprites/MushroomSprite.ts

import { getTheme } from '../Theme';

export interface MushroomSpriteProps {
  x: number;
  y: number;
  w: number;
  camX: number;
  collected: boolean;
  collectAnim: number;
}

export function drawMushroomSprite(
  ctx: CanvasRenderingContext2D,
  props: MushroomSpriteProps,
): void {
  const theme = getTheme();

  const sx = Math.floor(props.x - props.camX);
  const sy = Math.floor(props.y);
  const S = props.w;

  ctx.save();

  if (props.collected) {
    ctx.globalAlpha = Math.max(0, 1 - props.collectAnim / 20);
  }

  // Cap
  ctx.fillStyle = theme.mushroom.cap;
  ctx.beginPath();
  ctx.ellipse(sx + S / 2, sy + S / 2, S / 2, S / 2 + 2, 0, Math.PI, 0);
  ctx.fill();

  // Stem
  ctx.fillStyle = theme.mushroom.stem;
  ctx.fillRect(sx + 2, sy + S / 2, S - 4, S / 2);

  // Spots
  ctx.fillStyle = theme.mushroom.spot;
  ctx.fillRect(sx + 4, sy + 3, 4, 4);
  ctx.fillRect(sx + S - 8, sy + 3, 4, 4);

  ctx.restore();
}