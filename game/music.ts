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

export type SongId =
  | 'main' | 'boss' | 'vents' | 'compliance' | 'cubicles' | 'boardroom'
  | 'legal' | 'lab' | 'security' | 'executive' | 'penthouse' | 'escape'
  | 'boss_chad' | 'boss_halvorsen'
  | 'jingle_vhs' | 'jingle_hold' | 'jingle_call' | 'jingle_battle' | 'jingle_fineprint'
  | 'jingle_fps' | 'jingle_premium' | 'jingle_win' | 'jingle_race';

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
  /** Bass loudness (default 0.5). Plucked basses die away fast and need more. */
  bassGain?: number;
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

/** FLOOR 13, LEGAL: a harpsichord in A minor, baroque runs over a
 *  continuo bass, and a clock ticking (billed hourly). */
const LEGAL_MELODY: string[][] = [
  ['A5', 'C6', 'B5', 'A5', 'E5', 'A5', 'C6', 'E6'],      // Am
  ['G#5', 'B5', 'E6', 'D6', 'C6', 'B5', 'A5', 'G#5'],    // E
  ['A5', '-', 'E5', '-', 'C5', 'E5', 'A5', 'C6'],        // Am
  ['B5', '-', '-', '.', 'da:B5', '-', 'da:G5', '-'],     // G    "Da-da!"
  ['C6', 'E6', 'D6', 'C6', 'G5', 'C6', 'E6', 'G6'],      // C
  ['F6', 'E6', 'D6', 'C6', 'A5', 'F5', 'A5', 'C6'],      // F
  ['B5', 'G#5', 'E5', 'G#5', 'B5', 'D6', 'C6', 'B5'],    // E
  ['A5', '-', '-', '.', 'E5', '-', 'A4', '.'],           // Am
];

/** FLOOR 21, R&D: glitchy techno in E minor, a stuck little riff, fast
 *  arpeggios, four on the floor. */
const LAB_MELODY: string[][] = [
  ['E5', '.', 'E5', 'G5', '.', 'E5', 'B5', '.'],         // Em
  ['E5', '.', 'E5', 'G5', '.', 'C6', 'B5', '.'],         // C
  ['F#5', '.', 'F#5', 'A5', '.', 'F#5', 'D6', '.'],      // D
  ['B4', '-', '-', '.', 'da:G5', '-', 'da:E5', '-'],     // Em   "Da-da!"
  ['E6', '.', 'D6', 'B5', '.', 'G5', 'A5', 'B5'],        // Em
  ['C6', '.', 'B5', 'G5', '.', 'E5', 'G5', 'A5'],        // C
  ['A5', '.', 'F#5', 'D5', '.', 'F#5', 'A5', 'D6'],      // D
  ['D#6', '-', 'B5', '-', 'F#5', '-', 'D#5', '.'],       // B
];

/** FLOOR 27, SECURITY: tense surveillance synth in C minor. Long notes,
 *  a low pulse, a held pad, almost no drums. */
const SECURITY_MELODY: string[][] = [
  ['C5', '-', '-', '-', 'D#5', '-', 'D5', '-'],          // Cm
  ['C5', '-', '-', '-', '.', '.', 'G4', '.'],            // Cm
  ['C5', '-', 'D#5', '-', 'G5', '-', 'F5', '-'],         // Ab
  ['D5', '-', '-', '.', 'da:D5', '-', 'da:B4', '-'],     // G    "Da-da?"
  ['G5', '-', '-', '-', 'F5', '-', 'D#5', '-'],          // Cm
  ['F5', '-', 'G#5', '-', 'G5', '-', 'F5', '-'],         // Fm
  ['D5', '-', 'F5', '-', 'D5', '-', 'B4', '-'],          // G
  ['C5', '-', '-', '-', '-', '-', '.', '.'],             // Cm
];

/** FLOOR 30, THE EXECUTIVE WING: lounge and yacht rock in D major.
 *  Vibraphone, a lazy swing, a pad, nobody in a hurry. */
