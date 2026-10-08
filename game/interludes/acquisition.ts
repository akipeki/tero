// file: game/interludes/acquisition.ts
//
// THE ACQUISITION (Floor 30). Mid-level the game glitches, freezes and gets
// bought: "WHERE IS DADA? has been acquired by HALVORSEN CAPITAL". It
// reloads as WHERE IS DADA? PREMIUM, with a battle pass, DadaCoins and pop-up
// ads all over the level. Every jump costs a DadaCoin (then it's on credit).
// Tero burns the ads with his fire; halfway through an unskippable video ad
// takes over, and its SKIP button runs away from him. Burn them all and the
// acquisition is cancelled. The game is free again.
//
//   AcquisitionIntro  the takeover (interlude, over the frozen level)
//   PremiumMode       the ads, coins and debt while you keep playing
//   UnskippableAd     the video ad (full-screen interlude)

import { VIEWPORT_W, VIEWPORT_H } from '../constants';
import { drawCanopy } from '../creaturesAndObjects/Gadgets';
import { Interlude, type InterludeHost } from './Interlude';
import { text, shadowText, win95, button, bevel, noise, W95 } from './pixtext';
import { drawTero, preloadTero } from './teroSprite';
import type { AudioManager } from '../AudioManager';
import { Action } from '../types';
import { drawPig } from '../render/characters/creatures';

let pig: HTMLCanvasElement | null = null;
/** The ad's model: a pig executive, floating down with no consequences. */
function pigCanvas(): HTMLCanvasElement {
  return (pig ??= drawPig(0).toCanvas());
}

const W = VIEWPORT_W, H = VIEWPORT_H;
const GOLD = '#ffd23f', GOLD_DARK = '#c8961e';

/** How many ads Tero has to burn to cancel the deal. */
export const ADS_TO_BURN = 6;

function advance(host: InterludeHost): boolean {
  return host.input.justPressedAction(Action.JUMP) || host.input.justPressedAction(Action.FIRE);
}

// ─── The takeover ────────────────────────────────────────────────────────────

const GLITCH = 50;

export class AcquisitionIntro extends Interlude {
  readonly id = 'acquisition' as const;
  overlay = true;
  private page = 0;
  private pageT = 0;
  private progress = 0;

  constructor() { super(); preloadTero(); }

  get hidesPlayer(): boolean { return this.t > GLITCH; }

  update(host: InterludeHost): void {
    this.t++; this.pageT++;
    if (this.t === 1) { host.audio.play('error'); host.shake.trigger(6); }
    if (this.t < GLITCH) { if (this.t % 9 === 0) host.audio.play('laser'); return; }
    if (this.t === GLITCH) { this.pageT = 0; host.audio.play('error'); }

    const ready = this.pageT > 24;
    switch (this.page) {
      case 0: // acquisition notice
        if (ready && advance(host)) this.next(host);
        break;
      case 1: { // installing
        const p = this.pageT;
        this.progress = p < 90 ? Math.floor((p / 90) * 99) : p < 170 ? 99 : 100;
        if (p % 12 === 0 && p < 90) host.audio.play('click');
        if (p === 171) host.audio.play('goal');
        if (p > 200) this.next(host);
        break;
      }
      case 2: // premium splash
      case 3: // battle pass
        if (ready && advance(host)) this.next(host);
        break;
    }
  }

