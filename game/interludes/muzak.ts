// file: game/interludes/muzak.ts
//
// ELEVATOR MUZAK (between Floor 12 and 13). The elevator gets stuck with a
// coworker in it. First, small talk: a dialogue tree with three questions
// nobody wants to answer. Then the muzak starts (the theme, lounge style) and
// it becomes a rhythm game: notes fall onto the elevator's buttons
// (LEFT · DOWN · RIGHT · UP/JUMP) in time with the melody. Every hit nudges
// the elevator up. You can't fail; you can only be rated.

import { VIEWPORT_W, VIEWPORT_H } from '../constants';
import { Interlude, type InterludeHost } from './Interlude';
import { text, shadowText, noise } from './pixtext';
import { drawTero, preloadTero } from './teroSprite';
import { drawClerk } from '../render/characters/humans';
import { SONGS, BPM, midi, ARRANGEMENTS } from '../music';
import { Action } from '../types';

const W = VIEWPORT_W, H = VIEWPORT_H;

const LANES = [Action.LEFT, Action.DOWN, Action.RIGHT, Action.JUMP] as const;
const LANE_COL = ['#ff6f86', '#8fd3ff', '#ffd23f', '#6cc24a'];
/** Where the falling notes meet the buttons. */
const HIT_Y = 222;
const LANE_X0 = 300, LANE_W = 36;

interface Note { step: number; lane: number; result: '' | 'perfect' | 'good' | 'miss' }

/** The chart: one note per melody onset (fast neighbours thinned out).
 *  Lanes follow the melody: its lowest quarter of notes on the left, the
 *  highest on the right, like a piano. */
function chart(): Note[] {
  const raw: { step: number; m: number }[] = [];
  let last = -9;
  SONGS.main.melody.forEach((bar, b) => bar.forEach((tok, i) => {
    if (tok === '-' || tok === '.') return;
    const step = b * 8 + i;
    if (step < 8 || step - last < 2) return;   // bar 1 is the count-in
    last = step;
    raw.push({ step, m: midi(tok.startsWith('da:') ? tok.slice(3) : tok) });
  }));
  const sorted = raw.map((r) => r.m).sort((a, b) => a - b);
  const q = (k: number) => sorted[Math.floor((sorted.length * k) / 4)];
  const cuts = [q(1), q(2), q(3)];
  return raw.map(({ step, m }) => ({ step, lane: cuts.filter((c) => m >= c).length, result: '' as const }));
}

interface Talk { q: string; options: [string, string][] }
const TALK: Talk[] = [
  { q: 'BUSY WEEK?', options: [['DADA.', 'HAHA. TELL ME ABOUT IT.'], ['I\'M TWO.', 'SAME. I MEAN, I\'M FORTY.\nBUT SAME.'], ['(STARE)', '...YEAH. ME TOO.']] },
  { q: 'CRAZY WEATHER, HUH?', options: [['(POINT AT CEILING)', 'THE CEILING. YES.\nCRAZY.'], ['WHERE DADA?', 'FLOOR 33, KID.\nEVERYBODY KNOWS.'], ['(BITE)', 'OW. FAIR.']] },
  { q: 'ONLY FOUR MORE DAYS\nTILL FRIDAY.', options: [['IT\'S FRIDAY.', '...OH NO. IT\'S BEEN\nFRIDAY FOR A YEAR.'], ['WHAT\'S FRIDAY?', 'A MYTH.\nLIKE WEEKENDS.'], ['(SIGH)', '(HE SIGHS BACK.\nA CONNECTION.)']] },
];

type Phase = 'stuck' | 'talk' | 'reply' | 'song' | 'result';

export class ElevatorMuzak extends Interlude {
  readonly id = 'muzak' as const;
  private phase: Phase = 'stuck';
  private phaseT = 0;
  private q = 0;
  private cursor = 0;
  private reply = '';
  private notes = chart();
  private clockStep = 0;
  private songLen = SONGS.main.melody.length * 8;
  private flashLane = [0, 0, 0, 0];
  private judge = ''; private judgeT = 0;
  private combo = 0; private best = 0;
  private hits = 0;
  private shake = 0;
  private coworker = drawClerk(0).toCanvas();
  private coworker2 = drawClerk(2).toCanvas();

