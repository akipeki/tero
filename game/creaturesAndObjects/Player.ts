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
} from '../constants';
import { PlayerState, Action } from '../types';

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

  // Air-time tracking — fed into chain-stomp scoring
  airChain = 0;

  // Stored input from InputHandler
  actions = 0; // Action bitmask
  jumpJustPressed = false;
  jumpHeld = false;
  prevBottom = 0;
  /** True for exactly one frame when player's head hits a ceiling tile */
  hitCeiling = false;

  // Respawn anchor — re-pointed by checkpoints
  spawnX = 0;
  spawnY = 0;

  constructor(x: number, y: number, lives: number) {
    super(x, y, SMALL_W, SMALL_H);
    this.lives = lives;
  }

  get isDead()        { return this.state === PlayerState.DEAD; }
  get isHurting()     { return this.invincible > 0; }
  get isWin()         { return this.state === PlayerState.WIN; }
  get isInvincible()  { return this.invincible > 0; }
  get shouldFlash()   { return this.invincible > 0 && Math.floor(this.invincible / 4) % 2 === 0; }

  /** Called by Game when player touches enemy (side/top from above enemy) */
  hurt(ctx: UpdateCtx): void {
    if (this.invincible > 0) return;
    if (this.isBig) {
      this.shrink();
      ctx.shake.trigger(4);
      ctx.audio.play('hurt');
    } else {
      this.die(ctx);
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
    this.invincible = INVINCIBLE_FRAMES;
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

  die(ctx: UpdateCtx): void {
    this.lives--;
    this.state = PlayerState.DEAD;
    // Snap to spawn so the death bounce plays on solid ground and is visible.
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.vy = -10;
    this.vx = 0;
    this.deadTimer = DEAD_TIMER_FRAMES;
    ctx.shake.trigger(7);
    ctx.audio.play('death');
    ctx.particles.burst(this.cx, this.cy, 12, P.PLAYER_BLUE, P.PLAYER_DARK);
  }

  triggerWin(): void {
    this.state = PlayerState.WIN;
    this.vx = 0;
    this.vy = -8;
  }

  respawn(tx: number, ty: number): void {
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
    this.setState(PlayerState.IDLE);
  }

  update(ctx: UpdateCtx): void {
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
    this.updateTimers();
    this.updateInput();
    this.stepPhysics(ctx);
    if (this.onGround) this.airChain = 0;
    this.updateState();
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

  private updateTimers(): void {
    if (this.invincible > 0) this.invincible--;
  }

  private updateInput(): void {
    const a = this.actions;

    // Duck (only while grounded and small — Big Tero can't duck through low gaps yet)
    const wantsDuck = (a & Action.DOWN) !== 0 && this.onGround;
    this.setDucking(wantsDuck);

    // Horizontal — ducking halves walk speed
    const maxSpeed = this.ducking ? WALK_SPEED * 0.4 : WALK_SPEED;

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
      this.vy = JUMP_FORCE;
      this.jumpBuffer = 0;
      this.coyoteFrames = 0;
      this.scaleX = 0.8;
      this.scaleY = 1.25;
      this.squashTimer = 6;
    }

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
    const footY = this.bottom - 1;
    if (
      ctx.map.hazardAt(this.left + 2, footY) ||
      ctx.map.hazardAt(this.right - 2, footY) ||
      ctx.map.hazardAt(this.cx, footY) ||
      this.y > VIEWPORT_H + 48
    ) {
      this.hurt(ctx);
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
