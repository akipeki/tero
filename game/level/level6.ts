// file: game/level/level6.ts
//
// The Shareholders' Sanctum — floor 33. Hazard-dense finale. 80 × 15.

import type { LevelSpawns } from '../types';
import { buildLevel } from './buildLevel';

const SURFACE = '#####^^^###...####^^###...#####^^^####...###^^#####...####^^^####...############';
const UNDER   = '###########...#########...############...##########...###########...############';
const PLAT    = '....===....===.....===.....===.....===.....===.....===.....===.....===..........';
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

export const level6Tiles   = LEVEL.tiles;
export const LEVEL6_WIDTH  = LEVEL.width;
export const LEVEL6_HEIGHT = LEVEL.height;

export const level6Spawns: LevelSpawns = {
  player: { tx: 2, ty: 7 },
  enemies: [
    { type: 'walker', tx: 9, ty: 6 },
    { type: 'hopper', tx: 16, ty: 6 },
    { type: 'walker', tx: 26, ty: 6 },
    { type: 'hopper', tx: 35, ty: 6 },
    { type: 'walker', tx: 41, ty: 6 },
    { type: 'hopper', tx: 50, ty: 6 },
    { type: 'walker', tx: 57, ty: 6 },
    { type: 'hopper', tx: 63, ty: 6 },
    { type: 'walker', tx: 73, ty: 6 },
  ],
  blocks: [
    { type: 'question', tx: 12, ty: 4 },
    { type: 'question', tx: 46, ty: 4 },
  ],
  coins: [
    { tx: 6, ty: 4 },
    { tx: 12, ty: 7 },
    { tx: 19, ty: 4 },
    { tx: 25, ty: 7 },
    { tx: 31, ty: 4 },
    { tx: 37, ty: 7 },
    { tx: 43, ty: 4 },
    { tx: 49, ty: 7 },
    { tx: 55, ty: 4 },
    { tx: 61, ty: 7 },
    { tx: 67, ty: 4 },
    { tx: 73, ty: 4 },
  ],
  checkpoints: [
    { tx: 28, ty: 6 },
    { tx: 56, ty: 6 },
  ],
  goal: { tx: 76, ty: 2 },
};
