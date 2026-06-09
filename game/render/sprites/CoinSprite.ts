// file: game/render/sprites/CoinSprite.ts

import { getTheme } from '../Theme';

export interface CoinSpriteProps {
  x: number;
  y: number;
  camX: number;
  spinPhase: number;     // 0..1
  collected: boolean;
  collectAnim: number;
}

export function drawCoinSprite(
  ctx: CanvasRenderingContext2D,
  props: CoinSpriteProps,
): void {
  const theme = getTheme();
  const sx = Math.floor(props.x - props.camX);
  const sy = Math.floor(props.y);
  const w = 14;
  const h = 16;

  if (props.collected) {
    ctx.globalAlpha = Math.max(0, 1 - props.collectAnim / 18);
  }

  // Spin: width pulses between 4 and w
  const spinW = Math.max(3, Math.round(Math.abs(Math.cos(props.spinPhase * Math.PI * 2)) * w));
  const offX = Math.floor((w - spinW) / 2);

  // body
  ctx.fillStyle = theme.block.base;
  ctx.fillRect(sx + offX, sy + 1, spinW, h - 2);

  // edge shade
  ctx.fillStyle = theme.block.border;
  ctx.fillRect(sx + offX, sy + 1, 1, h - 2);
  ctx.fillRect(sx + offX + spinW - 1, sy + 1, 1, h - 2);

  // centre dot
  if (spinW >= 6) {
    ctx.fillStyle = theme.block.symbol;
    ctx.fillRect(sx + offX + Math.floor(spinW / 2) - 1, sy + 6, 2, 4);
  }

  ctx.globalAlpha = 1;
}
