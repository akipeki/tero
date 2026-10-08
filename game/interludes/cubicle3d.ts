// file: game/interludes/cubicle3d.ts
//
// CUBICLE 3D (Floor 27). Security "switches the camera to first person" and
// the game drops into a 1992-style raycaster: a cubicle maze with
// motivational posters, ceiling tiles and grey carpet. Find the KEYCARD,
// get to the EXIT. Guards chase you; a puff of fire sends them home.
//
// Controls: LEFT/RIGHT turn · JUMP (W / up) walk forward · DOWN back off ·
// FIRE breathe fire · DADA shout. Getting caught just puts you back at the
// start (no lives lost: it's a dream about a shooter, not a shooter).

import { VIEWPORT_W, VIEWPORT_H } from '../constants';
import { Interlude, type InterludeHost } from './Interlude';
import { text, shadowText, noise } from './pixtext';
import { drawTero, preloadTero } from './teroSprite';
import { Raster } from '../render/pixel/Raster';
import { drawText } from '../render/pixel/font';
import { drawGuard } from '../render/characters/creatures';
import { Action } from '../types';

const W = VIEWPORT_W, H = VIEWPORT_H;
/** The 3D view renders at half resolution (chunky pixels), above the status bar. */
const VW = 240, VH = 120, BAR = H - VH * 2;
const TEX = 32;
const DENIED = 'ACCESS DENIED. KEYCARD REQUIRED.';

//   # office wall · C cubicle partition · P poster · W window · E exit door
//   S start · K keycard · G guard · p plant · w water cooler
const MAP = [
  '################',
  '#S.....C.......#',
  '#.CCC..C..CPC..#',
  '#.C.......C.G..#',
  '#.P..G....C....#',
  '#.CCCC..CCC..C.#',
  '#......p.....C.#',
  'W###.CCPC.CCCC.#',
  'E....C....C..K.#',
  '#.G..C.w..C....#',
  '#....C.......G.#',
  '################',
];

type Tex = Uint32Array;

/** Carpet speckle, 16×16 per tile (precomputed: this runs per pixel). */
const CARPET = Array.from({ length: 256 }, (_, i) => noise(i * 7.31) * 14);

function rgba(r: number, g: number, b: number): number {
  return (255 << 24) | (b << 16) | (g << 8) | r;
}
function hex(c: string): number {
  const n = parseInt(c.slice(1, 7), 16);
  return rgba((n >> 16) & 255, (n >> 8) & 255, n & 255);
}
function fromRaster(r: Raster, size = TEX): Tex {
  const out = new Uint32Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const sx = Math.floor((x * r.w) / size), sy = Math.floor((y * r.h) / size);
    const i = (sy * r.w + sx) * 4;
    out[y * size + x] = r.data[i + 3] ? rgba(r.data[i], r.data[i + 1], r.data[i + 2]) : 0;
  }
  return out;
}

