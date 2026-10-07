import { describe, expect, it } from 'vitest';
import { Recruiter } from './Recruiter';
import { Player } from './Player';
import { Tilemap } from '../level/Tilemap';
import { ParticleSystem } from '../ParticleSystem';
import { ScreenShake } from '../ScreenShake';
import { level2Tiles, level2Spawns, LEVEL2_WIDTH, LEVEL2_HEIGHT } from '../level/level2';
import { STORY } from '../content/story/script';
import type { UpdateCtx } from './creaturesAndObjects';
import type { AudioManager } from '../AudioManager';

const ctx = (): UpdateCtx => ({
  map: new Tilemap([...level2Tiles], LEVEL2_WIDTH, LEVEL2_HEIGHT),
  particles: new ParticleSystem(),
  audio: { play: () => {} } as unknown as AudioManager,
  shake: new ScreenShake(),
  dt: 1 / 60,
});
const ARENA = level2Spawns.boss!.arenaTx;
const away = () => { const p = new Player(ARENA * 32 + 40, 7 * 32 - 28, 3); (p as unknown as { invincible: number }).invincible = 1e6; return p; };

function stomp(r: Recruiter, c: UpdateCtx): void {
  const p = new Player(r.cx - 11, r.y - 28 - 3, 3);
  p.prevBottom = r.y - 3;
  p.vy = 4;
  p.y += 4;
  r.tick(c, p, []);
}

describe('Chad from Talent Acquisition', () => {
  it('the arena fits: walled on the right, open door on the left', () => {
    const c = ctx();
    for (let ty = 1; ty <= 7; ty++) {
      expect(c.map.tileAt(ARENA + 15, ty)).toBe(1);
      expect(c.map.tileAt(ARENA - 1, ty)).toBe(0);
    }
  });

  it('three stomps and he remembers the farm, then walks out', () => {
    const c = ctx();
    const r = new Recruiter(ARENA);
    r.start();
    for (let hit = 0; hit < 3; hit++) {
      for (let i = 0; i < 100; i++) r.tick(c, away(), []);
      stomp(r, c);
      expect(r.hp).toBe(2 - hit);
    }
    expect(r.phase).toBe('freed');
    for (let i = 0; i < 1500 && !r.walkedOut; i++) r.tick(c, away(), []);
    expect(r.walkedOut).toBe(true);
  });

  it('he headhunts: a dash across the floor', () => {
    const c = ctx();
    const r = new Recruiter(ARENA);
    r.start();
    let maxStep = 0;
    let x = r.x;
    for (let i = 0; i < 400; i++) { r.tick(c, away(), []); maxStep = Math.max(maxStep, Math.abs(r.x - x)); x = r.x; }
    expect(maxStep).toBeGreaterThan(4);
  });

  it('Floor 6: the pitch opens the application, then the fight starts', () => {
    const triggers = STORY.levels['2'].triggers ?? [];
    const quiz = triggers.findIndex((t) => t.effect === 'quiz');
    const boss = triggers.findIndex((t) => t.effect === 'boss');
    expect(quiz).toBeGreaterThanOrEqual(0);
    expect(boss).toBeGreaterThan(quiz);
  });
});
