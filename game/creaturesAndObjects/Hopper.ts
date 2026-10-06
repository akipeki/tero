// file: game/creaturesAndObjects/Hopper.ts
//
// Hopper — a stationary-ish enemy that pauses on the ground, then leaps forward.
// Adds a different timing demand than the Walker.

import { creaturesAndObjects, type UpdateCtx } from './creaturesAndObjects';
import { stepBody } from '../physics/Physics';
import { overlaps, stompOverlap } from '../physics/AABB';
import { TILE_SIZE } from '../constants';
import { drawHopperSprite } from '../render/sprites/HopperSprite';
import type { Player } from './Player';
import { HOPPERS, type HopperSpec, type HopperVariant } from './enemyKinds';
import { FreedMotion, TIE_COLORS, drawFreedBubble } from './freed';

export class Hopper extends creaturesAndObjects {
  facingRight = false;
  private cooldown = 0;
  private dying = false;
  private dyingTimer = 0;
  scaleY = 1;
  /** World y of the floor under an airborne hopper (for its shadow). */
  private groundY: number | null = null;
  readonly variant: HopperVariant;
  private spec: HopperSpec;
  private freed: FreedMotion | null = null;
  /** Set on the tick this worker is sent home; Game counts it and clears it. */
  sentHome = false;

  constructor(tx: number, ty: number, variant: HopperVariant = 'manager') {
    const spec = HOPPERS[variant];
    super(tx * TILE_SIZE + (TILE_SIZE - spec.w) / 2, ty * TILE_SIZE - spec.h, spec.w, spec.h);
    this.variant = variant;
    this.spec = spec;
    this.cooldown = 30 + Math.floor(Math.random() * 40);
  }

  /** Can still be stomped, burnt or bumped into. */
  get hittable(): boolean { return this.active && !this.dying && !this.freed; }

  update(ctx: UpdateCtx): void {
    if (this.freed) {
      this.freed.update(this, ctx);
      this.groundY = null;
      if (this.freed.done) this.active = false;
      return;
    }
    if (this.dying) {
      this.dyingTimer--;
      this.scaleY = Math.max(0.05, this.scaleY - 0.12);
      if (this.dyingTimer <= 0) this.active = false;
      return;
    }

    if (this.onGround) {
      this.vx *= 0.8;
      if (Math.abs(this.vx) < 0.05) this.vx = 0;

      this.cooldown--;
      if (this.cooldown <= 0) {
        this.vy = this.spec.vy;
        this.vx = this.facingRight ? this.spec.vx : -this.spec.vx;
        this.cooldown = this.spec.interval;
      }
    }

    // Pre-emptively turn around if about to hop into a wall
    if (this.onGround && this.cooldown > this.spec.interval - 4) {
      const probeX = this.facingRight ? this.right + 4 : this.left - 4;
      if (ctx.map.solidAt(probeX, this.cy)) this.facingRight = !this.facingRight;
    }

    stepBody(this, ctx.map);

    // Find the floor below while airborne, so the sprite can drop a shadow
    // there — makes a hop read as a hop, not as floating.
    this.groundY = null;
    if (!this.onGround) {
      for (let y = this.bottom; y < this.bottom + TILE_SIZE * 6; y += 2) {
        if (ctx.map.solidAt(this.cx, y)) { this.groundY = Math.floor(y / TILE_SIZE) * TILE_SIZE; break; }
      }
    }
  }

  checkPlayerInteraction(player: Player, ctx: UpdateCtx): boolean {
    if (!this.hittable) return false;

    // A raging toddler just bowls you over.
    if (player.isTantrum && overlaps(player, this)) {
      this.free(ctx);
      return false;
    }

    if (player.vy > 0 && stompOverlap(
      { x: player.x, y: player.y, w: player.w, h: player.h },
      player.prevBottom,
      { x: this.x, y: this.y, w: this.w, h: this.h },
    )) {
      this.stomp(ctx, player);
      return true;
    }

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
    this.free(ctx);
  }

  /** Hit by tantrum fire. */
  burn(ctx: UpdateCtx): void {
    if (!this.hittable) return;
    ctx.particles.burst(this.cx, this.cy, 6, '#ffb347', '#6b6470');
    this.free(ctx);
  }

  /** Every hopper is a person (or a corporate creature) — they all go home. */
  private free(ctx: UpdateCtx): void {
    this.freed = new FreedMotion(this.variant);
    this.sentHome = true;
    this.facingRight = false;
    ctx.particles.burst(this.cx, this.y + 8, 6, TIE_COLORS[0], TIE_COLORS[1]);
    ctx.audio.play('free');
  }

  draw(ctx: CanvasRenderingContext2D, camX: number): void {
    const freed = this.freed;
    if (freed) ctx.globalAlpha = freed.alpha;
    drawHopperSprite(ctx, {
      x: this.x, y: this.y + (freed?.hop ?? 0), w: this.w, h: this.h, camX,
      freed: freed !== null,
      facingRight: this.facingRight,
      airborne: !this.onGround && !freed,
      dying: this.dying,
      scaleY: this.scaleY,
      variant: this.variant,
      groundY: this.groundY,
    });
    if (freed) {
      drawFreedBubble(ctx, freed, this, camX);
      ctx.globalAlpha = 1;
    }
  }
}
