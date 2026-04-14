// file: game/creaturesAndObjects/Goal.ts

import { creaturesAndObjects, type UpdateCtx } from './creaturesAndObjects';
import { overlaps } from '../physics/AABB';
import { TILE_SIZE } from '../constants';
import type { Player } from './Player';
import { drawCastleSprite, getCastleSize } from '../render/sprites/CastleSprite';

export class Goal extends creaturesAndObjects {
  triggered = false;
  private flagWave = 0;

  constructor(tx: number, ty: number) {
    const size = getCastleSize();
    super(tx * TILE_SIZE - TILE_SIZE, ty * TILE_SIZE, size.width, size.height);
  }

  checkTrigger(player: Player, ctx: UpdateCtx): boolean {
    if (this.triggered) return false;

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
    drawCastleSprite(ctx, camX, this.x, this.y, this.flagWave);
  }
}