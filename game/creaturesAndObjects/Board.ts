// file: game/creaturesAndObjects/Board.ts
//
// FINAL BOSS — THE BOARD (Floor 33). Dragon vs. hydra: five executives on
// long pinstripe necks rising from one giant boardroom table — the
// Chairman, the Pig, the Vampire, the Gorilla and the Robot.
//
//   lunge      a head winds up, shouts its buzzword and slams its chin into
//              the floor where Tero stands. Then it's dizzy for a moment:
//              stomp it.
//   dividends  idle heads spit gold coins in arcs (fire burns them)
//
// Tantrum fire hurts any head (it's a dragon fighting a hydra). Each head
// that goes down RESIGNS: out pops that executive, already freed and on
// the way home (the robot just breaks). The fewer heads, the faster.

import { t, tf } from '../i18n';
import { blitArt } from '../render/customImages';
import { creaturesAndObjects, type UpdateCtx } from './creaturesAndObjects';
import { overlaps, stompOverlap } from '../physics/AABB';
import { TILE_SIZE, PUFF_HEAT } from '../constants';
import type { Player } from './Player';
import type { Flame } from './Flame';
import type { Boss, BossPhase } from './Boss';
import type { WalkerVariant, HopperVariant } from './enemyKinds';
import { drawBubble } from './freed';
import { drawProjectorScreen } from '../render/office/bossArt';
import { drawManager } from '../render/characters/humans';
import { drawPig, drawVampire, drawGorilla, drawRobot } from '../render/characters/creatures';
import { Raster as RasterCtor, type Raster } from '../render/pixel/Raster';
import { drawText, textWidth } from '../render/pixel/font';

const ARENA_COLS = 15;
const FLOOR_ROW = 8;
const HEAD_W = 40;
const HEAD_H = 32;
const HEAT_PER_HEAD = 10;

type HeadState = 'idle' | 'windup' | 'lunge' | 'down' | 'back' | 'gone';

interface HeadDef {
  variant: WalkerVariant | HopperVariant;
  line: string;
  art: () => Raster;
  /** Crop of the head in the 32×32 rig (facing right): x, y, w, h. */
  crop: [number, number, number, number];
}

const HEADS: HeadDef[] = [
  { variant: 'manager', line: 'SYNERGY!',      art: () => drawManager(false),  crop: [8, 2, 20, 16] },
  { variant: 'pig',     line: 'DIVIDENDS!',    art: () => drawPig(0),          crop: [7, 0, 22, 16] },
  { variant: 'vampire', line: 'RESTRUCTURE!',  art: () => drawVampire(false),  crop: [10, 1, 18, 16] },
  { variant: 'gorilla', line: 'GROWTH!!',      art: () => drawGorilla(false),  crop: [9, 1, 20, 16] },
  { variant: 'robot',   line: 'OPTIMIZE.',     art: () => drawRobot(0),        crop: [7, 0, 22, 16] },
];

interface Head {
  def: HeadDef;
  state: HeadState;
  t: number;
  x: number; y: number;          // top-left of the head
  baseX: number; baseY: number;  // where the neck leaves the table
  restX: number; restY: number;
  fromX: number; fromY: number;
  toX: number; toY: number;
  heat: number;
  hurt: number;                  // flash ticks
}

interface Coin { x: number; y: number; vx: number; vy: number; active: boolean; life: number }

export class Board extends creaturesAndObjects implements Boss {
  readonly name = 'THE BOARD';
  readonly maxHp = HEADS.length;
  readonly arenaTx: number;
  phase: BossPhase = 'waiting';
  introDone = false;
  justHit = false;
  wantsIntern = false;
  freedNow = false;
  walkedOut = false;
  resigned: Boss['resigned'] = [];

  private heads: Head[] = [];
  private coins: Coin[] = [];
  private nextLunge = 90;
  private nextSpit = 60;
  private clock = 0;
  private endTimer = 0;
  private tableAlpha = 1;

  constructor(arenaTx: number) {
    // The body is the table; the heads have their own boxes.
    super((arenaTx + 9) * TILE_SIZE, 6 * TILE_SIZE - 8, 5 * TILE_SIZE, 2 * TILE_SIZE + 8);
    this.arenaTx = arenaTx;
    this.makeHeads();
  }

  get arenaLeft():  number { return this.arenaTx * TILE_SIZE; }
  get arenaRight(): number { return (this.arenaTx + ARENA_COLS) * TILE_SIZE; }
  get floorY():     number { return FLOOR_ROW * TILE_SIZE; }
  get hp():         number { return this.heads.filter((h) => h.state !== 'gone').length; }
  get fighting():   boolean { return this.phase === 'fight'; }
  get subtitle():   string { return this.phase === 'fight' ? tf('{n} HEADS LEFT', { n: this.hp }) : 'HAS RESIGNED'; }

