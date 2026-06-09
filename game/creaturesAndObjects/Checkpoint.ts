// file: game/creaturesAndObjects/Checkpoint.ts

import { creaturesAndObjects, type UpdateCtx } from './creaturesAndObjects';
import { overlaps } from '../physics/AABB';
import { TILE_SIZE } from '../constants';
import { drawCheckpointSprite } from '../render/sprites/CheckpointSprite';
import type { Player } from './Player';

export class Checkpoint extends creaturesAndObjects {
  triggered = false;
  flagWave = 0;
  readonly tx: number;
  readonly ty: number;

  constructor(tx: number, ty: number) {
    super(tx * TILE_SIZE + 12, ty * TILE_SIZE, 8, TILE_SIZE * 2);
    this.tx = tx;
    this.ty = ty;
  }

  update(ctx: UpdateCtx): void {
    void ctx;
    this.flagWave = (this.flagWave + 1) % 10000;
  }

  /** Returns true if the checkpoint was activated this frame. */
  checkTrigger(player: Player, ctx: UpdateCtx): boolean {
    if (this.triggered) return false;
    if (!overlaps(
      { x: player.x, y: player.y, w: player.w, h: player.h },
      { x: this.x, y: this.y, w: this.w, h: this.h },
    )) return false;
    this.triggered = true;
    // Re-anchor spawn so future deaths return here.
    player.spawnX = this.tx * TILE_SIZE;
    player.spawnY = this.ty * TILE_SIZE - player.h;
    ctx.audio.play('checkpoint');
    return true;
  }

  draw(ctx: CanvasRenderingContext2D, camX: number): void {
    drawCheckpointSprite(ctx, this.x, this.y, camX, this.triggered, this.flagWave);
  }
}