  constructor() { super(); preloadTero(); }

  private go(p: Phase): void { this.phase = p; this.phaseT = 0; }

  update(host: InterludeHost): void {
    this.t++; this.phaseT++;
    if (this.judgeT > 0) this.judgeT--;
    if (this.shake > 0) this.shake--;
    for (let i = 0; i < 4; i++) if (this.flashLane[i] > 0) this.flashLane[i]--;
    const inp = host.input;
    const ok = inp.jumpPressed || inp.firePressed;

    switch (this.phase) {
      case 'stuck':
        if (this.phaseT === 1) { host.audio.play('boom'); host.shake.trigger(8); }
        if (this.phaseT > 90 || (this.phaseT > 30 && ok)) this.go('talk');
        return;
      case 'talk':
        if (this.phaseT < 10) return;
        if (inp.justPressedAction(Action.LEFT)) { this.cursor = (this.cursor + 2) % 3; host.audio.play('click'); }
        if (inp.justPressedAction(Action.RIGHT) || inp.justPressedAction(Action.DOWN)) { this.cursor = (this.cursor + 1) % 3; host.audio.play('click'); }
        if (ok) { this.reply = TALK[this.q].options[this.cursor][1]; host.audio.play('text'); this.go('reply'); }
        return;
      case 'reply':
        if (this.phaseT > 20 && ok) {
          this.q++; this.cursor = 0;
          if (this.q < TALK.length) this.go('talk');
          else { host.audio.setMuzak(true); this.clockStep = 0; this.go('song'); }
        }
        return;
      case 'song':
        return this.updateSong(host);
      case 'result':
        if (this.phaseT === 1) { host.audio.setMuzak(false); host.audio.play('goal'); }
        if (this.phaseT > 60 && ok) this.done = true;
        return;
    }
  }

  private updateSong(host: InterludeHost): void {
    // Follow the real music when there is some; otherwise our own clock.
    const clock = host.audio.musicClock();
    if (clock) this.clockStep = clock.step;
    else this.clockStep += ((BPM + (ARRANGEMENTS.executive?.bpm ?? 0)) * 2) / 3600;

    const inp = host.input;
    LANES.forEach((bit, lane) => {
      if (!inp.justPressedAction(bit)) return;
      this.flashLane[lane] = 8;
      // the nearest open note in this lane
      let best: Note | null = null;
      for (const n of this.notes) {
        if (n.lane !== lane || n.result) continue;
        if (!best || Math.abs(n.step - this.clockStep) < Math.abs(best.step - this.clockStep)) best = n;
      }
      const d = best ? Math.abs(best.step - this.clockStep) : 99;
      if (best && d < 0.45) this.hit(best, 'perfect', host);
      else if (best && d < 0.9) this.hit(best, 'good', host);
      else { host.audio.play('click'); }
    });
    for (const n of this.notes) {
      if (!n.result && this.clockStep - n.step > 1) {
        n.result = 'miss'; this.combo = 0;
        this.judge = 'MISS'; this.judgeT = 30; this.shake = 8;
      }
    }
    if (this.clockStep > this.songLen + 2 || this.notes.every((n) => n.result)) this.go('result');
  }

  private hit(n: Note, r: 'perfect' | 'good', host: InterludeHost): void {
    n.result = r;
    this.hits++;
    this.combo++;
    this.best = Math.max(this.best, this.combo);
    this.judge = r === 'perfect' ? 'PERFECT!' : 'GOOD';
    this.judgeT = 30;
    host.audio.play(r === 'perfect' ? 'coin' : 'block');
  }

  private get progress(): number { return this.hits / this.notes.length; }

  private get rank(): string {
    const p = this.progress;
    return p > 0.9 ? 'EMPLOYEE OF THE MONTH\n(ELEVATOR DIVISION)' : p > 0.6 ? 'MEETS EXPECTATIONS' : p > 0.3 ? 'NEEDS IMPROVEMENT' : 'TOOK THE STAIRS\nIN HIS HEART';
  }

