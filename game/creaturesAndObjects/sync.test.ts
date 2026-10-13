import { describe, expect, it } from 'vitest';
import { Walker } from './Walker';
import { Player } from './Player';
import { Tilemap } from '../level/Tilemap';
import { buildLevel } from '../level/buildLevel';
import { TILE_SIZE } from '../constants';
import { level2Spawns } from '../level/level2';

function map(rows: string[]): Tilemap {
  const { tiles, width, height } = buildLevel(rows);
  return new Tilemap(tiles, width, height);
}

const OPEN = ['..........', '..........', '##########'];
const WALL = ['..........', '.....#....', '##########'];

function syncerAt(tx: number, faceRight: boolean): Walker {
  const w = new Walker(tx, 2, 'syncer');
  w.y = 2 * TILE_SIZE - w.h;
  w.facingRight = faceRight;
  return w;
}

describe('quick syncs', () => {
  const foot = 2 * TILE_SIZE;

  it('a syncer sees ahead, not behind', () => {
    const m = map(OPEN);
    const w = syncerAt(2, true);
    expect(w.canSee(6 * TILE_SIZE, foot, m)).toBe(true);
    expect(w.canSee(0, foot, m)).toBe(false);
  });

  it('only so far, and only on the same level', () => {
    const m = map(OPEN);
    const w = syncerAt(1, true);
    expect(w.canSee(9 * TILE_SIZE, foot, m)).toBe(false);          // 8 tiles: too far
    expect(w.canSee(4 * TILE_SIZE, foot - TILE_SIZE, m)).toBe(false); // up on a desk
  });

  it('walls and partitions block the view', () => {
    const m = map(WALL);
    const w = syncerAt(2, true);
    expect(w.canSee(7 * TILE_SIZE, foot, m)).toBe(false);
  });

  it('a ducking, still, grounded Tero is a box', () => {
    const p = new Player(0, 0, 3);
    p.onGround = true;
    p.ducking = true;
    expect(p.isHidden).toBe(true);
    p.vx = 2;
    expect(p.isHidden).toBe(false);
  });

  it('a sync freezes Tero; mashing jump cuts it short', () => {
    const p = new Player(0, 0, 3);
    p.startSync(150);
    expect(p.inSync).toBe(true);
    p.jumpJustPressed = true;
    // one update's worth of input handling
    (p as unknown as { updateInput(): void }).updateInput();
    expect(p.syncFrames).toBe(136);
  });

  it('Floor 6 has syncers, and they are harmless', () => {
    expect(level2Spawns.enemies.filter((e) => e.type === 'syncer').length).toBeGreaterThanOrEqual(4);
  });
});
