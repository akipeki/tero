// file: game/creaturesAndObjects/Flame.ts
//
// One puff of baby-dragon fire. The tantrum streams them; a normal FIRE
// press makes one tiny hiccup puff. Flames fly straight, grow, flicker and
// die out. They burn paperwork tiles on the way; Game checks them against
// enemies (only tantrum flames free workers, see `frees`).

import { creaturesAndObjects, type UpdateCtx } from './creaturesAndObjects';
import { TILE_SIZE, RAGE_PAPER } from '../constants';
import { TileType } from '../types';

const CORE = '#fff6b0';
const MID  = '#ffb347';
const EDGE = '#e8452c';
const SMOKE = '#6b6470';

export class Flame extends creaturesAndObjects {
  private life: number;
  private readonly maxLife: number;
  /** Tantrum fire turns workers back into people; a puff only singes paper. */
  readonly frees: boolean;
  /** Paper tiles burnt by this flame this tick — Game turns them into rage. */
  burned = 0;
  private seed = Math.random() * 1000;

  constructor(x: number, y: number, vx: number, vy: number, life: number, frees: boolean) {
    super(x - 5, y - 5, 10, 10);
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.maxLife = life;
    this.frees = frees;
  }

  /** 0 at birth → 1 when it dies out. */
  private get age(): number { return 1 - this.life / this.maxLife; }

  update(ctx: UpdateCtx): void {
    this.burned = 0;
    this.x += this.vx;
    this.y += this.vy;
    this.vy -= 0.04;            // hot air rises
    this.vx *= 0.985;

    // Grow from a spark into a fireball, centred on the same point.
    const size = Math.round(12 + this.age * 20);
    const cx = this.cx, cy = this.cy;
    this.w = this.h = size;
    this.x = cx - size / 2;
    this.y = cy - size / 2;

    if (--this.life <= 0) { this.active = false; return; }
    if (this.frees && this.life % 6 === 0) ctx.particles.burst(this.cx, this.cy, 1, MID, CORE);

    // Burn every paper tile the fireball touches (Big Tero's breath is
    // tall enough to clear a two-tile hole).
    const tx0 = Math.floor(this.left / TILE_SIZE), tx1 = Math.floor((this.right - 1) / TILE_SIZE);
    const ty0 = Math.floor(this.top / TILE_SIZE),  ty1 = Math.floor((this.bottom - 1) / TILE_SIZE);
    for (let ty = ty0; ty <= ty1; ty++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        const t = ctx.map.tileAt(tx, ty);
        if (t !== TileType.PAPER && t !== TileType.TAPE) continue;
        ctx.map.setTile(tx, ty, TileType.AIR);
        ctx.particles.burst(tx * TILE_SIZE + 16, ty * TILE_SIZE + 16, 10, '#fbf8ee', MID);
        ctx.particles.burst(tx * TILE_SIZE + 16, ty * TILE_SIZE + 16, 6, SMOKE, EDGE);
        this.burned++;
      }
    }
    if (this.burned) ctx.audio.play('burn');

    // Fizzle against walls, desks and the ceiling.
    if (ctx.map.tileAt(Math.floor(this.cx / TILE_SIZE), Math.floor(this.cy / TILE_SIZE)) === TileType.SOLID) {
      ctx.particles.burst(this.cx, this.cy, 2, SMOKE, MID);
      this.active = false;
    }
  }

  /** How much rage the paper it burnt this tick is worth. */
  get rageEarned(): number { return this.burned * RAGE_PAPER; }

  draw(ctx: CanvasRenderingContext2D, camX: number): void {
    const a = this.age;
    const flick = Math.sin(this.seed + this.life * 1.7) > 0 ? 1 : 0;
    const x = Math.round(this.x - camX);
    const y = Math.round(this.y);
    const s = Math.round(this.w);
    ctx.globalAlpha = a > 0.75 ? (1 - a) * 4 : 1;
    // Chunky pixel octagon: edge → mid → core; the core shrinks and the
    // edge turns to smoke as it burns out. A tongue licks upward.
    const blob = (inset: number, color: string) => {
      const w = s - inset * 2;
      if (w <= 0) return;
      const cut = Math.max(1, Math.round(w / 4));
      ctx.fillStyle = color;
      ctx.fillRect(x + inset + cut, y + inset, w - cut * 2, w);
      ctx.fillRect(x + inset, y + inset + cut, w, w - cut * 2);
    };
    blob(0, a > 0.65 ? SMOKE : EDGE);
    blob(Math.max(1, Math.round(s / 6)), a > 0.8 ? EDGE : MID);
    blob(Math.max(2, Math.round(s * (0.3 + a * 0.2))), CORE);
    ctx.fillStyle = a > 0.65 ? SMOKE : MID;
    const tx = x + Math.round(s / 2) - 1 + (flick ? 2 : -2);
    ctx.fillRect(tx, y - 3 - flick * 2, 2, 4 + flick * 2);
    ctx.globalAlpha = 1;
  }
}
