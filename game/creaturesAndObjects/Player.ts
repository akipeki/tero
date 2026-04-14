// file: game/creaturesAndObjects/Player.ts

import { drawPlayerSprite } from '../render/sprites/PlayerSprite';
import { creaturesAndObjects, type UpdateCtx } from './creaturesAndObjects';
import { stepBody } from '../physics/Physics';
import { P } from '../palette';
import {
  TILE_SIZE, GRAVITY, WALK_SPEED, RUN_ACCEL, FRICTION, AIR_FRICTION,
  JUMP_FORCE, JUMP_CUT, STOMP_BOUNCE, COYOTE_TIME, JUMP_BUFFER,
  INVINCIBLE_FRAMES, WALK_ANIM_FPS, VIEWPORT_H,
} from '../constants';
import { PlayerState, Action } from '../types';

const SMALL_W = 22;
const SMALL_H = 28;
const BIG_W   = 22;
const BIG_H   = 44;

export class Player extends creaturesAndObjects {
  state: PlayerState = PlayerState.IDLE;
  lives: number;
  isBig = false;
  facingRight = true;

  // Game-feel timers
  private coyoteFrames  = 0;
  private jumpBuffer    = 0;
  private invincible    = 0;
  private animFrame     = 0;
  private animTimer     = 0;
  private deadTimer     = 0;
  private hurtTimer     = 0;

  // Squash & stretch
  scaleX = 1;
  scaleY = 1;
  private squashTimer = 0;

  // Stored actions from InputHandler
  actions = 0; // Action bitmask
  jumpJustPressed = false;
  jumpHeld = false;
  prevBottom = 0;
  /** True for exactly one frame when player's head hits a ceiling tile */
  hitCeiling = false;

  constructor(x: number, y: number, lives: number) {
    super(x, y, SMALL_W, SMALL_H);
    this.lives = lives;
  }