  private next(host: InterludeHost): void {
    this.page++;
    this.pageT = 0;
    host.audio.play(this.page === 2 ? 'unlock' : 'plop');
    if (this.page > 3) this.done = true;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.t < GLITCH) return this.drawGlitch(ctx);
    if (this.page === 0) return this.drawNotice(ctx);
    if (this.page === 1) return this.drawInstall(ctx);
    if (this.page === 2) return this.drawSplash(ctx);
    return this.drawPass(ctx);
  }

  /** The frozen level tears: shifted slices of itself, colour bars, static. */
  private drawGlitch(ctx: CanvasRenderingContext2D): void {
    const k = this.t;
    for (let i = 0; i < 9; i++) {
      const y = Math.floor(noise(k * 31 + i) * H);
      const h = 2 + Math.floor(noise(k * 17 + i) * 14);
      const dx = Math.round((noise(k * 7 + i) - 0.5) * 60);
      ctx.drawImage(ctx.canvas, 0, y, W, h, dx, y, W, h);
    }
    const bars = ['#ff004d', '#00e436', '#29adff', '#ffec27'];
    for (let i = 0; i < 4; i++) {
      if (noise(k * 3 + i) < 0.6) continue;
      ctx.fillStyle = bars[i];
      ctx.globalAlpha = 0.35;
      ctx.fillRect(0, Math.floor(noise(k + i * 11) * H), W, 3);
      ctx.globalAlpha = 1;
    }
    if (k > GLITCH - 18) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      if (k % 6 < 3) shadowText(ctx, 'NO SIGNAL', W / 2, H / 2 - 4, '#ffffff', 2, 'center');
    }
  }

  private drawNotice(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(0,0,40,0.72)';
    ctx.fillRect(0, 0, W, H);
    const w = 300, h = 128, x = (W - w) / 2, y = (H - h) / 2;
    const { cx, cy } = win95(ctx, x, y, w, h, 'ACQUISITION_NOTICE.TXT');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx, cy, w - 12, h - 46);
    text(ctx, 'WHERE IS DADA? HAS BEEN ACQUIRED BY\nHALVORSEN CAPITAL.\n\nTHANK YOU FOR YOUR PASSION.\nYOUR SAVE DATA IS NOW OUR SAVE DATA.\nYOUR CHILDHOOD IS NOW A SUBSCRIPTION.', cx + 6, cy + 6, '#000000');
    button(ctx, x + w / 2 - 40, y + h - 22, 80, 'OK', this.pageT % 40 < 4);
  }

  private drawInstall(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    const label = this.progress < 99 ? 'INSTALLING PREMIUM EXPERIENCE...'
      : this.progress === 99 ? 'DOWNLOADING SHAREHOLDER VALUE...' : 'DONE. YOU ARE WELCOME.';
    text(ctx, label, W / 2, 110, '#c0c0c0', 1, 'center');
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(W / 2 - 120, 124, 240, 14);
    ctx.fillStyle = '#000';
    ctx.fillRect(W / 2 - 119, 125, 238, 12);
    ctx.fillStyle = W95.title;
    const blocks = Math.floor((this.progress / 100) * 23);
    for (let i = 0; i < blocks; i++) ctx.fillRect(W / 2 - 117 + i * 10, 127, 8, 8);
    text(ctx, `${this.progress}%`, W / 2, 146, '#ffffff', 1, 'center');
    if (this.progress === 99) text(ctx, '(THIS PART IS ALWAYS SLOW.)', W / 2, 160, '#808080', 1, 'center');
  }

  private drawSplash(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#1b1620';
    ctx.fillRect(0, 0, W, H);
    // light rays
    ctx.save();
    ctx.translate(W / 2, 92);
    ctx.rotate(this.pageT / 90);
    ctx.fillStyle = 'rgba(255,210,63,0.08)';
    for (let i = 0; i < 12; i++) {
      ctx.rotate(Math.PI / 6);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-30, -400); ctx.lineTo(30, -400); ctx.fill();
    }
    ctx.restore();
    shadowText(ctx, 'WHERE IS DADA?', W / 2, 40, '#ffffff', 3, 'center');
    const bounce = Math.round(Math.abs(Math.sin(this.pageT / 8)) * -4);
    shadowText(ctx, 'PREMIUM', W / 2, 72 + bounce, GOLD, 6, 'center', GOLD_DARK);
    text(ctx, 'NOW WITH:', W / 2, 128, '#c9ced6', 1, 'center');
    const feats = ['ADS', 'BATTLE PASS', 'DADACOINS', 'LESS DADA'];
    feats.forEach((f, i) => {
      if (this.pageT > 20 + i * 18) shadowText(ctx, `+ ${f}`, W / 2, 142 + i * 14, i === 3 ? '#ff6f86' : '#ffffff', 2, 'center');
    });
    if (this.pageT > 100 && this.pageT % 50 < 35) text(ctx, 'PRESS JUMP TO ACCEPT (YOU HAVE NO CHOICE)', W / 2, 254, '#808080', 1, 'center');
  }

  private drawPass(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#14101c';
    ctx.fillRect(0, 0, W, H);
    shadowText(ctx, 'SEASON 1 BATTLE PASS', W / 2, 16, GOLD, 2, 'center');
    text(ctx, 'THEME: GRATITUDE', W / 2, 34, '#c9ced6', 1, 'center');
    const tiers: [string, string, string, string][] = [
      ['TIER 1', 'FREE', 'A SAD TROMBONE', '#6cc24a'],
      ['TIER 2', 'PREMIUM', 'DADA (3-MINUTE TRIAL)', GOLD],
      ['TIER 50', 'PREMIUM+', 'DADA AT DINNER (WEEKENDS ONLY)', '#ff9a52'],
      ['TIER 99', 'PREMIUM ULTRA', 'DADA (FULL VERSION)\n$49.99 / MONTH, BILLED FOREVER', '#ff6f86'],
    ];
    tiers.forEach(([tier, track, reward, col], i) => {
      const y = 52 + i * 40;
      const shown = this.pageT > 10 + i * 14;
      if (!shown) return;
      ctx.fillStyle = '#231c2e';
      ctx.fillRect(40, y, W - 80, 34);
      ctx.fillStyle = col;
      ctx.fillRect(40, y, 4, 34);
      text(ctx, tier, 52, y + 6, col, 2);
      text(ctx, track, 52, y + 22, '#c9ced6');
      text(ctx, reward, 160, y + 8, '#ffffff', 1);
      // lock icon on everything but the free tier
      if (i > 0) {
        ctx.fillStyle = '#808080';
        ctx.fillRect(W - 62, y + 14, 12, 10);
        ctx.strokeStyle = '#808080';
        ctx.strokeRect(W - 59.5, y + 8.5, 6, 7);
      }
    });
    if (this.pageT > 80) {
      drawTero(ctx, 'idle', Math.floor(this.pageT / 10), 70, 262, 44);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(96, 218, 118, 18);
      ctx.fillRect(92, 228, 6, 4);
      text(ctx, 'DADA IS NOT DLC.', 155, 224, '#1b1620', 1, 'center');
    }
  }
}

