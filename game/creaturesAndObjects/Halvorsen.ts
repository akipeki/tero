// file: game/creaturesAndObjects/Halvorsen.ts
//
// BOSS — Mr. Halvorsen's quarterly review (Floor 12). He paces the stage like
// a TED talk, clicking through slides. The slides' bullet points are the
// platforms; every time Tero lands a hit he panics and clicks to the next
// slide, which moves them and changes the attack:
//
//   pie charts   lobbed at Tero, bounce once, burn in fire
//   laser dot    sweeps the floor — jump it or stand on a bullet point
//   interns      walk on from the left; stomp them to fill the tantrum meter
//   Q&A          "?"s rain from the ceiling on the last slide
//
// Damage: stomp his head, or hold him in tantrum fire. At 0 he isn't killed —
// he's freed like everyone else, remembers his kids and walks out.
//
// The arena is the 15 columns from `arenaTx`, exactly one screen. Game locks
// the camera and closes the door at `arenaTx - 1` while the fight is on.

import { tf } from '../i18n';
import { creaturesAndObjects, type UpdateCtx } from './creaturesAndObjects';
import { overlaps, stompOverlap } from '../physics/AABB';
import { TILE_SIZE, PUFF_HEAT } from '../constants';
import { TileType } from '../types';
import type { Player } from './Player';
import type { Flame } from './Flame';
import { drawBubble } from './freed';
import {
  drawHalvorsenAt, drawProjectorScreen, drawPie, drawQuestion, drawLaser,
} from '../render/office/bossArt';
import type { HalvorsenPose } from '../render/characters/humans';
import type { Boss, BossPhase } from './Boss';

type Attack = 'pie' | 'laser' | 'intern' | 'qa';

export interface Slide {
  title: string;
  /** Bullet-point platforms: [fromCol, toCol, row], columns relative to the arena. */
  bullets: [number, number, number][];
  /** Ticks between each attack on this slide. */
  every: Partial<Record<Attack, number>>;
  /** Walking speed between marks. */
  pace: number;
}

export const SLIDES: Slide[] = [
  { title: 'AGENDA',                     bullets: [[1, 3, 6], [5, 7, 5], [9, 11, 6]],                          every: { pie: 120 },                         pace: 0.8 },
  { title: 'Q3 SYNERGY',                 bullets: [[1, 2, 5], [4, 6, 6], [8, 10, 4], [12, 13, 6]],             every: { laser: 170, pie: 210 },             pace: 0.9 },
  { title: 'WHY BONUSES ARE BAD FOR YOU', bullets: [[2, 4, 4], [6, 8, 6], [10, 12, 4]],                        every: { pie: 95, intern: 280 },             pace: 1.0 },
  { title: 'THE COMPANY IS A FAMILY',    bullets: [[1, 2, 6], [3, 4, 4], [6, 7, 5], [9, 10, 3], [12, 13, 5]], every: { laser: 130, pie: 120, intern: 320 }, pace: 1.2 },
  { title: 'ANY QUESTIONS?',             bullets: [[1, 3, 5], [7, 9, 5], [11, 13, 5]],                        every: { qa: 26, pie: 130 },                 pace: 1.3 },
];

export const HALVORSEN_HP = SLIDES.length;
/** Tantrum flames it takes to count as one hit. */
const HEAT_PER_HIT = 14;
const INVULN = 100;
const ARENA_COLS = 15;
const MARKS = [3, 10];                 // where he stops to present, arena-relative
const FLOOR_ROW = 8;

const HOT_LINES = ['HOT TAKE.', 'MY SLIDES!', 'THIS IS FINE.', 'SO HOT RIGHT NOW.'];
const HIT_LINES = ['LET\'S TAKE THIS OFFLINE.', 'CIRCLE BACK!', 'PER MY LAST EMAIL...', 'THIS COULD HAVE BEEN AN EMAIL.'];
const FREED_LINES = ['...I HAVE KIDS TOO.', 'I MISSED SIX RECITALS.', 'I\'M GOING HOME.'];

