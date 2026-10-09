// file: game/interludes/kart.ts
//
// THE OFFICE CHAIR GP (the escape, near the bottom). Dad finds an office
// chair with wheels. Tero sits on his lap and they race down the last
// corridors to the lobby in pseudo-3D, 1980s arcade style: curves, office
// walls rushing past, water coolers, wet-floor signs, interns. LEFT/RIGHT
// steer, DOWN brakes, JUMP hops (over anything), coffee is a boost.
// Crashing only slows you down; nobody gets hurt (the interns are fine).

import { VIEWPORT_W, VIEWPORT_H } from '../constants';
import { Interlude, type InterludeHost } from './Interlude';
import { text, shadowText, noise } from './pixtext';
import { drawTero, preloadTero } from './teroSprite';
import { drawClerk } from '../render/characters/humans';
import { DAD_SRC, smoothDad } from '../render/sprites/dadSprite';

const W = VIEWPORT_W, H = VIEWPORT_H;
const HORIZON = 96;
const CAM = 900;                      // row r (from the horizon) sees z = CAM / r
const ROAD = 230;                     // half the corridor's width on the bottom row
const SEG = 40;                       // world units per curve segment
const LENGTH = 9000;                  // the race
const MAX_SPEED = 3.4;
const ROWS = H - HORIZON;

type ObKind = 'cooler' | 'sign' | 'intern' | 'plant' | 'coffee';
interface Ob { z: number; lane: number; kind: ObKind; hit: boolean }

let dadImg: HTMLImageElement | null = null;
function dad(): HTMLImageElement | null {
  if (typeof Image === 'undefined') return null;
  if (!dadImg) { dadImg = new Image(); dadImg.src = DAD_SRC; }
  return dadImg.complete && dadImg.naturalWidth ? dadImg : null;
}
dad();

/** The corridor bends: a smooth mix of sines, quiet at the start and end. */
function curveAt(z: number): number {
  const s = Math.floor(z / SEG);
  const k = Math.min(1, z / 1500, (LENGTH - z) / 1200);
  return Math.max(0, k) * (Math.sin(s / 23) * 0.8 + Math.sin(s / 9 + 1) * 0.5) * 0.0011;
}

export class OfficeChairGP extends Interlude {
  readonly id = 'kart' as const;
  private pos = 0;
  private speed = 0;
  private px = 0;                     // -1..1 across the corridor
  private hop = 0;
  private spin = 0;
  private boost = 0;
  private obs: Ob[] = [];
  private crashes = 0;
  private line = ''; private lineT = 0;
  private finished = 0;
  private started = 0;
  private intern = drawClerk(1).toCanvas();
  private rowCenter = new Float32Array(ROWS + 1);

  constructor() {
    super();
    preloadTero();
    const kinds: ObKind[] = ['cooler', 'sign', 'intern', 'plant', 'coffee', 'cooler', 'sign', 'intern'];
    for (let z = 700, i = 0; z < LENGTH - 400; z += 150 + noise(i * 3) * 220, i++) {
      this.obs.push({ z, lane: (noise(i * 7 + 1) - 0.5) * 1.6, kind: kinds[i % kinds.length], hit: false });
    }
  }

  private say(s: string): void { this.line = s; this.lineT = 120; }

  update(host: InterludeHost): void {
    this.t++;
    if (this.lineT > 0) this.lineT--;
    const inp = host.input;
    if (this.started < 120) {
      this.started++;
      if (this.started % 40 === 1) host.audio.play(this.started > 80 ? 'ready' : 'click');
      if (this.started === 1) this.say('HOLD ON TIGHT, BUDDY.');
      return;
    }
    if (this.finished > 0) {
      this.finished++;
      this.speed *= 0.95; this.pos += this.speed;
      if (this.finished > 90 && (inp.jumpPressed || inp.firePressed)) this.done = true;
      if (this.finished > 400) this.done = true;
      return;
    }
    if (this.boost > 0) this.boost--;
    if (this.spin > 0) this.spin--;
    if (this.hop > 0) this.hop--;
    const max = MAX_SPEED * (this.boost > 0 ? 1.4 : 1);
    if (this.spin > 0) this.speed *= 0.94;
    else if (inp.down) this.speed = Math.max(0.6, this.speed - 0.08);
    else this.speed = Math.min(max, this.speed + 0.035);
    if (this.spin === 0) {
      if (inp.left) this.px -= 0.028;
      if (inp.right) this.px += 0.028;
    }
    // the corridor's bend pushes you outwards
    this.px -= curveAt(this.pos + 300) * this.speed * 4;
    if (Math.abs(this.px) > 1.05) {
      this.px = Math.sign(this.px) * 1.05;
      this.speed *= 0.97;
      if (this.t % 12 === 0) host.audio.play('block');
    }
    if (inp.jumpPressed && this.hop === 0) { this.hop = 32; host.audio.play('jump'); }
    const before = this.pos;
    this.pos += this.speed;
    if (this.t % 9 === 0 && this.speed > 1) host.audio.play('click');

    for (const o of this.obs) {
      if (o.hit) continue;
      // the chair sits about 6 units in front of the camera
      if (o.z < before + 6 || o.z >= this.pos + 6) continue;
      if (Math.abs(o.lane - this.px) > 0.3) continue;
      if (o.kind === 'coffee') {
        o.hit = true; this.boost = 150;
        host.audio.play('powerup'); this.say('COFFEE! GO GO GO!');
        continue;
      }
      if (this.hop > 6) continue;           // hopped over it
      o.hit = true; this.crashes++;
      this.spin = 40;
      host.audio.play('hurt'); host.shake.trigger(6);
      this.say(o.kind === 'intern' ? 'SORRY, INTERN!' : o.kind === 'sign' ? 'IT WAS WET. IT SAID SO.' : o.kind === 'cooler' ? 'GLUG.' : 'NOT THE FERN!');
    }
    if (this.pos >= LENGTH) {
      this.finished = 1;
      host.audio.play('goal');
      this.say('I HAVEN\'T HAD THIS MUCH FUN SINCE 2019.');
    }
  }