function makeTextures(): Record<string, Tex> {
  const wall = new Raster(TEX, TEX);
  wall.rect(0, 0, TEX, TEX, '#b8b2a2');
  for (let i = 0; i < 40; i++) wall.px(noise(i) * TEX, noise(i + 99) * TEX, '#aaa494');
  wall.rect(0, 27, TEX, 5, '#6b6458');
  wall.rect(22, 20, 4, 5, '#e8e4d8'); wall.px(23, 22, '#3a3530'); wall.px(24, 22, '#3a3530');

  const cub = new Raster(TEX, TEX);
  cub.rect(0, 0, TEX, TEX, '#6f7f96');
  for (let i = 0; i < 90; i++) cub.px(noise(i * 3) * TEX, noise(i * 7 + 5) * TEX, noise(i) < 0.5 ? '#63728a' : '#7b8ba2');
  cub.rect(0, 0, TEX, 2, '#c9ced6');
  cub.rect(0, 0, 1, TEX, '#4f5d72'); cub.rect(TEX - 1, 0, 1, TEX, '#4f5d72');
  cub.rect(9, 9, 6, 7, '#ffe066'); cub.rect(17, 12, 6, 6, '#ff9ec7');   // sticky notes

  const poster = new Raster(TEX, TEX);
  poster.rect(0, 0, TEX, TEX, '#b8b2a2');
  poster.rect(0, 27, TEX, 5, '#6b6458');
  poster.rect(4, 3, 24, 22, '#1b1620');
  poster.rect(5, 4, 22, 14, '#e8452c');
  poster.ellipse(16, 11, 5, 5, '#ffd23f');
  drawText(poster, 'GROW', 8, 19, '#ffffff');

  const win = new Raster(TEX, TEX);
  win.rect(0, 0, TEX, TEX, '#b8b2a2');
  win.rect(3, 3, 26, 22, '#5a6b8c');
  win.rect(4, 4, 24, 20, '#8fd3ff');
  for (let i = 0; i < 5; i++) win.rect(5 + i * 5, 14 - (i % 3) * 3, 4, 10 + (i % 3) * 3, '#4a5a78');
  win.rect(15, 4, 2, 20, '#5a6b8c');
  win.rect(0, 27, TEX, 5, '#6b6458');

  const exit = new Raster(TEX, TEX);
  exit.rect(0, 0, TEX, TEX, '#b8b2a2');
  exit.rect(6, 6, 20, 26, '#2f6e33');
  exit.rect(7, 7, 18, 25, '#3e8a3c');
  exit.rect(21, 18, 2, 3, '#ffd23f');
  exit.rect(8, 0, 16, 6, '#1b1620');
  drawText(exit, 'EXIT', 9, 0, '#6cff6c');

  return { '#': fromRaster(wall), C: fromRaster(cub), P: fromRaster(poster), W: fromRaster(win), E: fromRaster(exit) };
}

function makeSprite(r: Raster): { px: Tex; w: number; h: number } {
  const px = new Uint32Array(r.w * r.h);
  for (let i = 0; i < r.w * r.h; i++) px[i] = r.data[i * 4 + 3] ? rgba(r.data[i * 4], r.data[i * 4 + 1], r.data[i * 4 + 2]) : 0;
  return { px, w: r.w, h: r.h };
}

function keycard(): Raster {
  const r = new Raster(16, 16);
  r.rect(2, 4, 12, 9, '#1b1620');
  r.rect(3, 5, 10, 7, '#ffd23f');
  r.rect(4, 6, 3, 4, '#fcd4ac');
  r.rect(8, 7, 4, 1, '#1b1620'); r.rect(8, 9, 3, 1, '#1b1620');
  r.rect(6, 1, 4, 4, '#d83b3b');
  return r;
}
function plant(): Raster {
  const r = new Raster(16, 24);
  r.rect(4, 16, 8, 8, '#b5651d'); r.rect(4, 16, 8, 2, '#8a4a14');
  r.ellipse(8, 10, 6, 7, '#3e8a3c'); r.ellipse(6, 8, 3, 4, '#6cc24a'); r.ellipse(11, 11, 3, 3, '#6cc24a');
  return r;
}
function cooler(): Raster {
  const r = new Raster(16, 28);
  r.rect(3, 12, 10, 16, '#e8e4d8'); r.rect(3, 26, 10, 2, '#9aa0a8');
  r.ellipse(8, 7, 5, 6, '#8fd3ff'); r.rect(6, 15, 4, 2, '#3f62d8');
  return r;
}

interface Thing { x: number; y: number; kind: 'guard' | 'key' | 'plant' | 'cooler'; sx: number; sy: number; freed: number; alive: boolean; dir: number }
interface Shot { x: number; y: number; dx: number; dy: number; life: number }

export class Cubicle3D extends Interlude {
  readonly id = 'cubicle3d' as const;
  private page: 'title' | 'play' | 'done' = 'title';
  private pageT = 0;
  private px = 1.5; private py = 1.5; private ang = 0.4;
  private startX = 1.5; private startY = 1.5;
  private things: Thing[] = [];
  private shots: Shot[] = [];
  private hasKey = false;
  private freed = 0;
  private caught = 0;
  private flash = 0;
  private bob = 0;
  private msg = ''; private msgT = 0;
  private fireT = 0;
  private playTicks = 0;