type Phase = BossPhase;

class Shot {
  life = 0;
  bounced = false;
  active = true;
  constructor(
    readonly kind: 'pie' | 'qa' | 'laser',
    public x: number, public y: number, public vx: number, public vy: number,
  ) {}

  get box() {
    const r = this.kind === 'laser' ? 5 : 7;
    return { x: this.x - r, y: this.y - r, w: r * 2, h: r * 2 };
  }
}

export class Halvorsen extends creaturesAndObjects implements Boss {
  readonly name = 'MR. HALVORSEN';
  readonly maxHp = HALVORSEN_HP;
  resigned: Boss['resigned'] = [];
  phase: Phase = 'waiting';
  hp = HALVORSEN_HP;
  readonly arenaTx: number;
  facingRight = false;
  /** Set when Tero has seen the intro; after a death he restarts without it. */
  introDone = false;
  /** Game reads and clears these. */
  justHit = false;
  wantsIntern = false;
  freedNow = false;
  walkedOut = false;

  private slide = 0;
  private timers: Partial<Record<Attack, number>> = {};
  private invuln = 0;
  private heat = 0;
  private target = 0;
  private presenting = 0;
  private windup = 0;
  private stepDist = 0;
  private speech: { text: string; t: number } | null = null;
  private speechQueue: string[] = [];
  private freedTimer = 0;
  private alpha = 1;
  private scorch = 0;
  private sizzleCd = 0;

  get heatLevel(): number { return this.heat / HEAT_PER_HIT; }
  private shots: Shot[] = [];

  constructor(arenaTx: number) {
    super((arenaTx + MARKS[1]) * TILE_SIZE, FLOOR_ROW * TILE_SIZE - 56, 22, 56);
    this.arenaTx = arenaTx;
  }

  get arenaLeft():  number { return this.arenaTx * TILE_SIZE; }
  get arenaRight(): number { return (this.arenaTx + ARENA_COLS) * TILE_SIZE; }
  get floorY():     number { return FLOOR_ROW * TILE_SIZE; }
  get slideIndex(): number { return this.slide; }
  get slideTitle(): string { return this.phase === 'freed' || this.phase === 'gone' ? 'MEETING ENDED' : SLIDES[this.slide].title; }
  get fighting():   boolean { return this.phase === 'fight'; }
  get subtitle():   string { return this.slideTitle; }

  /** Lights up the arena: first slide, bullets in place, attacks primed. */
  start(map: UpdateCtx['map']): void {
    this.phase = 'fight';
    this.hp = HALVORSEN_HP;
    this.slide = 0;
    this.heat = 0;
    this.invuln = 30;
    this.x = (this.arenaTx + MARKS[1]) * TILE_SIZE;
    this.y = this.floorY - this.h;
    this.target = 0;
    this.shots = [];
    this.primeTimers();
    this.placeBullets(map);
    this.say('SLIDE 1 OF 47.');
  }

  /** Tero died mid-meeting: put everything back for the next attempt. */
  reset(map: UpdateCtx['map']): void {
    this.clearBullets(map);
    this.phase = 'waiting';
    this.hp = HALVORSEN_HP;
    this.slide = 0;
    this.shots = [];
    this.speech = null;
    this.speechQueue = [];
    this.x = (this.arenaTx + MARKS[1]) * TILE_SIZE;
    this.y = this.floorY - this.h;
  }

  /** True once Tero is properly inside the arena (used to restart after a death). */
  playerInArena(player: Player): boolean {
    return player.cx > this.arenaLeft + TILE_SIZE * 1.5;
  }

  /** Unused: the boss needs the player and the flames, see `tick`. */
  update(): void { /* see tick() */ }

