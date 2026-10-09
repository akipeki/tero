// file: game/interludes/mute.ts
//
// "YOU'RE ON MUTE" (Floor 12). Tero gets pulled into a video call: eight
// bosses in a grid, all talking over each other. He wants to say one word.
// Find the unmute button: LEAVE is disabled, RAISE HAND is ignored, SHARE
// SCREEN shares his crayon drawing (silence), and UNMUTE is three menus
// deep under "...". When he finally unmutes, he shouts DADA!!! and
// everyone leaves the meeting.
//
// Controls: LEFT / RIGHT pick a button, JUMP or FIRE presses it. In a menu,
// DOWN moves.

import { VIEWPORT_W, VIEWPORT_H } from '../constants';
import { Interlude, type InterludeHost } from './Interlude';
import { text, shadowText, noise } from './pixtext';
import { drawTero, preloadTero } from './teroSprite';
import { drawHalvorsen, drawClerk, drawManager } from '../render/characters/humans';
import { drawPig, drawRobot, drawVampire, drawGorilla, drawGuard } from '../render/characters/creatures';
import { Action } from '../types';

const W = VIEWPORT_W, H = VIEWPORT_H;
const TW = 150, TH = 70, GX = 15, GY = 14;

const PEOPLE: [string, () => { toCanvas(): HTMLCanvasElement }][] = [
  ['HALVORSEN', () => drawHalvorsen('present')], ['PIG (CFO)', () => drawPig(0)], ['GARY', () => drawClerk(0)],
  ['ROBOT 3000', () => drawRobot(0)], ['', () => drawClerk(0)], ['V. VLAD', () => drawVampire(false)],
  ['DEREK', () => drawManager(false)], ['THE GORILLA', () => drawGorilla(false)], ['SECURITY', () => drawGuard(0)],
];

const CHATTER = [
  'CAN EVERYONE SEE MY SCREEN?', 'YOU\'RE ON MUTE.', 'LET\'S CIRCLE BACK.', 'SORRY, GO AHEAD.', 'NO, YOU GO.',
  'IS THERE A BABY ON THIS CALL?', 'PER MY LAST EMAIL...', 'I HAVE A HARD STOP.', 'CAN YOU HEAR ME NOW?',
  'YOU FROZE.', 'LET\'S TAKE THIS OFFLINE.', 'QUICK SYNC AFTER THIS?',
];

const BUTTONS = ['MIC', 'CAMERA', 'SHARE', 'RAISE HAND', '...', 'LEAVE'] as const;
const MENU: string[][] = [
  ['SETTINGS', 'BACKGROUND: BEACH', 'REPORT A PROBLEM'],
  ['AUDIO', 'VIDEO', 'NOTIFICATIONS'],
  ['MICROPHONE', 'SPEAKERS', 'TEST SOUND'],
  ['UNMUTE (REALLY)', 'STAY MUTED', 'ASK ADMIN'],
];

export class OnMute extends Interlude {
  readonly id = 'mute' as const;
  readonly song = 'jingle_call' as const;
  private faces = PEOPLE.map(([, make]) => make().toCanvas());
  private talk = PEOPLE.map((_, i) => ({ line: CHATTER[i % CHATTER.length], t: 40 + i * 17 }));
  private sel = 0;
  private menu = -1;            // depth in the "..." menu, -1 = closed
  private menuSel = 0;
  private camera = false;
  private hand = false;
  private sharing = 0;
  private toast = ''; private toastT = 0;
  private unmuted = 0;
  private left: number[] = [];

  constructor() { super(); preloadTero(); }

  private say(s: string): void { this.toast = s; this.toastT = 120; }

