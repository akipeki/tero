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

describe('fake cameras', () => {
  it('turn to follow Tero when he is near, and go back to their thing when he leaves', () => {
    const c = new Cctv(4, 1, [2.5, 2.5], undefined, true);
    const angle = () => (c as unknown as { angle: number }).angle;
    c.track({ x: 4 * 32 + 16 + 100, y: 6 * 32 });          // down and to the right
    for (let i = 0; i < 120; i++) c.update();
    expect(angle()).toBeGreaterThan(0.2);
    expect(angle()).toBeLessThan(1.4);
    c.track(null);
    for (let i = 0; i < 200; i++) c.update();
    expect(Math.abs(angle() - 2.5)).toBeLessThan(0.3);
  });

  it('never raise the alarm', () => {
    const c = new Cctv(4, 1, [0, 0], undefined, true);
    expect(c.watch(tero(4), map(ROOM))).toBeNull();
  });
});

describe('when Tero gets hit', () => {
  it('a camera blinks red for a moment, then stops', () => {
    const c = new Cctv(4, 1, [0, 0]);
    const red = () => (c as unknown as { redFlash: number }).redFlash;
    c.flashRed();
    expect(red()).toBeGreaterThan(0);
    for (let i = 0; i < 60; i++) c.update();
    expect(red()).toBe(0);
  });
});