  /** The fight tick. Needs the player and the flames, so Game calls this
   *  instead of the plain `update`. */
  tick(ctx: UpdateCtx, player: Player, flames: Flame[]): void {
    this.updateSpeech();
    if (this.phase === 'freed') { this.updateFreed(); return; }
    if (this.phase !== 'fight') return;

    if (this.invuln > 0) this.invuln--;
    if (this.scorch > 0) this.scorch--;
    if (this.sizzleCd > 0) this.sizzleCd--;
    this.move();
    this.attack(ctx, player);
    this.updateShots(ctx, player, flames);
    if (player.isDead) return;

    // Stomp the head
    if (player.vy > 0 && this.invuln === 0 && stompOverlap(
      { x: player.x, y: player.y, w: player.w, h: player.h }, player.prevBottom,
      { x: this.x - 4, y: this.y, w: this.w + 8, h: 16 },
    )) {
      player.bounce();
      player.vy = -9;
      this.takeHit(ctx);
      return;
    }
    // Fire: every flame that touches him shows. Tantrum flames stream in;
    // a little puff counts for more. While he's blinking it just fizzles.
    for (const f of flames) {
      if (!f.active || !overlaps(f, this)) continue;
      f.active = false;
      this.scorch = 10;
      if (this.invuln > 0) { ctx.particles.burst(f.cx, f.cy, 3, '#9aa0a8', '#c9ccd1'); continue; }
      this.heat += f.frees ? 1 : PUFF_HEAT;
      ctx.particles.burst(f.cx, f.cy, 5, '#ffb347', '#6b6470');
      if (this.sizzleCd === 0) { ctx.audio.play('burn'); this.sizzleCd = 8; }
      if (!this.speech && Math.random() < 0.35) this.say(HOT_LINES[Math.floor(Math.random() * HOT_LINES.length)]);
      if (this.heat >= HEAT_PER_HIT) { this.heat = 0; this.takeHit(ctx); break; }
    }
    // Walk into him and you get a stern talking-to
    if (this.invuln < INVULN - 20 && !player.isInvincible && !player.isTantrum && overlaps(
      { x: player.x + 3, y: player.y + 4, w: player.w - 6, h: player.h - 4 }, this,
    )) {
      player.hurt(ctx, 'halvorsen');
    }
  }

  // ─── Behaviour ─────────────────────────────────────────────────────────────

  private primeTimers(): void {
    const every = SLIDES[this.slide].every;
    this.timers = {};
    for (const k of Object.keys(every) as Attack[]) this.timers[k] = Math.round(every[k]! * 0.6);
  }

  private move(): void {
    if (this.presenting > 0) { this.presenting--; return; }
    const goal = (this.arenaTx + MARKS[this.target]) * TILE_SIZE;
    const dx = goal - this.x;
    if (Math.abs(dx) < 2) {
      this.presenting = 50;
      this.target = 1 - this.target;
      this.facingRight = this.target === 1;
      return;
    }
    const step = Math.sign(dx) * Math.min(Math.abs(dx), SLIDES[this.slide].pace);
    this.x += step;
    this.stepDist += Math.abs(step);
    this.facingRight = dx > 0;
  }

  private attack(ctx: UpdateCtx, player: Player): void {
    if (this.windup > 0 && --this.windup === 0) this.throwPie(player);
    const every = SLIDES[this.slide].every;
    for (const k of Object.keys(every) as Attack[]) {
      const t = (this.timers[k] ?? every[k]!) - 1;
      if (t > 0) { this.timers[k] = t; continue; }
      this.timers[k] = every[k]!;
      switch (k) {
        case 'pie':    if (this.windup === 0) this.windup = 18; break;
        case 'intern': this.wantsIntern = true; break;
        case 'qa': {
          const x = this.arenaLeft + TILE_SIZE + Math.random() * (ARENA_COLS - 2) * TILE_SIZE;
          this.shots.push(new Shot('qa', x, TILE_SIZE + 8, 0, 1.5));
          break;
        }
        case 'laser': {
          // Sweep the floor from his side to the other.
          const fromLeft = this.cx > (this.arenaLeft + this.arenaRight) / 2 ? false : true;
          const x = fromLeft ? this.arenaLeft + 12 : this.arenaRight - 12;
          this.shots.push(new Shot('laser', x, this.floorY - 3, fromLeft ? 3.2 : -3.2, 0));
          ctx.audio.play('laser');
          break;
        }
      }
    }
  }