  // ─── Drawing ───────────────────────────────────────────────────────────────

  draw(ctx: CanvasRenderingContext2D): void {
    // ceiling
    ctx.fillStyle = '#c9c4b4'; ctx.fillRect(0, 0, W, HORIZON);
    // the corridor, one screen row at a time (nearest first: that's how the bend adds up)
    let x = 0, dx = 0;
    for (let r = ROWS; r >= 1; r--) {
      const z = CAM / r;
      const half = ROAD * (r / ROWS);
      dx += curveAt(this.pos + z) * 4;
      x += dx;
      this.rowCenter[r] = W / 2 + x - this.px * half;
    }
    // the carpet
    for (let r = ROWS; r >= 1; r--) {
      const y = HORIZON + r - 1, z = CAM / r, half = ROAD * (r / ROWS), cx = this.rowCenter[r];
      const band = Math.floor((this.pos + z) / 30) % 2 === 0;
      const fog = Math.max(0.35, 1 - z / 1000);
      ctx.fillStyle = shade(band ? [90, 98, 114] : [80, 88, 104], fog);
      ctx.fillRect(0, y, W, 1);
      if (band) { ctx.fillStyle = shade([200, 190, 120], fog); ctx.fillRect(cx - half * 0.03, y, Math.max(1, half * 0.06), 1); }
    }
    // the walls, far to near so the near ones cover the far ones
    for (let r = 1; r <= ROWS; r++) {
      const y = HORIZON + r - 1, z = CAM / r, half = ROAD * (r / ROWS), cx = this.rowCenter[r];
      const fog = Math.max(0.35, 1 - z / 1000);
      const wh = 150 * (r / ROWS) + 2;
      const door = Math.floor((this.pos + z) / 60) % 4 === 0;
      const col = shade(door ? [107, 66, 38] : Math.floor((this.pos + z) / 30) % 2 ? [184, 178, 162] : [174, 168, 152], fog);
      ctx.fillStyle = col;
      ctx.fillRect(0, y - wh, Math.max(0, cx - half), wh + 1);
      ctx.fillRect(cx + half, y - wh, W - (cx + half), wh + 1);
      ctx.fillStyle = shade([60, 52, 44], fog);                 // skirting
      ctx.fillRect(0, y - 2 * (r / ROWS) - 1, Math.max(0, cx - half), 1 + 2 * (r / ROWS));
      ctx.fillRect(cx + half, y - 2 * (r / ROWS) - 1, W, 1 + 2 * (r / ROWS));
    }
    // ceiling lights rushing by
    for (let k = 0; k < 8; k++) {
      const z = 120 * k + 120 - (this.pos % 120);
      const r = CAM / z;
      const sy = HORIZON - r * 0.5;
      const w = ROAD * (r / ROWS) * 0.5;
      if (sy < -10 || r < 1) continue;
      ctx.fillStyle = '#fffbe6'; ctx.fillRect(W / 2 - w / 2, sy, w, Math.max(1, w / 10));
    }

    // obstacles, far to near
    const vis = this.obs.filter((o) => !o.hit && o.z - this.pos > CAM / ROWS && o.z - this.pos < CAM).sort((a, b) => b.z - a.z);
    for (const o of vis) {
      const r = Math.max(1, Math.min(ROWS, Math.round(CAM / (o.z - this.pos))));
      const scale = r / ROWS;
      const cx = this.rowCenter[r] + o.lane * ROAD * scale;
      this.drawOb(ctx, o.kind, cx, HORIZON + r - 1, scale * 3);
    }

    // us: the chair, Dad, Tero on his lap
    const bob = this.hop > 0 ? -Math.sin((this.hop / 32) * Math.PI) * 22 : Math.sin(this.t / 3) * (this.speed > 0.5 ? 1 : 0);
    const tilt = this.spin > 0 ? Math.sin(this.spin / 2) * 0.6 : 0;
    ctx.save();
    ctx.translate(W / 2, H - 12 + bob);
    ctx.rotate(tilt);
    ctx.fillStyle = '#1b1620';
    ctx.fillRect(-24, 2, 48, 4); ctx.fillRect(-3, -10, 6, 14);
    for (const wx of [-24, -10, 10, 22]) ctx.fillRect(wx, 5, 4, 4);
    ctx.fillStyle = '#2a2d33'; ctx.fillRect(-22, -22, 44, 12); ctx.fillRect(-20, -58, 40, 38);
    const d = dad();
    if (d) { smoothDad(ctx, d, 60); ctx.drawImage(d, -30, -78, 60, 60); }
    ctx.restore();
    drawTero(ctx, this.finished ? 'win' : 'idle', Math.floor(this.t / 8), W / 2 + 4, H - 26 + bob, 34);

    // HUD
    text(ctx, 'OFFICE CHAIR GP', 8, 6, '#1b1620', 2);
    const prog = Math.min(1, this.pos / LENGTH);
    ctx.fillStyle = '#1b1620'; ctx.fillRect(W - 168, 8, 160, 8);
    ctx.fillStyle = '#6cc24a'; ctx.fillRect(W - 167, 9, 158 * prog, 6);
    text(ctx, 'FLOOR 9', W - 168, 20, '#1b1620');
    text(ctx, 'LOBBY', W - 8, 20, '#1b1620', 1, 'right');
    text(ctx, `${Math.round(this.speed * 31)} KM/H`, 8, 24, this.boost > 0 ? '#d83b3b' : '#1b1620');
    if (this.lineT > 0) {
      ctx.fillStyle = '#ffffff'; ctx.fillRect(W / 2 + 34, H - 96, this.line.length * 4 + 8, 11);
      text(ctx, this.line, W / 2 + 38, H - 93, '#1b1620');
    }
    if (this.started < 120) shadowText(ctx, this.started < 40 ? '3' : this.started < 80 ? '2' : '1', W / 2, 60, '#ffd23f', 5, 'center');
    else if (this.started === 120 && this.t < 200) shadowText(ctx, 'GO!', W / 2, 60, '#6cc24a', 5, 'center');
    if (this.finished > 0) {
      ctx.fillStyle = 'rgba(20,16,28,0.8)'; ctx.fillRect(W / 2 - 120, 40, 240, 70);
      shadowText(ctx, 'LOBBY!', W / 2, 48, '#ffd23f', 3, 'center');
      text(ctx, `CRASHES: ${this.crashes}   INTERNS: FINE`, W / 2, 76, '#ffffff', 1, 'center');
      if (this.finished > 90 && this.t % 50 < 34) text(ctx, 'PRESS JUMP', W / 2, 94, '#c9ccd1', 1, 'center');
    }
    if (this.started >= 120 && this.pos < 1200) text(ctx, 'STEER: LEFT/RIGHT  HOP: JUMP  BRAKE: DOWN', W / 2, 40, '#1b1620', 1, 'center');
  }

