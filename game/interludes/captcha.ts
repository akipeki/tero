// file: game/interludes/captcha.ts
//
// THE CAPTCHA (Floor 6's security door). "I'M NOT A BABY" ☐. Then the grid:
// SELECT ALL SQUARES WITH SYNERGY (it always fails), SELECT ALL SQUARES WITH
// WORK-LIFE BALANCE (the right answer is none), SELECT ALL SQUARES WITH
// YOUR DADA (one suit in nine is him). Verified: definitely a baby. Access
// granted anyway; they need the headcount.
//
// Controls: LEFT / RIGHT / DOWN move, JUMP or FIRE ticks a square (or
// presses VERIFY, the tenth stop).

import { VIEWPORT_W, VIEWPORT_H } from '../constants';
import { Interlude, type InterludeHost } from './Interlude';
import { text, shadowText, button, bevel } from './pixtext';
import { drawClerk, drawManager, drawSyncer } from '../render/characters/humans';
import { drawPig, drawRobot, drawGuard, drawVampire, drawGorilla, drawRat } from '../render/characters/creatures';
import { Action } from '../types';
import { DAD_SRC, smoothDad } from '../render/sprites/dadSprite';

const W = VIEWPORT_W, H = VIEWPORT_H;
const CELL = 46, GX = W / 2 - (CELL * 3) / 2, GY = 62;

type Icon = (ctx: CanvasRenderingContext2D, x: number, y: number) => void;

let dadImg: HTMLImageElement | null = null;
function dad(): HTMLImageElement | null {
  if (typeof Image === 'undefined') return null;
  if (!dadImg) { dadImg = new Image(); dadImg.src = DAD_SRC; }
  return dadImg.complete && dadImg.naturalWidth ? dadImg : null;
}
dad();

function raster(make: () => { toCanvas(): HTMLCanvasElement }): Icon {
  let c: HTMLCanvasElement | null = null;
  return (ctx, x, y) => { c ??= make().toCanvas(); ctx.drawImage(c, x + 7, y + 6, 32, 32); };
}
const rect = (col: string, ...r: number[][]): Icon => (ctx, x, y) => {
  ctx.fillStyle = col; for (const [a, b, w, h] of r) ctx.fillRect(x + a, y + b, w, h);
};
const both = (...icons: Icon[]): Icon => (ctx, x, y) => icons.forEach((i) => i(ctx, x, y));

// Round 1: corporate clip art. Which of these has synergy? (It doesn't matter.)
const SYNERGY: Icon[] = [
  both(rect('#ffd23f', [17, 8, 12, 14]), rect('#c9ccd1', [19, 22, 8, 6]), rect('#ffffff', [20, 11, 3, 3])),               // lightbulb
  both(rect('#fcd4ac', [6, 18, 16, 8], [24, 18, 16, 8]), rect('#3f62d8', [2, 18, 6, 8], [38, 18, 6, 8])),                 // handshake
  both(rect('#9aa0a8', [12, 10, 20, 20]), rect('#1f3f8f', [18, 16, 8, 8]), rect('#9aa0a8', [8, 18, 4, 4], [32, 18, 4, 4], [20, 6, 4, 4], [20, 30, 4, 4])), // gear
  both(rect('#6cc24a', [8, 30, 6, 8], [18, 22, 6, 16], [28, 14, 6, 24]), rect('#d83b3b', [36, 6, 4, 4])),                // chart up
  both(rect('#6b4226', [8, 14, 30, 20]), rect('#3a2a20', [18, 10, 10, 4])),                                               // briefcase
  both(rect('#ff6f86', [8, 8, 14, 14], [24, 24, 14, 14]), rect('#8fd3ff', [24, 8, 14, 14], [8, 24, 14, 14])),           // puzzle
  both(rect('#ffffff', [12, 14, 18, 18]), rect('#6b4226', [14, 18, 14, 12]), rect('#ffffff', [30, 18, 4, 8])),            // coffee
  both(rect('#ffffff', [10, 8, 26, 26]), rect('#1b1620', [22, 12, 2, 10], [22, 20, 8, 2])),                               // clock
  both(rect('#d83b3b', [10, 10, 26, 4], [32, 10, 4, 22], [10, 28, 26, 4], [10, 10, 4, 22])),                              // circle of arrows-ish
];

