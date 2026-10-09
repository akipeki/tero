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

import { SONGS, ARRANGEMENTS } from './music';
import { DECORS } from './render/office/decor';

describe('more songs and arrangements', () => {
  it('every song is well formed', () => {
    for (const s of Object.values(SONGS)) {
      expect(s.melody.length).toBe(s.chords.length);
      for (const bar of s.melody) {
        expect(bar).toHaveLength(8);
        for (const tok of bar) if (tok !== '-' && tok !== '.') expect(() => midi(tok.replace(/^da:/, ''))).not.toThrow();
      }
      for (const bar of s.chords) for (const c of bar) expect(chordTones(c)).toHaveLength(3);
      expect(s.drums).toHaveLength(8);
    }
  });

  it('every floor décor has its own arrangement', () => {
    for (const id of Object.keys(DECORS)) expect(ARRANGEMENTS[id], id).toBeDefined();
    for (const a of Object.values(ARRANGEMENTS)) if (a.drums) expect(a.drums).toHaveLength(8);
  });
});

import { FLOOR_SONGS, BOSS_SONGS } from './music';

describe('floor and boss songs', () => {
  it('every floor song and boss song exists', () => {
    for (const id of [...Object.values(FLOOR_SONGS), ...Object.values(BOSS_SONGS)]) expect(SONGS[id!], id).toBeDefined();
    for (const decor of Object.keys(FLOOR_SONGS)) expect(DECORS[decor as keyof typeof DECORS], decor).toBeDefined();
  });

  it('bass lines are one bar of known steps, and own-sound songs are complete', () => {
    for (const [id, s] of Object.entries(SONGS)) {
      if (s.bass) {
        expect(s.bass, id).toHaveLength(8);
        expect(s.bass, id).toMatch(/^[ROFTA.-]{8}$/);
        expect(s.bass[0], id).not.toBe('-');
      }
      if (s.voice) expect(s.bass, `${id} has its own sound, so its own bass`).toBeDefined();
    }
  });

  it('the main theme is untouched: the Mailroom has no song of its own', () => {
    expect(FLOOR_SONGS.basement).toBeUndefined();
    expect(SONGS.main.voice).toBeUndefined();
  });

  it('every new song carries the Da-da hook', () => {
    for (const [id, s] of Object.entries(SONGS)) {
      if (id === 'boss') continue;   // the original boss theme has no singing
      expect(s.melody.flat().some((t) => t.startsWith('da:')), id).toBe(true);
    }
  });
});
