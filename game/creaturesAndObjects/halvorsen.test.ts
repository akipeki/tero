import { describe, expect, it } from 'vitest';
import { Halvorsen, SLIDES, HALVORSEN_HP } from './Halvorsen';
import { Player } from './Player';
import { Tilemap } from '../level/Tilemap';
import { ParticleSystem } from '../ParticleSystem';
import { ScreenShake } from '../ScreenShake';
import { TileType } from '../types';
import { TILE_SIZE } from '../constants';
import { level3Tiles, level3Spawns, LEVEL3_WIDTH, LEVEL3_HEIGHT } from '../level/level3';
import type { UpdateCtx } from './creaturesAndObjects';
import type { AudioManager } from '../AudioManager';

function floor12(): UpdateCtx {
  return {
    map: new Tilemap([...level3Tiles], LEVEL3_WIDTH, LEVEL3_HEIGHT),
    particles: new ParticleSystem(),
    audio: { play: () => {} } as unknown as AudioManager,
    shake: new ScreenShake(),
    dt: 1 / 60,
  };
}

const ARENA = level3Spawns.boss!.arenaTx;

/** Drop Tero onto Halvorsen's head and run one tick. */
function stomp(b: Halvorsen, ctx: UpdateCtx): void {
  const p = new Player(0, 0, 3);
  p.x = b.cx - p.w / 2;
  p.y = b.y - p.h + 6;
  p.prevBottom = b.y - 2;
  p.vy = 4;
  b.tick(ctx, p, []);
}

describe('Mr. Halvorsen', () => {
  it('every slide fits in the arena and its bullets land in open air on Floor 12', () => {
    const ctx = floor12();
    for (const s of SLIDES) {
      for (const [a, b, row] of s.bullets) {
        expect(a).toBeGreaterThanOrEqual(0);
        expect(b).toBeLessThan(15);
        expect(row).toBeGreaterThan(1);
        expect(row).toBeLessThan(8);
        for (let c = a; c <= b; c++) expect(ctx.map.tileAt(ARENA + c, row)).toBe(TileType.AIR);
      }
    }
  });

  it('the arena is walled on the right and open on the left until the meeting', () => {
    const ctx = floor12();
    for (let ty = 1; ty <= 7; ty++) {
      expect(ctx.map.tileAt(ARENA + 15, ty)).toBe(TileType.SOLID);
      expect(ctx.map.tileAt(ARENA - 1, ty)).toBe(TileType.AIR);
    }
  });

  it('starting the meeting projects the first slide\'s bullets', () => {
    const ctx = floor12();
    const b = new Halvorsen(ARENA);
    b.start(ctx.map);
    const [a, , row] = SLIDES[0].bullets[0];
    expect(ctx.map.tileAt(ARENA + a, row)).toBe(TileType.BULLET);
  });

  it('each stomp clicks to the next slide; the last one frees him', () => {
    const ctx = floor12();
    const b = new Halvorsen(ARENA);
    b.start(ctx.map);
    for (let hit = 1; hit < HALVORSEN_HP; hit++) {
      for (let i = 0; i < 120; i++) b.tick(ctx, new Player(0, 0, 3), []);   // wait out invulnerability
      stomp(b, ctx);
      expect(b.hp).toBe(HALVORSEN_HP - hit);
      expect(b.slideIndex).toBe(hit);
    }
    for (let i = 0; i < 120; i++) b.tick(ctx, new Player(0, 0, 3), []);
    stomp(b, ctx);
    expect(b.phase).toBe('freed');
    expect(b.freedNow).toBe(true);
    // No bullet points left once the meeting ends.
    for (let ty = 1; ty < 8; ty++) for (let c = 0; c < 15; c++) expect(ctx.map.tileAt(ARENA + c, ty)).not.toBe(TileType.BULLET);
  });

  it('after his speech he walks out through the door', () => {
    const ctx = floor12();
    const b = new Halvorsen(ARENA);
    b.start(ctx.map);
    for (let hit = 0; hit < HALVORSEN_HP; hit++) {
      for (let i = 0; i < 120; i++) b.tick(ctx, new Player(0, 0, 3), []);
      stomp(b, ctx);
    }
    for (let i = 0; i < 2000 && !b.walkedOut; i++) b.tick(ctx, new Player(0, 0, 3), []);
    expect(b.walkedOut).toBe(true);
    expect(b.x).toBeLessThan(ARENA * TILE_SIZE);
  });

  it('reset puts the slides away for the next attempt', () => {
    const ctx = floor12();
    const b = new Halvorsen(ARENA);
    b.start(ctx.map);
    b.reset(ctx.map);
    expect(b.phase).toBe('waiting');
    for (let ty = 1; ty < 8; ty++) for (let c = 0; c < 15; c++) expect(ctx.map.tileAt(ARENA + c, ty)).not.toBe(TileType.BULLET);
  });
});
