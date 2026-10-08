// file: game/interludes/desktop.ts
//
// BLUE SCREEN → THE DESKTOP (Floor 33). The Board crashes the game. After a
// blue screen, Tero walks out of the frozen game window onto a Windows 95
// desktop. Window title bars are platforms; hold DOWN on one to drag it
// (that's how you build the bridge to the Q4 report). The Recycle Bin on the
// floor deletes you (you're restored, a bit embarrassed). Up on the INBOX
// window sits DADA.EXE, locked by CLIPPO the paperclip assistant, who throws
// tips at you. Burn Clippo, open DADA.EXE, and the game comes back.

import { VIEWPORT_W, VIEWPORT_H } from '../constants';
import { Interlude, type InterludeHost } from './Interlude';
import { text, win95, button, bevel, noise, W95 } from './pixtext';
import { drawTero, preloadTero } from './teroSprite';
import { blitArt } from '../render/customImages';

export const CLIPPO_W = 32, CLIPPO_H = 44;
export type ClippoFrame = 'idle' | 'talk' | 'hurt' | 'broken';

/** Clippo, the paperclip assistant, in a CLIPPO_W × CLIPPO_H box at (x0, y0).
 *  `look` (-1, 0, 1) is where his eyes point. */
export function drawClippo(ctx: CanvasRenderingContext2D, x0: number, y0: number, frame: ClippoFrame, look = 0): void {
  const x = x0 + CLIPPO_W / 2, y = y0 + 20;
  ctx.save();
  ctx.lineCap = 'round';
  const wire = () => {
    ctx.beginPath();
    if (frame === 'broken') {
      // bent straight, the way paperclips end up
      ctx.moveTo(x - 10, y + 22); ctx.lineTo(x - 4, y + 4); ctx.lineTo(x + 6, y + 10); ctx.lineTo(x + 2, y - 14);
    } else {
      ctx.moveTo(x - 6, y + 20); ctx.lineTo(x - 6, y - 10); ctx.arc(x, y - 10, 6, Math.PI, 0);
      ctx.lineTo(x + 6, y + 14); ctx.arc(x + 2, y + 14, 4, 0, Math.PI); ctx.lineTo(x - 2, y - 4);
    }
    ctx.stroke();
  };
  ctx.strokeStyle = '#1b1620'; ctx.lineWidth = 4; wire();
  ctx.strokeStyle = '#c9ccd1'; ctx.lineWidth = 2; wire();
  // googly eyes (X eyes when hurt or broken)
  for (const ex of [-5, 5]) {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x + ex - 3, y - 8, 7, 7);
    ctx.fillStyle = '#1b1620';
    if (frame === 'hurt' || frame === 'broken') {
      for (let k = 0; k < 5; k++) { ctx.fillRect(x + ex - 2 + k, y - 7 + k, 1, 1); ctx.fillRect(x + ex + 2 - k, y - 7 + k, 1, 1); }
    } else ctx.fillRect(x + ex - 1 + look, y - 5, 3, 3);
  }
  if (frame === 'talk') { ctx.fillStyle = '#1b1620'; ctx.fillRect(x - 3, y + 2, 6, 3); }
  ctx.restore();
}

const W = VIEWPORT_W, H = VIEWPORT_H;
const FLOOR = H - 22;                 // the taskbar's top edge
const GRAV = 0.32, JUMP = -6.6, RUN = 1.8;

interface Win { title: string; x: number; y: number; w: number; h: number; drag: boolean; kind: 'game' | 'mines' | 'report' | 'inbox' }
interface Tip { x: number; y: number; vx: number; vy: number; text: string }

type Phase = 'bsod' | 'desktop' | 'opening';

const TIPS = [
  'TIP: WORK HARDER!',
  'TIP: HAVE YOU TRIED NOT BEING TWO?',
  'TIP: NAPS ARE THEFT.',
  'TIP: SMILE IN MEETINGS.',
  'TIP: DADA IS BUSY.',
];

