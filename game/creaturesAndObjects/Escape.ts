// file: game/creaturesAndObjects/Escape.ts
//
// THE WAY HOME — the escape after the Board. The elevator's been cut, so
// it's 33 floors of stairs before Monday:
//
//   DadFollower   Dad shambles along behind Tero (he can't be hurt; he's
//                 been through worse)
//   Debris        ceiling tiles that shake, drop and shatter
//   floor signs   huge stencilled floor numbers counting down to the lobby

import { creaturesAndObjects, type UpdateCtx } from './creaturesAndObjects';
import { overlaps } from '../physics/AABB';
import { TILE_SIZE } from '../constants';
import type { Player } from './Player';
import { Raster } from '../render/pixel/Raster';
import { drawText, textWidth } from '../render/pixel/font';
import { DAD_SRC, smoothDad } from '../render/sprites/dadSprite';

const DAD_DELAY = 26;      // ticks behind Tero

export class DadFollower {
  private trail: { x: number; y: number; right: boolean }[] = [];
  private img: HTMLImageElement | null = null;

  /** Record where Tero is (call once per tick). */
  follow(player: Player): void {
    if (player.isDead) return;
    this.trail.push({ x: player.cx - 14 * (player.facingRight ? 1 : -1), y: player.bottom, right: player.facingRight });
    if (this.trail.length > DAD_DELAY) this.trail.shift();
  }

  /** Snap behind Tero (level start, respawn). */
  reset(player: Player): void {
    this.trail = [{ x: player.cx - 20, y: player.bottom, right: true }];
  }

  draw(ctx: CanvasRenderingContext2D, camX: number): void {
    const p = this.trail[0];
    if (!p) return;
    if (!this.img && typeof Image !== 'undefined') {
      this.img = new Image();
      this.img.src = DAD_SRC;
    }
    if (!this.img?.complete || !this.img.naturalWidth) return;
    const x = Math.round(p.x - camX), y = Math.round(p.y);
    const bob = Math.abs(Math.sin(performance.now() / 120)) * 2;
    ctx.save();
    ctx.translate(x, y - bob);
    if (!p.right) ctx.scale(-1, 1);
    smoothDad(ctx, this.img, 52);
    ctx.drawImage(this.img, -26, -52, 52, 52);
    ctx.restore();
  }
}

/** A ceiling tile that shakes for a beat, then falls. */
export class Debris extends creaturesAndObjects {
  private warn = 40;
  private shattered = false;

  constructor(x: number) {
    super(x - 12, TILE_SIZE, 24, 12);
  }

  update(ctx: UpdateCtx): void {
    if (this.warn > 0) { this.warn--; return; }
    this.vy = Math.min(9, this.vy + 0.5);
    this.y += this.vy;
    const below = ctx.map.solidAt(this.cx, this.bottom);
    if (below || this.y > 9 * TILE_SIZE) {
      this.active = false;
      this.shattered = true;
      ctx.particles.burst(this.cx, this.bottom, 8, '#c3bfb1', '#8a8f96');
      ctx.audio.play('block');
    }
  }

  /** Lands on Tero? */
  hits(player: Player): boolean {
    return this.warn === 0 && !this.shattered && !player.isDead && overlaps(this, player);
  }

  draw(ctx: CanvasRenderingContext2D, camX: number): void {
    const x = Math.round(this.x - camX), y = Math.round(this.y);
    if (this.warn > 0) {
      // shadow on the floor + a crack in the ceiling
      ctx.fillStyle = 'rgba(27,22,32,0.35)';
      ctx.fillRect(x, 8 * TILE_SIZE - 3, this.w, 3);
      ctx.fillStyle = '#1b1620';
      ctx.fillRect(x + (this.warn % 6 < 3 ? 1 : 0), y - 2, this.w, 1);
    }
    ctx.fillStyle = '#1b1620';
    ctx.fillRect(x - 1, y - 1, this.w + 2, this.h + 2);
    ctx.fillStyle = '#e4e0d0';
    ctx.fillRect(x, y, this.w, this.h);
    ctx.fillStyle = '#c3bfb1';
    for (let i = 0; i < 4; i++) ctx.fillRect(x + 3 + i * 5, y + 3 + (i % 2) * 4, 1, 1);
  }
}

// ─── Floor signs ─────────────────────────────────────────────────────────────

const signs = new Map<number, HTMLCanvasElement>();
function sign(floor: number): HTMLCanvasElement {
  let c = signs.get(floor);
  if (!c) {
    const text = floor <= 1 ? 'LOBBY' : String(floor);
    const r = new Raster(textWidth(text, 3) + 10, 24);
    r.rect(0, 0, r.w, 24, '#ffd23f');
    r.rect(2, 2, r.w - 4, 20, '#1b1620');
    drawText(r, text, 5, 5, '#ffd23f', 3);
    c = r.toCanvas();
    signs.set(floor, c);
  }
  return c;
}

/** Stencilled floor numbers on the stairwell wall: `floors` sections of
 *  `cols` tiles each, counting down from the top. */
export function drawFloorSigns(ctx: CanvasRenderingContext2D, camX: number, floors: number, cols: number): void {
  const span = cols * TILE_SIZE;
  const first = Math.max(0, Math.floor(camX / span) - 1);
  for (let i = first; i < Math.min(floors, first + 4); i++) {
    const c = sign(floors - i);
    ctx.globalAlpha = 0.8;
    ctx.drawImage(c, Math.round(i * span + span / 2 - c.width / 2 - camX), 2 * TILE_SIZE + 6);
    ctx.globalAlpha = 1;
  }
}
