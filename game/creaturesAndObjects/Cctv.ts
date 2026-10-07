// file: game/creaturesAndObjects/Cctv.ts
//
// Security cameras (Floor 27). Each hangs from the ceiling and sweeps a cone
// of light back and forth. If the cone finds Tero — not hiding in his box,
// with no wall in between — the alarm goes off and Game drops guards from
// the ceiling vents. A box in the cone just gets a "?".

import { blitArt } from '../render/customImages';
import { creaturesAndObjects, type UpdateCtx } from './creaturesAndObjects';
import { TILE_SIZE } from '../constants';
import { isSolidTile } from '../level/Tilemap';
import type { Player } from './Player';
import { drawBubble } from './freed';

const RANGE = 6.5 * TILE_SIZE;
const HALF_WIDTH = 0.28;             // radians either side of the beam
const ALARM_FRAMES = 150;            // red, and no new alarm, for this long

export class Cctv extends creaturesAndObjects {
  private angle: number;
  private dir = 1;
  private readonly from: number;
  private readonly to: number;
  private readonly speed: number;
  /** Red-alert ticks left. */
  alarm = 0;
  puzzled = 0;
  /** Set when it spots Tero; Game reads and clears it. */
  spotted = false;

  /** `sweep` is [from, to] in radians, measured from straight down
   *  (negative = towards the left). */
  constructor(tx: number, ty: number, sweep: [number, number] = [-0.9, 0.9], speed = 0.012) {
    super(tx * TILE_SIZE + 8, ty * TILE_SIZE, 16, 12);
    this.from = sweep[0];
    this.to = sweep[1];
    this.angle = sweep[0];
    this.speed = speed;
  }

  get eyeX(): number { return this.cx; }
  get eyeY(): number { return this.y + 10; }

  update(): void {
    if (this.alarm > 0) { this.alarm--; return; }   // stares while the alarm rings
    if (this.puzzled > 0) { this.puzzled--; return; }
    this.angle += this.dir * this.speed;
    if (this.angle > this.to) { this.angle = this.to; this.dir = -1; }
    if (this.angle < this.from) { this.angle = this.from; this.dir = 1; }
  }

  /** Is the point inside the cone with a clear line to the lens? */
  sees(x: number, y: number, map: UpdateCtx['map']): boolean {
    const dx = x - this.eyeX, dy = y - this.eyeY;
    const dist = Math.hypot(dx, dy);
    if (dist > RANGE || dy <= 0) return false;
    const a = Math.atan2(dx, dy);                 // 0 = straight down
    if (Math.abs(a - this.angle) > HALF_WIDTH) return false;
    const steps = Math.ceil(dist / 8);
    for (let i = 1; i < steps; i++) {
      const sx = this.eyeX + (dx * i) / steps, sy = this.eyeY + (dy * i) / steps;
      if (isSolidTile(map.tileAtWorld(sx, sy))) return false;
    }
    return true;
  }

  /** Checks Tero; returns 'alarm', 'box' or null. */
  watch(player: Player, map: UpdateCtx['map']): 'alarm' | 'box' | null {
    if (player.isDead || this.alarm > 0) return null;
    const seen = this.sees(player.cx, player.top + 6, map) || this.sees(player.cx, player.bottom - 4, map);
    if (!seen) return null;
    if (player.isHidden) {
      if (this.puzzled === 0) this.puzzled = 60;
      return 'box';
    }
    this.alarm = ALARM_FRAMES;
    return 'alarm';
  }

  draw(ctx: CanvasRenderingContext2D, camX: number): void {
    const ex = this.eyeX - camX, ey = this.eyeY;
    // the cone
    const red = this.alarm > 0 && Math.floor(this.alarm / 8) % 2 === 0;
    ctx.fillStyle = red ? 'rgba(255,60,60,0.26)' : this.puzzled > 0 ? 'rgba(255,230,120,0.1)' : 'rgba(255,230,120,0.2)';
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    for (let k = -1; k <= 1; k += 0.25) {
      const a = this.angle + k * HALF_WIDTH;
      ctx.lineTo(ex + Math.sin(a) * RANGE, ey + Math.cos(a) * RANGE);
    }
    ctx.closePath();
    ctx.fill();
    // arm and body
    const x = Math.round(this.x - camX), y = Math.round(this.y);
    if (!blitArt(ctx, 'cctv', 0, x, y + 1)) this.drawBody(ctx, x, y);
    // lens points where it looks
    const lx = Math.round(ex + Math.sin(this.angle) * 6), ly = Math.round(ey + Math.cos(this.angle) * 3);
    ctx.fillStyle = '#1b1620';
    ctx.fillRect(lx - 3, ly - 2, 6, 5);
    ctx.fillStyle = red || this.alarm > 0 ? '#ff3b3b' : '#3fd84a';
    ctx.fillRect(lx - 1, ly - 1, 2, 2);
    if (this.alarm > 0) drawBubble(ctx, '!', ex, y + 2);
    else if (this.puzzled > 0) drawBubble(ctx, '?', ex, y + 2);
  }

  private drawBody(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.fillStyle = '#1b1620';
    ctx.fillRect(x + 6, y - 2, 4, 6);
    ctx.fillRect(x - 1, y + 3, this.w + 2, 10);
    ctx.fillStyle = '#c9ced6';
    ctx.fillRect(x, y + 4, this.w, 8);
    ctx.fillStyle = '#8a8f96';
    ctx.fillRect(x, y + 10, this.w, 2);
  }
}