const EXECUTIVE_MELODY: string[][] = [
  ['F#5', '-', 'A5', '-', 'D6', '-', 'C#6', '-'],        // D
  ['B5', '-', '-', '.', 'F#5', '-', 'D5', '.'],          // Bm
  ['B5', '-', 'D6', '-', 'G6', '-', 'F#6', 'E6'],        // G
  ['E6', '-', '-', '.', 'da:E6', '-', 'da:C#6', '-'],    // A    "Da-da!"
  ['D6', '-', 'F#6', '-', 'A6', '-', 'F#6', '-'],        // D
  ['F#6', '-', 'D6', '-', 'B5', '-', 'D6', '.'],         // Bm
  ['B5', '-', 'D6', '-', 'C#6', '-', 'E6', '-'],         // G A
  ['D6', '-', '-', '-', '.', '.', 'A5', '.'],            // D
];

/** FLOOR 33, THE SANCTUM: the Shareholders' Anthem. A church organ in
 *  G minor, half notes, a slow march. */
const PENTHOUSE_MELODY: string[][] = [
  ['G5', '-', '-', '-', 'A#5', '-', 'D6', '-'],          // Gm
  ['D6', '-', 'C6', '-', 'A5', '-', 'F#5', '-'],         // D
  ['G5', '-', 'A#5', '-', 'D6', '-', 'G6', '-'],         // Gm
  ['F#6', '-', '-', '.', 'da:A5', '-', 'da:F#5', '-'],   // D    "Da-da!"
  ['G6', '-', '-', '-', 'D#6', '-', 'A#5', '-'],         // Eb
  ['C6', '-', 'D#6', '-', 'G6', '-', 'D#6', '-'],        // Cm
  ['D6', '-', '-', '-', 'F#5', '-', 'A5', '-'],          // D
  ['G5', '-', '-', '-', '-', '-', '.', '.'],             // Gm
];

/** BOSS, CHAD: a sales jingle (C major, cheerful) that turns aggressive. */
const CHAD_MELODY: string[][] = [
  ['C6', '.', 'G5', '.', 'E5', 'G5', 'C6', '.'],         // C
  ['B5', '.', 'G5', '.', 'D5', 'G5', 'B5', '.'],         // G
  ['A5', '.', 'E5', '.', 'C5', 'E5', 'A5', '.'],         // Am
  ['G#5', '-', '-', '.', 'da:B5', '-', 'da:G#5', '-'],   // E    "Da-da!"
  ['A5', 'A5', '.', 'A5', 'C6', '.', 'A5', '.'],         // F
  ['B5', 'B5', '.', 'B5', 'D6', '.', 'B5', '.'],         // G
  ['C6', 'B5', 'A5', 'G#5', 'E5', '.', 'G#5', '.'],      // Am E
  ['A5', '-', '-', '.', 'E5', 'D5', 'C5', 'B4'],         // Am
];

/** BOSS, MR. HALVORSEN: the keynote walk-on fanfare, D major, pompous. */
const HALVORSEN_MELODY: string[][] = [
  ['D5', '-', 'F#5', '-', 'A5', '-', 'D6', '-'],         // D
  ['B5', '-', '-', '.', 'G5', '-', 'B5', '-'],           // G
  ['C#6', '-', 'E6', '-', 'A5', '-', 'C#6', '-'],        // A
  ['D6', '-', '-', '.', 'da:F#6', '-', 'da:D6', '-'],    // D    "Da-da!"
  ['D6', '-', 'B5', '-', 'F#5', '-', 'B5', '-'],         // Bm
  ['G5', '-', 'B5', '-', 'D6', '-', 'G6', '-'],          // G
  ['E6', '-', 'C#6', '-', 'A5', '-', 'E6', '-'],         // A
  ['D6', '-', '-', '-', 'A5', '.', 'D6', '.'],           // D
];

// ─── Interlude jingles: short loops while the office takes over ─────────────