// Round 2: work-life balance. There isn't any.
const BALANCE: Icon[] = [
  both(rect('#6b4226', [4, 26, 38, 6]), rect('#1b1620', [14, 12, 18, 14]), rect('#8fd3ff', [16, 14, 14, 10])),   // desk + monitor
  both(rect('#1b1620', [16, 8, 14, 26]), rect('#8fd3ff', [18, 10, 10, 18]), rect('#d83b3b', [26, 6, 6, 6])),       // phone with a red dot
  both(rect('#ffffff', [10, 8, 26, 26]), rect('#1b1620', [22, 10, 2, 12], [22, 10, 2, 2])),                       // midnight
  both(rect('#f4f1e6', [10, 6, 22, 30]), rect('#9aa0a8', [14, 12, 14, 2], [14, 18, 14, 2], [14, 24, 10, 2])),     // memo
  raster(() => drawClerk(0)),
  both(rect('#6b4226', [4, 26, 38, 6]), rect('#c9ccd1', [10, 16, 26, 10])),                                       // laptop on a desk
  both(rect('#ffffff', [12, 14, 18, 18]), rect('#6b4226', [14, 18, 14, 12])),                                      // coffee
  both(rect('#f4f1e6', [6, 10, 34, 24]), rect('#d83b3b', [6, 10, 34, 6])),                                         // calendar, full
  raster(() => drawSyncer(0)),
];

const ROUNDS: { prompt: string; icons: Icon[]; correct: (sel: boolean[]) => boolean | 'never' }[] = [
  { prompt: 'SELECT ALL SQUARES WITH\nSYNERGY', icons: SYNERGY, correct: () => 'never' },
  { prompt: 'SELECT ALL SQUARES WITH\nWORK-LIFE BALANCE', icons: BALANCE, correct: (s) => s.every((v) => !v) },
  {
    prompt: 'SELECT ALL SQUARES WITH\nYOUR DADA',
    icons: [
      raster(() => drawPig(0)), raster(() => drawClerk(1)), raster(() => drawRobot(0)),
      raster(() => drawGuard(0)), raster(() => drawManager(false)), raster(() => drawVampire(false)),
      raster(() => drawGorilla(false)),
      (ctx, x, y) => { const d = dad(); if (d) { smoothDad(ctx, d, 40); ctx.drawImage(d, x + 3, y + 3, 40, 40); } },
      raster(() => drawRat(0)),
    ],
    correct: (s) => s.every((v, i) => v === (i === 7)),
  },
];

const FAIL = [
  'PLEASE TRY AGAIN.',
  'INCORRECT. THAT IS NOT BALANCE.',
  'INCORRECT. THAT IS NOT YOUR DADA.',
];

export class Captcha extends Interlude {
  readonly id = 'captcha' as const;
  private stage: 'box' | 'grid' | 'done' = 'box';
  private stageT = 0;
  private round = 0;
  private cursor = 0;
  private sel = Array<boolean>(9).fill(false);
  private msg = ''; private msgT = 0;
  private shakeT = 0;
  private spin = 0;

  update(host: InterludeHost): void {
    this.t++; this.stageT++;
    if (this.msgT > 0) this.msgT--;
    if (this.shakeT > 0) this.shakeT--;
    const inp = host.input;
    const ok = inp.jumpPressed || inp.firePressed;
    if (this.stage === 'box') {
      if (this.spin > 0) { if (++this.spin > 70) { this.stage = 'grid'; this.stageT = 0; host.audio.play('plop'); } return; }
      if (this.stageT > 20 && ok) { this.spin = 1; host.audio.play('click'); }
      return;
    }
    if (this.stage === 'done') {
      if (this.stageT > 90 && ok) this.done = true;
      return;
    }
    if (inp.justPressedAction(Action.LEFT)) this.move(-1, host);
    if (inp.justPressedAction(Action.RIGHT)) this.move(1, host);
    if (inp.justPressedAction(Action.DOWN)) this.move(3, host);
    if (ok && this.stageT > 10) {
      if (this.cursor < 9) { this.sel[this.cursor] = !this.sel[this.cursor]; host.audio.play('block'); }
      else this.verify(host);
    }
  }

  private move(d: number, host: InterludeHost): void {
    host.audio.play('click');
    if (d === 3) this.cursor = this.cursor >= 9 ? this.cursor % 3 : this.cursor + 3 > 8 ? 9 : this.cursor + 3;
    else this.cursor = (this.cursor + d + 10) % 10;
  }

