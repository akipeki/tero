// file: game/render/sprites/CastleSprite.ts

import { TILE_SIZE } from '../../constants';
import { getTheme } from '../Theme';
import { castleConfig } from './castleConfig';

export function getCastleSize() {
  return {
    width: castleConfig.size.widthTiles * TILE_SIZE,
    height: castleConfig.size.heightTiles * TILE_SIZE,
  };
}

export function drawCastleSprite(
  ctx: CanvasRenderingContext2D,
  camX: number,
  x: number,
  y: number,
  flagWave: number,
): void {
  const sx = Math.floor(x - camX);
  const sy = Math.floor(y);

  const { width: W, height: H } = getCastleSize();

  drawCastleBody(ctx, sx, sy, W, H);
  drawBattlements(ctx, sx, sy, W);
  drawCastleShade(ctx, sx, sy, H);
  drawCastleGate(ctx, sx, sy, W, H);
  drawCastleWindows(ctx, sx, sy);
  drawCastleFlag(ctx, sx, sy, W, flagWave);
}

function drawCastleBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const theme = getTheme();

  ctx.fillStyle = theme.castle.body;
  ctx.fillRect(x, y, w, h);
}

function drawBattlements(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
): void {
  const theme = getTheme();
  const { merlonWidth, merlonHeight, gapWidth } = castleConfig.battlements;
  const step = merlonWidth + gapWidth;

  ctx.fillStyle = theme.castle.body;

  for (let dx = 0; dx < width; dx += step) {
    ctx.fillRect(x + dx, y - merlonHeight, merlonWidth, merlonHeight);
  }
}

function drawCastleShade(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  height: number,
): void {
  const theme = getTheme();

  ctx.fillStyle = theme.castle.shade;
  ctx.globalAlpha = 0.25;
  ctx.fillRect(x, y, castleConfig.shade.leftWidth, height);
  ctx.globalAlpha = 1;
}

function drawCastleGate(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const theme = getTheme();
  const gate = castleConfig.gate;
  const gateX = x + width / 2 - gate.width / 2;
  const gateY = y + height - gate.height - gate.insetBottom;

  ctx.fillStyle = theme.castle.gate;
  ctx.fillRect(gateX, gateY, gate.width, gate.height);

  ctx.beginPath();
  ctx.arc(x + width / 2, gateY, gate.archRadius, Math.PI, 0);
  ctx.fill();
}

function drawCastleWindows(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
): void {
  const theme = getTheme();

  ctx.fillStyle = theme.castle.window;

  for (const win of castleConfig.windows) {
    ctx.fillRect(x + win.x, y + win.y, win.w, win.h);
  }
}

function drawCastleFlag(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  flagWave: number,
): void {
  const theme = getTheme();
  const poleX = x + width / 2;
  const poleTopY = y - castleConfig.flag.poleHeight;

  ctx.fillStyle = theme.castle.pole;
  ctx.fillRect(poleX - 1, poleTopY, 2, castleConfig.flag.poleHeight);

  const wave = Math.sin(flagWave * 0.15) * castleConfig.flag.waveAmount;

  ctx.fillStyle = theme.castle.flag;
  ctx.beginPath();
  ctx.moveTo(poleX, poleTopY + 2);
  ctx.lineTo(poleX + castleConfig.flag.width + wave, poleTopY + 8);
  ctx.lineTo(poleX, poleTopY + 14);
  ctx.closePath();
  ctx.fill();
}