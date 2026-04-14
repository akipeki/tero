// file: game/render/sprites/TileSprites.ts

import { TILE_SIZE } from '../../constants';
import { getTheme } from '../Theme';
import { tileConfig, type TileDot } from './tileConfig';

export function drawSolidTile(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
): void {
  const theme = getTheme();
  const S = TILE_SIZE;
  const cfg = tileConfig.solid;

  // Base
  ctx.fillStyle = theme.ground.base;
  ctx.fillRect(sx, sy, S, S);

  // Top highlight
  ctx.fillStyle = theme.ground.top;
  ctx.fillRect(sx, sy, S, cfg.topHeight);

  // Left highlight
  ctx.fillRect(sx, sy, cfg.leftWidth, S);

  // Right shadow
  ctx.fillStyle = theme.ground.shadow;
  ctx.fillRect(
    sx + S - cfg.rightShadowWidth,
    sy + cfg.leftWidth,
    cfg.rightShadowWidth,
    S - cfg.leftWidth,
  );

  // Bottom shadow
  ctx.fillRect(
    sx + cfg.leftWidth,
    sy + S - cfg.bottomShadowHeight,
    S - cfg.leftWidth * 2,
    cfg.bottomShadowHeight,
  );

  // Pattern dots
  ctx.fillStyle = theme.ground.pattern;

  for (const dot of cfg.dots) {
    const dx = resolveDotX(dot, S);
    const dy = resolveDotY(dot, S);

    ctx.fillRect(sx + dx, sy + dy, cfg.dotSize, cfg.dotSize);
  }
}

export function drawPlatformTile(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
): void {
  const theme = getTheme();
  const S = TILE_SIZE;
  const cfg = tileConfig.platform;

  const bodyH = Math.floor(S * cfg.heightRatio);

  ctx.fillStyle = theme.platform.base;
  ctx.fillRect(sx, sy, S, bodyH);

  ctx.fillStyle = theme.platform.highlight;
  ctx.fillRect(sx, sy, S, cfg.topHighlightHeight);

  ctx.fillStyle = theme.platform.shadow;
  ctx.fillRect(sx, sy + bodyH - cfg.bottomShadowHeight, S, cfg.bottomShadowHeight);
}

export function drawHazardTile(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
): void {
  const theme = getTheme();
  const S = TILE_SIZE;
  const cfg = tileConfig.hazard;

  // Base
  ctx.fillStyle = theme.hazard.base;
  ctx.fillRect(sx, sy + S - cfg.baseHeight, S, cfg.baseHeight);

  // Spikes
  ctx.fillStyle = theme.hazard.spike;

  for (let i = 0; i < cfg.spikeCount; i++) {
    const cx = sx + cfg.spikeInset + i * 10;

    ctx.beginPath();
    ctx.moveTo(cx, sy + 4);
    ctx.lineTo(cx - 5, sy + S - cfg.baseHeight);
    ctx.lineTo(cx + 5, sy + S - cfg.baseHeight);
    ctx.closePath();
    ctx.fill();
  }
}

function resolveDotX(dot: TileDot, tileSize: number): number {
  if (typeof dot.x === 'number') return dot.x;
  if (typeof dot.xFromRight === 'number') return tileSize - dot.xFromRight;
  return 0;
}

function resolveDotY(dot: TileDot, tileSize: number): number {
  if (typeof dot.y === 'number') return dot.y;
  if (typeof dot.yFromBottom === 'number') return tileSize - dot.yFromBottom;
  return 0;
}