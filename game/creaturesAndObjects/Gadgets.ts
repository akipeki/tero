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

import { blitArt } from '../render/customImages';
import { creaturesAndObjects, type UpdateCtx } from './creaturesAndObjects';
import { overlaps } from '../physics/AABB';
import { TILE_SIZE } from '../constants';
import type { Player } from './Player';
import { drawText } from '../render/pixel/font';
import { Raster } from '../render/pixel/Raster';
import { drawElvisAt, drawBarrelFire } from '../render/office/ventArt';
import { drawWalkerSprite } from '../render/sprites/WalkerSprite';
import { drawBubble } from './freed';
import type { WalkerVariant } from './enemyKinds';

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
    if (blitArt(ctx, 'fax', this.busy > 0 ? 1 : 0, x + shake, y)) { this.drawLabels(ctx, x, y, shake); return; }
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
    this.drawLabels(ctx, x, y, shake);
  }

  /** FAX/OUT label, the DOWN prompt and JAM — over the built-in or your art. */
  private drawLabels(ctx: CanvasRenderingContext2D, x: number, y: number, shake: number): void {
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
    if (blitArt(ctx, 'spring', this.squash > 0 ? 1 : 0, x, bottom - 14)) return;
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

/** The golden parachute: a bulging gold sack with a CEO EXIT tag. Pick it
 *  up and holding jump while falling glides. */
export class ChutePickup extends creaturesAndObjects {
  private t = 0;

  constructor(tx: number, ty: number) {
    super(tx * TILE_SIZE + 6, ty * TILE_SIZE + 8, 20, 22);
  }

  /** True on the tick Tero grabs it. */
  check(player: Player): boolean {
    if (!this.active || player.isDead || !overlaps(player, this)) return false;
    this.active = false;
    player.hasChute = true;
    return true;
  }

  update(): void { this.t++; }

  draw(ctx: CanvasRenderingContext2D, camX: number): void {
    const bob = Math.round(Math.sin(this.t / 12) * 2);
    const x = Math.round(this.x - camX), y = Math.round(this.y) + bob;
    ctx.fillStyle = 'rgba(255,210,63,0.25)';
    ctx.fillRect(x - 4, y - 4, this.w + 8, this.h + 8);                 // glow
    if (blitArt(ctx, 'chute', 0, x, y)) return;
    ctx.fillStyle = '#1b1620';
    ctx.fillRect(x + 2, y + 5, this.w - 4, this.h - 5);
    ctx.fillRect(x + 6, y, this.w - 12, 7);
    ctx.fillStyle = '#e8b72f';
    ctx.fillRect(x + 3, y + 6, this.w - 6, this.h - 7);
    ctx.fillStyle = '#fff0a0';
    ctx.fillRect(x + 5, y + 8, 3, 6);
    ctx.fillStyle = '#a87b12';
    ctx.fillRect(x + 7, y + 1, this.w - 14, 5);                         // the knot
    ctx.drawImage(label('$'), x + 6, y + 12);
  }
}

/** The canopy over Tero's head while he glides (feet at footX, footY). */
export function drawCanopy(ctx: CanvasRenderingContext2D, footX: number, footY: number): void {
  const x = Math.round(footX), top = Math.round(footY - 78);
  if (blitArt(ctx, 'canopy', 0, x - 25, top)) return;
  ctx.fillStyle = '#1b1620';
  ctx.fillRect(x - 25, top + 6, 50, 9);
  ctx.fillRect(x - 21, top + 2, 42, 5);
  ctx.fillStyle = '#e8b72f';
  ctx.fillRect(x - 24, top + 7, 48, 7);
  ctx.fillRect(x - 20, top + 3, 40, 5);
  ctx.fillStyle = '#fff0a0';
  for (let i = -20; i < 20; i += 10) ctx.fillRect(x + i, top + 4, 5, 9);   // gores
  ctx.strokeStyle = '#5a5f68';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const dx of [-22, -8, 8, 22]) {
    ctx.moveTo(x + dx + 0.5, top + 14);
    ctx.lineTo(x + Math.sign(dx) * 4 + 0.5, top + 40);
  }
  ctx.stroke();
}

// ─── Dad's things ────────────────────────────────────────────────────────────
// One per floor, tucked somewhere a little out of the way. Each says a bit
// about who Dad was before the job ate him. The end card counts them.