// ─── Premium mode: the ads, while you keep playing ───────────────────────────

interface AdCopy { title: string; body: string; cta: string; color: string }

const ADS: AdCopy[] = [
  { title: 'CONGRATULATIONS!!', body: 'YOU ARE THE 1,000,000TH\nTODDLER! CLAIM YOUR\nUNPAID INTERNSHIP.', cta: 'CLAIM', color: '#d83b3b' },
  { title: 'HOT SINGLE EXECUTIVES', body: 'IN YOUR AREA WANT\nTO RESTRUCTURE YOU.', cta: 'MEET', color: '#c2185b' },
  { title: 'DADACOIN STORE', body: '500 DADACOINS  $4.99\n1200 DADACOINS $9.99\nDADA  NOT FOR SALE*', cta: 'BUY', color: '#c8961e' },
  { title: 'NEW BABY FORMULA', body: 'NOW WITH 40% MORE\nCOFFEE. GROW UP FAST.', cta: 'SIP', color: '#6b4226' },
  { title: 'DOWNLOAD MORE DADS', body: 'FAST. FREE. 100%\nLEGIT. NO VIRUSES.', cta: 'OK', color: '#2b6cb0' },
  { title: 'LIMITED OFFER', body: 'SKIP 1 FLOOR: $9.99\nSKIP CHILDHOOD: FREE', cta: 'YES', color: '#d83b3b' },
  { title: 'WARNING!', body: 'YOUR DAD\'S EXTENDED\nWARRANTY HAS EXPIRED.', cta: 'RENEW', color: '#e8b72f' },
  { title: 'SPONSORED', body: 'THIS PLATFORM WAS\nBROUGHT TO YOU BY\nHALVORSEN CAPITAL.', cta: 'OK', color: W95.title },
];

interface Ad { x: number; y: number; w: number; h: number; copy: AdCopy; burning: number; age: number; wobble: number }
interface Floater { x: number; y: number; text: string; life: number; color: string }

const AD_W = 124, AD_H = 62, BURN_TICKS = 28;

export class PremiumMode {
  active = true;
  burned = 0;
  coins = 3;
  debt = 0;
  /** Set when it's time for the video ad; Game starts it and sets `adShown`. */
  wantsAd = false;
  adShown = false;
  private t = 0;
  private ads: Ad[] = [];
  private floaters: Floater[] = [];
  private nextCopy = 0;
  private camX = 0;
  private spawnIn = 40;
  /** Ticks left on the "acquisition cancelled" window. */
  private ending = 0;
  /** Set on the tick the deal is cancelled (Game shouts about it). */
  justEnded = false;

