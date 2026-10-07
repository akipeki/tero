// file: game/creaturesAndObjects/Player.ts
//
// Player physics, state machine, and squash/stretch.
// Rendering happens via DOM <img> overlay in GameContainer — this class's
// draw() is intentionally empty (the entity loop skips Player anyway).

import { creaturesAndObjects, type UpdateCtx } from './creaturesAndObjects';
import { stepBody } from '../physics/Physics';
import { P } from '../palette';
import {
  TILE_SIZE, GRAVITY, WALK_SPEED, RUN_ACCEL, FRICTION, AIR_FRICTION,
  JUMP_FORCE, JUMP_CUT, STOMP_BOUNCE, COYOTE_TIME, JUMP_BUFFER,
  INVINCIBLE_FRAMES, VIEWPORT_H, DEAD_TIMER_FRAMES,
  TANTRUM_MAX, TANTRUM_FRAMES, TANTRUM_SPEED, RAGE_HURT, RAGE_DEATH, TAPE_SLOW, TAPE_JUMP, GLIDE_FALL,
} from '../constants';
import { PlayerState, Action, TileType } from '../types';

const SMALL_W = 22;
const SMALL_H = 28;
const BIG_W   = 22;
const BIG_H   = 44;
const DUCK_H  = 18;

export class Player extends creaturesAndObjects {
  state: PlayerState = PlayerState.IDLE;
  lives: number;
  isBig = false;
  facingRight = true;
  ducking = false;

  // Game-feel timers
  private coyoteFrames  = 0;
  private jumpBuffer    = 0;
  private invincible    = 0;
  private deadTimer     = 0;
  /** Was jump button held last frame? Used to apply jump-cut only on release edge. */
  private prevJumpHeld  = false;

  // Squash & stretch
  scaleX = 1;
  scaleY = 1;
  private squashTimer = 0;

  // Render interpolation — foot-centre at the start of the latest update.
  // Foot (not top-left) so height changes from duck/grow don't glide.
  prevCx    = 0;
  prevFootY = 0;
  /** Ground distance walked since the player last stood still. Drives the
   *  walk cycle so frames advance with movement, not wall-clock time. */
  walkDistance = 0;

  // Air-time tracking — fed into chain-stomp scoring
  airChain = 0;

  // Stored input from InputHandler
  actions = 0; // Action bitmask
  jumpJustPressed = false;
  jumpHeld = false;
  prevBottom = 0;
  /** True for exactly one frame when player's head hits a ceiling tile */
  hitCeiling = false;

  // ── Tantrum ──
  /** Anger, 0..TANTRUM_MAX. Full = the next FIRE press starts a tantrum. */
  rage = 0;
  /** Ticks of tantrum left (0 = calm). */
  tantrumFrames = 0;
  /** Ticks until the next hiccup puff is allowed. */
  puffCooldown = 0;
  /** Set for one tick when the meter first fills, so Game can announce it. */
  rageJustFilled = false;
  /** Set when Tero takes a hit (or dies); Game reads it for hit-stop. */
  justHurt = false;
  /** Ticks left trapped in a quick sync (can't move; mash jump to leave). */
  syncFrames = 0;
  /** Ticks during which nobody can start another sync with him. */
  syncImmune = 0;
  /** Wading through red tape this tick (slow feet, weak jumps). */
  inTape = false;
  /** "Bring Your Kid to Work Day": no lives lost, pits put you back on the
   *  last safe ground, the meter fills twice as fast. Set by Game. */
  assist = false;
  /** What last hurt Tero (for the playtest log). */
  lastCause = 'unknown';
  /** Last spot he stood safely on (assist mode's pit rescue). */
  private safeX = 0;
  private safeY = 0;
  /** Set for one tick when assist mode rescued him from a pit. */
  rescued = false;
  /** Where he was when he last died (die() then moves him to spawn). */
  deathX = 0;
  deathY = 0;

  /** Riding Elvis (the vents): faster, higher jumps, bumps don't hurt. */
  riding = false;
  /** Set for one tick when a bump knocked him back on Elvis (Elvis yelps). */
  bumped = false;

  /** Picked up the golden parachute on this floor. */
  hasChute = false;
  /** Gliding under it right now (drawn by Game). */
  gliding = false;

  // Respawn anchor — re-pointed by checkpoints
  spawnX = 0;
  spawnY = 0;

  constructor(x: number, y: number, lives: number) {
    super(x, y, SMALL_W, SMALL_H);
    this.lives = lives;
    this.safeX = x;
    this.safeY = y;
    this.syncPrev();
  }

  /** Discard interpolation history — call after any teleport. */
  syncPrev(): void {
    this.prevCx    = this.cx;
    this.prevFootY = this.bottom;
  }

