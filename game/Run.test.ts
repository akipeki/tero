import { describe, expect, it } from 'vitest';
import { Run, formatMs } from './Run';
import { shareLines, DAD_HOURS } from './ShareCard';
import { DAD_THINGS } from './creaturesAndObjects/Gadgets';
import { LEVELS } from './level/levels';
import { TileType } from './types';

describe('the whole run', () => {
  it('adds up splits and totals; a replayed floor replaces its split', () => {
    const r = new Run();
    r.start();
    r.floorCleared('b_level_1', 'The Mailroom', 60_000, 7, 10, false);
    r.floorCleared('b_level_2', 'Cubicle Farm', 90_000, 4, 5, false);
    r.floorCleared('b_level_2', 'Cubicle Farm', 80_000, 0, 0, false);
    expect(r.totalMs).toBe(140_000);
    expect(r.data.sentHome).toBe(11);
    expect(r.data.finished).toBe(false);
    r.floorCleared('b_level_9', 'The Way Home', 70_000, 3, 1, true);
    expect(r.data.finished).toBe(true);
  });

  it('counts events and Dad\'s things once each', () => {
    const r = new Run();
    r.start();
    r.event('tantrum'); r.event('tantrum'); r.event('death');
    r.thing('watch'); r.thing('watch');
    expect(r.data.events.tantrum).toBe(2);
    expect(r.data.events.death).toBe(1);
    expect(r.data.things).toEqual(['watch']);
  });

  it('formats run times like a speedrun timer', () => {
    expect(formatMs(83_456)).toBe('1:23.45');
  });

  it('the share card says the thing', () => {
    const lines = shareLines({ totalMs: 754_000, splits: [], sentHome: 87, deaths: 12, tantrums: 9, syncs: 4, things: ['watch'], thingsTotal: 9, bestMs: null, newRecord: true });
    expect(lines[0]).toContain(DAD_HOURS);
    expect(lines[1]).toContain('12:34');
    expect(lines[2]).toContain('87');
  });
});

describe('Dad\'s things', () => {
  it('every floor hides exactly one, in open air, and every id is known', () => {
    const seen = new Set<string>();
    for (const L of LEVELS) {
      const things = (L.spawns.gadgets ?? []).filter((g) => g.type === 'thing');
      expect(things, L.name).toHaveLength(1);
      const t = things[0] as { tx: number; ty: number; id: string };
      expect(L.tiles[t.ty * L.width + t.tx], `${L.name} thing tile`).toBe(TileType.AIR);
      expect(DAD_THINGS[t.id], t.id).toBeDefined();
      seen.add(t.id);
    }
    expect(seen.size).toBe(Object.keys(DAD_THINGS).length);
  });
});
