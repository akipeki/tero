// file: game/creaturesAndObjects/Recruiter.ts
//
// MINI-BOSS — Chad from Talent Acquisition (Floor 6). He asks Tero how old
// he is, offers him the Junior Trainee Program ("only 10-hour days!"),
// makes him fill in the application, and gets told where to go. Then:
//
//   contracts  thrown in arcs ("SIGN HERE"); fire burns them
//   HEADHUNT   every few seconds he charges across the floor — jump him
//
// Three stomps (or a good tantrum) and he's freed like everyone else.
// Same arena rules as the other bosses (see Boss.ts).

import { blitArt } from '../render/customImages';
import { creaturesAndObjects, type UpdateCtx } from './creaturesAndObjects';
import { overlaps, stompOverlap } from '../physics/AABB';
import { TILE_SIZE, PUFF_HEAT } from '../constants';
import type { Player } from './Player';
import type { Flame } from './Flame';
import type { Boss, BossPhase } from './Boss';
import { drawBubble } from './freed';
import { drawRecruiter, RECRUITER_W, RECRUITER_H, type RecruiterPose } from '../render/characters/creatures';
import { riggedFacings } from '../render/office/OfficeSprites';

const ARENA_COLS = 15;
const FLOOR_ROW = 8;
const HP = 3;
const INVULN = 90;
const HEAT_PER_HIT = 12;

const HIT_LINES = ['WOW. TOXIC.', 'I\'M PUTTING THIS IN YOUR FILE.'];
const PITCH_LINES = ['10-HOUR DAYS!', 'WE\'RE A FAMILY!', 'UNPAID = EXPOSURE!', 'PIZZA FRIDAYS!', 'HUSTLE!'];
const FREED_LINES = ['...I GREW UP ON A FARM.', 'I MISS THE MUD.', 'BYE, LITTLE BUDDY.'];

interface Paper { x: number; y: number; vx: number; vy: number; life: number; active: boolean }

export class Recruiter extends creaturesAndObjects implements Boss {
  readonly name = 'CHAD, TALENT ACQUISITION';
  readonly maxHp = HP;
  readonly arenaTx: number;
  phase: BossPhase = 'waiting';
  hp = HP;
  introDone = false;
  justHit = false;
  wantsIntern = false;
  freedNow = false;
  walkedOut = false;
  resigned: Boss['resigned'] = [];
  facingRight = false;

  private invuln = 0;
  private heat = 0;
  private papers: Paper[] = [];
  private nextThrow = 70;
  private nextDash = 260;
  private dash = 0;
  private windup = 0;
  private target = 0;
  private stepDist = 0;
  private speech: { text: string; t: number } | null = null;
  private speechQueue: string[] = [];
  private alpha = 1;

  constructor(arenaTx: number) {
    super((arenaTx + 8) * TILE_SIZE, FLOOR_ROW * TILE_SIZE - 44, 24, 44);   // on screen for his pitch
    this.arenaTx = arenaTx;
  }

  get arenaLeft():  number { return this.arenaTx * TILE_SIZE; }
  get arenaRight(): number { return (this.arenaTx + ARENA_COLS) * TILE_SIZE; }
  get floorY():     number { return FLOOR_ROW * TILE_SIZE; }
  get fighting():   boolean { return this.phase === 'fight'; }
  get subtitle():   string { return this.phase === 'fight' ? 'JUNIOR TRAINEE PROGRAM' : 'OFFER WITHDRAWN'; }

  start(): void {
    this.phase = 'fight';
    this.hp = HP;
    this.heat = 0;
    this.invuln = 30;
    this.papers = [];
    this.nextThrow = 60;
    this.nextDash = 240;
    this.dash = 0;
    this.say('LET\'S CIRCLE BACK ON THAT ATTITUDE!');
  }

  reset(): void {
    this.phase = 'waiting';
    this.hp = HP;
    this.papers = [];
    this.dash = 0;
    this.speech = null;
    this.speechQueue = [];
    this.x = (this.arenaTx + 8) * TILE_SIZE;
  }

  playerInArena(player: Player): boolean {
    return player.cx > this.arenaLeft + TILE_SIZE * 1.5;
  }