  get isDead()        { return this.state === PlayerState.DEAD; }
  get isHurting()     { return this.invincible > 0; }
  get isWin()         { return this.state === PlayerState.WIN; }
  get isInvincible()  { return this.invincible > 0; }
  get shouldFlash()   { return this.invincible > 0 && Math.floor(this.invincible / 4) % 2 === 0; }
  get isTantrum()     { return this.tantrumFrames > 0; }
  get inSync()        { return this.syncFrames > 0; }
  /** Ducking, still, on the floor: Tero is a cardboard box. Watchers can't see him. */
  get isHidden()      { return this.ducking && this.onGround && Math.abs(this.vx) < 0.6; }

  /** Caught by a syncer. */
  startSync(frames: number): void {
    this.syncFrames = frames;
    this.vx = 0;
    this.setDucking(false);
  }
  get rageFull()      { return this.rage >= TANTRUM_MAX; }

  addRage(amount: number): void {
    if (this.isTantrum) return;   // the meter refills only after the tantrum
    const wasFull = this.rageFull;
    this.rage = Math.min(TANTRUM_MAX, this.rage + amount * (this.assist ? 2 : 1));
    if (!wasFull && this.rageFull) this.rageJustFilled = true;
  }

  /** Spend a full meter. Returns false if it isn't full. */
  startTantrum(): boolean {
    if (!this.rageFull || this.isTantrum || this.isDead) return false;
    this.tantrumFrames = TANTRUM_FRAMES;
    this.rage = 0;
    this.scaleX = 1.3;
    this.scaleY = 0.75;
    this.squashTimer = 10;
    return true;
  }

  /** Called when something hurts Tero. `cause` is what did it (an enemy
   *  variant, 'tacks', 'pit', 'boss'…) — the playtest log records it. */
  hurt(ctx: UpdateCtx, cause = 'unknown'): void {
    if (this.invincible > 0 || this.isTantrum) return;
    if (this.riding && cause !== 'pit') {
      // Elvis takes the bump: a yelp, a bounce back, no harm done.
      this.vx = this.facingRight ? -5 : 5;
      this.vy = -6;
      this.invincible = 50;
      this.bumped = true;
      ctx.audio.play('hurt');
      return;
    }
    this.lastCause = cause;
    this.justHurt = true;
    this.addRage(RAGE_HURT);
    if (this.isBig) {
      this.shrink();
      ctx.shake.trigger(4);
      ctx.audio.play('hurt');
    } else {
      this.die(ctx, cause);
    }
  }

  /** Called by Game when player stomps enemy */
  bounce(): void {
    this.vy = STOMP_BOUNCE;
    this.scaleX = 1.3;
    this.scaleY = 0.7;
    this.squashTimer = 8;
    this.airChain++;
  }

  shrink(): void {
    this.isBig = false;
    this.w = SMALL_W;
    const oldBottom = this.bottom;
    this.h = SMALL_H;
    this.y = oldBottom - SMALL_H;
    this.invincible = INVINCIBLE_FRAMES * (this.assist ? 2 : 1);
    this.setState(PlayerState.HURT_FLASH);
  }

  grow(ctx: UpdateCtx): void {
    this.isBig = true;
    this.w = BIG_W;
    const oldBottom = this.bottom;
    this.h = BIG_H;
    this.y = oldBottom - BIG_H;
    ctx.audio.play('powerup');
    this.scaleX = 0.8;
    this.scaleY = 1.3;
    this.squashTimer = 10;
  }

  die(ctx: UpdateCtx, cause?: string): void {
    if (cause) this.lastCause = cause;
    this.deathX = this.cx;
    this.deathY = this.bottom;
    if (!this.assist) this.lives--;   // Bring Your Kid to Work Day: dying is free
    this.syncFrames = 0;
    this.tantrumFrames = 0;
    this.justHurt = true;
    this.addRage(RAGE_DEATH);
    this.state = PlayerState.DEAD;
    // Snap to spawn so the death bounce plays on solid ground and is visible.
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.syncPrev();
    this.vy = -10;
    this.vx = 0;
    this.deadTimer = DEAD_TIMER_FRAMES;
    ctx.shake.trigger(7);
    ctx.audio.play('death');
    ctx.particles.burst(this.cx, this.cy, 12, P.DRAGON, P.DRAGON_DARK);
  }

  triggerWin(): void {
    this.state = PlayerState.WIN;
    this.vx = 0;
    this.vy = -8;
  }