  get isDead()        { return this.state === PlayerState.DEAD; }
  get isHurting()     { return this.invincible > 0; }
  get isWin()         { return this.state === PlayerState.WIN; }
  get isInvincible()  { return this.invincible > 0; }

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
    // Squash on bounce
    this.scaleX = 1.3;
    this.scaleY = 0.7;
    this.squashTimer = 8;
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
    // Big pop squash
    this.scaleX = 0.8;
    this.scaleY = 1.3;
    this.squashTimer = 10;
  }

  // Spawn position — set by Game after loadLevel so die() can snap there safely.
  spawnX = 0;
  spawnY = 0;

  die(ctx: UpdateCtx): void {
    this.lives--;
    this.state = PlayerState.DEAD;
    // Snap to the spawn point so the death bounce always plays on solid ground
    // and is always visible on screen. Prevents the "bouncing over a gap" glitch.
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.vy = -10;
    this.vx = 0;
    this.deadTimer = 120;
    ctx.shake.trigger(7);
    ctx.audio.play('death');
    ctx.particles.burst(this.cx, this.cy, 12, P.PLAYER_BLUE, P.PLAYER_DARK);
  }

  triggerWin(): void {
    this.state = PlayerState.WIN;
    this.vx = 0;
    this.vy = -8;
  }

  /** Respawn at a given position */
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
    this.updateState();
    this.updateAnimation();
    this.updateSquash();
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
    if (this.hurtTimer > 0)  this.hurtTimer--;
  }

  private updateInput(): void {
    const a = this.actions;

    // Horizontal
    if (a & Action.LEFT) {
      this.vx = Math.max(this.vx - RUN_ACCEL, -WALK_SPEED);
      this.facingRight = false;
    } else if (a & Action.RIGHT) {
      this.vx = Math.min(this.vx + RUN_ACCEL, WALK_SPEED);
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
    if (this.jumpBuffer > 0 && this.coyoteFrames > 0) {
      this.vy = JUMP_FORCE;
      this.jumpBuffer = 0;
      this.coyoteFrames = 0;
      // Stretch on jump
      this.scaleX = 0.8;
      this.scaleY = 1.25;
      this.squashTimer = 6;
    }

    // Variable jump height — cut velocity when button released mid-air
    if (!this.jumpHeld && this.vy < 0) {
      this.vy *= JUMP_CUT;
    }
  }

  private stepPhysics(ctx: UpdateCtx): void {
    const { hitCeiling } = stepBody(this, ctx.map);
    this.hitCeiling = hitCeiling;
    if (hitCeiling && this.vy < 0) this.vy = 0;

    // Hazard tile OR fell below viewport + 48px grace buffer → instant death
    if (ctx.map.hazardAt(this.cx, this.bottom - 1) || this.y > VIEWPORT_H + 48) {
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
        : (this.vy < 0 ? PlayerState.JUMP      : PlayerState.FALL));
    } else if (moving) {
      this.setState(big ? PlayerState.BIG_WALK : PlayerState.WALK);
      // Squash on landing transition
      if (this.state !== PlayerState.BIG_WALK && this.state !== PlayerState.WALK) {
        this.scaleX = 1.4; this.scaleY = 0.7; this.squashTimer = 6;
      }
    } else {
      this.setState(big ? PlayerState.BIG_IDLE : PlayerState.IDLE);
    }
  }

  private setState(s: PlayerState): void {
    if (this.state === s) return;
    // Landing squash
    if (!this.onGround &&
      (s === PlayerState.IDLE || s === PlayerState.WALK ||
       s === PlayerState.BIG_IDLE || s === PlayerState.BIG_WALK)) {
      this.scaleX = 1.4;
      this.scaleY = 0.65;
      this.squashTimer = 8;
    }
    this.state = s;
    this.animFrame = 0;
    this.animTimer = 0;
  }

  private updateAnimation(): void {
    const isWalk = this.state === PlayerState.WALK || this.state === PlayerState.BIG_WALK;
    if (!isWalk) return;
    this.animTimer++;
    if (this.animTimer >= WALK_ANIM_FPS) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }
  }

  private updateSquash(): void {
    if (this.squashTimer <= 0) {
      // Spring back to 1,1
      this.scaleX += (1 - this.scaleX) * 0.3;
      this.scaleY += (1 - this.scaleY) * 0.3;
    } else {
      this.squashTimer--;
    }
  }

  draw(ctx: CanvasRenderingContext2D, camX: number): void {
  if (this.state === PlayerState.DEAD) {
    drawPlayerSprite(ctx, {
      x: this.x,
      y: this.y,
      w: this.w,
      h: this.h,
      camX,
      facingRight: this.facingRight,
      state: this.state,
      scaleX: this.scaleX,
      scaleY: this.scaleY,
      animFrame: this.animFrame,
      isBig: this.isBig,
    });
    return;
  }

ctx.save();

if (this.invincible > 0 && Math.floor(this.invincible / 4) % 2 === 0) {
  ctx.globalAlpha = 0.65;
}

drawPlayerSprite(ctx, {
  x: this.x,
  y: this.y,
  w: this.w,
  h: this.h,
  camX,
  facingRight: this.facingRight,
  state: this.state,
  scaleX: this.scaleX,
  scaleY: this.scaleY,
  animFrame: this.animFrame,
  isBig: this.isBig,
});

ctx.restore();

  drawPlayerSprite(ctx, {
    x: this.x,
    y: this.y,
    w: this.w,
    h: this.h,
    camX,
    facingRight: this.facingRight,
    state: this.state,
    scaleX: this.scaleX,
    scaleY: this.scaleY,
    animFrame: this.animFrame,
    isBig: this.isBig,
  });
}
  private drawShape(ctx: CanvasRenderingContext2D, camX: number, withDetail: boolean): void {
    const sx = Math.floor(this.x - camX + this.w / 2);
    const sy = Math.floor(this.y + this.h / 2);

    ctx.save();
    ctx.translate(sx, sy);
    if (!this.facingRight) ctx.scale(-1, 1);
    ctx.scale(this.scaleX, this.scaleY);

    const hw = this.w / 2;
    const hh = this.h / 2;

    // Body
    ctx.fillStyle = this.isBig ? P.PLAYER_BLUE : P.PLAYER_BLUE;
    ctx.fillRect(-hw, -hh, this.w, this.h);

    // Head (slightly darker top)
    ctx.fillStyle = P.PLAYER_DARK;
    ctx.fillRect(-hw, -hh, this.w, Math.round(this.h * 0.35));

    if (withDetail) {
      // Eyes
      ctx.fillStyle = P.STAR_WHITE;
      ctx.fillRect(hw - 8, -hh + 4, 5, 5);
      // Feet / walk animation
      const isWalk = this.state === PlayerState.WALK || this.state === PlayerState.BIG_WALK;
      if (isWalk) {
        const legOffset = Math.sin(this.animFrame * Math.PI / 2) * 4;
        ctx.fillStyle = P.PLAYER_DARK;
        ctx.fillRect(-hw,     hh - 7 + legOffset, hw - 1, 7);
        ctx.fillRect(1,       hh - 7 - legOffset, hw - 1, 7);
      } else {
        ctx.fillStyle = P.PLAYER_DARK;
        ctx.fillRect(-hw, hh - 7, this.w, 7);
      }

      // Jump stretch arm
      if (this.state === PlayerState.JUMP || this.state === PlayerState.BIG_JUMP) {
        ctx.fillStyle = P.STAR_WHITE;
        ctx.fillRect(hw - 2, -hh + 12, 6, 4);
      }
    }

    ctx.restore();
  }
}
