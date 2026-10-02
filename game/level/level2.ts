// file: game/level/level2.ts
//
// Cubicle Farm — 88 × 15. Stacked platforms, then a long empty corridor
// (cols 18–35) to let the eye rest, then the rest of the floor.

import type { LevelSpawns } from '../types';
import { buildLevel } from './buildLevel';

const SURFACE = '########..##########################..^^####....######.######^^########...##############';
const UNDER   = '########..##########################..######....######.################...##############';
const HI_PLAT = '.............===..........................===..............===.........===..............';
const PLAT    = '.....===............................===.......===.....===.........===.......===.........';
const AIR     = '........................................................................................';
const TOP     = '########################################################################################';

const ROWS = [
  TOP,     // 0
  AIR,     // 1
  AIR,     // 2
  HI_PLAT, // 3 — high platforms
  AIR,     // 4
  PLAT,    // 5 — mid platforms
  AIR,     // 6
  AIR,     // 7 — player spawn
  SURFACE, // 8
  UNDER,   // 9
  UNDER,   // 10
  UNDER,   // 11
  UNDER,   // 12
  UNDER,   // 13
  UNDER,   // 14
];

const LEVEL = buildLevel(ROWS);

export const level2Tiles   = LEVEL.tiles;
export const LEVEL2_WIDTH  = LEVEL.width;
export const LEVEL2_HEIGHT = LEVEL.height;

export const level2Spawns: LevelSpawns = {
  player: { tx: 2, ty: 7 },
  enemies: [
    { type: 'hopper', tx: 12, ty: 7 },
    { type: 'walker', tx: 41, ty: 7 },
    { type: 'walker', tx: 58, ty: 7 },
    { type: 'hopper', tx: 75, ty: 7 },
  ],
  blocks: [
    { type: 'question', tx: 8,  ty: 4 },
    { type: 'question', tx: 48, ty: 4 },
  ],
  coins: [
    { tx: 6,  ty: 4 },
    { tx: 14, ty: 2 },
    { tx: 43, ty: 2 },
    { tx: 50, ty: 4 },
    { tx: 68, ty: 4 },
    { tx: 36, ty: 7 },
    { tx: 63, ty: 7 },
  ],
  checkpoints: [
    { tx: 50, ty: 6 },
  ],
  goal: { tx: 83, ty: 2 },
};