  // ─── Drawing ───────────────────────────────────────────────────────────────

  draw(ctx: CanvasRenderingContext2D): void {
    const sh = this.shake > 0 ? Math.round(Math.sin(this.shake * 3) * 2) : 0;
    ctx.save();
    ctx.translate(0, sh);
    this.drawElevator(ctx);
    ctx.restore();
    if (this.phase === 'song') this.drawHighway(ctx);
    if (this.phase === 'talk') this.drawTalk(ctx);
    if (this.phase === 'reply') this.bubble(ctx, this.reply, 150, 70);
    if (this.phase === 'stuck') shadowText(ctx, 'THE ELEVATOR IS STUCK.', W / 2, 30, '#ffffff', 2, 'center');
    if (this.phase === 'song' && this.clockStep < 10) {
      shadowText(ctx, 'THE ELEVATOR IS STUCK.\nTHE MUZAK IS NOT.', 140, 24, '#ffd23f', 1, 'center');
      text(ctx, 'HIT THE BUTTONS IN TIME:\nLEFT  DOWN  RIGHT  UP', 140, 46, '#c9ced6', 1, 'center');
    }
    if (this.phase === 'result') this.drawResult(ctx);
  }

  private drawElevator(ctx: CanvasRenderingContext2D): void {
    // walls: wood panels, a brass rail, the floor display
    ctx.fillStyle = '#4a2c1a'; ctx.fillRect(0, 0, W, H);
    for (let x = 0; x < 280; x += 40) {
      ctx.fillStyle = '#6b4226'; ctx.fillRect(x + 4, 8, 32, 190);
      ctx.fillStyle = '#7d4f2e'; ctx.fillRect(x + 6, 10, 28, 4);
    }
    ctx.fillStyle = '#c8961e'; ctx.fillRect(0, 150, 280, 4);
    ctx.fillStyle = '#3a3e45'; ctx.fillRect(0, 200, 280, 70);
    ctx.fillStyle = '#2a2d33';
    for (let x = 0; x < 280; x += 16) ctx.fillRect(x, 200, 1, 70);
    // the floor display
    ctx.fillStyle = '#111'; ctx.fillRect(100, 14, 80, 22);
    const floor = this.phase === 'result' ? '13' : this.progress > 0.5 ? '12½' : '12';
    text(ctx, floor.replace('½', '.5'), 140, 20, '#ff4d3d', 2, 'center');
    const arrow = this.phase === 'song' && this.t % 30 < 15;
    if (arrow) { ctx.fillStyle = '#ff4d3d'; ctx.fillRect(172, 18, 4, 4); }
    // the muzak, as little notes in the air
    if (this.phase === 'song') {
      for (let i = 0; i < 5; i++) {
        const y = (this.t * 0.6 + i * 40) % 140;
        const x = 30 + noise(i * 9) * 200 + Math.sin((this.t + i * 40) / 20) * 8;
        ctx.fillStyle = 'rgba(255,224,102,0.5)';
        ctx.fillRect(x, 150 - y, 4, 4); ctx.fillRect(x + 3, 150 - y - 8, 1, 8);
      }
    }
    // Tero and the coworker, standing awkwardly far apart
    drawTero(ctx, this.phase === 'result' ? 'win' : 'idle', Math.floor(this.t / 10), 80, 212, 64);
    const cw = Math.floor(this.t / 40) % 2 ? this.coworker2 : this.coworker;
    ctx.save();
    ctx.translate(222, 212);
    ctx.scale(-2, 2);
    ctx.drawImage(cw, -16, -32);
    ctx.restore();
  }

  private bubble(ctx: CanvasRenderingContext2D, s: string, x: number, y: number): void {
    const lines = s.split('\n');
    const w = Math.max(...lines.map((l) => l.length)) * 4 + 12, h = lines.length * 7 + 8;
    ctx.fillStyle = '#1b1620'; ctx.fillRect(x - w / 2 - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x - w / 2, y, w, h);
    ctx.fillRect(x + w / 2 - 20, y + h, 6, 6);
    text(ctx, s, x, y + 5, '#1b1620', 1, 'center');
  }