export const DAD_THINGS: Record<string, { name: string; note: string }> = {
  watch:    { name: 'DAD\'S WATCH',             note: 'IT STOPPED IN MARCH' },
  drawing:  { name: 'TERO\'S DRAWING',          note: 'PINNED IN HIS CUBICLE' },
  photo:    { name: 'THE WEDDING PHOTO',        note: 'FACE DOWN IN A DRAWER' },
  letter:   { name: 'A RESIGNATION LETTER',     note: 'WRITTEN. NEVER SENT.' },
  slipper:  { name: 'ONE SLIPPER',              note: 'THE OTHER IS ON FLOOR 21' },
  buspass:  { name: 'HIS BUS PASS',             note: 'EXPIRED 2019' },
  book:     { name: '"HOW TO SAY NO"',          note: 'BOOKMARK ON PAGE 2' },
  remote:   { name: 'THE TV REMOTE',            note: 'SATURDAY CARTOONS' },
  key:      { name: 'THE HOUSE KEY',            note: 'STILL FITS' },
  sandwich: { name: 'HALF A SANDWICH WRAPPER',  note: 'IN DAD\'S WRITING: "FOR THE DOG"' },
};

export class DadThing extends creaturesAndObjects {
  private t = 0;
  readonly id: string;

  constructor(tx: number, ty: number, id: string) {
    super(tx * TILE_SIZE + 8, ty * TILE_SIZE + 8, 16, 16);
    this.id = id;
  }

  /** True on the tick Tero picks it up. */
  check(player: Player): boolean {
    if (!this.active || player.isDead || !overlaps(player, this)) return false;
    this.active = false;
    return true;
  }

  update(): void { this.t++; }

  draw(ctx: CanvasRenderingContext2D, camX: number): void {
    const bob = Math.round(Math.sin(this.t / 14) * 2);
    const x = Math.round(this.x - camX), y = Math.round(this.y) + bob;
    // a soft heart-shaped glow, so it reads as "Dad's", not "loot"
    ctx.fillStyle = 'rgba(255,119,168,0.28)';
    ctx.fillRect(x - 5, y - 5, 26, 26);
    if (!blitArt(ctx, 'dad_things', this.id, x, y)) {
      ctx.fillStyle = '#1b1620';
      ctx.fillRect(x - 1, y - 1, 18, 18);
      ctx.fillStyle = '#ff77a8';
      ctx.fillRect(x, y, 16, 16);
      ctx.drawImage(label('D'), x + 4, y + 4);
    }
    if (this.t % 50 < 6) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 12, y - 3, 2, 2);
    }
  }
}

// ─── The vents' residents ────────────────────────────────────────────────────

/** Elvis, sitting and wagging until Tero arrives. Once Tero rides him,
 *  Game draws him under Tero instead and this one hides. */
export class ElvisNpc extends creaturesAndObjects {
  t = 0;
  constructor(tx: number, ty: number) {
    super(tx * TILE_SIZE - 26, ty * TILE_SIZE + TILE_SIZE - 40, 52, 40);
  }
  update(): void { this.t++; }
  draw(ctx: CanvasRenderingContext2D, camX: number): void {
    drawElvisAt(ctx, this.cx - camX, this.bottom, this.t % 60 < 30 ? 'sit' : 'run0', false);
  }
}

/** One of the people who live in the pipes. Already free: warm faces. */
export class Npc extends creaturesAndObjects {
  /** Neighbours take turns talking: each gets its own slot in the cycle. */
  private static count = 0;
  private t: number;
  private lineIdx = 0;
  constructor(tx: number, ty: number, readonly variant: WalkerVariant, private lines: string[] = [], private facing = false) {
    super(tx * TILE_SIZE + 5, ty * TILE_SIZE + TILE_SIZE - 24, 22, 24);
    this.t = (Npc.count++ % 4) * 90;
  }
  update(): void {
    this.t++;
    if (this.t % 360 === 0 && this.lines.length) this.lineIdx = (this.lineIdx + 1) % this.lines.length;
  }
  draw(ctx: CanvasRenderingContext2D, camX: number): void {
    drawWalkerSprite(ctx, {
      x: this.x, y: this.y, w: this.w, h: this.h, camX, facingRight: this.facing, animFrame: 0,
      dying: false, scaleY: 1, variant: this.variant, freed: true, animTick: this.t,
    });
    if (this.lines.length && this.t % 360 < 85) drawBubble(ctx, this.lines[this.lineIdx], this.cx - camX, this.y - 3);
  }
}

export class Barrel extends creaturesAndObjects {
  private t = 0;
  constructor(tx: number, ty: number) {
    super(tx * TILE_SIZE + 7, ty * TILE_SIZE + TILE_SIZE - 22, 18, 22);
  }
  update(ctx: UpdateCtx): void {
    this.t++;
    if (this.t % 10 === 0) ctx.particles.burst(this.cx, this.y - 6, 1, '#ffd23f', '#ff8c3a');
  }
  draw(ctx: CanvasRenderingContext2D, camX: number): void { drawBarrelFire(ctx, this.cx - camX, this.bottom, this.t); }
}
