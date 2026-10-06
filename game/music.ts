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