  update(host: InterludeHost): void {
    this.t++;
    if (this.toastT > 0) this.toastT--;
    if (this.sharing > 0) this.sharing--;
    const inp = host.input;
    const ok = inp.jumpPressed || inp.firePressed;

    if (this.unmuted > 0) {
      this.unmuted++;
      if (this.unmuted === 2) { host.audio.play('dada'); host.audio.play('roar'); host.shake.trigger(10); }
      if (this.unmuted > 40 && this.unmuted % 14 === 0 && this.left.length < PEOPLE.length - 1) {
        const order = [3, 0, 8, 6, 1, 5, 7, 2];
        this.left.push(order[this.left.length]);
        host.audio.play('click');
      }
      if (this.unmuted > 220 && ok) this.done = true;
      if (this.unmuted > 420) this.done = true;
      return;
    }

    // everybody talks over everybody
    if (this.sharing === 0) for (let i = 0; i < this.talk.length; i++) {
      if (i === 4) continue;    // that's Tero's tile
      if (--this.talk[i].t <= 0) {
        this.talk[i] = { line: CHATTER[Math.floor(noise(this.t + i * 13) * CHATTER.length)], t: 90 + Math.floor(noise(i + this.t) * 80) };
        if (noise(this.t * 3 + i) < 0.3) host.audio.play('text');
      }
    }

    if (this.menu >= 0) {
      if (inp.justPressedAction(Action.DOWN)) { this.menuSel = (this.menuSel + 1) % 3; host.audio.play('click'); }
      if (inp.justPressedAction(Action.LEFT)) { this.menu = -1; host.audio.play('click'); return; }
      if (ok) {
        if (this.menuSel !== 0) { host.audio.play('error'); this.say(this.menu === 3 && this.menuSel === 2 ? 'ADMIN IS IN A MEETING.' : 'THAT\'S NOT IT.'); this.menu = -1; return; }
        host.audio.play('plop');
        if (this.menu === 3) { this.unmuted = 1; this.menu = -1; return; }
        this.menu++; this.menuSel = 0;
      }
      return;
    }
    if (inp.justPressedAction(Action.LEFT)) { this.sel = (this.sel + BUTTONS.length - 1) % BUTTONS.length; host.audio.play('click'); }
    if (inp.justPressedAction(Action.RIGHT)) { this.sel = (this.sel + 1) % BUTTONS.length; host.audio.play('click'); }
    if (inp.callPressed) { host.audio.play('dada'); this.say('YOU\'RE ON MUTE.'); }
    if (!ok || this.t < 30) return;
    switch (BUTTONS[this.sel]) {
      case 'MIC': host.audio.play('error'); this.say('YOUR MIC IS MANAGED BY YOUR ORGANISATION.'); break;
      case 'CAMERA': this.camera = !this.camera; host.audio.play('plop'); if (this.camera) this.say('CAMERA ON. EVERYONE CAN SEE YOU. NOBODY LOOKS.'); break;
      case 'SHARE': this.sharing = 200; host.audio.play('plop'); this.say('YOU ARE SHARING: DADA.PNG (CRAYON)'); break;
      case 'RAISE HAND': this.hand = true; host.audio.play('ready'); this.say('YOUR HAND IS RAISED. (IGNORED.)'); break;
      case '...': this.menu = 0; this.menuSel = 0; host.audio.play('plop'); break;
      case 'LEAVE': host.audio.play('error'); this.say('YOU CAN\'T LEAVE. THIS MEETING IS MANDATORY.'); break;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#1e1e24'; ctx.fillRect(0, 0, W, H);
    text(ctx, 'ALL-HANDS SYNC (RECURRING, FOREVER)', W / 2, 4, '#9aa0a8', 1, 'center');
    if (this.sharing > 0) return this.drawShare(ctx);
    PEOPLE.forEach(([name], i) => {
      const x = GX + (i % 3) * (TW + 2), y = GY + Math.floor(i / 3) * (TH + 2);
      const gone = this.left.includes(i);
      ctx.fillStyle = gone ? '#101014' : '#2c2c34'; ctx.fillRect(x, y, TW, TH);
      if (i === 4) {
        // Tero's tile
        if (this.camera || this.unmuted) {
          ctx.fillStyle = '#3a4a6a'; ctx.fillRect(x, y, TW, TH);
          drawTero(ctx, this.unmuted ? 'breathe' : 'idle', Math.floor(this.t / 8), x + TW / 2, y + TH + 18, 70);
        } else text(ctx, 'TERO', x + TW / 2, y + TH / 2 - 2, '#ffffff', 2, 'center');
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x, y + TH - 10, TW, 10);
        text(ctx, this.unmuted ? 'TERO' : 'TERO (YOU, MUTED)', x + 4, y + TH - 8, this.unmuted ? '#6cc24a' : '#ff6f86');
        if (this.hand && !this.unmuted) text(ctx, '!', x + TW - 10, y + 4, '#ffd23f', 2);
        if (this.unmuted) shadowText(ctx, 'DADA!!!', x + TW / 2, y + 12, '#ffd23f', 3, 'center');
        return;
      }
      if (gone) { text(ctx, `${name || 'SOMEONE'} LEFT`, x + TW / 2, y + TH / 2 - 2, '#5a5f68', 1, 'center'); return; }
      ctx.imageSmoothingEnabled = false;
      const bob = Math.round(Math.sin((this.t + i * 20) / 12));
      ctx.drawImage(this.faces[i], x + TW / 2 - 28, y + 6 + bob, 56, 56);
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x, y + TH - 10, TW, 10);
      text(ctx, name || 'UNKNOWN (CAMERA OFF?)', x + 4, y + TH - 8, '#ffffff');
      const talking = this.talk[i].t > 30 && !this.unmuted;
      if (talking) {
        ctx.strokeStyle = '#6cc24a'; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, TW - 2, TH - 2);
        const line = this.talk[i].line;
        ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.fillRect(x + 4, y + 4, line.length * 4 + 6, 9);
        text(ctx, line, x + 7, y + 6, '#1b1620');
      }
    });
    this.drawToolbar(ctx);
    if (this.menu >= 0) this.drawMenu(ctx);
    if (this.toastT > 0) shadowText(ctx, this.toast, W / 2, H - 32, '#ffd23f', 1, 'center');
    if (this.unmuted > 200 && this.t % 50 < 34) shadowText(ctx, 'MEETING ENDED. EVERYONE WENT HOME. PRESS JUMP', W / 2, H - 32, '#6cc24a', 1, 'center');
  }

  private drawToolbar(ctx: CanvasRenderingContext2D): void {
    const y = H - 22;
    ctx.fillStyle = '#2c2c34'; ctx.fillRect(0, y, W, 22);
    const bw = 70, x0 = W / 2 - (BUTTONS.length * bw) / 2;
    BUTTONS.forEach((b, i) => {
      const x = x0 + i * bw;
      const active = this.sel === i && this.menu < 0 && !this.unmuted;
      ctx.fillStyle = b === 'LEAVE' ? '#a02020' : active ? '#4a7bf0' : '#3a3a44';
      ctx.fillRect(x + 3, y + 3, bw - 6, 16);
      const label = b === 'MIC' ? (this.unmuted ? 'MIC ON' : 'MIC (MUTED)') : b === 'CAMERA' ? (this.camera ? 'CAM ON' : 'CAM OFF') : b;
      text(ctx, label, x + bw / 2, y + 9, '#ffffff', 1, 'center');
      if (b === 'MIC' && !this.unmuted) { ctx.fillStyle = '#ff6f86'; ctx.fillRect(x + 8, y + 10, bw - 16, 1); }
    });
  }

  private drawMenu(ctx: CanvasRenderingContext2D): void {
    const x = W / 2 + 40 + this.menu * 22, y = H - 82 - this.menu * 6;
    ctx.fillStyle = '#000'; ctx.fillRect(x - 1, y - 1, 122, 52);
    ctx.fillStyle = '#3a3a44'; ctx.fillRect(x, y, 120, 50);
    MENU[this.menu].forEach((m, i) => {
      if (i === this.menuSel) { ctx.fillStyle = '#4a7bf0'; ctx.fillRect(x + 2, y + 3 + i * 15, 116, 13); }
      text(ctx, m + (i === 0 && this.menu < 3 ? '  >' : ''), x + 6, y + 7 + i * 15, '#ffffff');
    });
    text(ctx, 'DOWN: NEXT  LEFT: BACK', x + 60, y + 54, '#9aa0a8', 1, 'center');
  }

  private drawShare(ctx: CanvasRenderingContext2D): void {
    // Tero's crayon drawing, full screen. Nobody says anything.
    ctx.fillStyle = '#f4f1e6'; ctx.fillRect(30, 18, W - 60, H - 46);
    ctx.fillStyle = '#ff9a52'; ctx.beginPath(); ctx.arc(390, 60, 22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4a7bf0'; ctx.fillRect(150, 110, 30, 60); ctx.fillRect(140, 100, 50, 16);
    ctx.fillStyle = '#fcd4ac'; ctx.beginPath(); ctx.arc(165, 90, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6cc24a'; ctx.fillRect(200, 140, 20, 30); ctx.beginPath(); ctx.arc(210, 132, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d83b3b'; ctx.fillRect(180, 150, 22, 4);
    shadowText(ctx, 'DADA', 160, 190, '#d83b3b', 3, 'center', '#f4f1e6');
    shadowText(ctx, 'TERO', 212, 190, '#6cc24a', 2, 'center', '#f4f1e6');
    text(ctx, '(SILENCE.)', W / 2, H - 20, '#9aa0a8', 1, 'center');
  }
}