  private throwPie(player: Player): void {
    const hand = { x: this.cx + (this.facingRight ? 6 : -6), y: this.y + 4 };
    const vx = Math.max(-4.5, Math.min(4.5, (player.cx - hand.x) / 42));
    this.shots.push(new Shot('pie', hand.x, hand.y, vx, -6.5));
  }

  private updateShots(ctx: UpdateCtx, player: Player, flames: Flame[]): void {
    for (const s of this.shots) {
      s.life++;
      if (s.kind === 'pie') {
        s.vy += 0.3;
        s.x += s.vx;
        s.y += s.vy;
        if (s.y > this.floorY - 7) {
          s.y = this.floorY - 7;
          if (s.bounced) { s.vy = 0; s.vx *= 0.97; } else { s.bounced = true; s.vy *= -0.45; }
        }
        if (s.life > 240) s.active = false;
      } else if (s.kind === 'qa') {
        s.vy = Math.min(4.5, s.vy + 0.08);
        s.y += s.vy;
        if (s.y > this.floorY - 8) {
          s.active = false;
          ctx.particles.burst(s.x, this.floorY - 4, 5, '#ff77a8', '#ffffff');
        }
      } else {
        s.x += s.vx;
      }
      if (s.x < this.arenaLeft - 8 || s.x > this.arenaRight + 8) s.active = false;
      if (!s.active) continue;

      // Fire burns pie charts and questions (not light).
      if (s.kind !== 'laser') {
        for (const f of flames) {
          if (f.active && overlaps(f, s.box)) {
            s.active = false;
            ctx.particles.burst(s.x, s.y, 6, '#ffb347', '#ffd23f');
            break;
          }
        }
        if (!s.active) continue;
      }

      const hitbox = { x: player.x + 3, y: player.y + 3, w: player.w - 6, h: player.h - 3 };
      if (!player.isDead && overlaps(hitbox, s.box)) {
        // The laser only hurts on the floor; standing on a bullet is safe.
        if (s.kind === 'laser' && player.bottom < this.floorY - 2) continue;
        player.hurt(ctx, 'halvorsen');
        if (s.kind !== 'laser') s.active = false;
      }
    }
    this.shots = this.shots.filter((s) => s.active);
  }

  blast(ctx: UpdateCtx): void {
    if (this.phase !== 'fight') return;
    this.invuln = 0;
    this.takeHit(ctx);
  }

  private takeHit(ctx: UpdateCtx): void {
    this.hp--;
    this.justHit = true;
    this.invuln = INVULN;
    this.heat = 0;
    ctx.shake.trigger(6);
    ctx.particles.burst(this.cx, this.y + 10, 10, '#ffd23f', '#d83b3b');
    ctx.audio.play('bossHit');
    if (this.hp <= 0) { this.free(ctx); return; }
    this.say(HIT_LINES[(HALVORSEN_HP - this.hp - 1) % HIT_LINES.length]);
    // Panic-click to the next slide.
    this.slide = Math.min(SLIDES.length - 1, HALVORSEN_HP - this.hp);
    this.placeBullets(ctx.map);
    this.primeTimers();
    ctx.audio.play('click');
  }

  private free(ctx: UpdateCtx): void {
    this.phase = 'freed';
    this.freedNow = true;
    this.shots = [];
    this.clearBullets(ctx.map);
    this.speechQueue = [...FREED_LINES];
    this.speech = null;
    this.freedTimer = 0;
    ctx.audio.play('free');
  }

