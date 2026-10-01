// file: game/level/level8.ts
//
// Executive Wing — floor 30. Pigs, gorillas, vampires and very hungry plants. 80 × 15.

import type { LevelSpawns } from '../types';
import { buildLevel } from './buildLevel';

const SURFACE = '######^^^#####...######^^#####...#######^^^####...######^^#####...####^^########';
const UNDER   = '##############...#############...##############...#############...##############';
const PLAT    = '....===.....===......===......===.....===......===......===......===............';
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

export const level8Tiles   = LEVEL.tiles;
export const LEVEL8_WIDTH  = LEVEL.width;
export const LEVEL8_HEIGHT = LEVEL.height;

export const level8Spawns: LevelSpawns = {
  player: { tx: 2, ty: 7 },
  enemies: [
    { type: 'pig', tx: 11, ty: 6 },
    { type: 'gorilla', tx: 19, ty: 6 },
    { type: 'plant', tx: 29, ty: 6 },
    { type: 'vampire', tx: 36, ty: 6 },
    { type: 'pig', tx: 44, ty: 6 },
    { type: 'gorilla', tx: 52, ty: 6 },
    { type: 'rat', tx: 60, ty: 6 },
    { type: 'vampire', tx: 67, ty: 6 },
    { type: 'plant', tx: 62, ty: 6 },
    { type: 'pig', tx: 20, ty: 6 },
  ],
  blocks: [
    { type: 'question', tx: 18, ty: 4 },
    { type: 'question', tx: 59, ty: 4 },
  ],
  coins: [
    { tx: 7, ty: 4 },
    { tx: 11, ty: 7 },
    { tx: 15, ty: 4 },
    { tx: 24, ty: 4 },
    { tx: 27, ty: 7 },
    { tx: 31, ty: 4 },
    { tx: 41, ty: 4 },
    { tx: 44, ty: 7 },
    { tx: 48, ty: 4 },
    { tx: 57, ty: 4 },
    { tx: 60, ty: 7 },
    { tx: 64, ty: 4 },
    { tx: 71, ty: 4 },
  ],
  checkpoints: [
    { tx: 27, ty: 6 },
    { tx: 52, ty: 6 },
  ],
  goal: { tx: 76, ty: 2 },
};
