import { describe, it, expect } from 'vitest';
import { compileStory, defineStory } from './compile';
import { findMissingCardRefs } from './validate';
import { defaultPack } from '../defaultPack';
import { validatePack } from '../serialize';

describe('compileStory', () => {
  const script = defineStory({
    cast: { tero: { name: 'TERO', portrait: 'b_sprite_player_idle' } },
    chapters: [{ id: 'c', name: 'Ch', levels: ['1'], intro: [{ text: 'narration' }] }],
    levels: {
      '1': {
        intro: [{ who: 'tero', text: 'hi' }],
        triggers: [{ atTile: 10, lines: [{ text: 'beat' }] }],
      },
    },
  });

  it('generates ids, speakers and portraits', () => {
    const out = compileStory(script);
    expect(out.chapters[0]).toMatchObject({
      id: 'b_chapter_c', levelIds: ['b_level_1'], intro: ['b_card_chapter_c_intro_0'],
    });
    expect(out.cards.b_card_chapter_c_intro_0).toEqual({ id: 'b_card_chapter_c_intro_0', text: 'narration' });
    expect(out.cards.b_card_level_1_intro_0).toMatchObject({ speaker: 'TERO', portrait: 'b_sprite_player_idle' });
    expect(out.levels.b_level_1.triggers).toEqual([{ tx: 10, cards: ['b_card_level_1_trigger_0_0'] }]);
    expect(out.levels.b_level_1.outro).toBeUndefined();
  });
});

describe('built-in story', () => {
  it('has no dangling card references', () => {
    expect(findMissingCardRefs(defaultPack)).toEqual([]);
  });

  it('passes pack validation', () => {
    expect(() => validatePack(structuredClone(defaultPack))).not.toThrow();
  });

  it('flags references to missing cards', () => {
    const pack = structuredClone(defaultPack);
    pack.levels.b_level_1.intro = ['nope'];
    expect(findMissingCardRefs(pack)).toEqual(['level b_level_1 intro → nope']);
  });

  it('rejects malformed triggers', () => {
    const pack = structuredClone(defaultPack) as unknown as { levels: Record<string, { triggers: unknown }> };
    pack.levels.b_level_1.triggers = [{ tx: 'x', cards: [] }];
    expect(() => validatePack(pack)).toThrow(/triggers\.0\.tx/);
  });
});
