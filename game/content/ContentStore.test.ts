import { describe, it, expect, beforeEach } from 'vitest';
import { ContentStore } from './ContentStore';
import { validatePack, PackValidationError } from './serialize';
import { defaultPack } from './defaultPack';

describe('defaultPack', () => {
  it('passes validation', () => {
    expect(() => validatePack(defaultPack)).not.toThrow();
  });

  it('contains the 3 built-in levels', () => {
    const ids = Object.keys(defaultPack.levels);
    expect(ids).toContain('b_level_1');
    expect(ids).toContain('b_level_2');
    expect(ids).toContain('b_level_3');
  });

  it('contains the 6 built-in entity bases', () => {
    const bases = Object.values(defaultPack.entities).map(e => e.base).sort();
    expect(bases).toEqual([
      'castle', 'coin', 'hopper', 'mushroom', 'question_block', 'walker',
    ].sort());
  });
});

describe('ContentStore', () => {
  let store: ContentStore;
  beforeEach(() => {
    if (typeof window !== 'undefined') window.localStorage.clear();
    store = new ContentStore();
  });

  it('exposes built-ins as readable but unwritable', () => {
    expect(store.getLevel('b_level_1')).not.toBeNull();
    expect(() => store.putLevel({ ...store.getLevel('b_level_1')! })).toThrow(/built-in/);
  });

  it('merges user pack over built-in', () => {
    const id = store.forkBuiltIn('level', 'b_level_1');
    const forked = store.getLevel(id)!;
    expect(forked.id).toBe(id);
    expect(forked.name).toMatch(/copy/i);
    expect(store.merged.levels[id]).toBeDefined();
    expect(store.merged.levels['b_level_1']).toBeDefined();
  });

  it('roundtrips through exportJsonBlob + importJson', async () => {
    const id = store.forkBuiltIn('level', 'b_level_1');
    store.putLevel({
      ...store.getLevel(id)!,
      name: 'Hello World',
    });
    const text = await store.exportJsonBlob().text();

    const fresh = new ContentStore();
    fresh.resetUserPack();
    fresh.importJson(text, 'replace');
    expect(fresh.getLevel(id)?.name).toBe('Hello World');
  });

  it('importJson rejects malformed packs', () => {
    expect(() => store.importJson('{}')).toThrow(PackValidationError);
    expect(() => store.importJson('not json')).toThrow();
  });

  it('forkBuiltIn returns a unique fresh id', () => {
    const a = store.forkBuiltIn('entity', 'b_entity_walker');
    const b = store.forkBuiltIn('entity', 'b_entity_walker');
    expect(a).not.toBe(b);
    expect(store.getEntity(a)?.base).toBe('walker');
  });

  it('subscribe fires on mutation', () => {
    let count = 0;
    const unsub = store.subscribe(() => count++);
    store.forkBuiltIn('sprite', 'b_sprite_player_idle');
    expect(count).toBeGreaterThan(0);
    unsub();
  });

  it('resetUserPack empties everything', () => {
    store.forkBuiltIn('level', 'b_level_1');
    expect(Object.keys(store.userPack.levels).length).toBe(1);
    store.resetUserPack();
    expect(Object.keys(store.userPack.levels).length).toBe(0);
  });
});

describe('validatePack', () => {
  it('reports the bad path', () => {
    try {
      validatePack({ meta: { id: 'x', name: 1, author: '', version: 1 }, sprites: {}, entities: {}, levels: {}, story: { chapters: [], cards: {} } });
      throw new Error('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(PackValidationError);
      expect((err as PackValidationError).path).toBe('meta.name');
    }
  });

  it('re-runs buildLevel on every level', () => {
    const bad = {
      ...structuredClone(defaultPack),
      levels: {
        b_level_1: {
          ...defaultPack.levels['b_level_1'],
          rows: ['##', '#'],   // jagged
        },
      },
    };
    expect(() => validatePack(bad)).toThrow(/row 1 has length/);
  });
});