  private makeHeads(): void {
    this.heads = HEADS.map((def, i) => {
      const baseX = this.x + 14 + i * 30;
      const baseY = this.y + 8;
      const restX = this.arenaLeft + (5.2 + i * 1.7) * TILE_SIZE;
      const restY = 36 + (i % 2) * 34;
      return { def, state: 'idle', t: i * 13, x: restX, y: restY, baseX, baseY, restX, restY, fromX: 0, fromY: 0, toX: 0, toY: 0, heat: 0, hurt: 0 };
    });
  }

  start(): void {
    this.phase = 'fight';
    this.makeHeads();
    this.coins = [];
    this.nextLunge = 70;
    this.nextSpit = 100;
  }

  reset(): void {
    this.phase = 'waiting';
    this.makeHeads();
    this.coins = [];
  }

  playerInArena(player: Player): boolean {
    return player.cx > this.arenaLeft + TILE_SIZE * 1.5;
  }

  update(): void { /* see tick() */ }

  tick(ctx: UpdateCtx, player: Player, flames: Flame[]): void {
    this.clock++;
    if (this.phase === 'freed') {
      this.tableAlpha = Math.max(0, this.tableAlpha - 0.01);
      if (++this.endTimer === 150) { this.walkedOut = true; this.phase = 'gone'; }
      return;
    }
    if (this.phase !== 'fight') { for (const h of this.heads) this.bob(h); return; }

    const alive = this.heads.filter((h) => h.state !== 'gone');
    const pace = 1 + (HEADS.length - alive.length) * 0.22;

    // Schedule a lunge with one idle head.
    if (--this.nextLunge <= 0) {
      const idle = alive.filter((h) => h.state === 'idle');
      if (idle.length) {
        const h = idle[Math.floor(Math.random() * idle.length)];
        h.state = 'windup';
        h.t = 0;
        ctx.audio.play('click');
      }
      this.nextLunge = Math.round(130 / pace);
    }
    // Dividends from an idle head
    if (--this.nextSpit <= 0) {
      const idle = alive.filter((h) => h.state === 'idle');
      if (idle.length) {
        const h = idle[Math.floor(Math.random() * idle.length)];
        const mx = h.x + 6, my = h.y + HEAD_H - 6;
        this.coins.push({ x: mx, y: my, vx: Math.max(-4.5, Math.min(-1, (player.cx - mx) / 55)), vy: -3.5, active: true, life: 0 });
      }
      this.nextSpit = Math.round(85 / pace);
    }

    for (const h of this.heads) this.stepHead(h, player, pace);
    this.updateCoins(ctx, player, flames);
    if (player.isDead) return;

    for (const h of this.heads) {
      if (h.state === 'gone') continue;
      const box = { x: h.x + 4, y: h.y + 2, w: HEAD_W - 8, h: HEAD_H - 4 };
      // Stomp a dizzy head
      if (h.state === 'down' && player.vy > 0 && stompOverlap(
        { x: player.x, y: player.y, w: player.w, h: player.h }, player.prevBottom, { ...box, h: 12 },
      )) {
        player.bounce();
        player.vy = -9;
        this.defeat(h, ctx);
        continue;
      }
      // Dragon fire vs. hydra
      for (const f of flames) {
        if (!f.active || !overlaps(f, box)) continue;
        f.active = false;
        h.hurt = 6;
        h.heat += f.frees ? 1 : PUFF_HEAT;
        if (h.heat >= HEAT_PER_HEAD) { this.defeat(h, ctx); break; }
      }
      if ((h.state as HeadState) === 'gone') continue;   // defeat() may have just run
      // A lunging head hurts
      if ((h.state === 'lunge' || h.state === 'back') && !player.isInvincible && !player.isTantrum &&
        overlaps({ x: player.x + 3, y: player.y + 4, w: player.w - 6, h: player.h - 4 }, box)) {
        player.hurt(ctx, 'the board');
      }
    }
  }

  private bob(h: Head): void {
    h.t++;
    h.x = h.restX + Math.sin(h.t / 31) * 6;
    h.y = h.restY + Math.sin(h.t / 19) * 7;
  }