  private drawOb(ctx: CanvasRenderingContext2D, kind: ObKind, cx: number, y: number, s: number): void {
    const u = Math.max(1, s * 22);       // one "unit" of sprite height
    ctx.save();
    ctx.translate(cx, y);
    switch (kind) {
      case 'cooler':
        ctx.fillStyle = '#e8e4d8'; ctx.fillRect(-u * 0.4, -u * 1.4, u * 0.8, u * 1.4);
        ctx.fillStyle = '#8fd3ff'; ctx.fillRect(-u * 0.35, -u * 2.1, u * 0.7, u * 0.7);
        break;
      case 'sign':
        ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.moveTo(-u * 0.5, 0); ctx.lineTo(0, -u * 1.3); ctx.lineTo(u * 0.5, 0); ctx.fill();
        ctx.fillStyle = '#1b1620'; ctx.fillRect(-u * 0.05, -u * 0.9, u * 0.1, u * 0.4);
        break;
      case 'intern':
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(this.intern, -u, -u * 2, u * 2, u * 2);
        break;
      case 'plant':
        ctx.fillStyle = '#b5651d'; ctx.fillRect(-u * 0.4, -u * 0.7, u * 0.8, u * 0.7);
        ctx.fillStyle = '#3e8a3c'; ctx.beginPath(); ctx.arc(0, -u * 1.2, u * 0.6, 0, Math.PI * 2); ctx.fill();
        break;
      case 'coffee':
        ctx.fillStyle = '#ffffff'; ctx.fillRect(-u * 0.3, -u * 0.8, u * 0.6, u * 0.8);
        ctx.fillStyle = '#6b4226'; ctx.fillRect(-u * 0.25, -u * 0.75, u * 0.5, u * 0.2);
        ctx.fillStyle = '#ffd23f'; ctx.fillRect(-u * 0.05, -u * 1.3, u * 0.1, u * 0.3);
        break;
    }
    ctx.restore();
  }
}

function shade(c: number[], k: number): string {
  return `rgb(${(c[0] * k) | 0},${(c[1] * k) | 0},${(c[2] * k) | 0})`;
}
