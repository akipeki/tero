// file: game/interludes/onboarding.ts
//
// MANDATORY ONBOARDING (Floor 1). Before Tero can go up, Brenda makes him
// watch the orientation video, recorded in 1987 on a VHS tape that has been
// copied many times. It's slow on purpose. Hold FIRE and Tero throws a
// tantrum at the VCR: fast-forward, ×8, with the tape screaming. Be kind,
// rewind.

import { VIEWPORT_W, VIEWPORT_H } from '../constants';
import { Interlude, type InterludeHost } from './Interlude';
import { text, shadowText, noise } from './pixtext';
import { drawHalvorsen } from '../render/characters/humans';

const W = VIEWPORT_W, H = VIEWPORT_H;
const SLIDE = 260;                       // ticks per slide at normal speed

const SLIDES: string[] = [
  'WELCOME TO THE FAMILY!',
  'RULE 1:\nTHE COMPANY IS ALWAYS RIGHT.',
  'RULE 2:\nLUNCH IS FOUR MINUTES.',
  'RULE 3:\nYOUR DESK IS YOUR HOME NOW.',
  'RULE 4:\nCHILDREN ARE NOT PERMITTED\nABOVE THE BASEMENT.',
  'RULE 5:\nIF YOU SEE A TODDLER,\nDO NOT ENGAGE. SCHEDULE A MEETING.',
  'THERE WILL BE A QUIZ AT THE END.\n(THERE IS NO END.)',
];

export class OnboardingVhs extends Interlude {
  readonly id = 'onboarding' as const;
  /** Position on the tape, in ticks of normal-speed playback. */
  private pos = 0;
  private ff = false;
  private nag = 0;
  private ended = 0;
  private presenter = drawHalvorsen('present').toCanvas();
  private presenter2 = drawHalvorsen('walk0').toCanvas();

  update(host: InterludeHost): void {
    this.t++;
    if (this.nag > 0) this.nag--;
    const inp = host.input;
    if (this.ended > 0) {
      this.ended++;
      if (this.ended === 2) host.audio.play('click');
      if (this.ended > 150 || (this.ended > 50 && (inp.jumpPressed || inp.firePressed))) this.done = true;
      return;
    }
    this.ff = inp.held(1 << 5 /* FIRE */);
    const before = Math.floor(this.pos / SLIDE);
    this.pos += this.ff ? 8 : 1;
    if (this.ff && this.t % 4 === 0) host.audio.play('laser');
    if (!this.ff && Math.floor(this.pos / SLIDE) !== before) host.audio.play('text');
    if (this.ff && this.t % 30 === 0) host.shake.trigger(2);
    if (inp.jumpPressed) { this.nag = 90; host.audio.play('error'); }
    if (this.pos >= SLIDES.length * SLIDE) { this.ended = 1; host.audio.play('plop'); }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#101018'; ctx.fillRect(0, 0, W, H);
    if (this.ended > 0) return this.drawEnd(ctx);
    const slide = Math.min(SLIDES.length - 1, Math.floor(this.pos / SLIDE));
    const k = (this.pos % SLIDE) / SLIDE;

    // the studio: a blue backdrop, the company logo, a presenter
    ctx.fillStyle = '#1f3f8f'; ctx.fillRect(20, 16, W - 40, H - 40);
    ctx.fillStyle = '#2a52b0';
    for (let y = 16; y < H - 24; y += 8) ctx.fillRect(20, y, W - 40, 3);
    shadowText(ctx, 'HALVORSEN & SONS', 40, 30, '#ffd23f', 2);
    text(ctx, 'EMPLOYEE ORIENTATION (1987)', 40, 48, '#c9ccd1');
    // presenter, bobbing on the tape's wobble
    const pc = Math.floor(this.pos / 40) % 2 ? this.presenter : this.presenter2;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(pc, 340, 70 + Math.round(Math.sin(this.pos / 25)), 80, 120);
    // the slide
    ctx.fillStyle = '#f4f1e6'; ctx.fillRect(40, 72, 270, 120);
    ctx.fillStyle = '#1b1620'; ctx.fillRect(40, 72, 270, 3);
    text(ctx, SLIDES[slide], 175, 118 - SLIDES[slide].split('\n').length * 5, '#1b1620', 1, 'center');
    ctx.fillStyle = '#d83b3b'; ctx.fillRect(40, 186, 270 * k, 3);

    // VHS: scanlines, a rolling tracking band, colour bleed, and the OSD
    for (let y = 0; y < H; y += 2) { ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(0, y, W, 1); }
    const band = (this.t * (this.ff ? 9 : 1.2)) % (H + 40) - 20;
    for (let i = 0; i < 14; i++) {
      const y = band + i;
      if (noise(i + this.t) < 0.5) { ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(0, y, W, 1); }
      ctx.drawImage(ctx.canvas, 0, y, W, 1, Math.round((noise(i * 3 + this.t) - 0.5) * 12), y, W, 1);
    }
    if (this.ff) {
      // fast-forward tears the picture into strips
      for (let i = 0; i < 6; i++) {
        const y = Math.floor(noise(this.t * 7 + i) * H), h = 4 + Math.floor(noise(i + this.t) * 10);
        ctx.drawImage(ctx.canvas, 0, y, W, h, 30, y, W, h);
      }
    }
    ctx.globalAlpha = 0.12; ctx.fillStyle = '#ff0040'; ctx.fillRect(2, 0, W, H); ctx.globalAlpha = 1;
    shadowText(ctx, this.ff ? '>> X8' : 'PLAY >', 30, 24 - 14 + 6, '#ffffff', 2);
    const secs = Math.floor(this.pos / 60);
    text(ctx, `SP 0:${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`, W - 30, 16, '#ffffff', 1, 'right');
    if (this.t < 240 && !this.ff) shadowText(ctx, 'HOLD FIRE: TANTRUM AT THE VCR (FAST-FORWARD)', W / 2, H - 16, '#ffd23f', 1, 'center');
    if (this.ff) shadowText(ctx, 'GRRRRRRRR!', W / 2, H - 16, '#ff6f86', 1, 'center');
    if (this.nag > 0) shadowText(ctx, 'PLEASE PAY ATTENTION.', W / 2, 206, '#ffffff', 2, 'center');
  }

  private drawEnd(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#0000aa'; ctx.fillRect(0, 0, W, H);
    shadowText(ctx, 'STOP', 30, 18, '#ffffff', 2);
    shadowText(ctx, 'BE KIND. REWIND.', W / 2, 110, '#ffffff', 3, 'center');
    if (this.ended > 50) text(ctx, 'ONBOARDING COMPLETE. YOU ARE NOW PART OF THE FAMILY.', W / 2, 150, '#c9ccd1', 1, 'center');
  }
}
