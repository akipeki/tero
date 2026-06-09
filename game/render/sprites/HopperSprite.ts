// file: game/render/sprites/HopperSprite.ts

import { getTheme } from '../Theme';

export interface HopperSpriteProps {
  x: number;
  y: number;
  w: number;
  h: number;
  camX: number;
  facingRight: boolean;
  airborne: boolean;
  dying: boolean;
  scaleY: number;
}

export function drawHopperSprite(
  ctx: CanvasRenderingContext2D,
  props: HopperSpriteProps,
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

  // Body — same red, slightly taller silhouette than walker (visual distinction via shade colour)
  ctx.fillStyle = theme.mushroom.cap;
  ctx.fillRect(-hw, -hh, props.w, props.h);

  // Top shade
  ctx.fillStyle = theme.enemy.shade;
  ctx.fillRect(-hw, -hh, props.w, Math.round(props.h * 0.35));

  if (!props.dying) {
    // Eye
    ctx.fillStyle = theme.enemy.eye;
    ctx.fillRect(hw - 9, -hh + 4, 5, 5);
    ctx.fillStyle = theme.enemy.shade;
    ctx.fillRect(hw - 7, -hh + 5, 3, 3);

    // Legs: tucked when airborne, splayed on ground
    ctx.fillStyle = theme.enemy.shade;
    if (props.airborne) {
      ctx.fillRect(-hw + 1, hh - 4, hw - 2, 4);
      ctx.fillRect(2,        hh - 4, hw - 3, 4);
    } else {
      ctx.fillRect(-hw - 1, hh - 6, hw - 1, 6);
      ctx.fillRect(2,       hh - 6, hw + 1, 6);
    }
  }

  ctx.restore();
}
