import { describe, expect, it } from 'vitest';
import { FireSpread } from '../level/FireSpread';
import { Tilemap } from '../level/Tilemap';
import { buildLevel } from '../level/buildLevel';
import { Walker } from './Walker';
import { Hopper } from './Hopper';
import { Coin } from './Coin';
import { ParticleSystem } from '../ParticleSystem';
import { ScreenShake } from '../ScreenShake';
import { TileType } from '../types';
import type { UpdateCtx } from './creaturesAndObjects';
import type { AudioManager } from '../AudioManager';

const ctxFor = (rows: string[]): UpdateCtx => {
  const b = buildLevel(rows);
  return { map: new Tilemap(b.tiles, b.width, b.height), particles: new ParticleSystem(), audio: { play: () => {} } as unknown as AudioManager, shake: new ScreenShake(), dt: 1 / 60 };
};

describe('fire spreads like a fuse', () => {
  it('through connected paper and tape, but not across a gap', () => {
    const c = ctxFor(['%~~%.%', '%.....', '######']);
    const fire = new FireSpread();
    c.map.setTile(0, 0, TileType.AIR);          // a flame burnt the first tile
    fire.spread(c.map, 0, 0);
    let burnt = 0;
    for (let i = 0; i < 60; i++) fire.step(c.map, () => burnt++);
    expect(c.map.tileAt(3, 0)).toBe(TileType.AIR);      // along the row
    expect(c.map.tileAt(0, 1)).toBe(TileType.AIR);      // and down
    expect(c.map.tileAt(5, 0)).toBe(TileType.PAPER);    // the gap stopped it
    expect(burnt).toBe(4);
  });
});

describe('everyone does their job', () => {
  const ROOM = ['............', '............', '############'];

  it('a panicking clerk runs away from the tantrum, fast', () => {
    const c = ctxFor(ROOM);
    const w = new Walker(6, 2, 'clerk');
    for (let i = 0; i < 10; i++) w.update(c);
    w.flee(3 * 32, 60);
    const x0 = w.x;
    for (let i = 0; i < 20; i++) w.update(c);
    expect(w.x).toBeGreaterThan(x0 + 30);
  });

  it('a robot hops when told to (copying Tero)', () => {
    const c = ctxFor(ROOM);
    const r = new Walker(4, 2, 'robot');
    for (let i = 0; i < 20; i++) r.update(c);
    r.hop();
    expect(r.vy).toBeLessThan(0);
  });

  it('a guard chases towards Tero', () => {
    const c = ctxFor(ROOM);
    const g = new Walker(8, 2, 'guard');
    for (let i = 0; i < 10; i++) g.update(c);
    g.hunt(2 * 32, 60);
    const x0 = g.x;
    for (let i = 0; i < 20; i++) g.update(c);
    expect(g.x).toBeLessThan(x0 - 30);
  });

  it('a hopper in a panic hops away', () => {
    const c = ctxFor(ROOM);
    const h = new Hopper(6, 2, 'manager');
    for (let i = 0; i < 5; i++) h.update(c);
    h.flee(3 * 32, 120);
    const x0 = h.x;
    for (let i = 0; i < 60; i++) h.update(c);
    expect(h.x).toBeGreaterThan(x0);
  });

  it('a thrown bribe lands on the floor', () => {
    const c = ctxFor(ROOM);
    const coin = new Coin(0, 0).throwFrom(5 * 32, 20, 2, -4);
    for (let i = 0; i < 120; i++) coin.update(c);
    expect(coin.bribe).toBe(true);
    expect(coin.bottom).toBeLessThanOrEqual(2 * 32 + 1);
    expect(coin.takeable).toBe(true);
  });
});
