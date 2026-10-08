// file: game/interludes/terms.ts
//
// TERMS & CONDITIONS (Floor 13, Legal). Legal won't let Tero past until he
// accepts the terms, so the game becomes a vertical climb up a 21-clause
// employment contract. Every clause is a platform (jump up through it).
// Clause 12 (the non-compete) and clause 15 are red tape across the page:
// burn them. Clause 13.3 has no floor. Clause 16.1 "may change at any
// time" (it moves). "INITIAL HERE" lines are checkpoints. At the top the
// I AGREE button runs away, of course. He signs in crayon. It's void: he's two.

import { VIEWPORT_W, VIEWPORT_H } from '../constants';
import { Interlude, type InterludeHost } from './Interlude';
import { text, shadowText, button, noise } from './pixtext';
import { drawTero, preloadTero } from './teroSprite';

const W = VIEWPORT_W, H = VIEWPORT_H;
const PX0 = 90, PX1 = 390;          // the paper's edges
const ROW = 40;
const GRAV = 0.32, JUMP = -6.6, RUN = 1.9;
const TERO_W = 14;

type Kind = 'line' | 'burn' | 'pit' | 'move' | 'initial' | 'agree';
interface Clause { text: string; kind: Kind; x0: number; x1: number; y: number; burnt: number; dx: number }

const CLAUSES: [string, Kind][] = [
  ['1.1 THE EMPLOYEE ("TERO") AGREES TO BE TWO.', 'line'],
  ['1.2 NAPS ARE UNPAID.', 'line'],
  ['2.1 SNACKS ARE A PERFORMANCE INCENTIVE.', 'line'],
  ['2.4 CRYING IS A BREACH OF CONTRACT.', 'line'],
  ['INITIAL HERE: ____', 'initial'],
  ['3.0 THE COMPANY OWNS ALL DRAWINGS.', 'line'],
  ['3.2 ...INCLUDING THE ONES OF DADA.', 'line'],
  ['4.1 OVERTIME IS ITS OWN REWARD.', 'line'],
  ['5.5 WEEKENDS ARE A BENEFIT, NOT A RIGHT.', 'line'],
  ['12.0 NON-COMPETE: FOREVER.', 'burn'],
  ['6.0 THE COMPANY IS A FAMILY.', 'line'],
  ['6.1 YOUR FAMILY IS NOT.', 'line'],
  ['INITIAL HERE: ____', 'initial'],
  ['13.3 THE FLOOR IS NOT INCLUDED.', 'pit'],
  ['8.8 SICK DAYS: BOOK 6 MONTHS AHEAD.', 'line'],
  ['9.0 THE EMPLOYEE WAIVES THE RIGHT TO WAVE.', 'line'],
  ['16.1 THIS CONTRACT MAY CHANGE AT ANY TIME.', 'move'],
  ['10.2 HUGS NEED A MANAGER\'S APPROVAL.', 'line'],
  ['15.0 DADA BELONGS TO THE COMPANY.', 'burn'],
  ['INITIAL HERE: ____', 'initial'],
  ['17.0 BY READING THIS, YOU AGREE.', 'line'],
  ['18.0 BY NOT READING THIS, YOU ALSO AGREE.', 'line'],
  ['19.9 PAYMENT: EXPOSURE.', 'line'],
  ['21.0 SIGN BELOW. CRAYON IS FINE.', 'line'],
  ['', 'agree'],
];

export class TermsAndConditions extends Interlude {
  readonly id = 'terms' as const;
  private rows: Clause[] = [];
  private docH: number;
  private x = PX0 + 40;
  private y: number;              // feet
  private prevY: number;
  private vx = 0; private vy = 0;
  private ground = false;
  private face = true;
  private walk = 0;
  private camY = 0;
  private checkX: number; private checkY: number;
  private puffs: { x: number; y: number; vx: number; life: number }[] = [];
  private embers: { x: number; y: number; vy: number; life: number }[] = [];
  private bx = PX1 - 70; private flees = 0; private moveT = 0; private fromX = 0; private toX = 0;
  private signed = 0;
  private intro = 0;
  private falls = 0;

