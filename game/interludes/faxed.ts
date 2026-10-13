// file: game/interludes/faxed.ts
//
// FAXED (Floor 21). The first time Tero goes through a fax machine, he
// arrives as a bad photocopy, and so does the whole floor for a while:
// one-bit black and white, grainy, with missing lines and a toner streak.
// The page comes out upside down for the first two seconds. Stand still
// too long and the paper jams: mash JUMP to clear it. Then the toner runs
// out and the colour comes back.
//
// Not a separate screen: it's a filter over the live level (Game calls
// update() each tick and post() after drawing).

import { VIEWPORT_W, VIEWPORT_H } from '../constants';
import { text, shadowText, noise } from './pixtext';
import type { InputHandler } from '../InputHandler';
import type { AudioManager } from '../AudioManager';
import type { Player } from '../creaturesAndObjects/Player';

const W = VIEWPORT_W, H = VIEWPORT_H;
const DURATION = 60 * 22;
const FADE = 120;
const UPSIDE_DOWN = 130;
const JAM_AFTER = 100;
const JAM_PRESSES = 5;
const MAX_JAMS = 2;

const PAPER = [244, 241, 230];
const TONER = [27, 22, 32];
/** 4×4 ordered dither. */
/** Toner grain, precomputed (the filter runs per pixel, per frame). */
const GRAIN = Float32Array.from({ length: 4096 }, (_, i) => (noise(i * 1.37) - 0.5) * 0.18);
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

export class PhotocopyMode {
  active = true;
  private t = 0;
  private still = 0;
  private jams = 0;
  /** JUMP presses still needed to clear a jam (0 = no jam). */
  private jam = 0;
  private jamT = 0;

  /** First seconds: the page came out upside down. */
  get upsideDown(): boolean { return this.t < UPSIDE_DOWN; }
  get jammed(): boolean { return this.jam > 0; }

  /** One tick. Returns true while the paper is jammed (the world waits). */
  update(player: Player, input: InputHandler, audio: AudioManager): boolean {
    if (this.jam > 0) {
      this.jamT++;
      if (input.jumpPressed || input.firePressed) {
        this.jam--;
        audio.play(this.jam === 0 ? 'fax' : 'block');
      }
      return this.jam > 0;
    }
    this.t++;
    if (this.t === UPSIDE_DOWN) audio.play('plop');
    if (this.t >= DURATION) { this.active = false; return false; }

    const moving = Math.abs(player.vx) > 0.15 || !player.onGround;
    this.still = moving || player.isDead ? 0 : this.still + 1;
    if (this.still > JAM_AFTER && this.jams < MAX_JAMS && this.t > UPSIDE_DOWN && this.t < DURATION - FADE) {
      this.jam = JAM_PRESSES; this.jamT = 0; this.jams++; this.still = 0;
      audio.play('error');
    }
    return false;
  }

  /** How strongly the copy look applies right now (fades at the end). */
  private get strength(): number {
    return Math.max(0, Math.min(1, (DURATION - this.t) / FADE));
  }

  /** Turns whatever was drawn this frame into a photocopy. */
  post(ctx: CanvasRenderingContext2D): void {
    const k = this.strength;
    if (k <= 0) return;
    let img: ImageData;
    try { img = ctx.getImageData(0, 0, W, H); } catch { return; }
    const d = img.data;
    const frame = Math.floor(this.t / 4);
    const streakX = 140 + Math.floor(noise(Math.floor(this.t / 300)) * 200);
    for (let y = 0; y < H; y++) {
      const missing = noise(y * 3.1 + Math.floor(this.t / 40)) < 0.035;
      const smear = noise(y * 7.7 + frame) < 0.05 ? 2 : 0;
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const j = smear ? (y * W + Math.max(0, x - smear)) * 4 : i;
        const lum = (0.3 * d[j] + 0.59 * d[j + 1] + 0.11 * d[j + 2]) / 255;
        const grain = GRAIN[(x * 13 + y * 71 + frame * 397) & 4095];
        let ink = lum + grain < BAYER[(y & 3) * 4 + (x & 3)] * 0.9 + 0.05;
        if (missing) ink = false;
        if (Math.abs(x - streakX) < 2 && GRAIN[(y * 31 + frame) & 4095] < 0.05) ink = true;
        const c = ink ? TONER : PAPER;
        d[i]     = d[i]     + (c[0] - d[i])     * k;
        d[i + 1] = d[i + 1] + (c[1] - d[i + 1]) * k;
        d[i + 2] = d[i + 2] + (c[2] - d[i + 2]) * k;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  /** Captions over the copy. */
  drawOverlay(ctx: CanvasRenderingContext2D): void {
    if (this.jam > 0) {
      // the page crumples
      ctx.fillStyle = 'rgba(27,22,32,0.55)';
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 9; i++) {
        ctx.fillStyle = 'rgba(244,241,230,0.18)';
        const x = noise(i * 5) * W, y = noise(i * 9) * H;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 120, y + 40); ctx.lineTo(x + 60, y + 90); ctx.fill();
      }
      const wob = Math.round(Math.sin(this.jamT / 3) * 2);
      shadowText(ctx, 'PAPER JAM!', W / 2 + wob, 92, '#ffffff', 4, 'center');
      text(ctx, 'PC LOAD LETTER', W / 2, 130, '#ffd23f', 2, 'center');
      text(ctx, 'MASH JUMP TO CLEAR IT', W / 2, 152, '#ffffff', 1, 'center');
      text(ctx, '*'.repeat(this.jam), W / 2, 162, '#ffd23f', 1, 'center');
      text(ctx, '(THE PAPER JAMS IF YOU STAND STILL. NOBODY KNOWS WHY.)', W / 2, 172, '#c9ccd1', 1, 'center');
      return;
    }
    if (this.upsideDown) {
      // the whole view is flipped (CSS), so write this one the right way up
      ctx.save();
      ctx.translate(0, H); ctx.scale(1, -1);
      shadowText(ctx, '(PAGE INSERTED UPSIDE DOWN)', W / 2, 24, '#1b1620', 1, 'center', '#f4f1e6');
      ctx.restore();
    }
    if (this.t > DURATION - FADE - 90 && this.t < DURATION) text(ctx, 'TONER LOW...', W - 8, 30, '#1b1620', 1, 'right');
  }
}
