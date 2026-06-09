// file: game/creaturesAndObjects/Hopper.ts
//
// Hopper — a stationary-ish enemy that pauses on the ground, then leaps forward.
// Adds a different timing demand than the Walker.

import { creaturesAndObjects, type UpdateCtx } from './creaturesAndObjects';
import { stepBody } from '../physics/Physics';
import { overlaps, stompOverlap } from '../physics/AABB';
import { TILE_SIZE } from '../constants';
import { P } from '../palette';
import { drawHopperSprite } from '../render/sprites/HopperSprite';
import type { Player } from './Player';

const HOP_INTERVAL_FRAMES = 70;  // ~1.16s at 60fps
const HOP_VY = -8.5;
const HOP_VX = 1.8;

export class Hopper extends creaturesAndObjects {
  facingRight = false;
  private cooldown = 0;
  private dying = false;
  private dyingTimer = 0;
  scaleY = 1;

  constructor(tx: number, ty: number) {
    super(tx * TILE_SIZE + 4, ty * TILE_SIZE - 24, 24, 24);
    this.cooldown = 30 + Math.floor(Math.random() * 40);
  }

  update(ctx: UpdateCtx): void {
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
        this.vy = HOP_VY;
        this.vx = this.facingRight ? HOP_VX : -HOP_VX;
        this.cooldown = HOP_INTERVAL_FRAMES;
      }
    }

    // Pre-emptively turn around if about to hop into a wall
    if (this.onGround && this.cooldown > HOP_INTERVAL_FRAMES - 4) {
      const probeX = this.facingRight ? this.right + 4 : this.left - 4;
      if (ctx.map.solidAt(probeX, this.cy)) this.facingRight = !this.facingRight;
    }

    stepBody(this, ctx.map);
  }

  checkPlayerInteraction(player: Player, ctx: UpdateCtx): boolean {
    if (this.dying || !this.active) return false;

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
    this.dying = true;
    this.dyingTimer = 20;
    this.scaleY = 0.3;
    player.bounce();
    ctx.particles.burst(this.cx, this.cy, 8, P.MUSHROOM, P.ENEMY_DARK);
    ctx.shake.trigger(3);
    ctx.audio.play('stomp');
  }

  draw(ctx: CanvasRenderingContext2D, camX: number): void {
    drawHopperSprite(ctx, {
      x: this.x, y: this.y, w: this.w, h: this.h, camX,
      facingRight: this.facingRight,
      airborne: !this.onGround,
      dying: this.dying,
      scaleY: this.scaleY,
    });
  }
}
