// file: game/level/levels.ts
//
// Single source-of-truth registry for all levels. Lets Game.ts iterate by
// index, lets the UI list/restart levels, lets the validator run once.

import type { LevelSpawns } from '../types';
import type { ThemeName } from '../render/Theme';

import { level1Tiles, level1Spawns, LEVEL_WIDTH as L1W, LEVEL_HEIGHT as L1H } from './level1';
import { level2Tiles, level2Spawns, LEVEL2_WIDTH, LEVEL2_HEIGHT } from './level2';
import { level3Tiles, level3Spawns, LEVEL3_WIDTH, LEVEL3_HEIGHT } from './level3';
import { level4Tiles, level4Spawns, LEVEL4_WIDTH, LEVEL4_HEIGHT } from './level4';
import { level5Tiles, level5Spawns, LEVEL5_WIDTH, LEVEL5_HEIGHT } from './level5';
import { level6Tiles, level6Spawns, LEVEL6_WIDTH, LEVEL6_HEIGHT } from './level6';

export interface LevelDef {
  id:     string;
  name:   string;
  theme:  ThemeName;
  tiles:  number[];
  spawns: LevelSpawns;
  width:  number;
  height: number;
}

export const LEVELS: readonly LevelDef[] = [
  { id: '1', name: 'The Mailroom',  theme: 'office', tiles: level1Tiles, spawns: level1Spawns, width: L1W,         height: L1H },
  { id: '2', name: 'Cubicle Farm',  theme: 'office', tiles: level2Tiles, spawns: level2Spawns, width: LEVEL2_WIDTH, height: LEVEL2_HEIGHT },
  { id: '3', name: 'The Boardroom', theme: 'office', tiles: level3Tiles, spawns: level3Spawns, width: LEVEL3_WIDTH, height: LEVEL3_HEIGHT },
  { id: '4', name: 'Legal',         theme: 'office', tiles: level4Tiles, spawns: level4Spawns, width: LEVEL4_WIDTH, height: LEVEL4_HEIGHT },
  { id: '5', name: 'R&D',           theme: 'office', tiles: level5Tiles, spawns: level5Spawns, width: LEVEL5_WIDTH, height: LEVEL5_HEIGHT },
  { id: '6', name: 'The Sanctum',   theme: 'office', tiles: level6Tiles, spawns: level6Spawns, width: LEVEL6_WIDTH, height: LEVEL6_HEIGHT },
] as const;

/** Validate level data on load. Pads missing cells with AIR and warns;
 *  throws only on actual garbage (out-of-range / non-integer tiles). */
export function validateLevel(level: LevelDef): void {
  const expected = level.width * level.height;
  if (level.tiles.length < expected) {
    // Be forgiving — author may have left trailing AIR rows implicit.
    const missing = expected - level.tiles.length;
    if (typeof console !== 'undefined') {
      console.warn(
        `[Tero] Level "${level.name}" tile array was ${missing} cells short; padding with AIR.`,
      );
    }
    while (level.tiles.length < expected) level.tiles.push(0);
  } else if (level.tiles.length > expected) {
    if (typeof console !== 'undefined') {
      console.warn(
        `[Tero] Level "${level.name}" has ${level.tiles.length - expected} extra cells; ignoring trailing data.`,
      );
    }
    level.tiles.length = expected;
  }
  for (let i = 0; i < level.tiles.length; i++) {
    const t = level.tiles[i];
    if (t < 0 || t > 5 || !Number.isInteger(t)) {
      const tx = i % level.width;
      const ty = Math.floor(i / level.width);
      throw new Error(`Level "${level.name}" invalid tile ${t} at (${tx}, ${ty})`);
    }
  }
}

// Run once at import time so a malformed level surfaces before play.
for (const L of LEVELS) validateLevel(L);
