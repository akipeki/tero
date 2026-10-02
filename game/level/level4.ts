// file: game/level/level4.ts
//
// Legal — floor 13. Paperwork traps, lots of thumbtacks. 80 × 15.

import type { LevelSpawns } from '../types';
import { buildLevel } from './buildLevel';

const SURFACE = '########...######^^#######...########^^^######...#########^^#####...############';
const UNDER   = '########...###############...#################...################...############';
const PLAT    = '......===.......===........===.......===.......===........===......===..........';
const AIR     = '................................................................................';
const TOP     = '################################################################################';

const ROWS = [
  TOP,     // 0
  AIR,     // 1
  AIR,     // 2
  AIR,     // 3
  AIR,     // 4
  PLAT,    // 5 — platforms
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

export const level4Tiles   = LEVEL.tiles;
export const LEVEL4_WIDTH  = LEVEL.width;
export const LEVEL4_HEIGHT = LEVEL.height;

export const level4Spawns: LevelSpawns = {
  player: { tx: 2, ty: 7 },
  enemies: [
    { type: 'walker', tx: 13, ty: 6 },
    { type: 'hopper', tx: 22, ty: 6 },
    { type: 'walker', tx: 33, ty: 6 },
    { type: 'hopper', tx: 43, ty: 6 },
    { type: 'walker', tx: 53, ty: 6 },
    { type: 'walker', tx: 62, ty: 6 },
    { type: 'hopper', tx: 71, ty: 6 },
  ],
  blocks: [
    { type: 'question', tx: 20, ty: 4 },
    { type: 'question', tx: 51, ty: 4 },
  ],
  coins: [
    { tx: 5, ty: 4 },
    { tx: 9, ty: 7 },
    { tx: 17, ty: 7 },
    { tx: 27, ty: 4 },
    { tx: 38, ty: 7 },
    { tx: 47, ty: 4 },
    { tx: 58, ty: 7 },
    { tx: 66, ty: 4 },
    { tx: 73, ty: 4 },
  ],
  checkpoints: [
    { tx: 42, ty: 6 },
  ],
  goal: { tx: 76, ty: 2 },
};
