import { describe, expect, it } from 'vitest';
import { Spring, SPRING_VY, Fax } from './Gadgets';
import { Player } from './Player';
import { Tilemap } from '../level/Tilemap';
import { buildLevel } from '../level/buildLevel';
import { ParticleSystem } from '../ParticleSystem';
import { ScreenShake } from '../ScreenShake';
import { TileType } from '../types';
import { level5Spawns, level5Tiles, LEVEL5_WIDTH } from '../level/level5';
import type { UpdateCtx } from './creaturesAndObjects';
import type { AudioManager } from '../AudioManager';

const ctx = (): UpdateCtx => {
  const { tiles, width, height } = buildLevel(['....', '....', '####']);
  return { map: new Tilemap(tiles, width, height), particles: new ParticleSystem(), audio: { play: () => {} } as unknown as AudioManager, shake: new ScreenShake(), dt: 1 / 60 };
};

describe('R&D gadgets', () => {
  it('a spring launches Tero when he lands on it', () => {
    const s = new Spring(1, 1);
    const p = new Player(s.x + 2, s.y - 28 + 2, 3);
    p.prevBottom = s.y - 1;
    p.vy = 3;
    expect(s.check(p, ctx())).toBe(true);
    expect(p.vy).toBe(SPRING_VY);
  });

  it('a spring ignores Tero walking past below its top', () => {
    const s = new Spring(1, 1);
    const p = new Player(s.x, s.y, 3);
    p.prevBottom = s.y + 10;
    p.vy = 1;
    expect(s.check(p, ctx())).toBe(false);
  });

  it('a fax notices Tero standing at it', () => {
    const f = new Fax(1, 1, null);
    const p = new Player(f.x, f.bottom - 28, 3);
    p.onGround = true;
    expect(f.touches(p)).toBe(true);
  });

  it('Floor 21: the clean room is sealed, and every fax link points at a fax', () => {
    const tile = (tx: number, ty: number) => level5Tiles[ty * LEVEL5_WIDTH + tx];
    for (let ty = 1; ty <= 7; ty++) {
      expect(tile(14, ty)).toBe(TileType.SOLID);
      expect(tile(28, ty)).toBe(TileType.SOLID);
    }
    const g = level5Spawns.gadgets!;
    for (const x of g) if (x.type === 'fax' && x.to !== undefined) expect(g[x.to].type).toBe('fax');
  });
});