  /** Ads live in the level (world px), so Tero can walk up and burn them.
   *  `mouth` = Tero's mouth, `flames` = flame boxes, both in world px. */
  update(
    mouth: { x: number; y: number }, flames: { x: number; y: number; w: number; h: number }[],
    camX: number, audio: AudioManager,
  ): void {
    this.t++;
    this.camX = camX;
    this.justEnded = false;
    for (const f of this.floaters) { f.life--; f.y -= 0.4; }
    this.floaters = this.floaters.filter((f) => f.life > 0);

    if (this.ending > 0) {
      for (const ad of this.ads) ad.burning++;
      this.ads = this.ads.filter((ad) => ad.burning <= BURN_TICKS);
      if (--this.ending === 0) this.active = false;
      return;
    }

    // new ads, up to 3 on screen, until enough have burned
    const left = ADS_TO_BURN - this.burned - this.ads.length;
    if (left > 0 && this.ads.length < 3 && --this.spawnIn <= 0) {
      this.spawnIn = 150 + Math.floor(noise(this.t) * 90);
      this.spawn(mouth, audio);
    }
    // ads you walked past chase you: they pop back up ahead
    for (const ad of this.ads) {
      if (ad.burning === 0 && ad.x + ad.w < camX - 20) {
        ad.x = Math.min(camX + W - ad.w - 6, mouth.x + 90);
        ad.age = 0;
        ad.copy = { ...ad.copy, title: 'COME BACK!' };
        audio.play('error');
      }
    }

    for (const ad of this.ads) {
      ad.age++;
      if (ad.burning > 0) { ad.burning++; continue; }
      for (const f of flames) {
        if (f.x < ad.x + ad.w && f.x + f.w > ad.x && f.y < ad.y + ad.h && f.y + f.h > ad.y) {
          ad.burning = 1;
          audio.play('burn');
          break;
        }
      }
    }
    for (const ad of this.ads) {
      if (ad.burning > BURN_TICKS) {
        this.burned++;
        this.floaters.push({ x: ad.x + ad.w / 2, y: ad.y + ad.h / 2, text: 'AD BURNED!', life: 60, color: '#ffd23f' });
        if (this.burned === 3 && !this.adShown) this.wantsAd = true;
      }
    }
    this.ads = this.ads.filter((a) => a.burning <= BURN_TICKS);

    if (this.burned >= ADS_TO_BURN && this.adShown) {
      this.ending = 240;
      this.justEnded = true;
      for (const ad of this.ads) if (ad.burning === 0) ad.burning = 1;
      audio.play('unlock');
    }
  }

  private spawn(mouth: { x: number; y: number }, audio: AudioManager): void {
    const copy = ADS[this.nextCopy++ % ADS.length];
    // ahead of Tero, on screen, at his mouth height, so he can walk up and puff it
    let x = Math.min(this.camX + W - AD_W - 6, mouth.x + 60 + noise(this.t * 3) * 110);
    const y = Math.min(H - 30 - AD_H, Math.max(26, mouth.y - AD_H / 2 + (noise(this.t * 7) - 0.5) * 30));
    // don't stack right on top of another one
    for (const o of this.ads) if (Math.abs(o.x - x) < 60 && Math.abs(o.y - y) < 40) x = Math.max(o.x + AD_W + 10, x);
    this.ads.push({ x, y, w: AD_W, h: AD_H, copy, burning: 0, age: 0, wobble: noise(this.t) * 6 });
    audio.play('error');
  }

  /** Every jump costs a DadaCoin. Then it's on credit. */
  charge(at: { x: number; y: number }): void {
    if (this.ending > 0 || !this.active) return;
    if (this.coins > 0) {
      this.coins--;
      this.floaters.push({ x: at.x, y: at.y, text: '-1 DADACOIN', life: 40, color: GOLD });
    } else {
      this.debt += 4.99;
      this.floaters.push({ x: at.x, y: at.y, text: 'ON CREDIT: +$4.99', life: 50, color: '#ff6f86' });
    }
  }

