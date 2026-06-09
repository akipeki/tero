// file: game/level/level3.ts
//
// Dusk Citadel — 80 × 15. Hazard-dense.

import type { LevelSpawns } from '../types';
import { buildLevel } from './buildLevel';

const SURFACE = '######^^^####....#####^^####...####^^^####...########..####^^###...#############';
const UNDER   = '#############....###########...###########...########..#########...#############';
const PLAT    = '....===.....===......===......===......===......===......===......===...........';
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

export const level3Tiles   = LEVEL.tiles;
export const LEVEL3_WIDTH  = LEVEL.width;
export const LEVEL3_HEIGHT = LEVEL.height;

export const level3Spawns: LevelSpawns = {
  player: { tx: 2, ty: 7 },
  enemies: [
    { type: 'walker', tx: 18, ty: 6 },
    { type: 'hopper', tx: 30, ty: 6 },
    { type: 'walker', tx: 42, ty: 6 },
    { type: 'hopper', tx: 55, ty: 6 },
    { type: 'walker', tx: 68, ty: 6 },
  ],
  blocks: [
    { type: 'question', tx: 22, ty: 4 },
    { type: 'question', tx: 55, ty: 4 },
  ],
  coins: [
    { tx: 5,  ty: 4 },
    { tx: 13, ty: 4 },
    { tx: 24, ty: 4 },
    { tx: 37, ty: 4 },
    { tx: 47, ty: 4 },
    { tx: 57, ty: 4 },
    { tx: 67, ty: 4 },
  ],
  checkpoints: [
    { tx: 32, ty: 6 },
    { tx: 58, ty: 6 },
  ],
  goal: { tx: 75, ty: 2 },
};
