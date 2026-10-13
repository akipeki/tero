// file: game/interludes/nap.ts
//
// NAP TIME (the escape, Floor 17-ish). Halfway down the stairs Tero sits down
// for one second and falls asleep, because he's two. He dreams in soft Game
// Boy green: a park, a Saturday, and Dad from before the job, playing catch.
// It's slow and nothing can hurt you. Every catch remembers something. Then
// an alarm clock rings and it's: RUN.
//
// Everything is drawn in colour, then folded into the Game Boy's four greens,
// so the user's own Tero and Dad art shows up here too.

import { VIEWPORT_W, VIEWPORT_H } from '../constants';
import { Interlude, type InterludeHost } from './Interlude';
import { text, shadowText, noise } from './pixtext';
import { drawTero, preloadTero } from './teroSprite';
import { DAD_SRC, smoothDad } from '../render/sprites/dadSprite';

const W = VIEWPORT_W, H = VIEWPORT_H;
const GB = [[15, 56, 15], [48, 98, 48], [139, 172, 15], [155, 188, 15]];
const GROUND = 214;
const DAD_X = 360;
const CATCHES = 5;

const MEMORIES = [
  'DADA USED TO BE HOME BY FIVE.',
  'SATURDAYS WERE FOR THE PARK.',
  'HE DID ALL THE VOICES AT BEDTIME.',
  'HE NEVER LOOKED AT HIS PHONE.',
  'HE SAID: "YOU\'RE MY FAVOURITE PROJECT."',
];

type Phase = 'sleep' | 'play' | 'goodbye' | 'alarm';

interface Ball { x: number; y: number; vx: number; vy: number; state: 'dad' | 'flying' | 'tero' | 'rolling' | 'back' }

let dadImg: HTMLImageElement | null = null;
function dad(): HTMLImageElement | null {
  if (typeof Image === 'undefined') return null;
  if (!dadImg) { dadImg = new Image(); dadImg.src = DAD_SRC; }
  return dadImg.complete && dadImg.naturalWidth ? dadImg : null;
}

dad();   // start loading Dad's picture early

export class NapTime extends Interlude {
  readonly id = 'nap' as const;
  private phase: Phase = 'sleep';
  private phaseT = 0;
  private tx = 120; private ty = GROUND; private tvy = 0; private face = true; private walk = 0;
  private ball: Ball = { x: DAD_X - 14, y: GROUND - 44, vx: 0, vy: 0, state: 'dad' };
  private holdT = 0;
  private catches = 0;
  private memory = ''; private memoryT = 0;
  private dadLine = ''; private dadT = 0;
  private hearts: { x: number; y: number; t: number }[] = [];

  constructor() { super(); preloadTero(); dad(); }

  private go(p: Phase): void { this.phase = p; this.phaseT = 0; }

  update(host: InterludeHost): void {
    this.t++; this.phaseT++;
    if (this.memoryT > 0) this.memoryT--;
    if (this.dadT > 0) this.dadT--;
    for (const h of this.hearts) { h.t++; h.y -= 0.4; }
    this.hearts = this.hearts.filter((h) => h.t < 80);
    const inp = host.input;

    switch (this.phase) {
      case 'sleep':
        if (this.phaseT === 1) host.audio.setMuzak(true, 'basement');
        if (this.phaseT > 150 || (this.phaseT > 40 && (inp.jumpPressed || inp.firePressed))) this.go('play');
        return;
      case 'play':
        this.updateTero(host);
        this.updateBall(host);
        if (this.catches >= CATCHES && this.ball.state === 'dad' && this.phaseT > 20) {
          this.say('TIME TO GO HOME, BUDDY.');
          this.go('goodbye');
        }
        return;
      case 'goodbye':
        // Tero walks over by himself
        if (this.tx < DAD_X - 34) { this.tx += 0.7; this.walk += 0.7; this.face = true; }
        if (this.phaseT % 40 === 0) this.hearts.push({ x: this.tx + 20, y: GROUND - 60, t: 0 });
        if (this.phaseT > 300) { this.go('alarm'); host.audio.setMuzak(false); }
        return;
      case 'alarm':
        if (this.phaseT % 10 === 1 && this.phaseT < 90) { host.audio.play('alarm'); host.shake.trigger(4); }
        if (this.phaseT > 150 && (inp.jumpPressed || inp.firePressed)) { this.done = true; host.callout('RUN!'); }
        if (this.phaseT > 400) { this.done = true; host.callout('RUN!'); }
        return;
    }
  }

  private say(s: string): void { this.dadLine = s; this.dadT = 110; }

