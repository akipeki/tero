import { describe, expect, it } from 'vitest';
import { CHORDS, DRUMS, MELODY, chordTones, midi } from './music';

describe('theme song', () => {
  it('every bar has 8 steps and a chord', () => {
    expect(MELODY.length).toBe(CHORDS.length);
    for (const bar of MELODY) expect(bar).toHaveLength(8);
    expect(DRUMS).toHaveLength(8);
  });

  it('every note and chord parses', () => {
    for (const bar of MELODY) {
      for (const tok of bar) {
        if (tok === '-' || tok === '.') continue;
        expect(() => midi(tok.replace(/^da:/, ''))).not.toThrow();
      }
    }
    for (const bar of CHORDS) for (const c of bar) expect(chordTones(c)).toHaveLength(3);
  });

  it('a bar never starts by holding nothing', () => {
    expect(MELODY[0][0]).not.toBe('-');
  });

  it('midi is anchored at A4 = 69', () => {
    expect(midi('A4')).toBe(69);
    expect(midi('C4')).toBe(60);
  });
});
