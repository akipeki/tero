import { afterEach, describe, expect, it } from 'vitest';
import { t, tf, setLang } from './i18n';
import { FI } from './content/lang/fi';
import { STORY } from './content/story/script';
import { compileStory } from './content/story/compile';
import { DAD_THINGS } from './creaturesAndObjects/Gadgets';

describe('languages', () => {
  afterEach(() => setLang('en'));

  it('English is the text itself; Finnish looks it up', () => {
    expect(t('TANTRUM!!')).toBe('TANTRUM!!');
    setLang('fi');
    expect(t('TANTRUM!!')).toBe('RAIVARI!!');
    expect(t('a line nobody translated')).toBe('a line nobody translated');
    expect(tf('{n} RESIGNATIONS!', { n: 4 })).toBe('4 IRTISANOUTUMISTA!');
  });

  it('every story line and every speaker has a Finnish translation', () => {
    const { cards } = compileStory(STORY);
    const missing = Object.values(cards)
      .flatMap((c) => [c.text, ...(c.speaker && c.speaker !== 'ELVIS' ? [c.speaker] : [])])
      .filter((s) => !(s in FI) && !/^(Tero\.|\.\.\.GRRRRR\.|Sky\. Net\.)$/.test(s));
    expect(missing).toEqual([]);
  });

  it('Dad\'s things are translated too', () => {
    for (const d of Object.values(DAD_THINGS)) {
      expect(FI[d.name], d.name).toBeDefined();
      expect(FI[d.note], d.note).toBeDefined();
    }
  });
});
