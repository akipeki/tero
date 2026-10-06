import { describe, expect, it } from 'vitest';
import { Cctv } from './Cctv';
import { Player } from './Player';
import { Tilemap } from '../level/Tilemap';
import { buildLevel } from '../level/buildLevel';

const map = (rows: string[]) => { const b = buildLevel(rows); return new Tilemap(b.tiles, b.width, b.height); };
const ROOM = ['##########', '..........', '..........', '..........', '..........', '##########'];
const PILLAR = ['##########', '..........', '..........', '.....#....', '.....#....', '##########'];

function tero(tx: number, hidden = false): Player {
  const p = new Player(tx * 32 + 5, 5 * 32 - 28, 3);
  p.onGround = true;
  if (hidden) p.ducking = true;
  return p;
}

describe('security cameras', () => {
  it('a camera looking straight down spots Tero below it', () => {
    const c = new Cctv(4, 1, [0, 0]);
    expect(c.watch(tero(4), map(ROOM))).toBe('alarm');
  });

  it('but not off to the side of its cone', () => {
    const c = new Cctv(4, 1, [0, 0]);
    expect(c.watch(tero(8), map(ROOM))).toBeNull();
  });

  it('a pillar blocks the view', () => {
    const c = new Cctv(3, 1, [0.6, 0.6]);
    expect(c.watch(tero(7), map(PILLAR))).toBeNull();
  });

  it('a box is just a box', () => {
    const c = new Cctv(4, 1, [0, 0]);
    expect(c.watch(tero(4, true), map(ROOM))).toBe('box');
    expect(c.alarm).toBe(0);
  });

  it('it sweeps back and forth between its angles', () => {
    const c = new Cctv(4, 1, [-0.2, 0.2], 0.05);
    const seen = new Set<number>();
    for (let i = 0; i < 40; i++) { c.update(); seen.add(Math.sign(Math.round((c as unknown as { angle: number }).angle * 10))); }
    expect(seen.has(-1) && seen.has(1)).toBe(true);
  });
});