  draw(ctx: CanvasRenderingContext2D, camX: number): void {
    for (const ad of this.ads) this.drawAd(ctx, ad, camX);
    for (const f of this.floaters) {
      ctx.globalAlpha = Math.min(1, f.life / 20);
      shadowText(ctx, f.text, f.x - camX, f.y, f.color, 1, 'center');
      ctx.globalAlpha = 1;
    }
    if (this.ending > 0) {
      const w = 220, h = 78, x = (W - w) / 2, y = 60;
      const { cx, cy } = win95(ctx, x, y, w, h, 'NOTICE.TXT', '#008000');
      text(ctx, 'ACQUISITION CANCELLED.\nREASON: THE TODDLER\nBURNED ALL THE ADS.\nDEBT: FORGIVEN. (IT\'S A GAME.)', cx + 2, cy + 2, '#000000');
      return;
    }
    // the premium bar along the bottom
    ctx.fillStyle = 'rgba(20,16,28,0.88)';
    ctx.fillRect(0, H - 11, W, 11);
    ctx.fillStyle = GOLD;
    ctx.fillRect(0, H - 11, W, 1);
    text(ctx, 'PREMIUM', 4, H - 8, GOLD);
    text(ctx, `DADACOINS: ${this.coins}`, 70, H - 8, '#ffffff');
    text(ctx, `DEBT: $${this.debt.toFixed(2)}`, 170, H - 8, this.debt > 0 ? '#ff6f86' : '#ffffff');
    text(ctx, `ADS BURNED: ${this.burned}/${ADS_TO_BURN}`, W - 4, H - 8, '#ffd23f', 1, 'right');
  }

  private drawAd(ctx: CanvasRenderingContext2D, ad: Ad, camX: number): void {
    const pop = Math.min(1, ad.age / 8);
    const x = Math.round(ad.x - camX), y = Math.round(ad.y + Math.sin((ad.age + ad.wobble * 10) / 30) * 2);
    ctx.save();
    if (pop < 1) {
      ctx.translate(x + ad.w / 2, y + ad.h / 2);
      ctx.scale(pop, pop);
      ctx.translate(-(x + ad.w / 2), -(y + ad.h / 2));
    }
    win95(ctx, x, y, ad.w, ad.h, ad.copy.title, ad.copy.color);
    text(ctx, ad.copy.body, x + 6, y + 19, '#000000');
    button(ctx, x + ad.w - 42, y + ad.h - 17, 36, ad.copy.cta, ad.age % 50 < 6);
    if (ad.burning > 0) {
      // the fire eats it from the bottom up
      const k = ad.burning / BURN_TICKS;
      const top = y + ad.h - ad.h * k;
      ctx.fillStyle = '#1b1620';
      ctx.fillRect(x, top, ad.w, y + ad.h - top);
      for (let i = 0; i < ad.w; i += 4) {
        const fh = 4 + noise(i + ad.burning * 13) * 10;
        ctx.fillStyle = noise(i * 3 + ad.burning) < 0.5 ? '#ff9a52' : '#ffd23f';
        ctx.fillRect(x + i, top - fh, 4, fh);
      }
    }
    ctx.restore();
  }
}

// ─── The unskippable ad ──────────────────────────────────────────────────────

const PANEL = { x: 30, y: 26, w: 420, h: 218 };
const FLOOR = PANEL.y + PANEL.h - 14;
const SKIP_W = 64;
const COUNTDOWN = 300;

export class UnskippableAd extends Interlude {
  readonly id = 'unskippable_ad' as const;
  private tx = PANEL.x + 70;
  private ty = FLOOR;
  private tvy = 0;
  private face = true;
  private walk = 0;
  /** The SKIP button. */
  private bx = PANEL.x + PANEL.w - SKIP_W - 16;
  private by = FLOOR - 13;
  private fromX = 0; private fromY = 0; private toX = 0; private toY = 0; private moveT = 0;
  private flees = 0;
  private skipped = 0;
  private puffs: { x: number; y: number; vx: number; life: number }[] = [];
  private said = '';
  private saidT = 0;

  constructor() { super(); preloadTero(); }

  private get skippable(): boolean { return this.t > COUNTDOWN; }
  private get tired(): boolean { return this.flees >= 3; }