  private updateFreed(): void {
    this.freedTimer++;
    // Stand still while he says his piece, then walk out the door.
    if (this.speech || this.speechQueue.length) return;
    this.facingRight = false;
    this.x -= 1.4;
    this.stepDist += 1.4;
    if (this.x < this.arenaLeft - TILE_SIZE * 2) {
      this.alpha = Math.max(0, this.alpha - 0.05);
      if (this.alpha === 0 && this.phase === 'freed') { this.phase = 'gone'; this.walkedOut = true; }
    }
  }

  private say(text: string): void {
    this.speech = { text, t: 100 };
  }

  private updateSpeech(): void {
    if (this.speech && --this.speech.t <= 0) this.speech = null;
    if (!this.speech && this.speechQueue.length) this.say(this.speechQueue.shift()!);
  }

  // ─── Slides → platforms ────────────────────────────────────────────────────

  private placeBullets(map: UpdateCtx['map']): void {
    this.clearBullets(map);
    for (const [a, b, row] of SLIDES[this.slide].bullets) {
      for (let c = a; c <= b; c++) {
        if (map.tileAt(this.arenaTx + c, row) === TileType.AIR) map.setTile(this.arenaTx + c, row, TileType.BULLET);
      }
    }
  }

  private clearBullets(map: UpdateCtx['map']): void {
    for (let row = 1; row < FLOOR_ROW; row++) {
      for (let c = 0; c < ARENA_COLS; c++) {
        if (map.tileAt(this.arenaTx + c, row) === TileType.BULLET) map.setTile(this.arenaTx + c, row, TileType.AIR);
      }
    }
  }

  // ─── Drawing ───────────────────────────────────────────────────────────────

  /** The projector screen sits behind everything else in the arena. */
  drawBackdrop(ctx: CanvasRenderingContext2D, camX: number): void {
    const header = this.phase === 'fight' ? tf('SLIDE {n}/47', { n: this.slide + 1 }) : 'Q3 REVIEW';
    drawProjectorScreen(ctx, this.arenaLeft + 2 * TILE_SIZE - camX, TILE_SIZE + 4, header,
      this.phase === 'waiting' ? 'WELCOME, TEAM!' : this.slideTitle);
  }

  draw(ctx: CanvasRenderingContext2D, camX: number): void {
    if (this.phase === 'gone') return;
    // Laser beams come from the clicker.
    for (const s of this.shots) {
      if (s.kind === 'laser') drawLaser(ctx, this.cx + (this.facingRight ? 16 : -16) - camX, this.y + 20, s.x - camX, s.y);
    }
    const pose: HalvorsenPose =
      this.phase === 'freed' ? (this.speech || this.speechQueue.length ? 'hurt' : this.walkPose())
      : this.invuln > INVULN - 30 ? 'hurt'
      : this.windup > 0 ? 'throw'
      : this.presenting > 0 ? 'present'
      : this.walkPose();
    ctx.globalAlpha = this.alpha;
    const flash = this.phase === 'fight' && this.invuln > 0 && Math.floor(this.invuln / 4) % 2 === 0;
    const jit = this.scorch > 0 ? (this.scorch % 2 ? 1 : -1) : 0;
    drawHalvorsenAt(ctx, this.cx - camX + jit, this.bottom, pose, this.facingRight, this.phase === 'freed', flash, this.scorch / 10);
    ctx.globalAlpha = 1;
    for (const s of this.shots) {
      if (s.kind === 'pie') drawPie(ctx, s.x - camX, s.y, Math.floor(s.life / 5) % 4);
      if (s.kind === 'qa') drawQuestion(ctx, s.x - camX, s.y);
    }
    if (this.speech) drawBubble(ctx, this.speech.text, this.cx - camX, this.y - 4);
  }

  private walkPose(): HalvorsenPose {
    return Math.floor(this.stepDist / 10) % 2 === 0 ? 'walk0' : 'walk1';
  }
}