  private tex = makeTextures();
  private sprites = {
    guard: makeSprite(drawGuard(0)), guard2: makeSprite(drawGuard(2)),
    key: makeSprite(keycard()), plant: makeSprite(plant()), cooler: makeSprite(cooler()),
  };
  private img: ImageData | null = null;
  private buf: Uint32Array | null = null;
  private off: HTMLCanvasElement | null = null;
  private zbuf = new Float32Array(VW);

  constructor() {
    super();
    preloadTero();
    MAP.forEach((row, y) => [...row].forEach((c, x) => {
      if (c === 'S') { this.px = this.startX = x + 0.5; this.py = this.startY = y + 0.5; }
      const kind = c === 'G' ? 'guard' : c === 'K' ? 'key' : c === 'p' ? 'plant' : c === 'w' ? 'cooler' : null;
      if (kind) this.things.push({ x: x + 0.5, y: y + 0.5, kind, sx: x + 0.5, sy: y + 0.5, freed: 0, alive: true, dir: noise(x * 7 + y) * 6.28 });
    }));
  }

  private cell(x: number, y: number): string {
    const row = MAP[Math.floor(y)];
    if (!row) return '#';
    const c = row[Math.floor(x)] ?? '#';
    return c === '.' || c === 'S' || c === 'K' || c === 'G' || c === 'p' || c === 'w' ? '.' : c;
  }
  private solid(x: number, y: number): boolean { return this.cell(x, y) !== '.'; }

  private say(s: string, ticks = 90): void { this.msg = s; this.msgT = ticks; }

  update(host: InterludeHost): void {
    this.t++; this.pageT++;
    const inp = host.input;
    if (this.msgT > 0) this.msgT--;
    if (this.flash > 0) this.flash--;
    if (this.fireT > 0) this.fireT--;

    if (this.page === 'title') {
      if (this.pageT === 1) host.audio.play('alarm');
      if (this.pageT > 30 && (inp.jumpPressed || inp.firePressed)) { this.page = 'play'; this.pageT = 0; host.audio.play('ready'); this.say('FIND THE KEYCARD. GET OUT.', 150); }
      return;
    }
    if (this.page === 'done') {
      if (this.pageT > 40 && (inp.jumpPressed || inp.firePressed)) this.done = true;
      return;
    }

    this.playTicks++;
    // turning and walking
    const turn = 0.045;
    if (inp.left) this.ang -= turn;
    if (inp.right) this.ang += turn;
    const fwd = inp.held(Action.JUMP) ? 0.045 : inp.down ? -0.03 : 0;
    if (fwd) {
      this.bob += 0.25;
      const nx = this.px + Math.cos(this.ang) * fwd, ny = this.py + Math.sin(this.ang) * fwd;
      const m = 0.22 * Math.sign(fwd);
      if (!this.solid(nx + Math.cos(this.ang) * m, this.py)) this.px = nx;
      if (!this.solid(this.px, ny + Math.sin(this.ang) * m)) this.py = ny;
      if (this.t % 18 === 0) host.audio.play('click');
    }
    // bumping into the exit
    const ahead = this.cell(this.px + Math.cos(this.ang) * 0.6, this.py + Math.sin(this.ang) * 0.6);
    if (ahead === 'E' && fwd > 0) {
      if (this.hasKey) { this.page = 'done'; this.pageT = 0; host.audio.play('goal'); return; }
      if (this.msg !== DENIED || this.msgT < 30) { this.say(DENIED); host.audio.play('error'); }
    }

    if (inp.firePressed && this.fireT === 0) {
      this.fireT = 16;
      this.shots.push({ x: this.px, y: this.py, dx: Math.cos(this.ang) * 0.16, dy: Math.sin(this.ang) * 0.16, life: 40 });
      host.audio.play('puff');
    }
    if (inp.callPressed) { host.audio.play('dada'); this.say('DADA!', 50); }

    for (const s of this.shots) {
      s.x += s.dx; s.y += s.dy; s.life--;
      if (this.solid(s.x, s.y)) s.life = 0;
      for (const g of this.things) {
        if (g.kind !== 'guard' || !g.alive || g.freed) continue;
        if (Math.hypot(g.x - s.x, g.y - s.y) < 0.45) {
          g.freed = 1; s.life = 0; this.freed++;
          host.audio.play('free');
          this.say(['GUARD SENT HOME.', 'HE QUIT. GOOD FOR HIM.', 'ONE LESS SHIFT.'][this.freed % 3], 70);
        }
      }
    }
    this.shots = this.shots.filter((s) => s.life > 0);

    for (const g of this.things) {
      if (!g.alive) continue;
      if (g.kind === 'key' && Math.hypot(g.x - this.px, g.y - this.py) < 0.5) {
        g.alive = false; this.hasKey = true;
        host.audio.play('powerup');
        this.say('GOT THE KEYCARD. NOW: THE EXIT.', 120);
      }
      if (g.kind !== 'guard') continue;
      if (g.freed) { if (++g.freed > 90) g.alive = false; continue; }
      const dx = this.px - g.x, dy = this.py - g.y, d = Math.hypot(dx, dy);
      let mx: number, my: number;
      if (d < 5 && this.los(g.x, g.y, this.px, this.py)) {
        mx = (dx / d) * 0.022; my = (dy / d) * 0.022;
      } else {
        if (this.t % 90 === 0) g.dir += (noise(this.t + g.sx * 13) - 0.5) * 3;
        mx = Math.cos(g.dir) * 0.012; my = Math.sin(g.dir) * 0.012;
      }
      if (!this.solid(g.x + mx * 8, g.y)) g.x += mx; else g.dir += 1.7;
      if (!this.solid(g.x, g.y + my * 8)) g.y += my; else g.dir += 1.7;
      if (d < 0.45) {
        this.caught++;
        this.flash = 30;
        host.audio.play('alarm');
        host.shake.trigger(5);
        this.say(['HALT! WHO AUTHORISED YOU?', 'BADGE! NOW!', 'BACK TO ONBOARDING.'][this.caught % 3], 110);
        this.px = this.startX; this.py = this.startY; this.ang = 0.4;
        for (const o of this.things) if (o.kind === 'guard' && !o.freed) { o.x = o.sx; o.y = o.sy; }
      }
    }
  }

