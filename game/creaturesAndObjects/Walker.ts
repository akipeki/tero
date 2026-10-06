// file: game/creaturesAndObjects/Walker.ts

import { drawWalkerSprite } from '../render/sprites/WalkerSprite';
import { creaturesAndObjects, type UpdateCtx } from './creaturesAndObjects';
import { stepBody } from '../physics/Physics';
import { overlaps, stompOverlap } from '../physics/AABB';
import { TILE_SIZE } from '../constants';
import type { Player } from './Player';
import { WALKERS, type WalkerSpec, type WalkerVariant } from './enemyKinds';
import { FreedMotion, TIE_COLORS, drawFreedBubble } from './freed';

export class Walker extends creaturesAndObjects {
  facingRight = false;
  private animTimer = 0;
  private animFrame = 0;
  private squashTimer = 0;
  private dying = false;
  private dyingTimer = 0;
  scaleY = 1;
  readonly variant: WalkerVariant;
  private spec: WalkerSpec;
  private freed: FreedMotion | null = null;
  /** Set on the tick this worker is sent home; Game counts it and clears it. */
  sentHome = false;

  constructor(tx: number, ty: number, variant: WalkerVariant = 'clerk') {
    const spec = WALKERS[variant];
    super(tx * TILE_SIZE + (TILE_SIZE - spec.w) / 2, ty * TILE_SIZE - spec.h, spec.w, spec.h);
    this.variant = variant;
    this.spec = spec;
  }

  /** Can still be stomped, burnt or bumped into. */
  get hittable(): boolean { return this.active && !this.dying && !this.freed; }

  update(ctx: UpdateCtx): void {
    if (this.freed) {
      this.freed.update(this, ctx);
      if (this.freed.done) this.active = false;
      return;
    }
    if (this.dying) {
      this.dyingTimer--;
      this.scaleY = Math.max(0.05, this.scaleY - 0.12);
      if (this.dyingTimer <= 0) this.active = false;
      return;
    }

    if (this.spec.speed === 0) {
      // Rooted in place (the plant): gravity only, chomp animation.
      this.vx = 0;
      stepBody(this, ctx.map);
      this.animTimer++;
      return;
    }
    this.vx = this.facingRight ? this.spec.speed : -this.spec.speed;

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
    if (!this.hittable) return false;

    // A raging toddler just bowls you over.
    if (player.isTantrum && overlaps(player, this)) {
      this.defeat(ctx);
      return false;
    }

    // Stomp (unstompable enemies fall through to the hurt check)
    if (this.spec.stompable && player.vy > 0 && stompOverlap(
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
    player.bounce();
    ctx.shake.trigger(4);
    ctx.audio.play('stomp');
    this.defeat(ctx);
  }

  /** Hit by tantrum fire. */
  burn(ctx: UpdateCtx): void {
    if (!this.hittable) return;
    ctx.particles.burst(this.cx, this.cy, 6, '#ffb347', '#6b6470');
    this.defeat(ctx);
  }

  /** People go home; robots and plants just break. */
  private defeat(ctx: UpdateCtx): void {
    if (this.spec.freeable) {
      this.freed = new FreedMotion(this.variant);
      this.sentHome = true;
      this.facingRight = false;
      this.vx = 0;
      ctx.particles.burst(this.cx, this.y + 8, 6, TIE_COLORS[0], TIE_COLORS[1]);
      ctx.audio.play('free');
      return;
    }
    this.dying = true;
    this.dyingTimer = 20;
    this.scaleY = 0.3;
    ctx.particles.burst(this.cx, this.cy, 8, this.spec.burst[0], this.spec.burst[1]);
  }

  draw(ctx: CanvasRenderingContext2D, camX: number): void {
  const freed = this.freed;
  if (freed) ctx.globalAlpha = freed.alpha;
  drawWalkerSprite(ctx, {
    x: this.x,
    y: this.y + (freed?.hop ?? 0),
    freed: freed !== null,
    w: this.w,
    h: this.h,
    camX,
    facingRight: this.facingRight,
    animFrame: this.animFrame,
    dying: this.dying,
    scaleY: this.scaleY,
    variant: this.variant,
    animTick: this.animTimer,
  });
  if (freed) {
    drawFreedBubble(ctx, freed, this, camX);
    ctx.globalAlpha = 1;
  }
}
}