  private updateTero(host: InterludeHost): void {
    const inp = host.input;
    let vx = 0;
    if (inp.left) { vx = -1.3; this.face = false; }
    if (inp.right) { vx = 1.3; this.face = true; }
    this.tx = Math.max(30, Math.min(DAD_X - 50, this.tx + vx));
    if (vx) this.walk += Math.abs(vx);
    if (inp.jumpPressed && this.ty >= GROUND) { this.tvy = -5.4; host.audio.play('jump'); }
    this.tvy += 0.22;                    // dream gravity: floaty
    this.ty = Math.min(GROUND, this.ty + this.tvy);
    if (this.ty >= GROUND) this.tvy = 0;
    if (inp.callPressed) { host.audio.play('dada'); this.say('I\'M RIGHT HERE.'); }
  }

  private updateBall(host: InterludeHost): void {
    const b = this.ball;
    switch (b.state) {
      case 'dad':
        b.x = DAD_X - 18; b.y = GROUND - 44;
        if (this.catches < CATCHES && ++this.holdT > 70) {
          this.holdT = 0;
          // a gentle throw towards (near) Tero
          const target = Math.max(40, Math.min(DAD_X - 70, this.tx + (noise(this.t) - 0.5) * 80));
          const time = 80;
          b.vx = (target - b.x) / time;
          b.vy = (GROUND - 30 - b.y) / time - (0.11 * time) / 2;
          b.state = 'flying';
          host.audio.play('boing');
        }
        return;
      case 'flying':
        b.x += b.vx; b.vy += 0.11; b.y += b.vy;
        if (Math.hypot(b.x - this.tx, b.y - (this.ty - 24)) < 24) {
          b.state = 'tero'; this.holdT = 0; this.catches++;
          host.audio.play('coin');
          this.memory = MEMORIES[(this.catches - 1) % MEMORIES.length]; this.memoryT = 220;
          this.hearts.push({ x: this.tx, y: this.ty - 50, t: 0 });
          this.say(['NICE CATCH!', 'THAT\'S MY KID!', 'WOW!', 'YOU\'RE A NATURAL.', 'ONE MORE?'][this.catches - 1] ?? 'YAY!');
        } else if (b.y >= GROUND - 4) {
          b.state = 'rolling'; b.y = GROUND - 4; b.vx = 1.6;
          this.say('ALMOST! I\'LL GET IT.');
        }
        return;
      case 'tero':
        b.x = this.tx + (this.face ? 8 : -8); b.y = this.ty - 26;
        if (++this.holdT > 50) {
          // he throws it back (not very far: he's two)
          b.state = 'back';
          b.vx = (DAD_X - 18 - b.x) / 70; b.vy = -4;
          host.audio.play('jump');
        }
        return;
      case 'back':
        b.x += b.vx; b.vy += 0.11; b.y += b.vy;
        if (b.x >= DAD_X - 22 || b.y >= GROUND - 4) { b.state = 'dad'; this.holdT = 0; }
        return;
      case 'rolling':
        b.x += b.vx;
        if (b.x >= DAD_X - 18) { b.state = 'dad'; this.holdT = 0; }
        return;
    }
  }

