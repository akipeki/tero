// file: game/creaturesAndObjects/Goal.ts

import { creaturesAndObjects, type UpdateCtx } from './creaturesAndObjects';
import { overlaps } from '../physics/AABB';
import { TILE_SIZE } from '../constants';
import type { Player } from './Player';
import { drawCastleSprite, getCastleSize } from '../render/sprites/CastleSprite';
import { drawMeetingSign } from '../render/office/bossArt';
import { drawVentHole, drawOutOfOrder } from '../render/office/ventArt';

export class Goal extends creaturesAndObjects {
  triggered = false;
  /** A boss floor keeps the elevator shut until the boss is beaten. */
  locked = false;
  kind: 'elevator' | 'broken' | 'vent' = 'elevator';
  label = '';
  private flagWave = 0;

  constructor(tx: number, ty: number) {
    const size = getCastleSize();
    super(tx * TILE_SIZE - TILE_SIZE, ty * TILE_SIZE, size.width, size.height);
  }

  checkTrigger(player: Player, ctx: UpdateCtx): boolean {
    if (this.triggered || this.locked) return false;

    if (!overlaps(
      { x: player.x, y: player.y, w: player.w, h: player.h },
      { x: this.x + 20, y: this.y, w: this.w - 40, h: this.h },
    )) return false;

    this.triggered = true;
    player.triggerWin();
    ctx.audio.play('goal');
    ctx.particles.confetti(this.cx, this.y + this.h / 2);
    ctx.shake.trigger(3);
    return true;
  }

  update(ctx: UpdateCtx): void {
    void ctx;
    this.flagWave = (this.flagWave + 1) % 10000;
  }

  draw(ctx: CanvasRenderingContext2D, camX: number): void {
    const cx = Math.round(this.x + this.w / 2 - camX);
    const floor = Math.round(this.y + this.h);
    if (this.kind === 'vent') {
      drawVentHole(ctx, cx, floor, this.label || 'THIS WAY');
      return;
    }
    drawCastleSprite(ctx, camX, this.x, this.y, this.flagWave);
    if (this.kind === 'broken') {
      drawOutOfOrder(ctx, cx, floor - 92);
      drawVentHole(ctx, cx, floor, 'PIPE');   // the way on: jump in
    }
    if (this.locked) drawMeetingSign(ctx, Math.round(this.x + this.w / 2 - camX), Math.round(this.y + this.h - 64));
  }
}