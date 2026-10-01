// file: game/level/level5.ts
//
// R&D (Rage & Depression) — floor 21. Hopper-heavy. 80 × 15.

import type { LevelSpawns } from '../types';
import { buildLevel } from './buildLevel';

const SURFACE = '######...#####^^^####...#######^^######...####^^^#####...########^^####...######';
const UNDER   = '######...############...###############...############...##############...######';
const PLAT    = '....===......===.......===.....===......===......===......===......===..........';
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

export const level5Tiles   = LEVEL.tiles;
export const LEVEL5_WIDTH  = LEVEL.width;
export const LEVEL5_HEIGHT = LEVEL.height;

export const level5Spawns: LevelSpawns = {
  player: { tx: 2, ty: 7 },
  enemies: [
    { type: 'hopper', tx: 11, ty: 6 },
    { type: 'walker', tx: 24, ty: 6 },
    { type: 'hopper', tx: 34, ty: 6 },
    { type: 'hopper', tx: 45, ty: 6 },
    { type: 'walker', tx: 53, ty: 6 },
    { type: 'hopper', tx: 63, ty: 6 },
    { type: 'walker', tx: 68, ty: 6 },
  ],
  blocks: [
    { type: 'question', tx: 16, ty: 4 },
    { type: 'question', tx: 57, ty: 4 },
  ],
  coins: [
    { tx: 4, ty: 4 },
    { tx: 8, ty: 7 },
    { tx: 15, ty: 7 },
    { tx: 21, ty: 4 },
    { tx: 29, ty: 7 },
    { tx: 36, ty: 4 },
    { tx: 43, ty: 7 },
    { tx: 51, ty: 4 },
    { tx: 59, ty: 7 },
    { tx: 66, ty: 4 },
    { tx: 74, ty: 4 },
  ],
  checkpoints: [
    { tx: 37, ty: 6 },
    { tx: 62, ty: 6 },
  ],
  goal: { tx: 76, ty: 2 },
};
