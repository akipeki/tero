// file: game/interludes/review.ts
//
// THE QUARTERLY REVIEW (after Halvorsen, Floor 12). The screen shatters into
// a turn-based RPG battle, 1990s style: Tero vs. THE PERFORMANCE REVIEW, a
// sentient form with a red pen. Menu: FIGHT · CRY · NAP · BITE.
//
// FIGHT does 1 damage. BITE does real damage. CRY is super effective, but
// Tero has to be sad enough first. NAP restores his patience. When his
// patience runs out he doesn't lose: he has a meltdown, which is the most
// effective move in the game. Nobody fails a toddler's review.

import { VIEWPORT_W, VIEWPORT_H } from '../constants';
import { Interlude, type InterludeHost } from './Interlude';
import { text, shadowText, noise } from './pixtext';
import { drawTero, preloadTero } from './teroSprite';
import { t } from '../i18n';
import { Action } from '../types';
import { blitArt } from '../render/customImages';

export const REVIEW_W = 132, REVIEW_H = 116;
export type ReviewFrame = 'idle' | 'attack' | 'hurt' | 'defeated';

/** THE PERFORMANCE REVIEW in a REVIEW_W × REVIEW_H box at (x0, y0): a
 *  sentient form with a face and a red pen arm on the left. `pen` bobs it. */
export function drawReviewForm(ctx: CanvasRenderingContext2D, x0: number, y0: number, frame: ReviewFrame, pen = 0): void {
  const x = x0 + 40, y = y0 + 2;
  ctx.save();
  if (frame === 'defeated') { ctx.translate(x + 30, y + 110); ctx.rotate(0.1); ctx.translate(-(x + 30), -(y + 110)); }
  ctx.fillStyle = '#1b1620'; ctx.fillRect(x - 2, y - 2, 94, 114);
  ctx.fillStyle = '#f4f1e6'; ctx.fillRect(x, y, 90, 110);
  ctx.fillStyle = '#d8d4c4'; ctx.fillRect(x + 70, y, 20, 20);   // dog-ear
  text(ctx, 'PERFORMANCE', x + 45, y + 6, '#1b1620', 1, 'center');
  text(ctx, 'REVIEW Q3', x + 45, y + 13, '#d83b3b', 1, 'center');
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i === 0 ? '#ffd23f' : '#c9ccd1';
    ctx.fillRect(x + 12 + i * 14, y + 24, 9, 9);
  }
  ctx.fillStyle = '#9aa0a8';
  for (let i = 0; i < 4; i++) ctx.fillRect(x + 10, y + 82 + i * 6, 70 - i * 9, 2);
  // the face: angry eyebrows, eyes, a zig-zag mouth
  ctx.fillStyle = '#1b1620';
  const brow = frame === 'attack' ? 4 : 0;
  ctx.fillRect(x + 18, y + 42 + brow, 18, 4); ctx.fillRect(x + 54, y + 42 + brow, 18, 4);
  if (frame === 'hurt' || frame === 'defeated') {
    ctx.fillRect(x + 22, y + 52, 10, 3); ctx.fillRect(x + 58, y + 52, 10, 3);   // squeezed shut
  } else {
    ctx.fillRect(x + 22, y + 48, 10, 10); ctx.fillRect(x + 58, y + 48, 10, 10);
    ctx.fillStyle = '#ff3b3b';
    ctx.fillRect(x + 25, y + 51, 4, 4); ctx.fillRect(x + 61, y + 51, 4, 4);
  }
  ctx.fillStyle = '#1b1620';
  const wide = frame === 'attack' ? 3 : 0;
  for (let i = 0; i < 6; i++) ctx.fillRect(x + 26 + i * 7, y + 66 + (i % 2) * (4 + wide), 7, 3);
  // the red pen arm (raised when it attacks)
  const pa = frame === 'attack' ? -14 : frame === 'defeated' ? 10 : pen;
  ctx.fillStyle = '#1b1620'; ctx.fillRect(x - 22, y + 40 + pa, 24, 4);
  ctx.fillStyle = '#d83b3b'; ctx.fillRect(x - 34, y + 34 + pa, 14, 5);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 38, y + 35 + pa, 4, 3);
  ctx.restore();
}