  constructor() {
    super();
    preloadTero();
    const n = CLAUSES.length;
    this.docH = n * ROW + 220;
    CLAUSES.forEach(([s, kind], i) => {
      const y = this.docH - 80 - i * ROW;
      // zig-zag: short lines alternate sides, so you hop across as you climb
      const left = i % 2 === 0;
      const w = kind === 'burn' || kind === 'pit' || kind === 'agree' ? PX1 - PX0 : 150 + Math.floor(noise(i * 3) * 50);
      const x0 = kind === 'burn' || kind === 'pit' || kind === 'agree' ? PX0 : left ? PX0 + 6 : PX1 - 6 - w;
      this.rows.push({ text: s, kind, x0, x1: x0 + w, y, burnt: 0, dx: 0 });
    });
    // the desk under the first page
    this.rows.unshift({ text: '', kind: 'line', x0: PX0, x1: PX1, y: this.docH - 20, burnt: 0, dx: 0 });
    this.y = this.prevY = this.docH - 20;
    this.checkX = this.x; this.checkY = this.y;
    this.camY = this.docH - H;
  }

  get hidesPlayer(): boolean { return true; }

  /** The segments of a row you can stand on (a pit has a gap). Red tape
   *  is solid from below until it's burnt, then it's a charred line. */
  private segments(r: Clause): [number, number][] {
    if (r.kind === 'pit') return [[r.x0, r.x0 + 70], [r.x1 - 70, r.x1]];
    return [[r.x0, r.x1]];
  }

  update(host: InterludeHost): void {
    this.t++;
    const inp = host.input;
    if (this.intro < 100) {
      this.intro++;
      if (this.intro === 1) host.audio.play('plop');
      if (this.intro > 30 && (inp.jumpPressed || inp.firePressed)) this.intro = 100;
      return;
    }
    if (this.signed > 0) {
      this.signed++;
      if (this.signed > 60 && (inp.jumpPressed || inp.firePressed)) this.done = true;
      return;
    }

    // the moving clause
    for (const r of this.rows) if (r.kind === 'move') {
      const w = r.x1 - r.x0, was = r.x0;
      r.x0 = PX0 + 10 + (Math.sin(this.t / 50) * 0.5 + 0.5) * (PX1 - PX0 - 20 - w);
      r.x1 = r.x0 + w;
      r.dx = r.x0 - was;
    }
    for (const r of this.rows) if (r.burnt > 0 && r.burnt < 40) r.burnt++;

    // Tero
    let ax = 0;
    if (inp.left) { ax = -1; this.face = false; }
    if (inp.right) { ax = 1; this.face = true; }
    this.vx = ax * RUN;
    if (inp.jumpPressed && this.ground) { this.vy = JUMP; this.ground = false; host.audio.play('jump'); }
    if (!inp.jump && this.vy < -2) this.vy = -2;           // short hop on release
    this.vy = Math.min(7, this.vy + GRAV);
    this.prevY = this.y;
    this.x = Math.max(PX0 + TERO_W / 2, Math.min(PX1 - TERO_W / 2, this.x + this.vx));
    this.y += this.vy;
    if (this.vx) this.walk += Math.abs(this.vx);

    this.ground = false;
    for (const r of this.rows) {
      for (const [a, b] of this.segments(r)) {
        if (this.x < a - 4 || this.x > b + 4) continue;
        // land on it from above
        if (this.vy >= 0 && this.prevY <= r.y + 0.01 && this.y >= r.y) {
          this.y = r.y; this.vy = 0; this.ground = true;
          if (r.kind === 'move') this.x += r.dx;   // ride along
          if (r.kind === 'initial' && this.checkY !== r.y) {
            this.checkX = this.x; this.checkY = r.y;
            host.audio.play('checkpoint');
          }
        }
        // red tape is solid from below too, until it burns
        if (r.kind === 'burn' && !r.burnt && this.vy < 0 && this.y - 26 < r.y + 10 && this.prevY - 26 >= r.y + 10) {
          this.y = r.y + 36; this.vy = 0.5;
          host.audio.play('block');
        }
      }
    }

    // fire
    if (inp.firePressed) {
      this.puffs.push({ x: this.x + (this.face ? 10 : -10), y: this.y - 18, vx: this.face ? 4 : -4, life: 14 });
      // breathe upward too when jumping or standing under red tape
      const tapeAbove = this.rows.some((r) => r.kind === 'burn' && !r.burnt && r.y < this.y && this.y - r.y < 70);
      if (!this.ground || tapeAbove) this.puffs.push({ x: this.x, y: this.y - 30, vx: 0, life: 14 });
      host.audio.play('puff');
    }
    for (const p of this.puffs) {
      p.x += p.vx; p.life--;
      if (p.vx === 0) p.y -= 4;
      for (const r of this.rows) {
        if (r.kind !== 'burn' || r.burnt) continue;
        if (p.x > r.x0 && p.x < r.x1 && p.y > r.y - 6 && p.y < r.y + 16) {
          r.burnt = 1; p.life = 0;
          host.audio.play('burn');
          for (let i = 0; i < 24; i++) this.embers.push({ x: r.x0 + noise(i + this.t) * (r.x1 - r.x0), y: r.y, vy: -1 - noise(i * 3) * 2, life: 40 });
        }
      }
    }
    this.puffs = this.puffs.filter((p) => p.life > 0);
    for (const e of this.embers) { e.y += e.vy; e.life--; }
    this.embers = this.embers.filter((e) => e.life > 0);

    // fell off the bottom of the screen: back to the last initials
    if (this.y > this.camY + H + 30) {
      this.falls++;
      this.x = this.checkX; this.y = this.prevY = this.checkY; this.vy = 0;
      host.audio.play('hurt');
    }

    // the I AGREE button
    const top = this.rows[this.rows.length - 1];
    if (this.moveT > 0) {
      this.moveT--;
      const k = 1 - this.moveT / 22;
      this.bx = this.fromX + (this.toX - this.fromX) * k * k * (3 - 2 * k);
    } else if (Math.abs(this.y - top.y) < 30) {
      const near = Math.abs(this.x - (this.bx + 30)) < 44;
      if (near && this.flees < 3) {
        this.flees++;
        this.fromX = this.bx;
        this.toX = this.x > (PX0 + PX1) / 2 ? PX0 + 8 : PX1 - 68;
        this.moveT = 22;
        host.audio.play('boing');
      } else if (this.flees >= 3 && this.x > this.bx - 4 && this.x < this.bx + 64 && this.ground && this.y === top.y) {
        this.signed = 1;
        host.audio.play('goal');
      }
    }

    // camera follows, upward
    const want = Math.max(0, Math.min(this.docH - H, this.y - 170));
    this.camY += (want - this.camY) * 0.12;
  }