  private stepHead(h: Head, player: Player, pace: number): void {
    switch (h.state) {
      case 'gone': return;
      case 'idle': this.bob(h); return;
      case 'windup':
        h.t++;
        h.x = h.restX + (h.t % 4 < 2 ? 2 : -2);           // shaking with ambition
        if (h.t >= Math.round(34 / pace)) {
          h.state = 'lunge';
          h.t = 0;
          h.fromX = h.x; h.fromY = h.y;
          h.toX = Math.max(this.arenaLeft + 8, Math.min(this.x - HEAD_W, player.cx - HEAD_W / 2));
          h.toY = this.floorY - HEAD_H;
        }
        return;
      case 'lunge': {
        h.t++;
        const k = Math.min(1, h.t / 20);
        const e = k * k;                                      // accelerate into the slam
        h.x = h.fromX + (h.toX - h.fromX) * e;
        h.y = h.fromY + (h.toY - h.fromY) * e;
        if (k >= 1) { h.state = 'down'; h.t = 0; }
        return;
      }
      case 'down':
        if (++h.t >= Math.round(90 / Math.sqrt(pace))) { h.state = 'back'; h.t = 0; h.fromX = h.x; h.fromY = h.y; }
        return;
      case 'back': {
        h.t++;
        const k = Math.min(1, h.t / 30);
        h.x = h.fromX + (h.restX - h.fromX) * k;
        h.y = h.fromY + (h.restY - h.fromY) * k;
        if (k >= 1) { h.state = 'idle'; }
        return;
      }
    }
  }

  /** The grenade takes out the head nearest the blast. */
  blast(ctx: UpdateCtx, x: number): void {
    if (this.phase !== 'fight') return;
    const alive = this.heads.filter((h) => h.state !== 'gone');
    if (!alive.length) return;
    alive.sort((a, b) => Math.abs(a.x + HEAD_W / 2 - x) - Math.abs(b.x + HEAD_W / 2 - x));
    this.defeat(alive[0], ctx);
  }

  private defeat(h: Head, ctx: UpdateCtx): void {
    h.state = 'gone';
    this.justHit = true;
    ctx.shake.trigger(7);
    ctx.audio.play('bossHit');
    ctx.particles.confetti(h.x + HEAD_W / 2, h.y + HEAD_H / 2);
    this.resigned.push({ variant: h.def.variant, x: Math.max(this.arenaLeft + 8, h.x + HEAD_W / 2), y: (FLOOR_ROW - 1) * TILE_SIZE });
    if (this.hp === 0) {
      this.phase = 'freed';
      this.freedNow = true;
      this.coins = [];
      this.endTimer = 0;
    }
  }

  private updateCoins(ctx: UpdateCtx, player: Player, flames: Flame[]): void {
    for (const c of this.coins) {
      c.life++;
      c.vy += 0.22;
      c.x += c.vx;
      c.y += c.vy;
      if (c.y > this.floorY - 5) { c.y = this.floorY - 5; c.vy *= -0.5; c.vx *= 0.8; }
      if (c.life > 200 || c.x < this.arenaLeft - 10) c.active = false;
      const box = { x: c.x - 5, y: c.y - 5, w: 10, h: 10 };
      for (const f of flames) if (f.active && overlaps(f, box)) { c.active = false; ctx.particles.burst(c.x, c.y, 4, '#ffd23f', '#ffb347'); }
      if (c.active && !player.isDead && overlaps({ x: player.x + 3, y: player.y + 3, w: player.w - 6, h: player.h - 3 }, box)) {
        player.hurt(ctx, 'the board');
        c.active = false;
      }
    }
    this.coins = this.coins.filter((c) => c.active);
  }

  // ─── Drawing ───────────────────────────────────────────────────────────────

  drawBackdrop(ctx: CanvasRenderingContext2D, camX: number): void {
    const title = this.phase === 'freed' || this.phase === 'gone' ? 'THE BOARD HAS RESIGNED' : 'INFINITE GROWTH';
    drawProjectorScreen(ctx, this.arenaLeft + TILE_SIZE - camX, TILE_SIZE + 4, 'SHAREHOLDER VALUE', title);
  }

  draw(ctx: CanvasRenderingContext2D, camX: number): void {
    if (this.tableAlpha <= 0) return;
    ctx.globalAlpha = this.tableAlpha;
    // necks first, then heads, then the table in front of the neck roots
    for (const h of this.heads) if (h.state !== 'gone') drawNeck(ctx, h, camX);
    for (const h of this.heads) if (h.state !== 'gone') this.drawHead(ctx, h, camX);
    drawTable(ctx, this.x - camX, this.y, this.w, this.h, this.phase === 'freed');
    for (const c of this.coins) drawDividend(ctx, c.x - camX, c.y);
    ctx.globalAlpha = 1;
  }