/** Mandatory Onboarding: 1987 corporate training-video synth pop. */
const VHS_MELODY: string[][] = [
  ['E5', '-', 'G5', '-', 'C6', '-', 'G5', '-'],          // C
  ['A5', '-', '-', '.', 'F5', '-', 'A5', '-'],           // F
  ['B5', '-', 'D6', '-', 'G5', '-', 'B5', '-'],          // G
  ['C6', '-', '-', '.', 'da:G5', '-', 'da:E5', '-'],     // C
  ['A5', '-', 'C6', '-', 'E6', '-', 'C6', '-'],          // Am
  ['F5', '-', 'A5', '-', 'C6', '-', 'A5', '-'],          // F
  ['G5', '-', 'B5', '-', 'D6', '-', 'F6', '-'],          // G
  ['E6', '-', '-', '-', 'C6', '.', '.', '.'],            // C
];
/** The CAPTCHA: "please hold", light bossa on a bell. */
const HOLD_MELODY: string[][] = [
  ['B5', '-', 'D6', '-', 'B5', '-', 'G5', '-'],          // G
  ['G5', '-', '-', '.', 'E5', '-', 'G5', '-'],           // Em
  ['E5', '-', 'G5', '-', 'C6', '-', 'B5', '-'],          // C
  ['A5', '-', '-', '.', 'da:A5', '-', 'da:F#5', '-'],    // D
  ['D6', '-', 'B5', '-', 'G5', '-', 'B5', '-'],          // G
  ['C6', '-', 'E6', '-', 'D6', '-', 'C6', '-'],          // C
  ['B5', '-', 'A5', '-', 'F#5', '-', 'A5', '-'],         // D
  ['G5', '-', '-', '-', '.', '.', 'D5', '.'],            // G
];
/** You're on Mute: the conference call's hold loop, thin and endless. */
const CALL_MELODY: string[][] = [
  ['C6', '.', 'A5', '.', 'F5', '.', 'A5', '.'],          // F
  ['C6', '.', 'G5', '.', 'E5', '.', 'G5', '.'],          // C
  ['D6', '.', 'A5', '.', 'F5', '.', 'A5', '.'],          // Dm
  ['G5', '-', '-', '.', 'da:G5', '-', 'da:E5', '-'],     // C
  ['A5', '.', 'C6', '.', 'F6', '.', 'C6', '.'],          // F
  ['A#5', '.', 'D6', '.', 'F6', '.', 'D6', '.'],         // Bb
  ['C6', '.', 'E6', '.', 'G6', '.', 'E6', '.'],          // C
  ['F6', '-', '-', '-', '.', '.', '.', '.'],             // F
];
/** The Quarterly Review: a 16-bit RPG battle theme in A minor. */
const BATTLE_MELODY: string[][] = [
  ['A5', '.', 'A5', 'B5', 'C6', '.', 'B5', 'A5'],        // Am
  ['C6', '.', 'C6', 'D6', 'E6', '.', 'D6', 'C6'],        // F
  ['B5', '.', 'B5', 'C6', 'D6', '.', 'G6', '.'],         // G
  ['G#5', '-', '-', '.', 'da:B5', '-', 'da:G#5', '-'],   // E
  ['E6', '.', 'D6', 'C6', 'B5', '.', 'A5', '.'],         // Am
  ['F6', '.', 'E6', 'D6', 'C6', '.', 'A5', '.'],         // F
  ['D6', '.', 'B5', 'G5', 'B5', '.', 'E6', '.'],         // G E
  ['A5', '-', '-', '.', 'E5', 'G#5', 'A5', '.'],         // Am
];
/** Terms & Conditions: the fine print, read out very fast (pizzicato). */
const FINEPRINT_MELODY: string[][] = [
  ['D5', 'F5', 'A5', 'F5', 'D5', 'F5', 'A5', 'F5'],      // Dm
  ['D5', 'F5', 'A#5', 'F5', 'D5', 'F5', 'A#5', 'F5'],    // Bb
  ['D5', 'G5', 'A#5', 'G5', 'D5', 'G5', 'A#5', 'G5'],    // Gm
  ['E5', '-', '-', '.', 'da:G5', '-', 'da:E5', '-'],     // A
  ['A5', 'F5', 'D5', 'F5', 'A5', 'D6', 'A5', 'F5'],      // Dm
  ['A#5', 'G5', 'D5', 'G5', 'A#5', 'D6', 'A#5', 'G5'],   // Gm
  ['C#6', 'A5', 'E5', 'A5', 'C#6', 'E6', 'C#6', 'A5'],   // A
  ['D6', '-', '-', '.', 'A5', '.', 'D5', '.'],           // Dm
];
/** Cubicle 3D: 1992 shareware-shooter MIDI metal, E minor, chugging. */
const FPS_MELODY: string[][] = [
  ['E5', '.', 'E5', 'G5', 'A5', '.', 'G5', 'E5'],        // Em
  ['D5', '.', 'E5', '.', 'B4', '-', '-', '.'],           // Em
  ['E5', '.', 'E5', 'G5', 'A5', '.', 'B5', 'C6'],        // C
  ['B5', '-', '-', '.', 'da:B5', '-', 'da:G5', '-'],     // D
  ['E6', '.', 'D6', '.', 'B5', '.', 'G5', '.'],          // Em
  ['C6', '.', 'B5', '.', 'G5', '.', 'E5', '.'],          // C
  ['F#5', '.', 'A5', '.', 'D6', '.', 'F#6', '.'],        // D
  ['D#6', '-', '-', '.', 'B5', '.', 'F#5', '.'],         // B
];
/** The Acquisition and the unskippable ad: a shiny PREMIUM brand jingle. */
const PREMIUM_MELODY: string[][] = [
  ['D6', '-', 'F6', '-', 'A#6', '-', 'F6', '-'],         // Bb
  ['G6', '-', '-', '.', 'D6', '-', 'A#5', '-'],          // Gm
  ['G6', '-', 'D#6', '-', 'A#5', '-', 'G5', '-'],        // Eb
  ['A5', '-', '-', '.', 'da:C6', '-', 'da:A5', '-'],     // F
  ['A#5', '-', 'D6', '-', 'F6', '-', 'A#6', '-'],        // Bb
  ['G6', '-', 'A#6', '-', 'G6', '-', 'D#6', '-'],        // Eb
  ['F6', '-', 'C6', '-', 'A5', '-', 'C6', '-'],          // F
  ['A#5', '-', '-', '-', '.', '.', 'F5', '.'],           // Bb
];
/** Blue Screen: a gentle MIDI piano tune, like a 1995 desktop's. */
const WIN_MELODY: string[][] = [
  ['G5', '-', 'C6', '-', 'E6', '-', 'D6', 'C6'],         // C
  ['C6', '-', '-', '.', 'A5', '-', 'E5', '-'],           // Am
  ['F5', '-', 'A5', '-', 'C6', '-', 'A5', 'F5'],         // F
  ['G5', '-', '-', '.', 'da:G5', '-', 'da:E5', '-'],     // G
  ['E6', '-', 'G6', '-', 'E6', '-', 'C6', '-'],          // C
  ['F6', '-', 'E6', '-', 'D6', '-', 'C6', '-'],          // F
  ['B5', '-', 'D6', '-', 'G6', '-', 'F6', '-'],          // G
  ['E6', '-', '-', '-', '.', '.', '.', '.'],             // C
];
/** The Office Chair GP: an arcade racing theme in A major. */
const RACE_MELODY: string[][] = [
  ['E5', 'A5', 'C#6', 'E6', '.', 'C#6', 'E6', '.'],      // A
  ['F#6', '-', 'E6', '-', 'D6', '-', 'C#6', '-'],        // D
  ['B5', 'G#5', 'B5', 'E6', '.', 'B5', 'E6', '.'],       // E
  ['C#6', '-', '-', '.', 'da:E6', '-', 'da:C#6', '-'],   // A
  ['F#5', 'A5', 'C#6', 'F#6', '.', 'C#6', 'A5', '.'],    // F#m
  ['A5', 'D6', 'F#6', 'A6', '.', 'F#6', 'D6', '.'],      // D
  ['G#5', 'B5', 'E6', 'G#6', '.', 'E6', 'B5', '.'],      // E
  ['A5', '-', '-', '.', 'E5', '.', 'A5', '.'],           // A
];