  // ─── Drawing ───────────────────────────────────────────────────────────────

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#5a3a2a'; ctx.fillRect(0, 0, W, H);           // the lawyer's desk
    ctx.fillStyle = '#6b4632';
    for (let y = -((this.camY * 0.3) % 24); y < H; y += 24) ctx.fillRect(0, y, W, 2);
    const cy = Math.round(this.camY);
    // the paper
    ctx.fillStyle = '#1b1620'; ctx.fillRect(PX0 - 2, -cy, PX1 - PX0 + 4, this.docH);
    ctx.fillStyle = '#f4f1e6'; ctx.fillRect(PX0, -cy, PX1 - PX0, this.docH);
    ctx.fillStyle = '#e8b4b4'; ctx.fillRect(PX0 + 14, -cy, 1, this.docH);   // margin
    text(ctx, 'TERMS AND CONDITIONS OF EMPLOYMENT', (PX0 + PX1) / 2, this.docH - 46 - cy, '#1b1620', 1, 'center');
    text(ctx, '(TODDLER EDITION. PAGE 1 OF 40.)', (PX0 + PX1) / 2, this.docH - 36 - cy, '#808080', 1, 'center');

    for (const r of this.rows) {
      const y = r.y - cy;
      if (y < -40 || y > H + 40) continue;
      if (r.kind === 'agree') continue;
      if (r.kind === 'burn') {
        if (r.burnt > 0) {
          // what's left: a charred line
          ctx.fillStyle = '#3a2a20'; ctx.fillRect(r.x0, y, r.x1 - r.x0, 2);
          for (let x = r.x0; x < r.x1; x += 9) ctx.fillRect(x, y - 1 - ((x * 7) % 3), 4, 2);
          ctx.globalAlpha = Math.max(0, 1 - r.burnt / 40);
        }
        ctx.fillStyle = '#d83b3b'; ctx.fillRect(r.x0, y - 2, r.x1 - r.x0, 12);
        ctx.fillStyle = '#9c2424';
        for (let x = r.x0; x < r.x1; x += 12) ctx.fillRect(x, y - 2, 6, 12);
        text(ctx, r.text, (r.x0 + r.x1) / 2, y + 2, '#ffffff', 1, 'center');
        ctx.globalAlpha = 1;
        continue;
      }
      for (const [a, b] of this.segments(r)) {
        ctx.fillStyle = r.kind === 'initial' ? '#3f62d8' : '#1b1620';
        ctx.fillRect(a, y, b - a, 2);
      }
      const col = r.kind === 'initial' ? '#3f62d8' : r.kind === 'pit' ? '#d83b3b' : '#1b1620';
      text(ctx, r.text, r.kind === 'pit' ? (r.x0 + r.x1) / 2 : r.x0 + 2, y - 9, col, 1, r.kind === 'pit' ? 'center' : 'left');
      if (r.kind === 'initial' && this.checkY === r.y) text(ctx, 'T.', r.x0 + 58, y - 11, '#ff6f86', 2);
    }

