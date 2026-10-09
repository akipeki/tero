import { describe, expect, it } from 'vitest';
import { Player } from './Player';
import { Grenade } from './Grenade';
import { Run } from '../Run';
import { Tilemap } from '../level/Tilemap';
import { buildLevel } from '../level/buildLevel';
import { ParticleSystem } from '../ParticleSystem';
import { ScreenShake } from '../ScreenShake';
import { level10Spawns, level10Tiles, LEVEL10_WIDTH } from '../level/level10';
import { level2Spawns } from '../level/level2';
import { STORY } from '../content/story/script';
import type { UpdateCtx } from './creaturesAndObjects';
import type { AudioManager } from '../AudioManager';

const ctxFor = (rows: string[]): UpdateCtx => {
  const b = buildLevel(rows);
  return { map: new Tilemap(b.tiles, b.width, b.height), particles: new ParticleSystem(), audio: { play: () => {} } as unknown as AudioManager, shake: new ScreenShake(), dt: 1 / 60 };
};
const ROOM = ['..........', '..........', '..........', '##########'];

describe('riding Elvis', () => {
  it('bumps knock Tero back but never hurt him', () => {
    const c = ctxFor(ROOM);
    const p = new Player(64, 96 - 28, 3);
    p.riding = true;
    p.hurt(c, 'tacks');
    expect(p.lives).toBe(3);
    expect(p.bumped).toBe(true);
    expect(p.vy).toBeLessThan(0);
  });

  it('Elvis is faster than walking', () => {
    const run = (riding: boolean) => {
      const c = ctxFor(ROOM);
      const p = new Player(32, 96 - 28, 3);
      p.riding = riding;
      p.actions = 2;                                  // RIGHT
      for (let i = 0; i < 40; i++) p.update(c);
      return p.x;
    };
    expect(run(true)).toBeGreaterThan(run(false) + 20);
  });
});

describe('the grenade', () => {
  it('is thrown, lands and goes off', () => {
    const c = ctxFor(ROOM);
    const g = new Grenade(40, 40, 3, -5);
    for (let i = 0; i < 100 && g.active; i++) g.update(c);
    expect(g.active).toBe(false);
    expect(g.exploded).toBe(true);
  });

  it('there is one, and then there is none', () => {
    const r = new Run();
    r.start();
    expect(r.useGrenade()).toBe(false);
    r.giveGrenade();
    expect(r.useGrenade()).toBe(true);
    expect(r.useGrenade()).toBe(false);
  });
});

describe('the vents', () => {
  it('a feel-good floor: no enemies and no pits', () => {
    expect(level10Spawns.enemies).toHaveLength(0);
    for (let tx = 0; tx < LEVEL10_WIDTH; tx++) expect(level10Tiles[8 * LEVEL10_WIDTH + tx]).not.toBe(0);
  });

  it('Elvis waits near the start, the resistance hands over the grenade, the exit is a vent', () => {
    const g = level10Spawns.gadgets!;
    expect(g.some((x) => x.type === 'elvis' && x.tx < 12)).toBe(true);
    const triggers = STORY.levels['10'].triggers ?? [];
    expect(triggers.find((t) => t.effect === 'ride')!.atTile).toBeLessThan(10);
    expect(triggers.some((t) => t.effect === 'grenade')).toBe(true);
    expect(level10Spawns.goal.kind).toBe('vent');
  });

  it('Floor 6\'s elevator is out of order (into the pipe)', () => {
    expect(level2Spawns.goal.kind).toBe('broken');
  });
});