  /** Line of sight between two points (no walls in between). */
  private los(x0: number, y0: number, x1: number, y1: number): boolean {
    const d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d / 0.2);
    for (let i = 1; i < n; i++) if (this.solid(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n)) return false;
    return true;
  }

  // ─── Drawing ───────────────────────────────────────────────────────────────

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.page === 'title') return this.drawTitle(ctx);
    if (this.page === 'done') return this.drawDone(ctx);
    this.render3d(ctx);
    this.drawHand(ctx);
    this.drawBar(ctx);
    if (this.msgT > 0) shadowText(ctx, this.msg, W / 2, 18, this.flash > 0 ? '#ff6f86' : '#ffffff', 1, 'center');
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255,40,40,${this.flash / 60})`;
      ctx.fillRect(0, 0, W, VH * 2);
    }
  }

  private drawTitle(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 2) { ctx.fillStyle = 'rgba(80,0,0,0.25)'; ctx.fillRect(0, y, W, 1); }
    shadowText(ctx, 'SECURITY HAS SWITCHED THE CAMERA', W / 2, 30, '#c0c0c0', 1, 'center');
    shadowText(ctx, 'TO FIRST PERSON.', W / 2, 40, '#c0c0c0', 1, 'center');
    shadowText(ctx, 'CUBICLE', W / 2, 72, '#d83b3b', 6, 'center', '#3a0000');
    shadowText(ctx, '3D', W / 2, 112, '#ffd23f', 6, 'center', '#5a3a00');
    text(ctx, 'EPISODE 1: THE OPEN-PLAN NIGHTMARE', W / 2, 162, '#ffffff', 1, 'center');
    text(ctx, 'SHAREWARE VERSION. PLEASE REGISTER: $9.99 TO HALVORSEN CAPITAL.', W / 2, 176, '#808080', 1, 'center');
    text(ctx, 'TURN: LEFT/RIGHT   WALK: JUMP / UP   FIRE: FIRE   SHOUT: DADA', W / 2, 206, '#c0c0c0', 1, 'center');
    if (this.pageT > 30 && this.pageT % 50 < 34) shadowText(ctx, 'PRESS JUMP TO START', W / 2, 232, '#ffffff', 2, 'center');
  }

  private drawDone(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    shadowText(ctx, 'FLOOR COMPLETE', W / 2, 50, '#ffd23f', 3, 'center');
    const secs = Math.round(this.playTicks / 60);
    const rows: [string, string][] = [
      ['GUARDS SENT HOME', `${this.freed}`],
      ['TIMES CAUGHT', `${this.caught}`],
      ['TIME', `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`],
      ['PAR', '0:45'],
      ['EXECUTIVE PAR', 'NEVER CAME IN'],
    ];
    rows.forEach(([k, v], i) => {
      text(ctx, k, W / 2 - 110, 100 + i * 16, '#c0c0c0', 1);
      text(ctx, v, W / 2 + 110, 100 + i * 16, '#ffffff', 1, 'right');
    });
    drawTero(ctx, 'win', Math.floor(this.pageT / 8), W / 2, 250, 44);
    if (this.pageT > 40 && this.pageT % 50 < 34) text(ctx, 'PRESS JUMP: BACK TO 2D, WHERE THINGS MAKE SENSE', W / 2, 200, '#ffffff', 1, 'center');
  }

  private ensureBuffer(): void {
    if (this.buf || typeof document === 'undefined') return;
    this.off = document.createElement('canvas');
    this.off.width = VW; this.off.height = VH;
    this.img = this.off.getContext('2d')!.createImageData(VW, VH);
    this.buf = new Uint32Array(this.img.data.buffer);
  }

  private render3d(ctx: CanvasRenderingContext2D): void {
    this.ensureBuffer();
    const buf = this.buf!, img = this.img!, off = this.off!;
    const dirX = Math.cos(this.ang), dirY = Math.sin(this.ang);
    const plane = 0.66, planeX = -dirY * plane, planeY = dirX * plane;
    const half = VH / 2;
    const bobY = Math.round(Math.sin(this.bob) * 1.5);

    // ceiling tiles and carpet (floor casting)
    for (let y = 0; y < VH; y++) {
      const floor = y > half + bobY;
      const p = floor ? y - half - bobY : half + bobY - y;
      if (p <= 0) { for (let x = 0; x < VW; x++) buf[y * VW + x] = rgba(30, 28, 34); continue; }
      const rowDist = half / p;
      const rx0 = dirX - planeX, ry0 = dirY - planeY;
      const stepX = (rowDist * 2 * planeX) / VW, stepY = (rowDist * 2 * planeY) / VW;
      let fx = this.px + rowDist * rx0, fy = this.py + rowDist * ry0;
      const fog = Math.max(0.25, 1 - rowDist / 9);
      for (let x = 0; x < VW; x++) {
        const cx = fx - Math.floor(fx), cy = fy - Math.floor(fy);
        let r: number, g: number, b: number;
        if (floor) {
          const n = CARPET[((fx * 16) & 15) * 16 + ((fy * 16) & 15)];
          r = 74 + n; g = 80 + n; b = 92 + n;
        } else {
          const edge = cx < 0.05 || cy < 0.05;
          const light = (Math.floor(fx) + Math.floor(fy)) % 3 === 0 && cx > 0.2 && cx < 0.8 && cy > 0.3 && cy < 0.7;
          [r, g, b] = light ? [250, 250, 236] : edge ? [150, 146, 136] : [206, 202, 190];
        }
        buf[y * VW + x] = rgba(r * fog | 0, g * fog | 0, b * fog | 0);
        fx += stepX; fy += stepY;
      }
    }

    // walls
    for (let x = 0; x < VW; x++) {
      const camX = (2 * x) / VW - 1;
      const rdx = dirX + planeX * camX, rdy = dirY + planeY * camX;
      let mx = Math.floor(this.px), my = Math.floor(this.py);
      const ddx = Math.abs(1 / rdx), ddy = Math.abs(1 / rdy);
      let sx: number, sy: number, sdx: number, sdy: number;
      if (rdx < 0) { sx = -1; sdx = (this.px - mx) * ddx; } else { sx = 1; sdx = (mx + 1 - this.px) * ddx; }
      if (rdy < 0) { sy = -1; sdy = (this.py - my) * ddy; } else { sy = 1; sdy = (my + 1 - this.py) * ddy; }
      let side = 0, c = '.';
      for (let i = 0; i < 64; i++) {
        if (sdx < sdy) { sdx += ddx; mx += sx; side = 0; } else { sdy += ddy; my += sy; side = 1; }
        c = this.cell(mx + 0.5, my + 0.5);
        if (c !== '.') break;
      }
      const dist = side === 0 ? sdx - ddx : sdy - ddy;
      this.zbuf[x] = dist;
      const lineH = Math.floor(VH / Math.max(0.0001, dist));
      const top = Math.floor(-lineH / 2 + half + bobY);
      let wallX = side === 0 ? this.py + dist * rdy : this.px + dist * rdx;
      wallX -= Math.floor(wallX);
      let tx = Math.floor(wallX * TEX);
      if ((side === 0 && rdx > 0) || (side === 1 && rdy < 0)) tx = TEX - tx - 1;
      const tex = this.tex[c] ?? this.tex['#'];
      const shade = (side ? 0.78 : 1) * Math.max(0.3, 1 - dist / 10);
      const y0 = Math.max(0, top), y1 = Math.min(VH, top + lineH);
      for (let y = y0; y < y1; y++) {
        const ty = Math.min(TEX - 1, Math.floor(((y - top) * TEX) / lineH));
        const col = tex[ty * TEX + tx];
        buf[y * VW + x] = rgba((col & 255) * shade | 0, ((col >> 8) & 255) * shade | 0, ((col >> 16) & 255) * shade | 0);
      }
    }

    // sprites: guards, the keycard, the plant, the cooler, fire
    const list: { x: number; y: number; spr: { px: Tex; w: number; h: number } | null; scale: number; fire?: boolean; fade?: number }[] = [];
    for (const g of this.things) {
      if (!g.alive) continue;
      const spr = g.kind === 'guard' ? (Math.floor(this.t / 12) % 2 ? this.sprites.guard : this.sprites.guard2)
        : g.kind === 'key' ? this.sprites.key : g.kind === 'plant' ? this.sprites.plant : this.sprites.cooler;
      list.push({ x: g.x, y: g.y, spr, scale: g.kind === 'key' ? 0.4 : g.kind === 'guard' ? 1 : 0.6, fade: g.freed ? 1 - g.freed / 90 : 1 });
    }
    for (const s of this.shots) list.push({ x: s.x, y: s.y, spr: null, scale: 0.3, fire: true });
    list.sort((a, b) => Math.hypot(b.x - this.px, b.y - this.py) - Math.hypot(a.x - this.px, a.y - this.py));
    const inv = 1 / (planeX * dirY - dirX * planeY);
    for (const s of list) {
      const rx = s.x - this.px, ry = s.y - this.py;
      const tX = inv * (dirY * rx - dirX * ry), tY = inv * (-planeY * rx + planeX * ry);
      if (tY <= 0.1) continue;
      const scrX = Math.floor((VW / 2) * (1 + tX / tY));
      const size = Math.abs(Math.floor(VH / tY)) * s.scale;
      const floorY = half + bobY + Math.floor(VH / tY / 2);
      const sh = size, sw = s.spr ? size * (s.spr.w / s.spr.h) : size;
      const top = s.fire ? half + bobY - sh / 2 : floorY - sh;
      const x0 = Math.max(0, Math.floor(scrX - sw / 2)), x1 = Math.min(VW, Math.floor(scrX + sw / 2));
      const fog = Math.max(0.3, 1 - tY / 10);
      for (let x = x0; x < x1; x++) {
        if (tY >= this.zbuf[x]) continue;
        const u = (x - (scrX - sw / 2)) / sw;
        for (let y = Math.max(0, Math.floor(top)); y < Math.min(VH, Math.floor(top + sh)); y++) {
          const v = (y - top) / sh;
          let col: number;
          if (s.spr) {
            col = s.spr.px[Math.min(s.spr.h - 1, Math.floor(v * s.spr.h)) * s.spr.w + Math.min(s.spr.w - 1, Math.floor(u * s.spr.w))];
            if (!col) continue;
            if ((s.fade ?? 1) < 1 && noise(x * 13 + y * 7 + this.t) > (s.fade ?? 1)) continue;
          } else {
            const d = Math.hypot(u - 0.5, v - 0.5);
            if (d > 0.5) continue;
            col = d < 0.25 ? hex('#fff6b0') : d < 0.38 ? hex('#ffb347') : hex('#e8452c');
          }
          const f = s.fire ? 1 : fog;
          buf[y * VW + x] = rgba((col & 255) * f | 0, ((col >> 8) & 255) * f | 0, ((col >> 16) & 255) * f | 0);
        }
      }
    }

    off.getContext('2d')!.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, 0, 0, VW * 2, VH * 2);
  }

  /** Tero's costume sleeve, his hand and a pacifier, bobbing as he walks. */
  private drawHand(ctx: CanvasRenderingContext2D): void {
    const bx = Math.round(W / 2 + 40 + Math.sin(this.bob / 2) * 6);
    const by = Math.round(VH * 2 - 46 + Math.abs(Math.cos(this.bob / 2)) * 4 + (this.fireT > 8 ? -6 : 0));
    ctx.fillStyle = '#1e2a2b'; ctx.fillRect(bx - 2, by + 14, 44, 40);
    ctx.fillStyle = '#84cc64'; ctx.fillRect(bx, by + 16, 40, 40);
    ctx.fillStyle = '#5fa046'; ctx.fillRect(bx, by + 16, 8, 40);
    ctx.fillStyle = '#f88004'; ctx.fillRect(bx + 30, by + 22, 6, 6);
    ctx.fillStyle = '#1e2a2b'; ctx.fillRect(bx + 4, by - 2, 32, 22);
    ctx.fillStyle = '#fcd4ac'; ctx.fillRect(bx + 6, by, 28, 18);
    ctx.fillStyle = '#e8b48c'; ctx.fillRect(bx + 6, by + 12, 28, 6);
    // the pacifier
    ctx.fillStyle = '#1e2a2b'; ctx.fillRect(bx + 8, by - 16, 22, 16);
    ctx.fillStyle = '#8fd3ff'; ctx.fillRect(bx + 10, by - 14, 18, 12);
    ctx.fillStyle = '#ff8ea0'; ctx.fillRect(bx + 15, by - 22, 8, 8);
    ctx.fillStyle = '#1e2a2b'; ctx.fillRect(bx + 17, by - 20, 4, 4);
    if (this.fireT > 8) {
      ctx.fillStyle = '#ffb347'; ctx.fillRect(W / 2 - 14, VH - 14, 28, 28);
      ctx.fillStyle = '#fff6b0'; ctx.fillRect(W / 2 - 7, VH - 7, 14, 14);
    }
  }

  private drawBar(ctx: CanvasRenderingContext2D): void {
    const y = VH * 2;
    ctx.fillStyle = '#5a5f68'; ctx.fillRect(0, y, W, BAR);
    ctx.fillStyle = '#80868f'; ctx.fillRect(0, y, W, 2);
    const cells: [string, string][] = [
      ['NAPS', '0'],
      ['KEYCARD', this.hasKey ? 'YES' : 'NO'],
      ['', ''],
      ['SENT HOME', `${this.freed}`],
      ['TANTRUM', 'FULL'],
    ];
    const cw = W / cells.length;
    cells.forEach(([k, v], i) => {
      const x = i * cw;
      ctx.fillStyle = '#3a3e45'; ctx.fillRect(x + 2, y + 4, cw - 4, BAR - 6);
      if (!k) return;
      text(ctx, v, x + cw / 2, y + 8, v === 'NO' ? '#ff6f86' : '#ffd23f', 2, 'center');
      text(ctx, k, x + cw / 2, y + 22, '#c0c0c0', 1, 'center');
    });
    // Tero's face in the middle, Doom-style
    ctx.save();
    ctx.beginPath(); ctx.rect(2 * cw + 2, y + 4, cw - 4, BAR - 6); ctx.clip();
    drawTero(ctx, this.flash > 0 ? 'hurt' : 'idle', Math.floor(this.t / 10), 2 * cw + cw / 2, y + 52, 56, Math.floor(this.t / 120) % 2 === 1);
    ctx.restore();
    if (this.msgT === 0 && !this.hasKey) text(ctx, 'FIND THE KEYCARD', W - 6, 6, '#ffd23f', 1, 'right');
  }
}
