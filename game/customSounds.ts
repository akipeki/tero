// file: game/customSounds.ts
//
// ── YOUR OWN SOUNDS ── recordings that replace the synth.
//
// Put audio files (mp3, ogg or wav) in public/audio/ and list them here.
// Anything not listed keeps the built-in chiptune sound.
//
//   music   a song that loops instead of the built-in sequencer:
//           main (the theme), boss, vents
//   sfx     any sound effect name, e.g.
//           dada   Tero calling "da-da?" (a real toddler would be perfect)
//           roar   the tantrum war cry
//           jump, stomp, coin, hurt, free, boom, woof …
//           (all names: SfxName in game/AudioManager.ts)
//
// Example:
//   music: { main: 'theme.mp3' },
//   sfx:   { dada: 'dada.wav', roar: 'raaah.wav' },

import type { SongId } from './music';

export interface CustomSounds {
  music: Partial<Record<SongId, string>>;
  sfx: Record<string, string>;
}

export const CUSTOM_SOUNDS: CustomSounds = {
  music: {},
  sfx: {},
};