  update(): void { /* see tick() */ }

  tick(ctx: UpdateCtx, player: Player, flames: Flame[]): void {
    if (this.speech && --this.speech.t <= 0) this.speech = null;
    if (!this.speech && this.speechQueue.length) this.say(this.speechQueue.shift()!);

    if (this.phase === 'freed') {
      if (this.speech || this.speechQueue.length) return;
      this.facingRight = false;
      this.x -= 1.5;
      this.stepDist += 1.5;
      if (this.x < this.arenaLeft - TILE_SIZE * 2) {
        this.alpha = Math.max(0, this.alpha - 0.05);
        if (this.alpha === 0) { this.phase = 'gone'; this.walkedOut = true; }
      }
      return;
    }
    if (this.phase !== 'fight') return;
    if (this.invuln > 0) this.invuln--;

    this.move(player, ctx);
    this.updatePapers(ctx, player, flames);
    if (player.isDead) return;

    // Stomp his head
    if (player.vy > 0 && this.invuln === 0 && stompOverlap(
      { x: player.x, y: player.y, w: player.w, h: player.h }, player.prevBottom,
      { x: this.x - 4, y: this.y, w: this.w + 8, h: 14 },
    )) {
      player.bounce();
      player.vy = -9;
      this.takeHit(ctx);
      return;
    }
    // Tantrum fire
    if (this.invuln === 0) {
      for (const f of flames) {
        if (!f.active || !overlaps(f, this)) continue;
        f.active = false;
        // tantrum flames stream in; a little puff counts for more
        this.heat += f.frees ? 1 : PUFF_HEAT;
        ctx.particles.burst(f.cx, f.cy, 3, '#ffb347', '#fff6b0');
        if (this.heat >= HEAT_PER_HIT) { this.heat = 0; this.takeHit(ctx); break; }
      }
    }
    // Bumping into him hurts (a dash really hurts)
    if (this.invuln < INVULN - 20 && !player.isInvincible && !player.isTantrum &&
      overlaps({ x: player.x + 3, y: player.y + 4, w: player.w - 6, h: player.h - 4 }, this)) {
      player.hurt(ctx, 'recruiter');
    }
  }

  private move(player: Player, ctx: UpdateCtx): void {
    if (this.dash > 0) {
      // HEADHUNT: charge across the floor
      this.dash--;
      this.x += this.facingRight ? 4.6 : -4.6;
      this.stepDist += 4.6;
      if (this.x < this.arenaLeft + 4 || this.x > this.arenaRight - this.w - 4) {
        this.x = Math.max(this.arenaLeft + 4, Math.min(this.arenaRight - this.w - 4, this.x));
        this.dash = 0;
        ctx.shake.trigger(3);
      }
      return;
    }
    if (this.windup > 0) {
      if (--this.windup === 0) {
        const hand = { x: this.cx + (this.facingRight ? 8 : -8), y: this.y + 6 };
        const vx = Math.max(-4.2, Math.min(4.2, (player.cx - hand.x) / 45));
        this.papers.push({ x: hand.x, y: hand.y, vx, vy: -5.5, life: 0, active: true });
      }
      return;
    }
    if (--this.nextDash <= 0) {
      this.nextDash = 200 + Math.floor(Math.random() * 80) - (HP - this.hp) * 30;
      this.facingRight = player.cx > this.cx;
      this.dash = 70;
      this.say('HEADHUNT!');
      ctx.audio.play('boing');
      return;
    }
    if (--this.nextThrow <= 0) {
      this.nextThrow = 95 - (HP - this.hp) * 18;
      this.facingRight = player.cx > this.cx;
      this.windup = 16;
      if (Math.random() < 0.4) this.say(PITCH_LINES[Math.floor(Math.random() * PITCH_LINES.length)]);
      return;
    }
    // Pace between two marks
    const marks = [this.arenaLeft + 4 * TILE_SIZE, this.arenaLeft + 11 * TILE_SIZE];
    const goal = marks[this.target];
    if (Math.abs(goal - this.x) < 2) { this.target = 1 - this.target; return; }
    const step = Math.sign(goal - this.x) * 1.1;
    this.x += step;
    this.stepDist += 1.1;
    this.facingRight = step > 0;
  }

