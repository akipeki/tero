// file: game/music.ts
//
// ── THE THEME SONG ── "Where Is Dada?", a 16-bar office-muzak lullaby.
// Edit the notes here; AudioManager plays them. Each bar is 8 eighth-notes.
//
//   'E5'      play a note (name + octave; sharps as 'F#5')
//   '-'       hold the previous note
//   '.'       rest
//   'da:G5'   Tero sings "da" on that pitch (the vocal hook)
//
// Bars 4 and 16 are the hook: "Da-da!" (falling, a toddler calling out) and
// "Da-da?" (rising, the question in the title).

export const BPM = 128;

export const MELODY: string[][] = [
  // A — the theme
  ['E5', '-', 'G5', '-', 'C6', '-', 'B5', 'A5'],      // C
  ['G5', '-', 'E5', '-', 'C5', '-', '-', '.'],        // Am
  ['F5', '-', 'A5', '-', 'C6', '-', 'A5', 'F5'],      // F
  ['G5', '-', '-', '.', 'da:G5', '-', 'da:E5', '-'],  // G   "Da-da!"
  ['E5', '-', 'G5', '-', 'C6', '-', 'D6', 'E6'],      // C
  ['D6', '-', 'C6', '-', 'A5', '-', '-', '.'],        // Am
  ['F5', 'A5', 'C6', 'A5', 'B5', '-', 'D6', '-'],     // F G
  ['C6', '-', '-', '.', 'G5', '-', 'C6', '-'],        // C
  // B — the sad bit (somebody's been in a meeting since March)
  ['A5', '-', '-', 'B5', 'C6', '-', 'B5', 'A5'],      // Am
  ['A5', '-', 'G5', '-', 'F5', '-', '-', '.'],        // F
  ['G5', '-', '-', 'A5', 'G5', '-', 'E5', 'C5'],      // C
  ['D5', '-', '-', '.', 'D5', 'E5', 'F5', 'G5'],      // G
  ['A5', '-', '-', 'B5', 'C6', '-', 'D6', 'E6'],      // Am
  ['F6', '-', 'E6', '-', 'D6', '-', 'C6', '-'],       // F
  ['B5', '-', 'G5', '-', 'D6', '-', 'B5', '-'],       // G
  ['G5', '-', '.', '.', 'da:E5', '-', 'da:G5', '-'],  // G   "Da-da?"
];

/** Chord per bar: root note + quality. Two entries = two chords, 4 steps each. */
export const CHORDS: string[][] = [
  ['C3'], ['A2m'], ['F2'], ['G2'],
  ['C3'], ['A2m'], ['F2', 'G2'], ['C3'],
  ['A2m'], ['F2'], ['C3'], ['G2'],
  ['A2m'], ['F2'], ['G2'], ['G2'],
];

/** Drum pattern per bar: k = kick, s = snare, h = hat, . = nothing. */
export const DRUMS = 'khshkhsh';

const NOTE_INDEX: Record<string, number> = {
  C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11,
};

