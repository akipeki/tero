// file: game/level/level7.ts
//
// Security — floor 27. Guards, robots, rats, and plants guarding the pits. 80 × 15.

import type { LevelSpawns } from '../types';
import { buildLevel } from './buildLevel';

const SURFACE = '#######...######^^######...#######^^^#####...######^^#####...####^^#############';
const UNDER   = '#######...##############...###############...#############...###################';
const PLAT    = '.....===......===.......===......===......===.......===......===......===.......';
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

export const level7Tiles   = LEVEL.tiles;
export const LEVEL7_WIDTH  = LEVEL.width;
export const LEVEL7_HEIGHT = LEVEL.height;

export const level7Spawns: LevelSpawns = {
  player: { tx: 2, ty: 7 },
  enemies: [
    { type: 'guard', tx: 12, ty: 6 },
    { type: 'robot', tx: 20, ty: 6 },
    { type: 'plant', tx: 33, ty: 6 },
    { type: 'rat', tx: 39, ty: 6 },
    { type: 'guard', tx: 47, ty: 6 },
    { type: 'robot', tx: 55, ty: 6 },
    { type: 'plant', tx: 64, ty: 6 },
    { type: 'guard', tx: 13, ty: 6 },
    { type: 'rat', tx: 21, ty: 6 },
    { type: 'robot', tx: 31, ty: 6 },
  ],
  blocks: [
    { type: 'question', tx: 19, ty: 4 },
    { type: 'question', tx: 54, ty: 4 },
  ],
  coins: [
    { tx: 8, ty: 4 },
    { tx: 12, ty: 7 },
    { tx: 17, ty: 4 },
    { tx: 25, ty: 4 },
    { tx: 30, ty: 7 },
    { tx: 35, ty: 4 },
    { tx: 43, ty: 4 },
    { tx: 47, ty: 7 },
    { tx: 52, ty: 4 },
    { tx: 59, ty: 4 },
    { tx: 62, ty: 7 },
    { tx: 66, ty: 4 },
  ],
  checkpoints: [
    { tx: 30, ty: 6 },
    { tx: 47, ty: 6 },
  ],
  goal: { tx: 76, ty: 2 },
};