  private drawTalk(ctx: CanvasRenderingContext2D): void {
    this.bubble(ctx, TALK[this.q].q, 200, 70);
    ctx.fillStyle = 'rgba(20,16,28,0.9)'; ctx.fillRect(296, 60, 176, 90);
    text(ctx, 'SAY:', 306, 68, '#808080');
    TALK[this.q].options.forEach(([o], i) => {
      const y = 84 + i * 20;
      text(ctx, o, 320, y, i === this.cursor ? '#ffd23f' : '#ffffff');
      if (i === this.cursor) { ctx.fillStyle = '#ffd23f'; ctx.fillRect(308, y + 1, 6, 3); }
    });
    text(ctx, `SMALL TALK ${this.q + 1}/3`, 384, 156, '#808080', 1, 'center');
  }

  private drawHighway(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(10,8,14,0.85)';
    ctx.fillRect(LANE_X0 - 10, 0, LANE_W * 4 + 20, H);
    for (let lane = 0; lane < 4; lane++) {
      const x = LANE_X0 + lane * LANE_W;
      ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(x + 2, 0, LANE_W - 4, H);
    }
    // notes
    for (const n of this.notes) {
      if (n.result === 'perfect' || n.result === 'good') continue;
      const y = HIT_Y - (n.step - this.clockStep) * 24;
      if (y < -10 || y > H + 10) continue;
      const x = LANE_X0 + n.lane * LANE_W + LANE_W / 2;
      ctx.fillStyle = n.result === 'miss' ? '#555' : LANE_COL[n.lane];
      ctx.fillRect(x - 12, y - 4, 24, 8);
      ctx.fillStyle = '#1b1620'; ctx.fillRect(x - 12, y + 3, 24, 1);
    }
    // the buttons (elevator style, round-ish, with arrows)
    for (let lane = 0; lane < 4; lane++) {
      const x = LANE_X0 + lane * LANE_W + LANE_W / 2;
      const lit = this.flashLane[lane] > 0;
      ctx.fillStyle = '#c8961e'; ctx.fillRect(x - 14, HIT_Y - 12, 28, 24);
      ctx.fillStyle = lit ? LANE_COL[lane] : '#f4f1e6'; ctx.fillRect(x - 11, HIT_Y - 9, 22, 18);
      ctx.fillStyle = '#1b1620';
      const tri = (pts: number[]) => { ctx.beginPath(); ctx.moveTo(x + pts[0], HIT_Y + pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(x + pts[i], HIT_Y + pts[i + 1]); ctx.fill(); };
      if (lane === 0) tri([-5, 0, 4, -5, 4, 5]);
      if (lane === 1) tri([0, 5, -5, -4, 5, -4]);
      if (lane === 2) tri([5, 0, -4, -5, -4, 5]);
      if (lane === 3) tri([0, -5, -5, 4, 5, 4]);
    }
    if (this.judgeT > 0) shadowText(ctx, this.judge, LANE_X0 + LANE_W * 2, 120, this.judge === 'MISS' ? '#ff6f86' : '#ffd23f', 2, 'center');
    if (this.combo > 3) text(ctx, `${this.combo} COMBO`, LANE_X0 + LANE_W * 2, 140, '#ffffff', 1, 'center');
  }

  private drawResult(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(10,8,14,0.85)'; ctx.fillRect(250, 30, 220, 160);
    shadowText(ctx, 'DING!', 360, 42, '#ffd23f', 3, 'center');
    text(ctx, 'FLOOR 13. YOU MADE IT.', 360, 70, '#ffffff', 1, 'center');
    text(ctx, `NOTES HIT: ${this.hits}/${this.notes.length}`, 360, 92, '#c9ced6', 1, 'center');
    text(ctx, `BEST COMBO: ${this.best}`, 360, 104, '#c9ced6', 1, 'center');
    text(ctx, 'RATING:', 360, 124, '#808080', 1, 'center');
    text(ctx, this.rank, 360, 136, '#6cc24a', 1, 'center');
    if (this.phaseT > 60 && this.phaseT % 50 < 34) text(ctx, 'PRESS JUMP', 360, 172, '#ffffff', 1, 'center');
  }
}