/** 'A4' → 69. Throws on a typo so a bad note fails loudly in tests. */
export function midi(name: string): number {
  const m = /^([A-G]#?)(\d)$/.exec(name);
  if (!m) throw new Error(`music.ts: bad note "${name}"`);
  return 12 * (Number(m[2]) + 1) + NOTE_INDEX[m[1]];
}

export function hz(midiNote: number): number {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

/** A chord token like 'A2m' → [root, third, fifth] as midi numbers. */
export function chordTones(token: string): number[] {
  const minor = token.endsWith('m');
  const root = midi(minor ? token.slice(0, -1) : token);
  return [root, root + (minor ? 3 : 4), root + 7];
}

// ─── More songs ──────────────────────────────────────────────────────────────

export type SongId = 'main' | 'boss' | 'vents' | 'compliance' | 'cubicles' | 'boardroom';

/** Instruments the sequencer can play. The plain waveforms, plus a few
 *  built from them (see AudioManager.instrument). */
export type Voice = OscillatorType | 'pluck' | 'organ' | 'brass' | 'bell' | 'harpsi';

export interface Song {
  bpm: number;
  melody: string[][];
  chords: string[][];
  drums: string;
  /** A floor song with its own sound. Without it the floor's arrangement
   *  decides (that's how the main theme works on every floor). */
  voice?: Voice;
  leadGain?: number;
  /** Bass per bar, 8 steps: R root · O octave · F fifth · T third ·
   *  A approach (a semitone under the next chord's root) · - hold · . rest */
  bass?: string;
  bassVoice?: Voice;
  /** A soft held chord under everything. */
  pad?: boolean;
  arp?: 'up' | 'fast' | 'off';
  /** Off-beat eighths pushed late by this fraction of a step (jazz feel). */
  swing?: number;
}

/** BOSS: the theme's angry cousin, in A minor. Plays while a boss fights. */
const BOSS_MELODY: string[][] = [
  ['A4', '-', 'C5', '-', 'E5', '-', 'A5', '-'],       // Am
  ['G5', '-', 'E5', '-', 'C5', '-', 'D5', 'E5'],      // F
  ['F5', '-', 'E5', '-', 'D5', '-', 'B4', '-'],       // G
  ['E5', '-', '-', '-', 'G#4', '-', 'B4', '-'],       // E
  ['A4', '-', 'C5', '-', 'E5', '-', 'A5', '-'],       // Am
  ['B5', '-', 'A5', '-', 'G5', '-', 'E5', '-'],       // F
  ['F5', '-', 'D5', '-', 'G5', '-', 'B4', '-'],       // G
  ['A4', '-', '-', '.', 'E5', 'D5', 'C5', 'B4'],      // E
];

/** THE VENTS: Elvis's song. Bouncy, G major, and the "Da-da!" is happy. */
const VENTS_MELODY: string[][] = [
  ['G5', '-', 'B5', '-', 'D6', '-', 'B5', '-'],       // G
  ['C6', '-', 'E6', '-', 'D6', '-', 'C6', '-'],       // C
  ['B5', '-', 'G5', '-', 'E5', '-', 'G5', '-'],       // Em
  ['A5', '-', '-', '.', 'da:D6', '-', 'da:B5', '-'],  // D   "Da-da!"
  ['G5', '-', 'B5', '-', 'D6', '-', 'G6', '-'],       // G
  ['E6', '-', 'D6', '-', 'C6', '-', 'A5', '-'],       // C
  ['B5', '-', 'G5', '-', 'A5', '-', 'F#5', '-'],      // D
  ['G5', '-', '-', '.', 'G5', 'A5', 'B5', '-'],       // G
];

/** FLOOR 3, COMPLIANCE: spy music. D minor, staccato plucks, a sneaky
 *  bass, the Da-da hook over the A chord (bar 4). */
const COMPLIANCE_MELODY: string[][] = [
  ['D5', '.', 'F5', '.', 'E5', '.', 'D5', '.'],         // Dm
  ['C#5', '.', 'D5', '.', '.', 'A4', '-', '.'],         // Dm
  ['D5', '.', 'F5', '.', 'G5', '.', 'F5', 'D5'],        // Bb
  ['E5', '-', '-', '.', 'da:G5', '-', 'da:E5', '-'],    // A    "Da-da!"
  ['A5', '.', 'F5', '.', 'D5', '.', 'F5', '.'],         // Dm
  ['G5', '.', 'A#5', '.', 'A5', '.', 'G5', '.'],        // Gm
  ['E5', '.', 'C#5', '.', 'E5', '.', 'A5', '.'],        // A
  ['D5', '-', '-', '.', '.', '.', 'A4', '.'],           // Dm
];

/** FLOOR 6, THE CUBICLE FARM: a training-video funk tune. F major, synth
 *  brass stabs, octave bass; bar 4 is the theme's own Da-da. */
const CUBICLES_MELODY: string[][] = [
  ['A5', '.', 'C6', 'A5', '.', 'F5', 'G5', '.'],        // F
  ['A5', '-', '-', '.', 'C6', '.', 'A5', '.'],          // Am
  ['A#5', '.', 'D6', 'A#5', '.', 'F5', 'G5', 'A5'],     // Bb
  ['G5', '-', '-', '.', 'da:G5', '-', 'da:E5', '-'],    // C    "Da-da!"
  ['C6', '.', 'A5', 'C6', '.', 'F6', 'E6', '.'],        // F
  ['D6', '-', 'C6', '.', 'A5', '.', 'F5', '.'],         // Dm
  ['D6', '.', 'C6', '.', 'A#5', '.', 'G5', '.'],        // Bb C
  ['F5', '-', '-', '.', 'F5', 'G5', 'A5', 'C6'],        // F
];

/** FLOOR 12, THE BOARDROOM: smooth jazz for the keynote walk-on. E-flat,
 *  a Rhodes-ish bell, an organ pad, a swung walking bass. */
const BOARDROOM_MELODY: string[][] = [
  ['G5', '-', 'A#5', '-', 'D#6', '-', 'D6', 'A#5'],     // Eb
  ['C6', '-', '-', '.', 'G5', '-', 'D#5', '.'],         // Cm
  ['G#5', '-', 'C6', '-', 'D#6', 'D6', 'C6', 'G#5'],    // Fm
  ['A#5', '-', '-', '.', 'da:A#5', '-', 'da:G5', '-'],  // Bb   "Da-da!"
  ['D#6', '-', 'D6', '-', 'A#5', '-', 'G5', '.'],       // Eb
  ['G#5', '-', 'C6', '-', 'D#6', '-', 'F6', '.'],       // Ab
  ['F6', '-', 'D#6', '-', 'D6', '-', 'A#5', '.'],       // Bb
  ['D#6', '-', '-', '-', '.', '.', 'A#5', 'C6'],        // Eb
];

/** Which floors have their own song (by décor). Everything else plays the
 *  main theme in the floor's arrangement. */
export const FLOOR_SONGS: Partial<Record<string, SongId>> = {
  vents: 'vents',
  compliance: 'compliance',
  cubicles: 'cubicles',
  boardroom: 'boardroom',
};

export const SONGS: Record<SongId, Song> = {
  main:  { bpm: BPM, melody: MELODY, chords: CHORDS, drums: DRUMS },
  boss:  { bpm: 150, melody: BOSS_MELODY, chords: [['A2m'], ['F2'], ['G2'], ['E2'], ['A2m'], ['F2'], ['G2'], ['E2']], drums: 'kkshkksh' },
  vents: { bpm: 136, melody: VENTS_MELODY, chords: [['G2'], ['C3'], ['E2m'], ['D3'], ['G2'], ['C3'], ['D3'], ['G2']], drums: 'khshkhsh' },
  compliance: {
    bpm: 118, melody: COMPLIANCE_MELODY,
    chords: [['D2m'], ['D2m'], ['A#2'], ['A2'], ['D2m'], ['G2m'], ['A2'], ['D2m']],
    drums: 'k..hs.h.', voice: 'pluck', leadGain: 0.42,
    bass: 'R.RFR.FA', bassVoice: 'pluck', arp: 'off',
  },
  cubicles: {
    bpm: 116, melody: CUBICLES_MELODY,
    chords: [['F2'], ['A2m'], ['A#2'], ['C3'], ['F2'], ['D3m'], ['A#2', 'C3'], ['F2']],
    drums: 'khskkhsh', voice: 'brass', leadGain: 0.22,
    bass: 'R.OR.RO.', bassVoice: 'square', arp: 'up',
  },
  boardroom: {
    bpm: 92, melody: BOARDROOM_MELODY,
    chords: [['D#3'], ['C3m'], ['F2m'], ['A#2'], ['D#3'], ['G#2'], ['A#2'], ['D#3']],
    drums: 'kh.hsh.h', voice: 'bell', leadGain: 0.34,
    bass: 'R.T.F.A.', bassVoice: 'triangle', pad: true, arp: 'off', swing: 0.28,
  },
};

// ─── Arrangements: every floor plays the theme its own way ───────────────────

export interface Arrangement {
  /** Lead instrument. */
  lead: OscillatorType;
  /** Semitones up/down from the written key. */
  transpose: number;
  /** BPM added to the song's. */
  bpm: number;
  /** Arpeggio: 'up' = one note per eighth, 'fast' = two, 'off' = none. */
  arp: 'up' | 'fast' | 'off';
  /** Drum pattern override (k kick · s snare · h hat · . rest). */
  drums?: string;
  leadGain?: number;
}

export const ARRANGEMENTS: Record<string, Arrangement> = {
  basement:  { lead: 'triangle', transpose: 0,  bpm: -10, arp: 'off',  drums: 'k.h.k.h.' },                 // the boiler-room lullaby
  cubicles:  { lead: 'square',   transpose: 0,  bpm: 0,   arp: 'up' },
  boardroom: { lead: 'square',   transpose: -2, bpm: -4,  arp: 'up',   drums: 'k.hsk.hs' },                 // a bossa nova nobody asked for
  legal:     { lead: 'sawtooth', transpose: -3, bpm: -6,  arp: 'up',   leadGain: 0.2 },                     // billed hourly
  lab:       { lead: 'square',   transpose: 2,  bpm: 4,   arp: 'fast' },
  security:  { lead: 'square',   transpose: 0,  bpm: 6,   arp: 'up',   drums: 'kkhskkhs' },
  compliance:{ lead: 'square',   transpose: -1, bpm: -4,  arp: 'up',   drums: 'k.hsk.h.', leadGain: 0.26 },    // tiptoe music
  executive: { lead: 'triangle', transpose: 5,  bpm: -12, arp: 'off',  drums: 'k..hk..h' },                 // lobby lounge
  penthouse: { lead: 'sine',     transpose: 0,  bpm: -6,  arp: 'up',   leadGain: 0.42 },
  vents:     { lead: 'triangle', transpose: 0,  bpm: 0,   arp: 'up',   leadGain: 0.4 },
  stairwell: { lead: 'square',   transpose: 0,  bpm: 38,  arp: 'fast', drums: 'kkskkkks' },                // RUN
};

export const DEFAULT_ARRANGEMENT: Arrangement = ARRANGEMENTS.cubicles;