export class DesktopCrash extends Interlude {
  readonly id = 'desktop' as const;
  overlay = true;                         // one frame of the level, for the frozen window
  private phase: Phase = 'bsod';
  private phaseT = 0;
  private snap: HTMLCanvasElement | null = null;
  private wins: Win[] = [
    { title: 'WHERE IS DADA?.EXE (NOT RESPONDING)', x: 8, y: 22, w: 200, h: 118, drag: false, kind: 'game' },
    { title: 'MINESWEEPER', x: 24, y: 186, w: 96, h: 60, drag: true, kind: 'mines' },
    { title: 'Q4_REPORT_FINAL_FINAL2.DOC', x: 250, y: 128, w: 116, h: 92, drag: false, kind: 'report' },
    { title: 'INBOX (9,999)', x: 362, y: 70, w: 112, h: 80, drag: false, kind: 'inbox' },
  ];
  private x = 230; private y = FLOOR; private prevY = FLOOR; private vx = 0; private vy = 0;
  private ground = true; private face = true; private walk = 0; private standing: Win | null = null;
  private dragging = false;
  private deleted = 0;
  private bin = { x: 160, w: 22 };
  private clippy = { x: 330, y: 40, hp: 3, hit: 0, dead: 0 };
  private tips: Tip[] = [];
  private puffs: { x: number; y: number; vx: number; vy: number; life: number }[] = [];
  private bubble = 'IT LOOKS LIKE YOU\'RE TRYING TO\nRESCUE YOUR FATHER.\nWOULD YOU LIKE TO SCHEDULE A MEETING?';
  private bubbleT = 260;
  private toast = ''; private toastT = 0;
  private icon = { x: 424, y: 40 };

  constructor() { super(); preloadTero(); }

  get hidesPlayer(): boolean { return true; }

  private go(p: Phase): void { this.phase = p; this.phaseT = 0; }
  private say(s: string, ticks = 150): void { this.bubble = s; this.bubbleT = ticks; }
  private note(s: string): void { this.toast = s; this.toastT = 120; }

  update(host: InterludeHost): void {
    this.t++; this.phaseT++;
    if (this.bubbleT > 0) this.bubbleT--;
    if (this.toastT > 0) this.toastT--;
    const inp = host.input;
    if (this.phase === 'bsod') {
      if (this.phaseT === 1) host.audio.play('error');
      if (this.phaseT > 60 && (inp.jumpPressed || inp.firePressed || inp.left || inp.right)) {
        this.go('desktop');
        host.audio.play('unlock');                // the startup chime, more or less
        this.note('HOLD DOWN ON A TITLE BAR TO DRAG THE WINDOW.');
      }
      return;
    }
    if (this.phase === 'opening') {
      if (this.phaseT === 1) host.audio.play('goal');
      if (this.phaseT > 120) this.done = true;
      return;
    }
    this.updateTero(host);
    this.updateClippy(host);
  }

  private platforms(): { x0: number; x1: number; y: number; win: Win | null }[] {
    const p = this.wins.map((w) => ({ x0: w.x, x1: w.x + w.w, y: w.y, win: w as Win | null }));
    p.push({ x0: 0, x1: W, y: FLOOR, win: null });
    return p;
  }

  private updateTero(host: InterludeHost): void {
    const inp = host.input;
    if (this.deleted > 0) {
      if (++this.deleted > 80) {
        this.deleted = 0;
        this.x = 230; this.y = this.prevY = FLOOR; this.vy = 0;
        this.note('TERO WAS RESTORED FROM THE RECYCLE BIN.');
      }
      return;
    }
    let ax = 0;
    if (inp.left) { ax = -1; this.face = false; }
    if (inp.right) { ax = 1; this.face = true; }
    // drag the window you're standing on
    this.dragging = !!(this.standing?.drag && this.ground && inp.down);
    if (this.dragging && this.standing) {
      const w = this.standing;
      const nx = Math.max(0, Math.min(W - w.w, w.x + ax * 1.4));
      const dx = nx - w.x;
      w.x = nx;
      this.x += dx;
      if (dx && this.t % 8 === 0) host.audio.play('click');
    } else {
      this.vx = ax * RUN;
      this.x = Math.max(6, Math.min(W - 6, this.x + this.vx));
    }
    if (ax && !this.dragging) this.walk += RUN;
    if (inp.jumpPressed && this.ground) { this.vy = JUMP; this.ground = false; host.audio.play('jump'); }
    if (!inp.jump && this.vy < -2) this.vy = -2;
    this.vy = Math.min(7, this.vy + GRAV);
    this.prevY = this.y;
    this.y += this.vy;
    this.ground = false;
    this.standing = null;
    for (const p of this.platforms()) {
      if (this.x < p.x0 - 3 || this.x > p.x1 + 3) continue;
      if (this.vy >= 0 && this.prevY <= p.y + 0.01 && this.y >= p.y) {
        this.y = p.y; this.vy = 0; this.ground = true; this.standing = p.win;
      }
    }
    // the Recycle Bin
    if (this.y >= FLOOR - 2 && this.x > this.bin.x && this.x < this.bin.x + this.bin.w) {
      this.deleted = 1;
      host.audio.play('hurt');
      this.note('TERO.EXE WAS MOVED TO THE RECYCLE BIN.');
    }
    // fire: forward, and up while jumping
    if (inp.firePressed) {
      this.puffs.push({ x: this.x + (this.face ? 9 : -9), y: this.y - 18, vx: this.face ? 4 : -4, vy: 0, life: 16 });
      if (!this.ground) this.puffs.push({ x: this.x, y: this.y - 28, vx: 0, vy: -4, life: 16 });
      host.audio.play('puff');
    }
    if (inp.callPressed) { host.audio.play('dada'); this.say('DADA IS NOT A VALID FILE NAME.', 100); }
    for (const p of this.puffs) { p.x += p.vx; p.y += p.vy; p.life--; }
    this.puffs = this.puffs.filter((p) => p.life > 0);

    // DADA.EXE
    const i = this.icon;
    if (Math.abs(this.x - (i.x + 12)) < 18 && this.y > i.y && this.y - 30 < i.y + 26) {
      if (this.clippy.dead) this.go('opening');
      else if (this.toastT === 0) { this.note('DADA.EXE IS LOCKED BY CLIPPO.'); host.audio.play('error'); }
    }
  }