  // ─── Drawing ───────────────────────────────────────────────────────────────

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.phase === 'sleep') return this.drawSleep(ctx);
    if (this.phase === 'alarm') return this.drawAlarm(ctx);
    // the park, in colour first
    ctx.fillStyle = '#5f8fbf'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffe066'; ctx.beginPath(); ctx.arc(70, 50, 22, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 4; i++) {
      const x = ((i * 140 + this.t * 0.15) % (W + 80)) - 40, y = 30 + (i % 2) * 24;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, 46, 12); ctx.fillRect(x + 10, y - 8, 24, 10);
    }
    ctx.fillStyle = '#4c9a36'; ctx.fillRect(0, 150, W, 120);
    ctx.fillStyle = '#2f6e2a';
    for (let x = 0; x < W; x += 6) ctx.fillRect(x, 150 + ((x * 7) % 5), 2, 3);
    // a house far away, with the lights on
    ctx.fillStyle = '#c9a07a'; ctx.fillRect(390, 112, 50, 40);
    ctx.fillStyle = '#a0522d'; ctx.beginPath(); ctx.moveTo(384, 114); ctx.lineTo(415, 92); ctx.lineTo(446, 114); ctx.fill();
    ctx.fillStyle = '#ffe066'; ctx.fillRect(400, 124, 10, 10); ctx.fillRect(420, 124, 10, 10);
    // a tree
    ctx.fillStyle = '#7a4a2a'; ctx.fillRect(196, 104, 12, 50);
    ctx.fillStyle = '#3e8a3c'; ctx.beginPath(); ctx.arc(202, 96, 30, 0, Math.PI * 2); ctx.fill();

    // Dad, from before the job (standing tall, not slumped)
    const img = dad();
    if (img) {
      ctx.save();
      ctx.translate(DAD_X + 10, GROUND + 2);
      ctx.scale(-1, 1);                       // facing Tero
      smoothDad(ctx, img, 96);
      ctx.drawImage(img, -48, -96, 96, 96);
      ctx.restore();
    }
    const anim = this.ty < GROUND ? 'jump' : this.phase === 'goodbye' && this.tx >= DAD_X - 34 ? 'win' : this.walk > 0 && this.t % 2 === 0 ? 'walk' : 'idle';
    drawTero(ctx, anim, Math.floor(anim === 'walk' ? this.walk / 9 : this.t / 12), this.tx, this.ty + 2, 52, !this.face);
    // the ball
    const b = this.ball;
    ctx.fillStyle = '#d83b3b'; ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(b.x - 2, b.y - 3, 2, 2);
    for (const h of this.hearts) this.heart(ctx, h.x, h.y);

    // fold it all into four greens
    this.gameBoy(ctx, this.phase === 'goodbye' ? Math.min(1, this.phaseT / 280) : 0);

    const dark = '#0f380f';
    if (this.dadT > 0 && this.dadLine) this.bubble(ctx, this.dadLine, DAD_X - 20, GROUND - 120);
    if (this.memoryT > 0) {
      ctx.globalAlpha = Math.min(1, this.memoryT / 40);
      shadowText(ctx, this.memory, W / 2, 16, dark, 1, 'center', '#9bbc0f');
      ctx.globalAlpha = 1;
    }
    text(ctx, `CATCHES: ${this.catches}/${CATCHES}`, 8, H - 12, dark);
    if (this.phase === 'play' && this.phaseT < 200) text(ctx, 'CATCH THE BALL', W / 2, H - 12, dark, 1, 'center');
  }

  private heart(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.fillStyle = '#ff6f86';
    ctx.fillRect(x - 4, y - 2, 3, 3); ctx.fillRect(x + 1, y - 2, 3, 3); ctx.fillRect(x - 4, y, 8, 3); ctx.fillRect(x - 2, y + 3, 4, 2);
  }

  private bubble(ctx: CanvasRenderingContext2D, s: string, x: number, y: number): void {
    const w = s.length * 4 + 10;
    ctx.fillStyle = '#0f380f'; ctx.fillRect(x - w / 2 - 1, y - 1, w + 2, 13);
    ctx.fillStyle = '#9bbc0f'; ctx.fillRect(x - w / 2, y, w, 11);
    ctx.fillRect(x + 10, y + 11, 4, 4);
    text(ctx, s, x, y + 3, '#0f380f', 1, 'center');
  }

  /** Four shades of green; `white` fades the dream out at the end. */
  private gameBoy(ctx: CanvasRenderingContext2D, white: number): void {
    let img: ImageData;
    try { img = ctx.getImageData(0, 0, W, H); } catch { return; }
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const lum = (0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]) / 255;
      const c = GB[Math.min(3, Math.floor(lum * 4))];
      d[i] = c[0] + (255 - c[0]) * white * 0.85;
      d[i + 1] = c[1] + (255 - c[1]) * white * 0.85;
      d[i + 2] = c[2] + (255 - c[2]) * white * 0.85;
    }
    ctx.putImageData(img, 0, 0);
  }

  private drawSleep(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#0f380f'; ctx.fillRect(0, 0, W, H);
    shadowText(ctx, 'TERO SITS DOWN FOR ONE SECOND.', W / 2, 90, '#9bbc0f', 1, 'center', '#306230');
    if (this.phaseT > 50) shadowText(ctx, 'TERO IS TWO.', W / 2, 108, '#9bbc0f', 1, 'center', '#306230');
    if (this.phaseT > 90) {
      const z = Math.floor(this.phaseT / 15) % 4;
      shadowText(ctx, 'Z'.repeat(z), W / 2 + 40, 140 - z * 4, '#8bac0f', 2, 'left', '#306230');
    }
  }

  private drawAlarm(ctx: CanvasRenderingContext2D): void {
    const ringing = this.phaseT < 90;
    ctx.fillStyle = ringing && this.phaseT % 10 < 5 ? '#ffffff' : '#000000';
    ctx.fillRect(0, 0, W, H);
    if (ringing) {
      shadowText(ctx, 'BRRRRRING!', W / 2 + Math.round((noise(this.t) - 0.5) * 8), 110, '#d83b3b', 4, 'center');
      return;
    }
    shadowText(ctx, 'TERO! WAKE UP!', W / 2, 90, '#ffffff', 2, 'center');
    if (this.phaseT > 120) text(ctx, 'THE STAIRS. MONDAY. RUN.', W / 2, 120, '#ffd23f', 1, 'center');
    if (this.phaseT > 150 && this.t % 50 < 34) text(ctx, 'PRESS JUMP', W / 2, 150, '#808080', 1, 'center');
  }
}
