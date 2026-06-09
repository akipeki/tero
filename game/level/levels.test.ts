import { describe, it, expect } from 'vitest';
import { LEVELS, validateLevel } from './levels';

describe('levels registry', () => {
  it('contains three levels with unique ids', () => {
    expect(LEVELS).toHaveLength(3);
    const ids = new Set(LEVELS.map(L => L.id));
    expect(ids.size).toBe(3);
  });

  it('every level has tiles matching width × height', () => {
    for (const L of LEVELS) {
      expect(L.tiles.length).toBe(L.width * L.height);
    }
  });

  it('every level passes the validator without warnings', () => {
    for (const L of LEVELS) {
      expect(() => validateLevel(L)).not.toThrow();
    }
  });

  it('every level has a player spawn within bounds', () => {
    for (const L of LEVELS) {
      const { tx, ty } = L.spawns.player;
      expect(tx).toBeGreaterThanOrEqual(0);
      expect(tx).toBeLessThan(L.width);
      expect(ty).toBeGreaterThanOrEqual(0);
      expect(ty).toBeLessThan(L.height);
    }
  });

  it('every level has a goal within bounds', () => {
    for (const L of LEVELS) {
      const { tx, ty } = L.spawns.goal;
      expect(tx).toBeGreaterThanOrEqual(0);
      expect(tx).toBeLessThan(L.width);
      expect(ty).toBeGreaterThanOrEqual(0);
      expect(ty).toBeLessThan(L.height);
    }
  });
});