  private updateClippy(host: InterludeHost): void {
    const c = this.clippy;
    if (c.dead) { c.dead++; return; }
    if (c.hit > 0) c.hit--;
    c.x = 300 + Math.sin(this.t / 90) * 70;
    c.y = 30 + Math.sin(this.t / 47) * 16;
    if (this.t % 130 === 0 && this.phaseT > 60) {
      const dx = this.x - c.x, dy = this.y - 20 - c.y, d = Math.hypot(dx, dy) || 1;
      this.tips.push({ x: c.x, y: c.y + 10, vx: (dx / d) * 1.6, vy: (dy / d) * 1.6, text: TIPS[(this.t / 130) % TIPS.length | 0] });
      host.audio.play('plop');
    }
    for (const tip of this.tips) {
      tip.x += tip.vx; tip.y += tip.vy;
      if (Math.abs(tip.x - this.x) < 12 && Math.abs(tip.y - (this.y - 16)) < 16 && this.deleted === 0) {
        tip.y = 999;
        this.vy = -3; this.x += tip.vx > 0 ? 14 : -14;
        host.audio.play('hurt');
        this.say(tip.text, 110);
      }
    }
    this.tips = this.tips.filter((tip) => tip.x > -20 && tip.x < W + 20 && tip.y < H + 20);
    for (const p of this.puffs) {
      if (Math.abs(p.x - c.x) < 14 && Math.abs(p.y - c.y) < 20 && c.hit === 0) {
        p.life = 0; c.hit = 30; c.hp--;
        host.audio.play('bossHit');
        host.shake.trigger(3);
        if (c.hp <= 0) {
          c.dead = 1;
          host.audio.play('free');
          this.say('CLIPPO HAS STOPPED WORKING.', 200);
          this.note('DADA.EXE IS UNLOCKED.');
        } else this.say(['OUCH! WOULD YOU LIKE HELP WITH THAT?', 'IT LOOKS LIKE YOU\'RE ON FIRE.'][c.hp - 1], 120);
      }
    }
  }

