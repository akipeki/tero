// file: game/render/sprites/PlayerSprite.ts

import { PlayerState } from '../../types';
import { getTheme } from '../Theme';

export interface PlayerSpriteProps {
  x: number;
  y: number;
  w: number;
  h: number;
  camX: number;
  facingRight: boolean;
  state: PlayerState;
  scaleX: number;
  scaleY: number;
  animFrame: number;
  isBig: boolean;
}

export function drawPlayerSprite(
  ctx: CanvasRenderingContext2D,
  props: PlayerSpriteProps,
): void {
  const theme = getTheme();

  const sx = Math.floor(props.x - props.camX + props.w / 2);
  const sy = Math.floor(props.y + props.h / 2);
  const hw = props.w / 2;
  const hh = props.h / 2;

  ctx.save();
  ctx.translate(sx, sy);

  if (!props.facingRight) ctx.scale(-1, 1);
  ctx.scale(props.scaleX, props.scaleY);

  // Body
  ctx.fillStyle = theme.player.body;
  ctx.fillRect(-hw, -hh, props.w, props.h);

  // Top shade
  ctx.fillStyle = theme.player.shade;
  ctx.fillRect(-hw, -hh, props.w, Math.round(props.h * 0.35));

  // Eye
  ctx.fillStyle = theme.player.eye;
  ctx.fillRect(hw - 8, -hh + 4, 5, 5);

  drawFeet(ctx, props.state, props.animFrame, hw, hh, props.w);

  // Jump arm
  if (props.state === PlayerState.JUMP || props.state === PlayerState.BIG_JUMP) {
    ctx.fillStyle = theme.player.arm;
    ctx.fillRect(hw - 2, -hh + 12, 6, 4);
  }

  ctx.restore();
}

function drawFeet(
  ctx: CanvasRenderingContext2D,
  state: PlayerState,
  animFrame: number,
  hw: number,
  hh: number,
  width: number,
): void {
  const theme = getTheme();
  const isWalk = state === PlayerState.WALK || state === PlayerState.BIG_WALK;

  ctx.fillStyle = theme.player.shade;

  if (!isWalk) {
    ctx.fillRect(-hw, hh - 7, width, 7);
    return;
  }

  const legOffset = Math.sin(animFrame * Math.PI / 2) * 4;
  ctx.fillRect(-hw, hh - 7 + legOffset, hw - 1, 7);
  ctx.fillRect(1, hh - 7 - legOffset, hw - 1, 7);
}