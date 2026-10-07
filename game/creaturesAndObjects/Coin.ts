// file: game/creaturesAndObjects/Coin.ts

import { creaturesAndObjects, type UpdateCtx } from './creaturesAndObjects';
import { overlaps } from '../physics/AABB';
import { stepBody } from '../physics/Physics';
import { TILE_SIZE, COIN_VALUE } from '../constants';
import { P } from '../palette';
import { drawCoinSprite } from '../render/sprites/CoinSprite';
import type { Player } from './Player';

export class Coin extends creaturesAndObjects {
  private collected = false;
  private collectAnim = 0;
  /** Spin animation phase, 0..1 */
  spinPhase = 0;
  /** Thrown (a pig's bribe): falls under gravity until it lands. */
  private flying = false;
  /** A pig threw it: Tero has an opinion about taking it. */
  bribe = false;

  constructor(tx: number, ty: number) {
    // 14×16 hitbox centred in the tile
    super(tx * TILE_SIZE + 9, ty * TILE_SIZE + 8, 14, 16);
  }

  /** Toss it (a pig's bribe). */
  throwFrom(x: number, y: number, vx: number, vy: number): this {
    this.x = x - this.w / 2;
    this.y = y - this.h / 2;
    this.vx = vx;
    this.vy = vy;
    this.flying = true;
    this.bribe = true;
    return this;
  }

  /** Still there to be picked up (or stolen). */
  get takeable(): boolean { return this.active && !this.collected; }

  /** A rat took it. */
  steal(): void { this.active = false; }

  update(ctx: UpdateCtx): void {
    if (this.flying) {
      stepBody(this, ctx.map);
      this.vx *= 0.98;
      if (this.onGround) { this.flying = false; this.vx = 0; }
      if (this.y > 9 * TILE_SIZE) this.active = false;
    }
    this.spinPhase = (this.spinPhase + 0.06) % 1;
    if (this.collected) {
      this.collectAnim++;
      this.y -= 2;
      if (this.collectAnim > 18) this.active = false;
    }
  }

  /** Returns true if the player picked up the coin this frame. */
  checkCollect(player: Player, ctx: UpdateCtx): boolean {
    if (this.collected) return false;
    if (!overlaps(
      { x: player.x, y: player.y, w: player.w, h: player.h },
      { x: this.x,   y: this.y,   w: this.w,   h: this.h },
    )) return false;
    this.collected = true;
    ctx.audio.play('coin');
    ctx.particles.burst(this.cx, this.cy, 6, P.SUN_GOLD, P.STAR_WHITE);
    return true;
  }

  get value(): number { return COIN_VALUE; }

  draw(ctx: CanvasRenderingContext2D, camX: number): void {
    drawCoinSprite(ctx, {
      x: this.x, y: this.y, camX,
      spinPhase: this.spinPhase,
      collected: this.collected,
      collectAnim: this.collectAnim,
    });
  }
}
