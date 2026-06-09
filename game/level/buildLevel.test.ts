import { describe, it, expect } from 'vitest';
import { buildLevel } from './buildLevel';

describe('buildLevel', () => {
  it('builds a uniform level', () => {
    const L = buildLevel(['###', '...', '###']);
    expect(L.width).toBe(3);
    expect(L.height).toBe(3);
    expect(L.tiles).toEqual([1, 1, 1, 0, 0, 0, 1, 1, 1]);
  });

  it('throws when rows have inconsistent widths', () => {
    expect(() => buildLevel(['###', '##'])).toThrow(/row 1 has length 2/);
  });

  it('throws on unknown characters', () => {
    expect(() => buildLevel(['#?#'])).toThrow(/unknown char "\?"/);
  });

  it('maps DSL chars correctly', () => {
    const L = buildLevel(['#=^.']);
    expect(L.tiles).toEqual([1, 2, 3, 0]);
  });
});