  // ─── Drawing ───────────────────────────────────────────────────────────────

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.snap && typeof document !== 'undefined') {
      // the frozen game, for the "not responding" window
      this.snap = document.createElement('canvas');
      this.snap.width = W; this.snap.height = H;
      this.snap.getContext('2d')!.drawImage(ctx.canvas, 0, 0);
    }
    if (this.phase === 'bsod') return this.drawBsod(ctx);
    this.drawDesktop(ctx);
    if (this.phase === 'opening') {
      const w = 220, x = (W - w) / 2, y = 100;
      const { cx, cy } = win95(ctx, x, y, w, 60, 'DADA.EXE');
      text(ctx, 'OPENING DADA.EXE...', cx + 2, cy + 2, '#000000');
      ctx.fillStyle = '#ffffff'; ctx.fillRect(cx, cy + 14, w - 12, 10);
      ctx.fillStyle = W95.title; ctx.fillRect(cx + 1, cy + 15, Math.min(w - 14, (this.phaseT / 100) * (w - 14)), 8);
    }
  }

  private drawBsod(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#0000aa'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#aaaaaa'; ctx.fillRect(W / 2 - 34, 40, 68, 11);
    text(ctx, 'WINDOWS', W / 2, 43, '#0000aa', 1, 'center');
    text(ctx,
      'A FATAL EXCEPTION 0D HAS OCCURRED AT DADA:0033.\n' +
      'THE CURRENT APPLICATION (WHERE IS DADA?) WILL BE TERMINATED.\n\n' +
      '*  PRESS ANY KEY TO TERMINATE THE CURRENT APPLICATION.\n' +
      '*  REASON: A TODDLER GOT TOO CLOSE TO THE BOARD.\n' +
      '*  YOU WILL LOSE ANY UNSAVED SHAREHOLDER VALUE.',
      40, 70, '#ffffff');
    if (this.phaseT > 60) text(ctx, `PRESS ANY KEY TO CONTINUE ${this.t % 40 < 20 ? '_' : ' '}`, W / 2, 170, '#ffffff', 1, 'center');
  }

  private drawDesktop(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = W95.desk; ctx.fillRect(0, 0, W, H);
    // desktop icons (decoration)
    this.iconAt(ctx, 220, 8, 'MY COMPUTER', '#c0c0c0');
    this.iconAt(ctx, 220, 46, 'HOMEWORK', '#ffd23f');
    // the windows
    for (const w of this.wins) this.drawWin(ctx, w);
    // the Recycle Bin on the floor
    const b = this.bin;
    ctx.fillStyle = '#1b1620'; ctx.fillRect(b.x - 1, FLOOR - 21, b.w + 2, 21);
    ctx.fillStyle = '#c9ccd1'; ctx.fillRect(b.x, FLOOR - 20, b.w, 20);
    ctx.fillStyle = '#8a8f96'; for (let i = 3; i < b.w; i += 5) ctx.fillRect(b.x + i, FLOOR - 16, 2, 14);
    text(ctx, 'RECYCLE BIN', b.x + b.w / 2, FLOOR - 30, '#ffffff', 1, 'center');
    // DADA.EXE
    const i = this.icon;
    this.iconAt(ctx, i.x, i.y, 'DADA.EXE', this.clippy.dead ? '#6cc24a' : '#808080');
    if (!this.clippy.dead) { ctx.fillStyle = '#ffd23f'; ctx.fillRect(i.x + 16, i.y + 14, 8, 8); ctx.fillStyle = '#1b1620'; ctx.fillRect(i.x + 19, i.y + 17, 2, 3); }
    // Clippo
    this.drawClippy(ctx);
    for (const tip of this.tips) {
      ctx.fillStyle = '#ffffe1'; ctx.fillRect(tip.x - 5, tip.y - 4, 10, 8);
      ctx.fillStyle = '#1b1620'; ctx.fillRect(tip.x - 3, tip.y - 1, 6, 1);
    }
    for (const p of this.puffs) {
      ctx.fillStyle = '#ff9a52'; ctx.fillRect(p.x - 4, p.y - 4, 8, 8);
      ctx.fillStyle = '#fff6b0'; ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    // Tero
    if (this.deleted === 0) {
      const anim = !this.ground ? (this.vy < 0 ? 'jump' : 'fall') : this.dragging ? 'duck' : this.vx ? 'walk' : 'idle';
      drawTero(ctx, anim, Math.floor(anim === 'walk' ? this.walk / 9 : this.t / 10), this.x, this.y + 2, 34, !this.face);
    }
    // the taskbar
    bevel(ctx, 0, FLOOR, W, 22);
    button(ctx, 3, FLOOR + 4, 46, 'START');
    bevel(ctx, 56, FLOOR + 4, 130, 14, true);
    text(ctx, 'WHERE IS DADA?.EXE', 62, FLOOR + 9, '#000000');
    bevel(ctx, W - 58, FLOOR + 4, 54, 14, true);
    text(ctx, '4:71 PM', W - 31, FLOOR + 9, '#000000', 1, 'center');
    if (this.toastT > 0) {
      const w = Math.max(...this.toast.split('\n').map((l) => l.length)) * 4 + 12;
      ctx.fillStyle = '#000'; ctx.fillRect(W - w - 7, FLOOR - 21, w + 2, 15);
      ctx.fillStyle = '#ffffe1'; ctx.fillRect(W - w - 6, FLOOR - 20, w, 13);
      text(ctx, this.toast, W - 6 - w / 2, FLOOR - 16, '#000000', 1, 'center');
    }
  }

  private iconAt(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, col: string): void {
    ctx.fillStyle = '#1b1620'; ctx.fillRect(x + 3, y, 22, 22);
    ctx.fillStyle = col; ctx.fillRect(x + 4, y + 1, 20, 20);
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(x + 4, y + 1, 20, 4);
    ctx.fillStyle = W95.desk; ctx.fillRect(x - 6, y + 24, label.length * 4 + 4, 8);
    text(ctx, label, x + 14, y + 25, '#ffffff', 1, 'center');
  }

  private drawWin(ctx: CanvasRenderingContext2D, w: Win): void {
    const grey = w.kind === 'game' ? '#808080' : W95.title;
    const { cx, cy } = win95(ctx, w.x, w.y, w.w, w.h, w.title.length * 4 > w.w - 24 ? w.title.slice(0, Math.floor((w.w - 24) / 4) - 2) + '..' : w.title, grey);
    const iw = w.w - 12, ih = w.h - 24;
    ctx.save();
    ctx.beginPath(); ctx.rect(cx, cy, iw, ih); ctx.clip();
    switch (w.kind) {
      case 'game':
        if (this.snap) { ctx.globalAlpha = 0.55; ctx.drawImage(this.snap, cx, cy, iw, ih); ctx.globalAlpha = 1; }
        ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(cx, cy, iw, ih);
        text(ctx, '(NOT RESPONDING)', cx + iw / 2, cy + ih / 2 - 2, '#000000', 1, 'center');
        break;
      case 'mines':
        for (let gy = 0; gy < 4; gy++) for (let gx = 0; gx < 9; gx++) bevel(ctx, cx + gx * 9, cy + gy * 9, 9, 9, noise(gx * 7 + gy) < 0.3);
        break;
      case 'report':
        ctx.fillStyle = '#ffffff'; ctx.fillRect(cx, cy, iw, ih);
        text(ctx, 'Q4: GROWTH!!!', cx + 4, cy + 4, '#d83b3b');
        ctx.fillStyle = '#9aa0a8';
        for (let i = 0; i < 7; i++) ctx.fillRect(cx + 4, cy + 16 + i * 7, iw - 12 - (i % 3) * 14, 2);
        break;
      case 'inbox':
        ctx.fillStyle = '#ffffff'; ctx.fillRect(cx, cy, iw, ih);
        ['RE: RE: RE: SYNC', 'URGENT!!', 'URGENT!!!', 'PIZZA PARTY (CANCELLED)'].forEach((m, i) => text(ctx, m, cx + 3, cy + 3 + i * 9, i % 2 ? '#d83b3b' : '#000000'));
        break;
    }
    ctx.restore();
    if (w.drag && this.standing === w && !this.dragging && this.ground) text(ctx, 'HOLD DOWN: DRAG', w.x + w.w / 2, w.y - 9, '#ffffff', 1, 'center');
  }

  private drawClippy(ctx: CanvasRenderingContext2D): void {
    const c = this.clippy;
    if (c.dead > 60) return;
    ctx.save();
    if (c.dead) { ctx.globalAlpha = Math.max(0, 1 - c.dead / 60); ctx.translate(0, c.dead * 0.6); }
    if (c.hit > 0 && c.hit % 6 < 3) ctx.globalAlpha *= 0.4;
    const x = Math.round(c.x), y = Math.round(c.y);
    const frame: ClippoFrame = c.dead ? 'broken' : c.hit > 0 ? 'hurt' : this.bubbleT > 0 ? 'talk' : 'idle';
    if (!blitArt(ctx, 'clippo', frame, x - CLIPPO_W / 2, y - 20)) drawClippo(ctx, x - CLIPPO_W / 2, y - 20, frame, Math.sign(this.x - x));
    ctx.restore();
    if (this.bubbleT > 0) {
      const lines = this.bubble.split('\n');
      const w = Math.max(...lines.map((l) => l.length)) * 4 + 12, h = lines.length * 7 + 22;
      const bx = Math.max(4, Math.min(W - w - 4, x - w + 20)), by = y + 26;
      ctx.fillStyle = '#000'; ctx.fillRect(bx - 1, by - 1, w + 2, h + 2);
      ctx.fillStyle = '#ffffe1'; ctx.fillRect(bx, by, w, h);
      text(ctx, this.bubble, bx + 6, by + 5, '#000000');
      if (this.bubble.startsWith('IT LOOKS LIKE YOU\'RE TRYING')) {
        button(ctx, bx + 6, by + h - 16, 40, 'YES');
        button(ctx, bx + 52, by + h - 16, 70, 'YES, LATER');
      }
    }
  }
}

