import { describe, it, expect } from 'vitest';
import { stepBody, type PhysicsBody } from './Physics';
import { Tilemap } from '../level/Tilemap';
import { GRAVITY, MAX_FALL_SPD, TILE_SIZE } from '../constants';

function makeMap(): Tilemap {
  // 10×10 map: floor at row 5, otherwise air
  const w = 10, h = 10;
  const tiles = new Array(w * h).fill(0);
  for (let x = 0; x < w; x++) tiles[5 * w + x] = 1;  // SOLID floor
  return new Tilemap(tiles, w, h);
}

function makeBody(overrides: Partial<PhysicsBody> = {}): PhysicsBody {
  return {
    x: 50, y: 80, w: 16, h: 16,
    vx: 0, vy: 0, onGround: false,
    ...overrides,
  };
}

describe('stepBody', () => {
  it('applies gravity capped at MAX_FALL_SPD', () => {
    const map = makeMap();
    const body = makeBody({ y: 0, vy: MAX_FALL_SPD });
    stepBody(body, map);
    expect(body.vy).toBe(MAX_FALL_SPD);
  });

  it('lands on a solid tile and zeroes vy', () => {
    const map = makeMap();
    // Drop the body just above the floor
    const floorTop = 5 * TILE_SIZE;
    const body = makeBody({ y: floorTop - 17, vy: 5 });
    stepBody(body, map);
    expect(body.onGround).toBe(true);
    expect(body.vy).toBe(0);
    expect(body.y + body.h).toBe(floorTop);
  });

  it('reports ceiling hit when moving up into a solid', () => {
    // Build a single-cell ceiling at row 2
    const w = 10, h = 10;
    const tiles = new Array(w * h).fill(0);
    for (let x = 0; x < w; x++) tiles[2 * w + x] = 1;
    const map = new Tilemap(tiles, w, h);

    const ceilBottom = 3 * TILE_SIZE;
    const body = makeBody({ y: ceilBottom + 1, vy: -10 });
    const { hitCeiling } = stepBody(body, map);
    expect(hitCeiling).toBe(true);
  });

  it('stops horizontal movement at a wall', () => {
    const w = 10, h = 10;
    const tiles = new Array(w * h).fill(0);
    for (let y = 0; y < h; y++) tiles[y * w + 5] = 1;
    const map = new Tilemap(tiles, w, h);

    const wallLeft = 5 * TILE_SIZE;
    const body = makeBody({ x: wallLeft - 17, y: 0, vx: 8 });
    stepBody(body, map);
    expect(body.vx).toBe(0);
    expect(body.x + body.w).toBeLessThanOrEqual(wallLeft);
  });

  it('lets the body fall freely until it crosses the floor', () => {
    const map = makeMap();
    const floorTop = 5 * TILE_SIZE;
    const body = makeBody({ y: floorTop - 18, vy: 0 });

    // First step: gravity engaged, still in air.
    stepBody(body, map);
    expect(body.onGround).toBe(false);

    // Run a few more steps; should reliably land on the floor.
    for (let i = 0; i < 10 && !body.onGround; i++) stepBody(body, map);
    expect(body.onGround).toBe(true);
    expect(body.y + body.h).toBe(floorTop);
  });
});

// Make GRAVITY referenced so the import isn't dead.
void GRAVITY;