  private verify(host: InterludeHost): void {
    const r = ROUNDS[this.round];
    const ok = r.correct(this.sel);
    if (ok === true) {
      host.audio.play('goal');
      this.round++;
      this.sel.fill(false);
      this.cursor = 0;
      if (this.round >= ROUNDS.length) { this.stage = 'done'; this.stageT = 0; return; }
      this.msg = 'CORRECT. THERE ISN\'T ANY.'; this.msgT = 120;   // (only round two can be passed early)
      return;
    }
    host.audio.play('error');
    this.shakeT = 20;
    this.msg = FAIL[this.round]; this.msgT = 120;
    if (ok === 'never') {
      // round one always fails, then moves on anyway
      this.round++; this.sel.fill(false); this.cursor = 0;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#3a3e45'; ctx.fillRect(0, 0, W, H);
    // the security door behind the screen
    ctx.fillStyle = '#2a2d33'; for (let x = 0; x < W; x += 24) ctx.fillRect(x, 0, 2, H);
    shadowText(ctx, 'SECURITY DOOR, FLOOR 6', W / 2, 10, '#c9ccd1', 1, 'center');
    if (this.stage === 'box') return this.drawBox(ctx);
    if (this.stage === 'done') return this.drawDone(ctx);
    const sx = this.shakeT > 0 ? Math.round(Math.sin(this.shakeT * 2) * 3) : 0;
    ctx.save(); ctx.translate(sx, 0);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(GX - 8, 22, CELL * 3 + 16, 228);
    ctx.fillStyle = '#4a7bf0'; ctx.fillRect(GX - 4, 26, CELL * 3 + 8, 32);
    text(ctx, ROUNDS[this.round].prompt, GX + 4, 32, '#ffffff', 1);
    ROUNDS[this.round].icons.forEach((icon, i) => {
      const x = GX + (i % 3) * CELL, y = GY + Math.floor(i / 3) * CELL;
      ctx.fillStyle = '#e8e4d8'; ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
      ctx.save(); ctx.beginPath(); ctx.rect(x + 1, y + 1, CELL - 2, CELL - 2); ctx.clip();
      icon(ctx, x, y);
      ctx.restore();
      if (this.sel[i]) {
        ctx.fillStyle = 'rgba(74,123,240,0.35)'; ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
        ctx.fillStyle = '#4a7bf0'; ctx.fillRect(x + 2, y + 2, 10, 10);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 4, y + 7, 2, 2); ctx.fillRect(x + 6, y + 8, 2, 2); ctx.fillRect(x + 8, y + 4, 2, 5);
      }
      if (this.cursor === i) { ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 2; ctx.strokeRect(x + 2, y + 2, CELL - 4, CELL - 4); }
    });
    const vy = GY + CELL * 3 + 8;
    button(ctx, GX + CELL * 3 - 60, vy, 60, 'VERIFY', this.cursor === 9 && this.t % 20 < 10);
    if (this.cursor === 9) { ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 2; ctx.strokeRect(GX + CELL * 3 - 62, vy - 2, 64, 17); }
    text(ctx, `${this.round + 1} OF 3`, GX, vy + 4, '#808080');
    ctx.restore();
    if (this.msgT > 0) shadowText(ctx, this.msg, W / 2, H - 14, this.msg.startsWith('CORRECT') ? '#6cc24a' : '#ff6f86', 1, 'center');
    text(ctx, 'ARROWS: MOVE   JUMP: TICK / VERIFY', W / 2, H - 4 - 2, '#808080', 1, 'center');
  }

  private drawBox(ctx: CanvasRenderingContext2D): void {
    const x = W / 2 - 110, y = 100;
    ctx.fillStyle = '#f9f9f9'; ctx.fillRect(x, y, 220, 60);
    ctx.strokeStyle = '#d3d3d3'; ctx.strokeRect(x + 0.5, y + 0.5, 219, 59);
    bevel(ctx, x + 14, y + 20, 20, 20, true);
    if (this.spin > 0) {
      ctx.strokeStyle = '#4a7bf0'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x + 24, y + 30, 7, this.spin / 6, this.spin / 6 + 4); ctx.stroke();
    }
    text(ctx, 'I\'M NOT A BABY', x + 44, y + 27, '#1b1620', 2);
    text(ctx, 'RECAPTCHA-ISH', x + 200, y + 48, '#808080', 1, 'right');
    if (this.stageT > 20 && this.spin === 0 && this.t % 50 < 34) text(ctx, 'PRESS JUMP TO TICK THE BOX', W / 2, 180, '#ffffff', 1, 'center');
  }

  private drawDone(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(W / 2 - 150, 80, 300, 100);
    ctx.fillStyle = '#6cc24a'; ctx.fillRect(W / 2 - 150, 80, 300, 6);
    shadowText(ctx, 'VERIFIED', W / 2, 96, '#6cc24a', 2, 'center', '#2f6e33');
    text(ctx, 'YOU ARE DEFINITELY A BABY.\nACCESS GRANTED ANYWAY.\n(WE NEED THE HEADCOUNT.)', W / 2, 122, '#1b1620', 1, 'center');
    if (this.stageT > 90 && this.t % 50 < 34) text(ctx, 'PRESS JUMP', W / 2, 196, '#ffffff', 1, 'center');
  }
}
