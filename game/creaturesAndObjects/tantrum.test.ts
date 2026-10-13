import { describe, expect, it } from 'vitest';
import { Player } from './Player';
import { Flame } from './Flame';
import { Walker } from './Walker';
import { Hopper } from './Hopper';
import { Tilemap } from '../level/Tilemap';
import { buildLevel } from '../level/buildLevel';
import { ParticleSystem } from '../ParticleSystem';
import { ScreenShake } from '../ScreenShake';
import { TileType } from '../types';
import { TANTRUM_MAX, TANTRUM_FRAMES, RAGE_HURT } from '../constants';
import type { UpdateCtx } from './creaturesAndObjects';
import type { AudioManager } from '../AudioManager';
import { level1Tiles, LEVEL_WIDTH } from '../level/level1';

function ctxFor(rows: string[]): UpdateCtx {
  const { tiles, width, height } = buildLevel(rows);
  return {
    map: new Tilemap(tiles, width, height),
    particles: new ParticleSystem(),
    audio: { play: () => {} } as unknown as AudioManager,
    shake: new ScreenShake(),
    dt: 1 / 60,
  };
}

describe('tantrum meter', () => {
  it('fills, announces once, and caps at the max', () => {
    const p = new Player(0, 0, 3);
    p.addRage(60);
    expect(p.rageFull).toBe(false);
    p.addRage(60);
    expect(p.rage).toBe(TANTRUM_MAX);
    expect(p.rageJustFilled).toBe(true);
  });

  it('only starts when full, then empties the meter', () => {
    const p = new Player(0, 0, 3);
    expect(p.startTantrum()).toBe(false);
    p.addRage(TANTRUM_MAX);
    expect(p.startTantrum()).toBe(true);
    expect(p.isTantrum).toBe(true);
    expect(p.tantrumFrames).toBe(TANTRUM_FRAMES);
    expect(p.rage).toBe(0);
  });

  it('getting hurt makes Tero angrier; a raging Tero cannot be hurt', () => {
    const ctx = ctxFor(['....', '####']);
    const p = new Player(0, 0, 3);
    p.grow(ctx);
    p.hurt(ctx);
    expect(p.rage).toBe(RAGE_HURT);
    expect(p.isBig).toBe(false);

    const q = new Player(0, 0, 3);
    q.addRage(TANTRUM_MAX);
    q.startTantrum();
    q.hurt(ctx);
    expect(q.lives).toBe(3);
  });
});

describe('fire', () => {
  it('burns paperwork it touches and earns rage for it', () => {
    const ctx = ctxFor(['..%.', '####']);
    const f = new Flame(10, 16, 6, 0, 20, false);
    let burnt = 0;
    for (let i = 0; i < 20 && f.active; i++) { f.update(ctx); burnt += f.burned; }
    expect(ctx.map.tileAt(2, 0)).toBe(TileType.AIR);
    expect(burnt).toBe(1);
  });

  it('fizzles against solid walls', () => {
    const ctx = ctxFor(['..#.', '####']);
    const f = new Flame(10, 16, 6, 0, 20, true);
    for (let i = 0; i < 20 && f.active; i++) f.update(ctx);
    expect(f.active).toBe(false);
    expect(ctx.map.tileAt(2, 0)).toBe(TileType.SOLID);
  });
});

describe('sending workers home', () => {
  const rows = ['........', '........', '########'];

  it('a burnt clerk is freed, not killed, and skips off home', () => {
    const ctx = ctxFor(rows);
    const w = new Walker(4, 2, 'clerk');
    for (let i = 0; i < 30; i++) w.update(ctx);
    w.burn(ctx);
    expect(w.sentHome).toBe(true);
    expect(w.hittable).toBe(false);
    const x0 = w.x;
    for (let i = 0; i < 60; i++) w.update(ctx);
    expect(w.x).toBeLessThan(x0);
    for (let i = 0; i < 200; i++) w.update(ctx);
    expect(w.active).toBe(false);
  });

  it('robots are not people: they break instead', () => {
    const ctx = ctxFor(rows);
    const r = new Walker(4, 2, 'robot');
    r.burn(ctx);
    expect(r.sentHome).toBe(false);
    expect(r.hittable).toBe(false);
  });

  it('hoppers go home too', () => {
    const ctx = ctxFor(rows);
    const h = new Hopper(4, 2, 'manager');
    h.burn(ctx);
    expect(h.sentHome).toBe(true);
  });
});

describe('floor 1', () => {
  const tile = (tx: number, ty: number) => level1Tiles[ty * LEVEL_WIDTH + tx];

  it('a wall of paperwork pens in the Monday rush', () => {
    for (let ty = 1; ty <= 7; ty++) expect(tile(34, ty)).toBe(TileType.PAPER);
  });

  it('the supply-closet stash sits behind paper on the high shelf', () => {
    expect(tile(60, 2)).toBe(TileType.PAPER);
    for (let tx = 57; tx <= 63; tx++) expect(tile(tx, 3)).toBe(TileType.PLATFORM);
  });
});

describe('red tape', () => {
  it('slows Tero down and burns away', () => {
    const ctx = ctxFor(['..~~~~..', '..~~~~..', '########']);
    const p = new Player(2 * 32 + 5, 64 - 28, 3);
    p.actions = 2; // RIGHT
    for (let i = 0; i < 40; i++) p.update(ctx);
    expect(p.inTape).toBe(true);
    expect(Math.abs(p.vx)).toBeLessThan(1.3);

    const f = new Flame(2 * 32, 48, 4, 0, 20, false);
    for (let i = 0; i < 20 && f.active; i++) f.update(ctx);
    expect(ctx.map.tileAt(2, 1)).toBe(TileType.AIR);
  });
});