  respawn(tx: number, ty: number): void {
    this.safeX = tx * TILE_SIZE;
    this.safeY = ty * TILE_SIZE - SMALL_H;
    this.x = tx * TILE_SIZE;
    this.y = ty * TILE_SIZE - SMALL_H;
    this.vx = 0;
    this.vy = 0;
    this.isBig = false;
    this.w = SMALL_W;
    this.h = SMALL_H;
    this.invincible = INVINCIBLE_FRAMES;
    this.onGround = false;
    this.facingRight = true;
    this.ducking = false;
    this.airChain = 0;
    this.walkDistance = 0;
    this.syncPrev();
    this.setState(PlayerState.IDLE);
  }

  update(ctx: UpdateCtx): void {
    this.syncPrev();
    if (this.state === PlayerState.DEAD) {
      this.updateDead();
      return;
    }
    if (this.state === PlayerState.WIN) {
      this.vy = Math.min(this.vy + GRAVITY, 8);
      this.y += this.vy;
      return;
    }

    this.prevBottom = this.bottom;
    this.inTape = this.touchesTape(ctx);
    this.updateTimers();
    this.updateInput();
    this.stepPhysics(ctx);
    if (this.onGround) this.airChain = 0;
    this.updateState();
    this.walkDistance =
      this.state === PlayerState.WALK || this.state === PlayerState.BIG_WALK
        ? this.walkDistance + Math.abs(this.vx)
        : 0;
    this.updateSquash();
    this.prevJumpHeld = this.jumpHeld;
  }

  private updateDead(): void {
    this.vy = Math.min(this.vy + GRAVITY, 14);
    this.y += this.vy;
    this.deadTimer--;
  }

  get deadTimerDone(): boolean {
    return this.state === PlayerState.DEAD && this.deadTimer <= 0;
  }

  private touchesTape(ctx: UpdateCtx): boolean {
    const m = ctx.map;
    return m.tileAtWorld(this.cx, this.cy) === TileType.TAPE ||
      m.tileAtWorld(this.cx, this.bottom - 2) === TileType.TAPE ||
      m.tileAtWorld(this.left + 2, this.bottom - 2) === TileType.TAPE ||
      m.tileAtWorld(this.right - 2, this.bottom - 2) === TileType.TAPE;
  }

  private updateTimers(): void {
    if (this.invincible > 0) this.invincible--;
    if (this.tantrumFrames > 0) this.tantrumFrames--;
    if (this.puffCooldown > 0) this.puffCooldown--;
    if (this.syncImmune > 0) this.syncImmune--;
    if (this.syncFrames > 0 && --this.syncFrames === 0) this.syncImmune = 120;
  }

  private updateInput(): void {
    if (this.syncFrames > 0) {
      // Trapped in a conversation: mash jump to wrap it up faster.
      this.vx *= 0.5;
      if (this.jumpJustPressed) {
        this.syncFrames = Math.max(1, this.syncFrames - 14);
        this.scaleX = 1.15; this.scaleY = 0.9; this.squashTimer = 3;
      }
      return;
    }
    const a = this.actions;

    // Duck (only while grounded and small — Big Tero can't duck through low gaps yet)
    const wantsDuck = (a & Action.DOWN) !== 0 && this.onGround && !this.riding;
    this.setDucking(wantsDuck);

    // Horizontal — ducking halves walk speed
    const maxSpeed = (this.ducking ? WALK_SPEED * 0.4
      : this.isTantrum ? WALK_SPEED * TANTRUM_SPEED
      : WALK_SPEED) * (this.inTape ? TAPE_SLOW : 1) * (this.riding ? 1.45 : 1);
    if (this.inTape) this.vx = Math.max(-maxSpeed, Math.min(maxSpeed, this.vx));
    if (this.inTape && this.vy > 2) this.vy = 2;   // you sink through it slowly

    if (a & Action.LEFT) {
      this.vx = Math.max(this.vx - RUN_ACCEL, -maxSpeed);
      this.facingRight = false;
    } else if (a & Action.RIGHT) {
      this.vx = Math.min(this.vx + RUN_ACCEL, maxSpeed);
      this.facingRight = true;
    } else {
      this.vx *= this.onGround ? FRICTION : AIR_FRICTION;
      if (Math.abs(this.vx) < 0.1) this.vx = 0;
    }

    // Jump buffering
    if (this.jumpJustPressed) this.jumpBuffer = JUMP_BUFFER;
    else if (this.jumpBuffer > 0) this.jumpBuffer--;

    // Coyote time
    if (this.onGround) this.coyoteFrames = COYOTE_TIME;
    else if (this.coyoteFrames > 0) this.coyoteFrames--;

    // Execute jump
    if (this.jumpBuffer > 0 && this.coyoteFrames > 0 && !this.ducking) {
      this.vy = JUMP_FORCE * (this.inTape ? TAPE_JUMP : 1) * (this.riding ? 1.12 : 1);
      this.jumpBuffer = 0;
      this.coyoteFrames = 0;
      this.scaleX = 0.8;
      this.scaleY = 1.25;
      this.squashTimer = 6;
    }

    // Golden parachute: hold jump on the way down to float.
    this.gliding = this.hasChute && !this.onGround && this.jumpHeld && this.vy > 0 && !this.inTape;
    if (this.gliding) this.vy = Math.min(this.vy, GLIDE_FALL - GRAVITY);

    // Variable-height jump — cut velocity ONCE on the release edge.
    // (Applying every frame compounded the cut and made jumps too short.)
    if (this.prevJumpHeld && !this.jumpHeld && this.vy < 0) {
      this.vy *= JUMP_CUT;
    }
  }

