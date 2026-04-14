// file: game/render/sprites/WalkerSprite.ts

import { getTheme } from '../Theme';

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
}

export function drawWalkerSprite(
  ctx: CanvasRenderingContext2D,
  props: WalkerSpriteProps,
): void {
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