const W = VIEWPORT_W, H = VIEWPORT_H;
const MAX_PATIENCE = 30;
const REVIEW_HP = 100;
const MENU = ['FIGHT', 'CRY', 'NAP', 'BITE'] as const;
type Move = typeof MENU[number];

interface EnemyAttack { name: string; lines: string[]; dmg: number }
const ATTACKS: EnemyAttack[] = [
  { name: 'SYNERGY', lines: ['THE REVIEW USES SYNERGY!', 'NOBODY KNOWS WHAT IT MEANS.\nTERO LOSES 5 PATIENCE.'], dmg: 5 },
  { name: 'UNLIMITED PTO', lines: ['THE REVIEW OFFERS UNLIMITED PTO!', '(0 DAYS TAKEN.)\nTERO LOSES 4 PATIENCE ANYWAY.'], dmg: 4 },
  { name: 'MEETS EXPECTATIONS', lines: ['THE REVIEW SAYS: "MEETS EXPECTATIONS."', 'IT\'S CRUSHING.\nTERO LOSES 7 PATIENCE.'], dmg: 7 },
  { name: '360 FEEDBACK', lines: ['THE REVIEW USES 360 FEEDBACK!', 'IT HITS FROM ALL SIDES.\nTERO LOSES 3 + 3 PATIENCE.'], dmg: 6 },
  { name: 'LET\'S TAKE THIS OFFLINE', lines: ['THE REVIEW WANTS TO TAKE THIS OFFLINE.', 'NOTHING HAPPENS.\nIT FEELS LIKE A THREAT.'], dmg: 0 },
  { name: 'CIRCLE BACK', lines: ['THE REVIEW CIRCLES BACK.', 'AND BACK. AND BACK.\nTERO LOSES 4 PATIENCE.'], dmg: 4 },
];

type Phase = 'shatter' | 'intro' | 'menu' | 'text' | 'win';

export class QuarterlyReview extends Interlude {
  readonly id = 'review' as const;
  readonly song = 'jingle_battle' as const;
  overlay = true;
  private phase: Phase = 'shatter';
  private phaseT = 0;
  private patience = MAX_PATIENCE;
  private hp = REVIEW_HP;
  private cursor = 0;
  /** Lines to show, one box at a time; `after` runs when they're read. */
  private queue: string[] = [];
  private shown = 0;
  private after: (() => void) | null = null;
  private enemyHit = 0;
  private teroHit = 0;
  private meltdown = 0;
  private turn = 0;
  private dead = 0;
  private bitten = 0;

  constructor() { super(); preloadTero(); }

  get hidesPlayer(): boolean { return this.t > 2; }

  private say(lines: string[], after: () => void): void {
    this.queue = lines; this.shown = 0; this.after = after;
    this.phase = 'text'; this.phaseT = 0;
  }

