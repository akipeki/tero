// file: game/creaturesAndObjects/Coin.ts

import { creaturesAndObjects, type UpdateCtx } from './creaturesAndObjects';
import { overlaps } from '../physics/AABB';
import { TILE_SIZE, COIN_VALUE } from '../constants';
import { P } from '../palette';
import { drawCoinSprite } from '../render/sprites/CoinSprite';
import type { Player } from './Player';

export class Coin extends creaturesAndObjects {
  private collected = false;
  private collectAnim = 0;
  /** Spin animation phase, 0..1 */
  spinPhase = 0;

  constructor(tx: number, ty: number) {
    // 14×16 hitbox centred in the tile
    super(tx * TILE_SIZE + 9, ty * TILE_SIZE + 8, 14, 16);
  }

  update(ctx: UpdateCtx): void {
    void ctx;
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
