// file: game/creaturesAndObjects/Mushroom.ts
import { drawMushroomSprite } from '../render/sprites/MushroomSprite';
import { creaturesAndObjects, type UpdateCtx } from './creaturesAndObjects';
import { stepBody } from '../physics/Physics';
import { overlaps } from '../physics/AABB';
import { P } from '../palette';
import type { Player } from './Player';

export class Mushroom extends creaturesAndObjects {
  collected = false;
  private collectAnim = 0;

  constructor(x: number, y: number) {
    super(x, y, 20, 20);
    this.vx = 1.5;  // starts moving right
  }

  update(ctx: UpdateCtx): void {
    if (this.collected) {
      this.collectAnim++;
      this.y -= 2;
      if (this.collectAnim > 20) this.active = false;
      return;
    }

    // Wall-turn
    const probeX = this.vx > 0 ? this.right + 1 : this.left - 1;
    if (ctx.map.solidAt(probeX, this.cy)) this.vx = -this.vx;

    stepBody(this, ctx.map);
  }

  checkCollect(player: Player, ctx: UpdateCtx): boolean {
    if (this.collected) return false;
    if (!overlaps(
      { x: player.x, y: player.y, w: player.w, h: player.h },
      { x: this.x,   y: this.y,   w: this.w,   h: this.h },
    )) return false;

    this.collected = true;
    player.grow(ctx);
    ctx.particles.burst(this.cx, this.cy, 6, P.MUSHROOM, P.STAR_WHITE);
    return true;
  }

  draw(ctx: CanvasRenderingContext2D, camX: number): void {
  drawMushroomSprite(ctx, {
    x: this.x,
    y: this.y,
    w: this.w,
    camX,
    collected: this.collected,
    collectAnim: this.collectAnim,
  });
}
}