/** Which floors have their own song (by décor). Everything else plays the
 *  main theme in the floor's arrangement. */
export const FLOOR_SONGS: Partial<Record<string, SongId>> = {
  vents: 'vents',
  compliance: 'compliance',
  cubicles: 'cubicles',
  boardroom: 'boardroom',
  legal: 'legal',
  lab: 'lab',
  security: 'security',
  executive: 'executive',
  penthouse: 'penthouse',
  stairwell: 'escape',
};

/** Each boss fights to its own music (the Board keeps the original). */
export const BOSS_SONGS: Record<string, SongId> = {
  recruiter: 'boss_chad',
  halvorsen: 'boss_halvorsen',
  board: 'boss',
};

export const SONGS: Record<SongId, Song> = {
  main:  { bpm: BPM, melody: MELODY, chords: CHORDS, drums: DRUMS },
  boss:  { bpm: 150, melody: BOSS_MELODY, chords: [['A2m'], ['F2'], ['G2'], ['E2'], ['A2m'], ['F2'], ['G2'], ['E2']], drums: 'kkshkksh' },
  vents: { bpm: 136, melody: VENTS_MELODY, chords: [['G2'], ['C3'], ['E2m'], ['D3'], ['G2'], ['C3'], ['D3'], ['G2']], drums: 'khshkhsh' },
  compliance: {
    bpm: 118, melody: COMPLIANCE_MELODY,
    chords: [['D2m'], ['D2m'], ['A#2'], ['A2'], ['D2m'], ['G2m'], ['A2'], ['D2m']],
    drums: 'k..hs.h.', voice: 'pluck', leadGain: 1.7,
    bass: 'R.RFR.FA', bassVoice: 'pluck', bassGain: 1.8, arp: 'off',
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
  legal: {
    bpm: 104, melody: LEGAL_MELODY,
    chords: [['A2m'], ['E2'], ['A2m'], ['G2'], ['C3'], ['F2'], ['E2'], ['A2m']],
    drums: 'h.h.h.h.', voice: 'harpsi', leadGain: 1.8,
    bass: 'R.F.O.F.', bassVoice: 'harpsi', bassGain: 1.8, arp: 'off',
  },
  lab: {
    bpm: 138, melody: LAB_MELODY,
    chords: [['E2m'], ['C3'], ['D3'], ['E2m'], ['E2m'], ['C3'], ['D3'], ['B2']],
    drums: 'khshkhsh', voice: 'square', leadGain: 0.24,
    bass: 'RRORRROR', bassVoice: 'sawtooth', arp: 'fast',
  },
  security: {
    bpm: 100, melody: SECURITY_MELODY,
    chords: [['C3m'], ['C3m'], ['G#2'], ['G2'], ['C3m'], ['F2m'], ['G2'], ['C3m']],
    drums: 'k..k..s.', voice: 'sawtooth', leadGain: 0.16,
    bass: 'R.R.R.RA', bassVoice: 'triangle', pad: true, arp: 'off',
  },
  executive: {
    bpm: 96, melody: EXECUTIVE_MELODY,
    chords: [['D3'], ['B2m'], ['G2'], ['A2'], ['D3'], ['B2m'], ['G2', 'A2'], ['D3']],
    drums: 'kh.hsh.h', voice: 'bell', leadGain: 0.32,
    bass: 'R.F.O.FA', bassVoice: 'triangle', pad: true, arp: 'off', swing: 0.18,
  },
  penthouse: {
    bpm: 84, melody: PENTHOUSE_MELODY,
    chords: [['G2m'], ['D3'], ['G2m'], ['D3'], ['D#3'], ['C3m'], ['D3'], ['G2m']],
    drums: 'k...s..k', voice: 'organ', leadGain: 0.22,
    bass: 'R---F---', bassVoice: 'organ', pad: true, arp: 'off',
  },
  // THE WAY HOME: the theme itself, as a chase (synth brass, double time feel)
  escape: {
    bpm: 160, melody: MELODY, chords: CHORDS,
    drums: 'kkskkhks', voice: 'brass', leadGain: 0.22,
    bass: 'RORORORO', bassVoice: 'square', arp: 'fast',
  },
  boss_chad: {
    bpm: 150, melody: CHAD_MELODY,
    chords: [['C3'], ['G2'], ['A2m'], ['E2'], ['F2'], ['G2'], ['A2m', 'E2'], ['A2m']],
    drums: 'kkshkksh', voice: 'brass', leadGain: 0.22,
    bass: 'RORORORO', bassVoice: 'square', arp: 'up',
  },
  jingle_vhs: {
    bpm: 108, melody: VHS_MELODY,
    chords: [['C3'], ['F2'], ['G2'], ['C3'], ['A2m'], ['F2'], ['G2'], ['C3']],
    drums: 'k.skk.s.', voice: 'brass', leadGain: 0.2,
    bass: 'R.R.O.R.', bassVoice: 'square', pad: true, arp: 'off',
  },
  jingle_hold: {
    bpm: 100, melody: HOLD_MELODY,
    chords: [['G2'], ['E2m'], ['C3'], ['D3'], ['G2'], ['C3'], ['D3'], ['G2']],
    drums: 'k.h.s.h.', voice: 'bell', leadGain: 0.32,
    bass: 'R.F.R.FA', bassVoice: 'triangle', arp: 'off', swing: 0.15,
  },
  jingle_call: {
    bpm: 90, melody: CALL_MELODY,
    chords: [['F2'], ['C3'], ['D3m'], ['C3'], ['F2'], ['A#2'], ['C3'], ['F2']],
    drums: '........', voice: 'sine', leadGain: 0.36,
    bass: 'R...F...', bassVoice: 'triangle', arp: 'off',
  },
  jingle_battle: {
    bpm: 152, melody: BATTLE_MELODY,
    chords: [['A2m'], ['F2'], ['G2'], ['E2'], ['A2m'], ['F2'], ['G2', 'E2'], ['A2m']],
    drums: 'kkshkksh', voice: 'square', leadGain: 0.26,
    bass: 'RORORORO', bassVoice: 'square', arp: 'fast',
  },
  jingle_fineprint: {
    bpm: 150, melody: FINEPRINT_MELODY,
    chords: [['D2m'], ['A#2'], ['G2m'], ['A2'], ['D2m'], ['G2m'], ['A2'], ['D2m']],
    drums: 'h.h.h.h.', voice: 'pluck', leadGain: 1.4,
    bass: 'R.R.R.R.', bassVoice: 'pluck', bassGain: 1.6, arp: 'off',
  },
  jingle_fps: {
    bpm: 140, melody: FPS_MELODY,
    chords: [['E2m'], ['E2m'], ['C3'], ['D3'], ['E2m'], ['C3'], ['D3'], ['B2']],
    drums: 'kkskkkks', voice: 'sawtooth', leadGain: 0.18,
    bass: 'RRRRRRRR', bassVoice: 'sawtooth', bassGain: 0.35, arp: 'off',
  },
  jingle_premium: {
    bpm: 124, melody: PREMIUM_MELODY,
    chords: [['A#2'], ['G2m'], ['D#3'], ['F2'], ['A#2'], ['D#3'], ['F2'], ['A#2']],
    drums: 'k.hsk.hs', voice: 'bell', leadGain: 0.34,
    bass: 'R.O.F.O.', bassVoice: 'triangle', pad: true, arp: 'up',
  },
  jingle_win: {
    bpm: 96, melody: WIN_MELODY,
    chords: [['C3'], ['A2m'], ['F2'], ['G2'], ['C3'], ['F2'], ['G2'], ['C3']],
    drums: 'k..hs..h', voice: 'bell', leadGain: 0.34,
    bass: 'R.F.O.F.', bassVoice: 'triangle', pad: true, arp: 'off',
  },
  jingle_race: {
    bpm: 164, melody: RACE_MELODY,
    chords: [['A2'], ['D3'], ['E2'], ['A2'], ['F#2m'], ['D3'], ['E2'], ['A2']],
    drums: 'khskkhsh', voice: 'square', leadGain: 0.24,
    bass: 'RORORORO', bassVoice: 'square', arp: 'fast',
  },
  boss_halvorsen: {
    bpm: 132, melody: HALVORSEN_MELODY,
    chords: [['D3'], ['G2'], ['A2'], ['D3'], ['B2m'], ['G2'], ['A2'], ['D3']],
    drums: 'k.skk.s.', voice: 'brass', leadGain: 0.22,
    bass: 'R.R.F.F.', bassVoice: 'triangle', pad: true, arp: 'up',
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
