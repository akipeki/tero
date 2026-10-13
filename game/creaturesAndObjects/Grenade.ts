// file: game/creaturesAndObjects/Grenade.ts
//
// The resistance's hand grenade. Nobody gets hurt in this game, so it's
// packed with resignation letters: everyone in the blast resigns on the
// spot and goes home (robots and plants just break). One per run.

import { creaturesAndObjects, type UpdateCtx } from './creaturesAndObjects';
import { stepBody } from '../physics/Physics';
import { drawGrenade } from '../render/office/ventArt';

export const GRENADE_FUSE = 70;
export const BLAST_TILES = 5;

export class Grenade extends creaturesAndObjects {
  private fuse = GRENADE_FUSE;
  private spin = 0;
  /** Set on the tick it goes off; Game does the blast. */
  exploded = false;

  constructor(x: number, y: number, vx: number, vy: number) {
    super(x - 6, y - 6, 12, 12);
    this.vx = vx;
    this.vy = vy;
  }

  update(ctx: UpdateCtx): void {
    if (!this.active) return;
    const wasAir = !this.onGround;
    stepBody(this, ctx.map);
    if (this.onGround) {
      if (wasAir && Math.abs(this.vy) < 0.1) this.vx *= 0.6;   // lands, rolls a bit
      this.vx *= 0.9;
    }
    this.spin++;
    if (--this.fuse <= 0 || this.y > 9 * 32) {
      this.exploded = this.y <= 9 * 32;
      this.active = false;
    }
  }

  draw(ctx: CanvasRenderingContext2D, camX: number): void {
    drawGrenade(ctx, this.cx - camX, this.cy, Math.floor(this.spin / 4));
    // the fuse ticks faster near the end
    if (this.fuse < 30 && this.fuse % 6 < 3) {
      ctx.fillStyle = '#ff3b1f';
      ctx.fillRect(Math.round(this.cx - camX) + 3, Math.round(this.y) - 4, 2, 2);
    }
  }
}