  private drawHead(ctx: CanvasRenderingContext2D, h: Head, camX: number): void {
    const img = headCanvas(h.def);
    const x = Math.round(h.x - camX), y = Math.round(h.y);
    const alpha = ctx.globalAlpha;
    if (h.hurt > 0) { h.hurt--; ctx.globalAlpha = alpha * 0.55; }
    if (!blitArt(ctx, 'board_heads', HEADS.indexOf(h.def), x, y, HEAD_W, HEAD_H)) ctx.drawImage(img, x, y, HEAD_W, HEAD_H);
    ctx.globalAlpha = alpha;
    if (h.state === 'windup') drawBubble(ctx, h.def.line, x + HEAD_W / 2, y - 2);
    if (h.state === 'down') {
      // dizzy stars
      for (let i = 0; i < 3; i++) {
        const a = this.clock / 9 + (i * Math.PI * 2) / 3;
        ctx.fillStyle = '#ffd23f';
        ctx.fillRect(Math.round(x + HEAD_W / 2 + Math.cos(a) * 14) - 1, Math.round(y - 4 + Math.sin(a) * 4) - 1, 3, 3);
      }
    }
  }
}

// ─── Art helpers ─────────────────────────────────────────────────────────────

const heads = new Map<string, HTMLCanvasElement>();
/** The head cropped from the character rig, facing left, at native size. */
function headCanvas(def: HeadDef): HTMLCanvasElement {
  let c = heads.get(def.variant);
  if (!c) {
    const src = def.art().flipX().toCanvas();
    const [cx, cy, cw, ch] = def.crop;
    c = document.createElement('canvas');
    c.width = cw;
    c.height = ch;
    c.getContext('2d')!.drawImage(src, 32 - cx - cw, cy, cw, ch, 0, 0, cw, ch);
    heads.set(def.variant, c);
  }
  return c;
}

/** A long pinstripe neck from the table to the head, ending in a collar and tie. */
function drawNeck(ctx: CanvasRenderingContext2D, h: Head, camX: number): void {
  const x0 = h.baseX - camX, y0 = h.baseY;
  const x1 = h.x + HEAD_W / 2 + 4 - camX, y1 = h.y + HEAD_H - 4;
  const cx = (x0 + x1) / 2 + 18, cy = Math.min(y0, y1) - 30;      // curve up and over
  const n = 14;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const px = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1;
    const py = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1;
    ctx.fillStyle = '#1b1620';
    ctx.fillRect(Math.round(px) - 7, Math.round(py) - 7, 14, 14);
    ctx.fillStyle = i % 2 ? '#26305a' : '#2c3768';
    ctx.fillRect(Math.round(px) - 6, Math.round(py) - 6, 12, 12);
    ctx.fillStyle = '#3a4878';
    ctx.fillRect(Math.round(px) - 2, Math.round(py) - 6, 1, 12);   // pinstripe
  }
  // collar + tie under the head
  ctx.fillStyle = '#e9e6dc';
  ctx.fillRect(Math.round(x1) - 7, Math.round(y1) - 3, 14, 4);
  ctx.fillStyle = '#b8343a';
  ctx.fillRect(Math.round(x1) - 1, Math.round(y1) - 1, 3, 9);
}

function drawTable(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, resigned: boolean): void {
  x = Math.round(x);
  ctx.fillStyle = '#1b1620';
  ctx.fillRect(x - 1, y - 1, w + 2, 12);
  ctx.fillStyle = '#5e3b1f';                       // mahogany top
  ctx.fillRect(x, y, w, 10);
  ctx.fillStyle = '#7a5232';
  ctx.fillRect(x, y, w, 2);
  ctx.fillStyle = '#3e2614';                       // the front panel
  ctx.fillRect(x + 4, y + 10, w - 8, h - 10);
  const plaque = plaqueCanvas(t(resigned ? 'RESIGNED' : 'THE BOARD'));
  ctx.drawImage(plaque, Math.round(x + w / 2 - plaque.width / 2), y + 22);
}

const plaques = new Map<string, HTMLCanvasElement>();
function plaqueCanvas(text: string): HTMLCanvasElement {
  let c = plaques.get(text);
  if (!c) {
    const r = new RasterCtor(textWidth(text) + 10, 11);
    r.rect(0, 0, r.w, 11, '#1b1620');
    r.rect(1, 1, r.w - 2, 9, '#c9a24a');
    drawText(r, text, 5, 3, '#1b1620');
    c = r.toCanvas();
    plaques.set(text, c);
  }
  return c;
}

function drawDividend(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  x = Math.round(x); y = Math.round(y);
  ctx.fillStyle = '#1b1620';
  ctx.fillRect(x - 5, y - 4, 10, 8);
  ctx.fillRect(x - 4, y - 5, 8, 10);
  ctx.fillStyle = '#ffd23f';
  ctx.fillRect(x - 4, y - 3, 8, 6);
  ctx.fillRect(x - 3, y - 4, 6, 8);
  ctx.fillStyle = '#a87b12';
  ctx.fillRect(x - 1, y - 3, 2, 6);
}
