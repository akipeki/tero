// file: game/creaturesAndObjects/Walker.ts

import { drawWalkerSprite } from '../render/sprites/WalkerSprite';
import { creaturesAndObjects, type UpdateCtx } from './creaturesAndObjects';
import { stepBody } from '../physics/Physics';
import { isSolidTile } from '../level/Tilemap';
import { overlaps, stompOverlap } from '../physics/AABB';
import { TILE_SIZE } from '../constants';
import type { Player } from './Player';
import { WALKERS, type WalkerSpec, type WalkerVariant } from './enemyKinds';
import { FreedMotion, TIE_COLORS, drawFreedBubble, drawBubble } from './freed';

const SYNC_LINES = ['QUICK SYNC?', 'GOT 5 MINS?', 'LET\'S ALIGN!', 'JUST CIRCLING BACK', 'SO... WEEKEND PLANS?', 'HAVE YOU SEEN MY EMAIL?'];
let syncLine = 0;

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
  /** Ticks left of a quick sync (the syncer stands still and talks). */
  talking = 0;
  private talkLine = '';
  /** Ticks of "?" — they saw a box where a toddler should be. */
  puzzled = 0;
  /** Something to say for a moment ("BRIBE?", "HR!!"). */
  private quip: { text: string; t: number } | null = null;
  /** Ticks of running away from `fleeX` (a tantrum is coming). */
  panic = 0;
  private fleeX = 0;
  /** Ticks of chasing `chaseX` (a guard who wants your badge). */
  chase = 0;
  private chaseX = 0;
  /** Floppies a rat has stolen (dropped when it's sent home). */
  loot = 0;
  /** Ticks until this one can do its job thing again. */
  jobCooldown = 60;

  say(text: string, frames = 70): void { this.quip = { text, t: frames }; }
  /** Ticks left flashing hot after a puff of fire. */
  scorch = 0;

  /** Run from a point (a raging toddler). */
  flee(fromX: number, frames: number): void {
    if (!this.hittable || this.spec.speed === 0) return;
    this.panic = frames;
    this.fleeX = fromX;
    this.talking = 0;
  }

  /** Run towards a point (a guard after your badge). */
  hunt(x: number, frames: number): void {
    if (!this.hittable || this.panic > 0) return;
    this.chase = frames;
    this.chaseX = x;
  }

  /** A little hop (the robot copying Tero's jump). */
  hop(vy = -8.5): void {
    if (this.hittable && this.onGround && this.talking === 0) this.vy = vy;
  }

  constructor(tx: number, ty: number, variant: WalkerVariant = 'clerk') {
    const spec = WALKERS[variant];
    super(tx * TILE_SIZE + (TILE_SIZE - spec.w) / 2, ty * TILE_SIZE - spec.h, spec.w, spec.h);
    this.variant = variant;
    this.spec = spec;
  }

  /** Can still be stomped, burnt or bumped into. */
  get hittable(): boolean { return this.active && !this.dying && !this.freed; }
  /** Line of sight in tiles (0 = doesn't look for Tero). */
  get sightTiles(): number { return this.spec.sees ?? 0; }

  /** Trap Tero in a quick sync: stop, face him, start talking. */
  startTalking(frames: number, faceRight: boolean): void {
    this.talking = frames;
    this.facingRight = faceRight;
    this.talkLine = SYNC_LINES[syncLine++ % SYNC_LINES.length];
  }

  /** Can it see a point at (x, footY) right now? Walls in between block it. */
  canSee(x: number, footY: number, map: UpdateCtx['map']): boolean {
    const reach = this.sightTiles * TILE_SIZE;
    if (!reach || this.talking > 0 || !this.hittable) return false;
    const dx = (x - this.cx) * (this.facingRight ? 1 : -1);
    if (dx < -8 || dx > reach) return false;
    if (Math.abs(footY - this.bottom) > 20) return false;
    const eyeY = this.y + 8;
    const step = Math.sign(x - this.cx) * 8;
    for (let sx = this.cx; step !== 0 && Math.abs(sx - this.cx) < Math.abs(x - this.cx); sx += step) {
      if (isSolidTile(map.tileAtWorld(sx, eyeY))) return false;   // walls and paper block the view
    }
    return true;
  }

  update(ctx: UpdateCtx): void {
    if (this.scorch > 0) this.scorch--;
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

    if (this.puzzled > 0) this.puzzled--;
    if (this.quip && --this.quip.t <= 0) this.quip = null;
    if (this.jobCooldown > 0) this.jobCooldown--;
    if (this.talking > 0) {
      this.talking--;
      this.vx = 0;
      stepBody(this, ctx.map);
      this.animTimer++;
      return;
    }

    if (this.spec.speed === 0) {
      // Rooted in place (the plant): gravity only, chomp animation.
      this.vx = 0;
      stepBody(this, ctx.map);
      this.animTimer++;
      return;
    }
    let speed = this.spec.speed;
    if (this.panic > 0) {
      this.panic--;
      this.facingRight = this.cx > this.fleeX;   // away from the tantrum
      speed = Math.max(speed, 1.2) * 2.2;
    } else if (this.chase > 0) {
      this.chase--;
      if (Math.abs(this.chaseX - this.cx) > 6) this.facingRight = this.chaseX > this.cx;
      speed = 2.4;
    }
    this.vx = this.facingRight ? speed : -speed;

    // Wall check
    const probeX = this.facingRight ? this.right + 1 : this.left - 1;
    const wallHit = ctx.map.solidAt(probeX, this.cy);

    // Cliff check — no floor ahead
    const floorProbeX = this.facingRight ? this.right + 2 : this.left - 2;
    const noFloor = !ctx.map.solidAt(floorProbeX, this.bottom + 4);

    if (wallHit || noFloor) {
      if (this.panic > 0 || this.chase > 0) this.vx = 0;   // cornered: cower / stop at the edge
      else this.facingRight = !this.facingRight;
    }

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

    // Side collision — hurt player (a syncer just wants to talk: Game handles that)
    if (!this.spec.harmless && !player.isInvincible && overlaps(
      { x: player.x + 2, y: player.y + 4, w: player.w - 4, h: player.h - 4 },
      { x: this.x, y: this.y, w: this.w, h: this.h },
    )) {
      player.hurt(ctx, this.variant);
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
  if (!freed && this.talking > 0) drawBubble(ctx, this.talkLine, this.cx - camX, this.y - 3);
  else if (!freed && this.quip) drawBubble(ctx, this.quip.text, this.cx - camX, this.y - 3);
  else if (!freed && this.panic > 0 && this.panic % 40 < 20) drawBubble(ctx, '!', this.cx - camX, this.y - 3);
  else if (!freed && this.puzzled > 0) drawBubble(ctx, '?', this.cx - camX, this.y - 3);
  drawWalkerSprite(ctx, {
    x: this.x,
    y: this.y + (freed?.hop ?? 0),
    freed: freed !== null,
    talking: !freed && this.talking > 0,
    w: this.w,
    h: this.h,
    camX,
    facingRight: this.facingRight,
    animFrame: this.animFrame,
    dying: this.dying,
    scaleY: this.scaleY,
    scorch: this.scorch / 10,
    variant: this.variant,
    animTick: this.animTimer,
  });
  if (freed) {
    drawFreedBubble(ctx, freed, this, camX);
    ctx.globalAlpha = 1;
  }
}
}
