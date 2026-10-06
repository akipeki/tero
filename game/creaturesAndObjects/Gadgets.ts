// file: game/creaturesAndObjects/Gadgets.ts
//
// R&D prototypes (Floor 21), both bright because they're gameplay:
//
//   Fax     stand at one and press DOWN: Tero is faxed to its `to` machine
//           and comes out a grainy black-and-white copy for a moment.
//           A fax with no `to` is "OUT ONLY" (pressing DOWN jams it).
//   Spring  the SYNERGY SPRING: land on it and it launches you sky-high.
//
// Game owns the teleport itself (it hides Tero while he's on the line);
// these classes are the machines.

import { creaturesAndObjects, type UpdateCtx } from './creaturesAndObjects';
import { overlaps } from '../physics/AABB';
import { TILE_SIZE } from '../constants';
import type { Player } from './Player';
import { drawText } from '../render/pixel/font';
import { Raster } from '../render/pixel/Raster';

export const SPRING_VY = -17;

export class Fax extends creaturesAndObjects {
  /** Index of the destination fax in the level's gadget list, or null. */
  readonly to: number | null;
  /** Ticks of "printing" animation (sending or receiving). */
  busy = 0;
  jammed = 0;
  private near = false;

  constructor(tx: number, ty: number, to: number | null) {
    super(tx * TILE_SIZE + 2, ty * TILE_SIZE + TILE_SIZE - 26, 28, 26);
    this.to = to;
  }

  /** Is Tero standing at the machine? */
  touches(player: Player): boolean {
    return player.onGround && overlaps(player, { x: this.x - 4, y: this.y, w: this.w + 8, h: this.h });
  }

  setNear(near: boolean): void { this.near = near; }

  update(ctx: UpdateCtx): void {
    if (this.busy > 0) {
      this.busy--;
      if (this.busy % 4 === 0) ctx.particles.burst(this.cx, this.y + 4, 1, '#f4f1e6', '#ffffff');
    }
    if (this.jammed > 0) this.jammed--;
  }

  draw(ctx: CanvasRenderingContext2D, camX: number): void {
    const x = Math.round(this.x - camX), y = Math.round(this.y);
    const shake = this.busy > 0 ? (this.busy % 4 < 2 ? 1 : -1) : 0;
    ctx.fillStyle = '#1b1620';
    ctx.fillRect(x - 1 + shake, y + 5, this.w + 2, this.h - 4);
    ctx.fillStyle = '#e4dcc4';                       // beige plastic
    ctx.fillRect(x + shake, y + 6, this.w, this.h - 6);
    ctx.fillStyle = '#c9bf9f';
    ctx.fillRect(x + shake, y + this.h - 5, this.w, 4);
    ctx.fillStyle = '#5a5f68';                       // top + paper slot
    ctx.fillRect(x + 2 + shake, y + 6, this.w - 4, 5);
    ctx.fillStyle = '#f4f1e6';                       // paper sticking out
    ctx.fillRect(x + 6 + shake, y + (this.busy > 0 ? 0 : 2), this.w - 12, this.busy > 0 ? 9 : 5);
    ctx.fillStyle = '#9aa0a8';
    for (let i = 0; i < 3; i++) ctx.fillRect(x + 4 + i * 5 + shake, y + 15, 3, 2);   // keypad
    ctx.fillStyle = this.jammed > 0 ? '#d83b3b' : this.busy > 0 ? '#ffd23f' : '#3fd84a';
    ctx.fillRect(x + this.w - 7 + shake, y + 14, 3, 3);                             // LED
    // label
    ctx.drawImage(label(this.to === null ? 'OUT' : 'FAX'), x + 4 + shake, y + 19);
    // DOWN prompt when Tero stands here and it can send
    if (this.near && this.to !== null && this.busy === 0) {
      const bob = Math.round(Math.sin(performance.now() / 150) * 2);
      ctx.drawImage(label('▼ DOWN'), x - 2, y - 46 + bob);   // above Tero's head
    }
    if (this.jammed > 0) ctx.drawImage(label('JAM'), x + 4, y - 10);
  }
}

export class Spring extends creaturesAndObjects {
  private squash = 0;

  constructor(tx: number, ty: number) {
    super(tx * TILE_SIZE + 3, ty * TILE_SIZE + TILE_SIZE - 14, 26, 14);
  }

  /** Bounce Tero if he lands on it. Returns true on a launch. */
  check(player: Player, ctx: UpdateCtx): boolean {
    if (player.vy <= 0 || player.isDead) return false;
    if (!overlaps(player, this) || player.prevBottom > this.y + 6) return false;
    player.y = this.y - player.h;
    player.vy = SPRING_VY;
    player.scaleX = 0.75;
    player.scaleY = 1.35;
    this.squash = 10;
    ctx.audio.play('boing');
    ctx.particles.burst(this.cx, this.y, 6, '#ffd23f', '#d83b3b');
    return true;
  }

  update(): void { if (this.squash > 0) this.squash--; }

  draw(ctx: CanvasRenderingContext2D, camX: number): void {
    const x = Math.round(this.x - camX);
    const bottom = Math.round(this.y + this.h);
    const h = this.squash > 0 ? 7 : 12;
    // base
    ctx.fillStyle = '#1b1620';
    ctx.fillRect(x - 1, bottom - 4, this.w + 2, 4);
    ctx.fillStyle = '#5a5f68';
    ctx.fillRect(x, bottom - 3, this.w, 3);
    // coil
    for (let i = 0; i < 3; i++) {
      const cy = bottom - 4 - Math.round((i + 1) * (h - 4) / 3);
      ctx.fillStyle = '#1b1620';
      ctx.fillRect(x + 5, cy - 1, this.w - 10, 3);
      ctx.fillStyle = '#d83b3b';
      ctx.fillRect(x + 6, cy, this.w - 12, 1);
    }
    // plate with the yellow-black tape (you stand on it)
    const top = bottom - h - 3;
    ctx.fillStyle = '#1b1620';
    ctx.fillRect(x - 1, top - 1, this.w + 2, 5);
    ctx.fillStyle = '#ffd23f';
    ctx.fillRect(x, top, this.w, 3);
    ctx.fillStyle = '#1b1620';
    for (let i = 0; i < this.w; i += 6) ctx.fillRect(x + i, top, 3, 3);
  }
}

const labels = new Map<string, HTMLCanvasElement>();
function label(text: string): HTMLCanvasElement {
  let c = labels.get(text);
  if (!c) {
    const r = new Raster(text.length * 4 + 3, 8);
    r.rect(0, 0, r.w, 8, '#1b1620');
    drawText(r, text.replace('▼', 'v'), 2, 1, '#ffffff');
    c = r.toCanvas();
    labels.set(text, c);
  }
  return c;
}