  update(host: InterludeHost): void {
    this.t++; this.phaseT++;
    if (this.enemyHit > 0) this.enemyHit--;
    if (this.teroHit > 0) this.teroHit--;
    if (this.meltdown > 0) this.meltdown++;
    if (this.dead > 0) this.dead++;
    const inp = host.input;
    const ok = inp.jumpPressed || inp.firePressed;

    switch (this.phase) {
      case 'shatter':
        if (this.phaseT === 1) host.audio.play('roar');
        if (this.phaseT > 50) { this.phase = 'intro'; this.phaseT = 0; host.audio.play('alarm'); }
        return;
      case 'intro':
        if (this.phaseT === 1) this.say(['THE PERFORMANCE REVIEW APPEARS!', 'IT HAS A RED PEN.\nIT HAS OPINIONS.'], () => this.toMenu());
        return;
      case 'menu':
        if (this.phaseT > 6) {
          if (inp.justPressedAction(Action.LEFT)) { this.cursor = (this.cursor + 3) % 4; host.audio.play('click'); }
          if (inp.justPressedAction(Action.RIGHT)) { this.cursor = (this.cursor + 1) % 4; host.audio.play('click'); }
          if (inp.justPressedAction(Action.DOWN)) { this.cursor = (this.cursor + 2) % 4; host.audio.play('click'); }
          if (ok) this.choose(MENU[this.cursor], host);
          if (inp.callPressed) { host.audio.play('dada'); this.say(['TERO CALLS FOR DADA.', 'DADA IS IN A MEETING.\nTHE REVIEW NOTES "DEPENDENT".'], () => this.enemyTurn(host)); }
        }
        return;
      case 'text': {
        const line = t(this.queue[this.shown] ?? '');
        const typed = Math.min(line.length, this.phaseT * 1.5);
        if (this.phaseT % 3 === 0 && typed < line.length) host.audio.play('text');
        if (ok && this.phaseT > 4) {
          if (typed < line.length) { this.phaseT = 999; return; }
          this.shown++;
          this.phaseT = 0;
          if (this.shown >= this.queue.length) { const a = this.after; this.after = null; a?.(); }
        }
        return;
      }
      case 'win':
        if (this.phaseT > 60 && ok) this.done = true;
        return;
    }
  }

  private toMenu(): void { this.phase = 'menu'; this.phaseT = 0; }

  private hurtEnemy(n: number, host: InterludeHost): void {
    this.hp = Math.max(0, this.hp - n);
    this.enemyHit = 24;
    host.audio.play('bossHit');
    host.shake.trigger(3);
  }

  private choose(move: Move, host: InterludeHost): void {
    host.audio.play('plop');
    this.turn++;
    const next = () => (this.hp <= 0 ? this.win(host) : this.enemyTurn(host));
    switch (move) {
      case 'FIGHT':
        this.hurtEnemy(1, host);
        this.say(['TERO SWINGS A TINY FIST.', '1 DAMAGE.\nHR NOTES: "AGGRESSIVE."'], next);
        break;
      case 'BITE':
        this.bitten++;
        this.hurtEnemy(18, host);
        this.say(['TERO BITES THE REVIEW.', this.bitten === 1 ? 'IT TASTES LIKE TONER.\n18 DAMAGE!' : this.bitten === 2 ? 'STILL TONER.\n18 DAMAGE!' : 'TERO IS LEARNING NOTHING.\n18 DAMAGE!'], next);
        break;
      case 'CRY':
        if (this.patience > MAX_PATIENCE / 2) {
          this.say(['TERO TRIES TO CRY.', 'HE\'S NOT SAD ENOUGH YET.\n(LOSE SOME PATIENCE FIRST.)'], () => this.enemyTurn(host));
        } else {
          this.hurtEnemy(34, host);
          host.audio.play('hurt');
          this.say(['TERO CRIES.', 'IT\'S SUPER EFFECTIVE!\nHR DOESN\'T KNOW HOW TO HANDLE FEELINGS.'], next);
        }
        break;
      case 'NAP':
        this.patience = MAX_PATIENCE;
        host.audio.play('powerup');
        this.say(['TERO TAKES A NAP.', 'PATIENCE FULLY RESTORED.\nHR SCHEDULES A MEETING ABOUT IT.'], () => this.enemyTurn(host));
        break;
    }
  }

  private enemyTurn(host: InterludeHost): void {
    const a = ATTACKS[Math.floor(noise(this.turn * 7.7 + this.patience) * ATTACKS.length)];
    this.say(a.lines, () => {
      if (a.dmg > 0) {
        this.patience = Math.max(0, this.patience - a.dmg);
        this.teroHit = 20;
        host.audio.play('hurt');
      }
      if (this.patience === 0) {
        this.meltdown = 1;
        host.audio.play('roar');
        host.shake.trigger(12);
        this.say(['TERO\'S PATIENCE RAN OUT.', 'TERO HAS A MELTDOWN.', 'IT\'S THE MOST EFFECTIVE MOVE IN THE GAME.\n999 DAMAGE!'], () => { this.hurtEnemy(999, host); this.win(host); });
        return;
      }
      this.toMenu();
    });
  }