  private updatePapers(ctx: UpdateCtx, player: Player, flames: Flame[]): void {
    for (const p of this.papers) {
      p.life++;
      p.vy += 0.25;
      p.x += p.vx;
      p.y += p.vy;
      if (p.y > this.floorY - 6 || p.life > 200) p.active = false;
      const box = { x: p.x - 6, y: p.y - 4, w: 12, h: 9 };
      for (const f of flames) {
        if (f.active && overlaps(f, box)) { p.active = false; ctx.particles.burst(p.x, p.y, 6, '#fbf8ee', '#ffb347'); }
      }
      if (p.active && !player.isDead && overlaps({ x: player.x + 3, y: player.y + 3, w: player.w - 6, h: player.h - 3 }, box)) {
        player.hurt(ctx, 'recruiter');
        p.active = false;
      }
    }
    this.papers = this.papers.filter((p) => p.active);
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
    this.dash = 0;
    ctx.shake.trigger(5);
    ctx.particles.burst(this.cx, this.y + 8, 10, '#ffc6cc', '#ff77a8');
    ctx.audio.play('bossHit');
    if (this.hp > 0) { this.say(HIT_LINES[(HP - this.hp - 1) % HIT_LINES.length]); return; }
    this.phase = 'freed';
    this.freedNow = true;
    this.papers = [];
    this.speech = null;
    this.speechQueue = [...FREED_LINES];
    ctx.audio.play('free');
  }

  private say(text: string): void { this.speech = { text, t: 90 }; }

  drawBackdrop(): void { /* no screen: Chad is the presentation */ }

  draw(ctx: CanvasRenderingContext2D, camX: number): void {
    if (this.phase === 'gone') return;
    const pose: RecruiterPose =
      this.phase === 'freed' ? (this.speech || this.speechQueue.length ? 'hurt' : this.walkPose())
      : this.invuln > INVULN - 25 ? 'hurt'
      : this.dash > 0 ? 'dash'
      : this.windup > 0 ? 'throw'
      : this.walkPose();
    ctx.globalAlpha = this.alpha * (this.phase === 'fight' && this.invuln > 0 && Math.floor(this.invuln / 4) % 2 === 0 ? 0.5 : 1);
    const x = Math.round(this.cx - camX - RECRUITER_W / 2), y = Math.round(this.bottom - RECRUITER_H + 1);
    if (!blitArt(ctx, 'recruiter', pose, x, y, RECRUITER_W, RECRUITER_H, !this.facingRight)) {
      const f = riggedFacings(`recruiter:${pose}`, () => drawRecruiter(pose), this.phase === 'freed');
      ctx.drawImage(this.facingRight ? f.right : f.left, x, y);
    }
    ctx.globalAlpha = 1;
    for (const p of this.papers) drawContract(ctx, p.x - camX, p.y, p.life);
    if (this.speech) drawBubble(ctx, this.speech.text, this.cx - camX, this.y - 4);
  }

  private walkPose(): RecruiterPose {
    return Math.floor(this.stepDist / 10) % 2 === 0 ? 'walk0' : 'walk1';
  }
}

/** A tumbling contract: white sheet, red SIGN HERE line. */
function drawContract(ctx: CanvasRenderingContext2D, x: number, y: number, life: number): void {
  const flip = Math.floor(life / 6) % 2 === 0;
  const w = flip ? 12 : 8, h = flip ? 9 : 11;
  const sx = Math.round(x - w / 2), sy = Math.round(y - h / 2);
  ctx.fillStyle = '#1b1620';
  ctx.fillRect(sx - 1, sy - 1, w + 2, h + 2);
  ctx.fillStyle = '#fbf8ee';
  ctx.fillRect(sx, sy, w, h);
  ctx.fillStyle = '#9aa0a8';
  ctx.fillRect(sx + 2, sy + 2, w - 4, 1);
  ctx.fillStyle = '#d83b3b';
  ctx.fillRect(sx + 2, sy + h - 3, w - 4, 1);
}
