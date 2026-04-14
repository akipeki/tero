// file: game/creaturesAndObjects/QuestionBlock.ts

import { creaturesAndObjects, type UpdateCtx } from './creaturesAndObjects';
import { P } from '../palette';
import { TILE_SIZE } from '../constants';
import { Mushroom } from './Mushroom';
import type { Player } from './Player';
import { drawQuestionBlockSprite } from '../render/sprites/QuestionBlockSprite';

type BlockState = 'idle' | 'bump' | 'open';

export class QuestionBlock extends creaturesAndObjects {
  private blockState: BlockState = 'idle';
  private bumpTimer = 0;
  private bumpOffset = 0;
  private animFrame = 0;
  private animTimer = 0;

  readonly tx: number;
  readonly ty: number;

  pendingSpawn: Mushroom | null = null;

  constructor(tx: number, ty: number) {
    super(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    this.tx = tx;
    this.ty = ty;
  }

  checkPlayerHit(player: Player, ctx: UpdateCtx): void {
    if (this.blockState !== 'idle') return;

    const playerHitsBottom =
      player.hitCeiling &&
      player.top <= this.bottom + 2 &&
      player.top >= this.y - 4 &&
      player.right > this.x + 1 &&
      player.left < this.right - 1;

    if (playerHitsBottom) {
      this.hit(ctx, player);
    }
  }

  private hit(ctx: UpdateCtx, player: Player): void {
    this.blockState = 'bump';
    this.bumpTimer = 18;
    ctx.audio.play('block');

    const mushroom = new Mushroom(this.x + 3, this.y - TILE_SIZE);
    this.pendingSpawn = mushroom;
    ctx.particles.burst(this.cx, this.y, 4, P.BLOCK_TAN, P.SUN_GOLD);

    player.vy = Math.max(player.vy, 1);
  }

  update(ctx: UpdateCtx): void {
    void ctx;

    if (this.blockState === 'idle') {
      this.animTimer++;
      if (this.animTimer >= 12) {
        this.animTimer = 0;
        this.animFrame = (this.animFrame + 1) % 4;
      }
      return;
    }

    if (this.blockState === 'bump') {
      this.bumpTimer--;
      const t = 1 - this.bumpTimer / 18;
      this.bumpOffset = -Math.sin(t * Math.PI) * 8;

      if (this.bumpTimer <= 0) {
        this.blockState = 'open';
        this.bumpOffset = 0;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, camX: number): void {
    drawQuestionBlockSprite(ctx, {
      x: this.x,
      y: this.y,
      camX,
      bumpOffset: this.bumpOffset,
      animFrame: this.animFrame,
      state: this.blockState,
    });
  }
}