    // the top: I AGREE (runs) and I DECLINE (greyed out)
    const top = this.rows[this.rows.length - 1];
    const ty = top.y - cy;
    ctx.fillStyle = '#1b1620'; ctx.fillRect(PX0, ty, PX1 - PX0, 2);
    button(ctx, this.bx, ty - 16, 60, this.flees >= 3 ? 'I AGREE.' : 'I AGREE');
    text(ctx, '[ I DECLINE ]', (PX0 + PX1) / 2, ty - 34, '#c9ccd1', 1, 'center');
    text(ctx, '(NOT AVAILABLE IN YOUR REGION)', (PX0 + PX1) / 2, ty - 26, '#c9ccd1', 1, 'center');

    for (const e of this.embers) { ctx.fillStyle = e.life % 6 < 3 ? '#ff9a52' : '#ffd23f'; ctx.fillRect(e.x, e.y - cy, 3, 3); }
    for (const p of this.puffs) {
      ctx.fillStyle = '#ff9a52'; ctx.fillRect(p.x - 4, p.y - cy - 4, 8, 8);
      ctx.fillStyle = '#fff6b0'; ctx.fillRect(p.x - 2, p.y - cy - 2, 4, 4);
    }
    const anim = !this.ground ? (this.vy < 0 ? 'jump' : 'fall') : this.vx ? 'walk' : 'idle';
    drawTero(ctx, anim, Math.floor(anim === 'walk' ? this.walk / 9 : this.t / 10), this.x, this.y - cy + 2, 34, !this.face);

    // margins: what the lawyers think of you
    text(ctx, 'LEGAL', 30, 12, '#c9a07a', 2);
    text(ctx, `FALLS: ${this.falls}`, 12, 30, '#c9a07a');
    text(ctx, 'CLIMB TO AGREE', W - 46, 12, '#c9a07a', 1, 'center');
    text(ctx, 'FIRE BURNS\nRED TAPE', W - 46, 26, '#ff9a52', 1, 'center');

    if (this.intro < 100) {
      ctx.fillStyle = 'rgba(20,16,28,0.85)'; ctx.fillRect(0, 0, W, H);
      shadowText(ctx, 'BEFORE YOU CONTINUE', W / 2, 70, '#ffffff', 2, 'center');
      shadowText(ctx, 'PLEASE ACCEPT THE TERMS.', W / 2, 92, '#ffd23f', 2, 'center');
      text(ctx, 'YOU MUST SCROLL TO THE TOP TO AGREE.\nYES, THE TOP. LEGAL MOVED IT.', W / 2, 130, '#c9ccd1', 1, 'center');
      if (this.intro > 30 && this.t % 50 < 34) text(ctx, 'PRESS JUMP', W / 2, 180, '#ffffff', 1, 'center');
    }
    if (this.signed > 0) {
      ctx.fillStyle = 'rgba(20,16,28,0.88)'; ctx.fillRect(40, 60, W - 80, 140);
      shadowText(ctx, 'CONTRACT SIGNED', W / 2, 76, '#ffd23f', 2, 'center');
      text(ctx, 'SIGNATURE:', W / 2 - 60, 104, '#c9ccd1');
      // the crayon "DADA"
      ctx.save();
      ctx.translate(W / 2 + 20, 108);
      ctx.rotate(-0.12);
      shadowText(ctx, 'DADA', 0, -6, '#ff6f86', 3, 'center', '#9c2424');
      ctx.restore();
      text(ctx, 'LEGAL REVIEW: VOID.\n(THE EMPLOYEE IS TWO.)', W / 2, 136, '#ffffff', 1, 'center');
      if (this.signed > 60 && this.t % 50 < 34) text(ctx, 'PRESS JUMP', W / 2, 178, '#808080', 1, 'center');
    }
  }
}

