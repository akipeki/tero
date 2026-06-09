// file: game/level/buildLevel.ts
//
// Tiny DSL for authoring levels as arrays of single-char strings.
// Each row must be exactly `width` characters. The build helper throws
// if any row is misaligned, so you cannot ship a level with miscounted tiles.
//
// Characters:
//   .  = AIR     (0)
//   #  = SOLID   (1)
//   =  = PLATFORM (2)
//   ^  = HAZARD  (3)
//
// Example:
//   const TILES = buildLevel(['..###..', '..^^^..', '#######']);

import { TileType } from '../types';

const CHAR_TO_TILE: Record<string, number> = {
  '.': TileType.AIR,
  '#': TileType.SOLID,
  '=': TileType.PLATFORM,
  '^': TileType.HAZARD,
};

export interface BuiltLevel {
  tiles:  number[];
  width:  number;
  height: number;
}

export function buildLevel(rows: string[]): BuiltLevel {
  if (rows.length === 0) throw new Error('buildLevel: no rows');
  const width = rows[0].length;
  if (width === 0) throw new Error('buildLevel: row 0 is empty');

  const tiles: number[] = [];
  for (let ty = 0; ty < rows.length; ty++) {
    const row = rows[ty];
    if (row.length !== width) {
      throw new Error(
        `buildLevel: row ${ty} has length ${row.length}, expected ${width}`,
      );
    }
    for (let tx = 0; tx < row.length; tx++) {
      const ch = row[tx];
      const t = CHAR_TO_TILE[ch];
      if (t === undefined) {
        throw new Error(`buildLevel: unknown char "${ch}" at (${tx}, ${ty})`);
      }
      tiles.push(t);
    }
  }
  return { tiles, width, height: rows.length };
}