  private win(host: InterludeHost): void {
    this.dead = 1;
    host.audio.play('free');
    this.say(['THE PERFORMANCE REVIEW WAS DEFEATED!', 'RATING: EXCEEDS EXPECTATIONS.\n(WHAT EXPECTATIONS?)', 'TERO GAINED 0 EXP.\nTERO IS TWO.'], () => {
      this.phase = 'win'; this.phaseT = 0;
      host.audio.play('goal');
    });
  }

  // ─── Drawing ───────────────────────────────────────────────────────────────

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.phase === 'shatter') return this.drawShatter(ctx);
    this.drawBackground(ctx);
    this.drawEnemy(ctx);
    // Tero on the left, facing the review
    const shake = this.teroHit > 0 ? Math.round(Math.sin(this.teroHit) * 3) : 0;
    const anim = this.meltdown > 0 ? 'breathe' : this.teroHit > 0 ? 'hurt' : this.phase === 'win' ? 'win' : 'idle';
    drawTero(ctx, anim, Math.floor(this.t / 8), 96 + shake, 184, 72);
    if (this.meltdown > 0 && this.meltdown < 120) {
      for (let i = 0; i < 14; i++) {
        const k = (this.meltdown * 4 + i * 30) % 260;
        ctx.fillStyle = i % 2 ? '#ffb347' : '#e8452c';
        ctx.fillRect(130 + k, 120 + Math.sin(i + this.meltdown / 5) * 20, 10, 10);
      }
    }
    this.drawStatus(ctx);
    if (this.phase === 'text') this.drawText(ctx);
    if (this.phase === 'menu') this.drawMenu(ctx);
    if (this.phase === 'win') {
      shadowText(ctx, 'YOU WIN!', W / 2, 60, '#ffd23f', 4, 'center');
      text(ctx, '+1 STICKER', W / 2, 96, '#ffffff', 2, 'center');
      if (this.phaseT > 60 && this.phaseT % 50 < 34) text(ctx, 'PRESS JUMP', W / 2, 118, '#c0c0c0', 1, 'center');
    }
  }

  /** The frozen level shatters into a spiral of black squares. */
  private drawShatter(ctx: CanvasRenderingContext2D): void {
    const n = Math.floor((this.phaseT / 50) * 160);
    const cols = 16, rows = 10, cw = W / cols, rh = H / rows;
    // spiral order, outside in
    let x0 = 0, y0 = 0, x1 = cols - 1, y1 = rows - 1, k = 0;
    ctx.fillStyle = '#000';
    const fill = (x: number, y: number) => { if (k++ < n) ctx.fillRect(Math.floor(x * cw), Math.floor(y * rh), Math.ceil(cw), Math.ceil(rh)); };
    while (x0 <= x1 && y0 <= y1) {
      for (let x = x0; x <= x1; x++) fill(x, y0);
      for (let y = y0 + 1; y <= y1; y++) fill(x1, y);
      for (let x = x1 - 1; x >= x0 && y1 > y0; x--) fill(x, y1);
      for (let y = y1 - 1; y > y0 && x1 > x0; y--) fill(x0, y);
      x0++; y0++; x1--; y1--;
    }
  }

  /** A wobbly 90s battle background in corporate colours. */
  private drawBackground(ctx: CanvasRenderingContext2D): void {
    const cols = ['#1b2a5a', '#23346e', '#2c3f82', '#23346e'];
    for (let y = 0; y < H; y += 3) {
      const off = Math.sin(y / 14 + this.t / 18) * 10 + Math.sin(y / 5 - this.t / 30) * 3;
      const band = Math.floor((y + this.t / 2 + off) / 12) % cols.length;
      ctx.fillStyle = cols[(band + cols.length) % cols.length];
      ctx.fillRect(0, y, W, 3);
    }
    // a faint grid of dollar signs drifting by
    ctx.globalAlpha = 0.12;
    for (let i = 0; i < 18; i++) text(ctx, '$', (i * 53 + this.t / 2) % W, (i * 37) % 150 + 10, '#ffd23f', 2);
    ctx.globalAlpha = 1;
  }

  private drawEnemy(ctx: CanvasRenderingContext2D): void {
    if (this.dead > 60) return;
    const cx = 330, cy = 92 + Math.round(Math.sin(this.t / 20) * 4);
    const jitter = this.enemyHit > 0 ? Math.round(Math.sin(this.enemyHit * 2) * 4) : 0;
    const x0 = cx - 45 + jitter - 40, y0 = cy - 57;
    ctx.save();
    if (this.dead > 0) ctx.globalAlpha = Math.max(0, 1 - this.dead / 60);
    if (this.enemyHit > 0 && this.enemyHit % 6 < 3) ctx.globalAlpha *= 0.4;
    const frame: ReviewFrame = this.dead > 0 ? 'defeated' : this.enemyHit > 0 ? 'hurt' : this.phase === 'text' && this.shown === 0 && this.queue[0]?.startsWith('THE REVIEW') ? 'attack' : 'idle';
    if (!blitArt(ctx, 'review_form', frame, x0, y0)) drawReviewForm(ctx, x0, y0, frame, Math.sin(this.t / 12) * 6);
    ctx.restore();
  }

  private drawStatus(ctx: CanvasRenderingContext2D): void {
    this.box(ctx, 300, 196, 172, 30);
    text(ctx, 'TERO', 310, 203, '#ffffff');
    text(ctx, `PATIENCE ${this.patience}/${MAX_PATIENCE}`, 352, 203, this.patience <= 10 ? '#ff6f86' : '#ffffff');
    ctx.fillStyle = '#1b1620'; ctx.fillRect(310, 214, 152, 6);
    ctx.fillStyle = this.patience <= 10 ? '#ff6f86' : '#6cc24a';
    ctx.fillRect(311, 215, Math.round((150 * this.patience) / MAX_PATIENCE), 4);
  }

  private drawMenu(ctx: CanvasRenderingContext2D): void {
    this.box(ctx, 8, 196, 284, 66);
    MENU.forEach((m, i) => {
      const x = 30 + (i % 2) * 130, y = 208 + Math.floor(i / 2) * 26;
      text(ctx, m, x, y, i === this.cursor ? '#ffd23f' : '#ffffff', 2);
      if (i === this.cursor) {
        // the cursor is a little pacifier
        const bob = Math.round(Math.sin(this.t / 6));
        ctx.fillStyle = '#8fd3ff'; ctx.fillRect(x - 16 + bob, y + 1, 8, 7);
        ctx.fillStyle = '#ff8ea0'; ctx.fillRect(x - 9 + bob, y + 3, 3, 3);
      }
    });
    this.box(ctx, 300, 232, 172, 30);
    const hint: Record<Move, string> = {
      FIGHT: 'A TINY FIST.', CRY: this.patience > MAX_PATIENCE / 2 ? 'NOT SAD ENOUGH YET.' : 'SUPER EFFECTIVE?', NAP: 'RESTORE PATIENCE.', BITE: 'TASTES LIKE TONER.',
    };
    text(ctx, hint[MENU[this.cursor]], 310, 244, '#c9ced6');
  }

  private drawText(ctx: CanvasRenderingContext2D): void {
    this.box(ctx, 8, 196, 284, 66);
    const line = t(this.queue[this.shown] ?? '');
    const typed = Math.min(line.length, Math.floor(this.phaseT * 1.5));
    text(ctx, line.slice(0, typed), 20, 208, '#ffffff', 1);
    if (typed >= line.length && this.t % 40 < 26) {
      ctx.fillStyle = '#ffffff'; ctx.fillRect(276, 250, 6, 3); ctx.fillRect(277, 253, 4, 2);
    }
  }

  /** A blue gradient RPG window with a white border. */
  private box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#3f5fd0'); g.addColorStop(1, '#12206a');
    ctx.fillStyle = '#000'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = g; ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
  }
}
