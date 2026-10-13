// file: game/creaturesAndObjects/Cctv.ts
//
// Security cameras (Floors 3 and 27): chunky 1990s CCTV housings with a sun
// hood. Each hangs from the ceiling (or a wall bracket, or the side of a
// pillar) and sweeps a cone of light back and forth. If the cone finds Tero — not hiding in his box,
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
const FOLLOW_RANGE = 7 * TILE_SIZE;  // fake cameras watch Tero inside this

/** Where a camera is fixed: hanging from the ceiling, on a bracket on the
 *  back wall, or on the side of a pillar (`left` = the pillar is on its left). */
export type CctvMount = 'ceiling' | 'wall' | 'left' | 'right';

/** The housing, in its own coordinates: pointing right (+x), 32 × 16, its
 *  top-left at (x, y). The lens is at the right end. Exported for /art. */
export function drawCctvHousing(ctx: CanvasRenderingContext2D, x: number, y: number, alert = false): void {
  const ink = '#1b1620';
  ctx.fillStyle = ink;
  ctx.fillRect(x, y + 3, 30, 12);                    // body outline
  ctx.fillRect(x - 1, y, 33, 5);                     // hood outline
  ctx.fillStyle = alert ? '#ff4d4d' : '#c9ced6';
  ctx.fillRect(x + 1, y + 4, 28, 10);                // body
  ctx.fillStyle = alert ? '#ff9a9a' : '#e8ebee';
  ctx.fillRect(x + 1, y + 4, 28, 2);                 // highlight
  ctx.fillStyle = alert ? '#b02020' : '#8a8f96';
  ctx.fillRect(x + 1, y + 12, 28, 2);                // shade
  for (let i = 5; i < 22; i += 4) ctx.fillRect(x + i, y + 7, 1, 4);   // ribs
  ctx.fillStyle = '#5a5f68';
  ctx.fillRect(x, y + 1, 31, 3);                     // the sun hood
  ctx.fillStyle = ink;
  ctx.fillRect(x + 26, y + 4, 6, 10);                // lens bezel
  ctx.fillStyle = '#2a3a5a';
  ctx.fillRect(x + 27, y + 6, 4, 6);                 // the glass
  ctx.fillStyle = '#8fb8e8';
  ctx.fillRect(x + 28, y + 7, 1, 2);                 // glint
  ctx.fillStyle = '#ff3b3b';
  ctx.fillRect(x + 3, y + 5, 2, 2);                  // REC light
}

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
  /** Decoration (Floor 3 has dozens): no cone, never sees anyone. */
  readonly fake: boolean;
  readonly mount: CctvMount;
  /** Where the housing hangs from (world px). */
  private readonly px: number;
  private readonly py: number;
  private twitch = 0;
  /** Ticks left blinking red (Tero just got hit: everybody saw). */
  private redFlash = 0;

  /** Tero got hurt: blink red. */
  flashRed(ticks = 40): void { this.redFlash = ticks; }
  /** Where Tero is (fake cameras turn to follow him), or null. */
  private target: { x: number; y: number } | null = null;
  /** How fast this one turns: they don't all move in perfect sync. */
  private readonly turnRate: number;

  /** `sweep` is [from, to] in radians, measured from straight down
   *  (negative = towards the left). */
  constructor(
    tx: number, ty: number, sweep: [number, number] = [-0.9, 0.9], speed = 0.012,
    fake = false, mount: CctvMount = 'ceiling',
  ) {
    const px = tx * TILE_SIZE + (mount === 'left' ? 10 : mount === 'right' ? 22 : 16);
    const py = ty * TILE_SIZE + (mount === 'ceiling' ? 10 : 14);
    super(px - 16, py - 4, 32, 20);
    this.px = px; this.py = py;
    this.fake = fake;
    this.mount = mount;
    this.from = sweep[0];
    this.to = sweep[1];
    this.angle = sweep[0];
    this.speed = speed;
    this.turnRate = 0.05 + ((tx * 37 + ty * 11) % 9) * 0.012;
  }

  /** Fake cameras turn to watch whatever this points at (null: back to their thing). */
  track(target: { x: number; y: number } | null): void { this.target = target; }

  get eyeX(): number { return this.px; }
  get eyeY(): number { return this.py + 4; }

  update(): void {
    if (this.redFlash > 0) this.redFlash--;
    if (this.fake) {
      const rest = (this.from + this.to) / 2;
      let want: number;
      const t = this.target;
      if (t && Math.abs(t.x - this.eyeX) < FOLLOW_RANGE && Math.abs(t.y - this.eyeY) < FOLLOW_RANGE) {
        // Tero is near: every one of them turns to watch him go by
        want = Math.atan2(t.x - this.eyeX, t.y - this.eyeY);
      } else {
        // back to staring at its one thing; now and then it twitches
        want = rest + (Math.floor((++this.twitch + this.x) / 100) % 3 === 0 ? 0.25 : 0);
      }
      // turn the short way round
      let d = want - this.angle;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      this.angle += d * this.turnRate;
      if (this.angle > Math.PI) this.angle -= Math.PI * 2;
      if (this.angle < -Math.PI) this.angle += Math.PI * 2;
      return;
    }
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
    if (this.fake || player.isDead || this.alarm > 0) return null;
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
    // the cone (fake cameras have none: they're just watching their thing)
    if (!this.fake) this.drawCone(ctx, ex, ey);
    const px = Math.round(this.px - camX), py = Math.round(this.py);
    this.drawMount(ctx, px, py);
    // The housing points the way it looks: left or right, tilted up or down.
    const a = this.angle;
    const facing = Math.sin(a) < -0.05 ? -1 : 1;
    const tilt = Math.max(-0.75, Math.min(0.75, Math.PI / 2 - Math.abs(a)));
    ctx.save();
    ctx.translate(px, py);
    ctx.scale(facing, 1);
    ctx.rotate(tilt);
    const blink = this.redFlash > 0 && Math.floor(this.redFlash / 5) % 2 === 0;
    if (blitArt(ctx, 'cctv', 0, -12, -8)) {
      if (blink) { ctx.fillStyle = 'rgba(255,40,40,0.55)'; ctx.fillRect(-12, -7, 32, 15); }
    } else drawCctvHousing(ctx, -12, -8, blink);
    // the lens light: green watching, red when it has seen you (fakes are always "recording")
    const red = this.fake || this.alarm > 0 || this.redFlash > 0;
    ctx.fillStyle = red ? '#ff3b3b' : '#3fd84a';
    ctx.fillRect(16, -3, 2, 2);
    if (blink) {
      // a red glow round the lens
      ctx.fillStyle = 'rgba(255,60,60,0.35)';
      ctx.fillRect(13, -6, 8, 8);
    }
    ctx.restore();
    if (this.alarm > 0) drawBubble(ctx, '!', px, py - 10);
    else if (this.puzzled > 0) drawBubble(ctx, '?', px, py - 10);
  }

  /** The pole, bracket or clamp it hangs from. */
  private drawMount(ctx: CanvasRenderingContext2D, px: number, py: number): void {
    const ink = '#1b1620', steel = '#8a8f96';
    ctx.fillStyle = ink;
    switch (this.mount) {
      case 'ceiling':
        ctx.fillRect(px - 2, py - 10, 5, 12);
        ctx.fillRect(px - 6, py - 11, 13, 3);
        ctx.fillStyle = steel; ctx.fillRect(px - 1, py - 9, 3, 10);
        break;
      case 'wall':
        ctx.fillRect(px - 6, py - 14, 13, 8);              // the plate on the wall
        ctx.fillRect(px - 2, py - 8, 5, 9);
        ctx.fillStyle = steel; ctx.fillRect(px - 5, py - 13, 11, 6); ctx.fillRect(px - 1, py - 7, 3, 7);
        break;
      case 'left':
      case 'right': {
        const wallX = this.mount === 'left' ? px - 10 : px + 7;
        ctx.fillRect(wallX, py - 8, 4, 14);                 // clamp on the pillar
        ctx.fillRect(Math.min(wallX, px), py - 2, Math.abs(px - wallX) + 2, 4);
        ctx.fillStyle = steel; ctx.fillRect(wallX + 1, py - 7, 2, 12);
        break;
      }
    }
  }

  private drawCone(ctx: CanvasRenderingContext2D, ex: number, ey: number): void {
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
  }
}