  private setDucking(wantsDuck: boolean): void {
    if (wantsDuck === this.ducking) return;
    if (this.isBig) return; // ducking only for small Tero in v1
    if (wantsDuck) {
      const oldBottom = this.bottom;
      this.ducking = true;
      this.h = DUCK_H;
      this.y = oldBottom - DUCK_H;
    } else {
      const oldBottom = this.bottom;
      this.ducking = false;
      this.h = SMALL_H;
      this.y = oldBottom - SMALL_H;
    }
  }

  private stepPhysics(ctx: UpdateCtx): void {
    const { hitCeiling } = stepBody(this, ctx.map);
    this.hitCeiling = hitCeiling;
    if (hitCeiling && this.vy < 0) this.vy = 0;

    // Hazard probe at both foot corners (single-point probe missed straddle cases).
    if (this.y > VIEWPORT_H + 48) {
      if (this.assist) {
        // Bring Your Kid to Work Day: a grown-up lifts you back out.
        this.deathX = this.cx;              // where he fell, for the playtest log
        this.deathY = VIEWPORT_H;
        this.x = this.safeX;
        this.y = this.safeY;
        this.vx = this.vy = 0;
        this.syncPrev();
        this.lastCause = 'pit';
        this.invincible = INVINCIBLE_FRAMES;
        this.rescued = true;
        this.addRage(RAGE_HURT);
        ctx.audio.play('hurt');
        return;
      }
      this.die(ctx, 'pit');   // a pit is fatal, big or raging
      return;
    }
    if (this.onGround && !this.inTape) {
      const below = ctx.map.tileAtWorld(this.cx, this.bottom + 2);
      const edgeL = ctx.map.solidAt(this.left + 1, this.bottom + 2);
      const edgeR = ctx.map.solidAt(this.right - 1, this.bottom + 2);
      if (below !== TileType.HAZARD && edgeL && edgeR) { this.safeX = this.x; this.safeY = this.y; }
    }
    const footY = this.bottom - 1;
    if (
      ctx.map.hazardAt(this.left + 2, footY) ||
      ctx.map.hazardAt(this.right - 2, footY) ||
      ctx.map.hazardAt(this.cx, footY)
    ) {
      this.hurt(ctx, 'tacks');
    }
  }

  private updateState(): void {
    const moving = Math.abs(this.vx) > 0.3;
    const airborne = !this.onGround;
    const big = this.isBig;

    if (this.state === PlayerState.HURT_FLASH && this.invincible > 0) return;

    if (airborne) {
      this.setState(big
        ? (this.vy < 0 ? PlayerState.BIG_JUMP : PlayerState.BIG_FALL)
        : (this.vy < 0 ? PlayerState.JUMP     : PlayerState.FALL));
    } else if (this.ducking) {
      this.setState(PlayerState.DUCK);
    } else if (moving) {
      this.setState(big ? PlayerState.BIG_WALK : PlayerState.WALK);
    } else {
      this.setState(big ? PlayerState.BIG_IDLE : PlayerState.IDLE);
    }
  }

  private setState(s: PlayerState): void {
    if (this.state === s) return;
    if (!this.onGround &&
      (s === PlayerState.IDLE || s === PlayerState.WALK ||
       s === PlayerState.BIG_IDLE || s === PlayerState.BIG_WALK)) {
      this.scaleX = 1.4;
      this.scaleY = 0.65;
      this.squashTimer = 8;
    }
    this.state = s;
  }

  private updateSquash(): void {
    if (this.squashTimer <= 0) {
      this.scaleX += (1 - this.scaleX) * 0.3;
      this.scaleY += (1 - this.scaleY) * 0.3;
    } else {
      this.squashTimer--;
    }
  }

  // Rendering handled by DOM overlay; no-op on canvas.
  draw(): void { /* see GameContainer's player overlay */ }
}