  update(host: InterludeHost): void {
    this.t++;
    const inp = host.input;
    if (this.saidT > 0) this.saidT--;
    if (this.t === 1) host.audio.play('plop');

    if (this.skipped > 0) {
      if (++this.skipped === 70) host.audio.play('error');
      if (this.skipped > 150) this.done = true;
      return;
    }

    // Tero, a little guy in the ad
    let vx = 0;
    if (inp.left) { vx = -1.6; this.face = false; }
    if (inp.right) { vx = 1.6; this.face = true; }
    this.tx = Math.max(PANEL.x + 12, Math.min(PANEL.x + PANEL.w - 12, this.tx + vx));
    if (vx) this.walk += Math.abs(vx);
    if (inp.jumpPressed && this.ty >= FLOOR) { this.tvy = -5.2; host.audio.play('jump'); }
    this.tvy += 0.3;
    this.ty = Math.min(FLOOR, this.ty + this.tvy);
    if (this.ty >= FLOOR) this.tvy = 0;
    if (inp.firePressed) {
      this.puffs.push({ x: this.tx + (this.face ? 12 : -12), y: this.ty - 22, vx: this.face ? 3.5 : -3.5, life: 40 });
      host.audio.play('puff');
    }
    for (const p of this.puffs) { p.x += p.vx; p.life--; }
    this.puffs = this.puffs.filter((p) => p.life > 0);
    if (inp.callPressed) { this.say('DADA!'); host.audio.play('dada'); }

    if (!this.skippable) {
      if (this.t % 60 === 0) host.audio.play('click');
      return;
    }
    if (this.t === COUNTDOWN + 1) { host.audio.play('ready'); this.say('THERE!'); }

    // the button runs
    if (this.moveT > 0) {
      this.moveT--;
      const k = 1 - this.moveT / 26;
      const e = k * k * (3 - 2 * k);
      this.bx = this.fromX + (this.toX - this.fromX) * e;
      this.by = this.fromY + (this.toY - this.fromY) * e - Math.sin(k * Math.PI) * 30;
      return;
    }
    const bcx = this.bx + SKIP_W / 2;
    const near = Math.abs(bcx - this.tx) < 46 && Math.abs(this.by - (this.ty - 20)) < 50;
    const fireNear = this.puffs.some((p) => Math.abs(p.x - bcx) < 50 && Math.abs(p.y - (this.by + 6)) < 30);
    if (!this.tired && (near || fireNear)) {
      this.flees++;
      this.fromX = this.bx; this.fromY = this.by;
      // to the far side of the panel, sometimes up on the "AD 1 OF 3" shelf
      const goLeft = this.tx > PANEL.x + PANEL.w / 2;
      this.toX = goLeft ? PANEL.x + 14 + noise(this.t) * 50 : PANEL.x + PANEL.w - SKIP_W - 14 - noise(this.t) * 50;
      this.toY = this.flees === 2 ? PANEL.y + 30 : FLOOR - 13;
      this.moveT = 26;
      host.audio.play('boing');
      this.say(['NOPE.', 'NOT TODAY.', 'TRY HARDER.'][this.flees - 1]);
      return;
    }
    if (this.flees === 2 && this.by < FLOOR - 13 && !near) {
      // it can't stay up there forever
      if (this.t % 240 === 0) { this.fromX = this.bx; this.fromY = this.by; this.toX = this.bx; this.toY = FLOOR - 13; this.moveT = 26; }
    }
    const touching = this.tx > this.bx - 8 && this.tx < this.bx + SKIP_W + 8 && this.ty - 10 > this.by - 12 && this.ty - 40 < this.by + 13;
    const burnt = this.puffs.some((p) => p.x > this.bx && p.x < this.bx + SKIP_W && Math.abs(p.y - (this.by + 6)) < 14);
    if (this.tired && (touching || burnt)) {
      this.skipped = 1;
      host.audio.play('goal');
    }
  }

  private say(s: string): void { this.said = s; this.saidT = 70; }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    const p = PANEL;
    // the "video"
    ctx.fillStyle = '#1e2f5a';
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = '#28407a';
    for (let i = 0; i < 6; i++) ctx.fillRect(p.x, p.y + 20 + i * 34, p.w, 14);
    ctx.fillStyle = '#3c2a1a';
    ctx.fillRect(p.x, FLOOR, p.w, p.y + p.h - FLOOR);

    if (this.skipped > 0) {
      ctx.fillStyle = '#000';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      const s = this.skipped < 70 ? 'AD 2 OF 3' : 'JUST KIDDING.\nNO MORE ADS. FOR NOW.';
      shadowText(ctx, s, W / 2, H / 2 - 10, '#ffffff', 2, 'center');
      return;
    }

