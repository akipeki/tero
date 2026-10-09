// file: game/render/sprites/WalkerSprite.ts

import { getTheme, isOffice } from '../Theme';
import type { WalkerVariant } from '../../creaturesAndObjects/enemyKinds';
import { drawOfficeWalker } from '../office/OfficeSprites';

export interface WalkerSpriteProps {
  x: number;
  y: number;
  w: number;
  h: number;
  camX: number;
  facingRight: boolean;
  animFrame: number;
  dying: boolean;
  scaleY: number;
  /** Sent home: drawn with the colour back in their face. */
  freed?: boolean;
  /** A syncer mid-"quick sync": waving the mug, mouth going. */
  talking?: boolean;
  variant?: WalkerVariant;
  /** Ticks since spawn — drives animations that don't follow movement. */
  animTick?: number;
  /** Just hit by fire: flashes hot (0..1). */
  scorch?: number;
  /** A plant that got a puff of fire: shut tight and sulking. */
  shut?: boolean;
}

export function drawWalkerSprite(
  ctx: CanvasRenderingContext2D,
  props: WalkerSpriteProps,
): void {
  if (isOffice()) return drawOfficeWalker(ctx, props);
  const theme = getTheme();

  const sx = Math.floor(props.x - props.camX + props.w / 2);
  const sy = Math.floor(props.y + props.h / 2);
  const hw = props.w / 2;
  const hh = props.h / 2;

  ctx.save();
  ctx.translate(sx, sy);

  if (!props.facingRight) ctx.scale(-1, 1);
  ctx.scale(1, props.scaleY);

  // Body
  ctx.fillStyle = theme.enemy.body;
  ctx.fillRect(-hw, -hh, props.w, props.h);

  // Top shade
  ctx.fillStyle = theme.enemy.shade;
  ctx.fillRect(-hw, -hh, props.w, Math.round(props.h * 0.4));

  if (!props.dying) {
    // Eye
    ctx.fillStyle = theme.enemy.eye;
    ctx.fillRect(hw - 9, -hh + 4, 5, 5);

    // Pupil
    ctx.fillStyle = theme.enemy.shade;
    ctx.fillRect(hw - 7, -hh + 5, 3, 3);

    // Feet
    const legOff = props.animFrame === 0 ? 2 : -2;
    ctx.fillStyle = theme.enemy.shade;
    ctx.fillRect(-hw, hh - 5 + legOff, hw - 1, 5);
    ctx.fillRect(1, hh - 5 - legOff, hw - 1, 5);
  }

  ctx.restore();
}