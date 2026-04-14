// file: game/creaturesAndObjects/Walker.ts

import { drawWalkerSprite } from '../render/sprites/WalkerSprite';
import { creaturesAndObjects, type UpdateCtx } from './creaturesAndObjects';
import { stepBody } from '../physics/Physics';
import { overlaps, stompOverlap } from '../physics/AABB';
import { P } from '../palette';
import { TILE_SIZE, ENEMY_SPEED } from '../constants';
import type { Player } from './Player';

export class Walker extends creaturesAndObjects {
  facingRight = false;
  private animTimer = 0;
  private animFrame = 0;
  private squashTimer = 0;
  private dying = false;
  private dyingTimer = 0;
  scaleY = 1;

  constructor(tx: number, ty: number) {
    super(tx * TILE_SIZE + 4, ty * TILE_SIZE - 24, 24, 24);
  }

  update(ctx: UpdateCtx): void {
    if (this.dying) {
      this.dyingTimer--;
      this.scaleY = Math.max(0.05, this.scaleY - 0.12);
      if (this.dyingTimer <= 0) this.active = false;
      return;
    }

    this.vx = this.facingRight ? ENEMY_SPEED : -ENEMY_SPEED;

    // Wall check
    const probeX = this.facingRight ? this.right + 1 : this.left - 1;
    const wallHit = ctx.map.solidAt(probeX, this.cy);

    // Cliff check — no floor ahead
    const floorProbeX = this.facingRight ? this.right + 2 : this.left - 2;
    const noFloor = !ctx.map.solidAt(floorProbeX, this.bottom + 4);

    if (wallHit || noFloor) this.facingRight = !this.facingRight;

    stepBody(this, ctx.map);

    // Animation
    this.animTimer++;
    if (this.animTimer >= 10) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 2;
    }
  }

  /** Returns true if player stomped this enemy */
  checkPlayerInteraction(player: Player, ctx: UpdateCtx): boolean {
    if (this.dying || !this.active) return false;

    // Stomp
    if (player.vy > 0 && stompOverlap(
      { x: player.x, y: player.y, w: player.w, h: player.h },
      player.prevBottom,
      { x: this.x, y: this.y, w: this.w, h: this.h },
    )) {
      this.stomp(ctx, player);
      return true;
    }

    // Side collision — hurt player
    if (!player.isInvincible && overlaps(
      { x: player.x + 2, y: player.y + 4, w: player.w - 4, h: player.h - 4 },
      { x: this.x, y: this.y, w: this.w, h: this.h },
    )) {
      player.hurt(ctx);
    }

    return false;
  }

  private stomp(ctx: UpdateCtx, player: Player): void {
    this.dying = true;
    this.dyingTimer = 20;
    this.scaleY = 0.3;
    player.bounce();
    ctx.particles.burst(this.cx, this.cy, 8, P.ENEMY_RED, P.ENEMY_DARK);
    ctx.shake.trigger(3);
    ctx.audio.play('stomp');
  }

  draw(ctx: CanvasRenderingContext2D, camX: number): void {
  drawWalkerSprite(ctx, {
    x: this.x,
    y: this.y,
    w: this.w,
    h: this.h,
    camX,
    facingRight: this.facingRight,
    animFrame: this.animFrame,
    dying: this.dying,
    scaleY: this.scaleY,
  });
}
}