    // a golden parachute floats past, the product
    const footY = p.y + 118 + Math.sin(this.t / 40) * 10;
    const px = p.x + 310 + Math.sin(this.t / 70) * 30;
    drawCanopy(ctx, px, footY);
    ctx.drawImage(pigCanvas(), Math.round(px - 16), Math.round(footY - 38));
    text(ctx, '$', px + 12, footY - 20 + Math.sin(this.t / 9) * 2, GOLD, 2);
    shadowText(ctx, 'GOLDEN PARACHUTE', p.x + 14, p.y + 20, GOLD, 2);
    text(ctx, 'FOR WHEN YOU FAIL UPWARD.', p.x + 14, p.y + 38, '#ffffff');
    text(ctx, 'ASK YOUR BOARD IF A GOLDEN\nPARACHUTE IS RIGHT FOR YOU.', p.x + 14, p.y + 54, '#c9ced6');
    // the small print, crawling
    const crawl = 'SIDE EFFECTS MAY INCLUDE: YACHTS, MORE YACHTS, A SECOND YACHT FOR THE FIRST YACHT, NO CONSEQUENCES, MILD SMUGNESS. NOT AVAILABLE TO WORKERS.   ';
    ctx.save();
    ctx.beginPath(); ctx.rect(p.x, p.y + p.h - 10, p.w, 10); ctx.clip();
    text(ctx, crawl + crawl, p.x + p.w - ((this.t * 1.2) % (crawl.length * 4)), p.y + p.h - 8, '#808080');
    ctx.restore();

    // ad chrome
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(p.x + p.w - 58, p.y + 4, 54, 11);
    text(ctx, 'AD 1 OF 3', p.x + p.w - 54, p.y + 7, '#ffd23f');
    ctx.fillStyle = '#ffd23f';
    ctx.fillRect(p.x, p.y + p.h - 2, p.w * Math.min(1, this.t / COUNTDOWN), 2);
    if (!this.skippable) {
      const s = Math.ceil((COUNTDOWN - this.t) / 60);
      bevel(ctx, p.x + p.w - 96, FLOOR - 15, 90, 13);
      text(ctx, `SKIP AD IN ${s}`, p.x + p.w - 51, FLOOR - 11, '#000000', 1, 'center');
    } else {
      button(ctx, this.bx, this.by, SKIP_W, this.tired ? 'SKIP (FINE.)' : 'SKIP AD');
      if (this.tired) {
        ctx.fillStyle = '#8fd3ff';
        ctx.fillRect(this.bx + SKIP_W - 2, this.by - 4 + (this.t % 30 < 15 ? 0 : 2), 2, 3);
      }
    }

    // Tero and his puffs
    for (const f of this.puffs) {
      ctx.fillStyle = '#ff9a52'; ctx.fillRect(f.x - 3, f.y - 3, 7, 7);
      ctx.fillStyle = '#ffd23f'; ctx.fillRect(f.x - 1, f.y - 1, 3, 3);
    }
    const anim = this.ty < FLOOR ? 'jump' : this.walk > 0 && this.t % 2 === 0 && (this.walk | 0) % 2 === 0 ? 'walk' : 'idle';
    drawTero(ctx, anim, Math.floor(anim === 'walk' ? this.walk / 9 : this.t / 10), this.tx, this.ty + 2, 40, !this.face);
    if (this.saidT > 0) {
      const s = this.said;
      const w = s.length * 4 + 8;
      const bx = this.said === 'DADA!' || this.said === 'THERE!' ? this.tx - 4 : this.bx + SKIP_W / 2 - w / 2;
      const by = this.said === 'DADA!' || this.said === 'THERE!' ? this.ty - 52 : this.by - 14;
      ctx.fillStyle = '#ffffff'; ctx.fillRect(bx, by, w, 10);
      text(ctx, s, bx + 4, by + 3, '#1b1620');
    }
    if (!this.skippable && this.t < 120) text(ctx, 'THIS AD CANNOT BE SKIPPED. (YET.)', W / 2, 12, '#808080', 1, 'center');
    if (this.skippable && !this.tired) text(ctx, 'CATCH THE SKIP BUTTON', W / 2, 12, '#ffd23f', 1, 'center');
  }
}
