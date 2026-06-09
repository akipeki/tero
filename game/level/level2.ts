// file: game/level/level2.ts
//
// Mint Meadow — 70 × 15. Vertical layout with stacked platforms.

import type { LevelSpawns } from '../types';
import { buildLevel } from './buildLevel';

const SURFACE = '########..########..^^####....######.######^^########...########......';
const UNDER   = '########..########..######....######.################...########......';
const HI_PLAT = '.............===........===..............===.........===..............';
const PLAT    = '.....===..........===.......===.....===.........===.......===.........';
const AIR     = '......................................................................';
const TOP     = '######################################################################';

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
    { type: 'walker', tx: 26, ty: 7 },
    { type: 'walker', tx: 40, ty: 7 },
    { type: 'hopper', tx: 55, ty: 7 },
  ],
  blocks: [
    { type: 'question', tx: 8,  ty: 4 },
    { type: 'question', tx: 30, ty: 4 },
  ],
  coins: [
    { tx: 6,  ty: 4 },
    { tx: 14, ty: 2 },
    { tx: 25, ty: 2 },
    { tx: 32, ty: 4 },
    { tx: 50, ty: 4 },
    { tx: 18, ty: 7 },
    { tx: 45, ty: 7 },
  ],
  checkpoints: [
    { tx: 32, ty: 6 },
  ],
  goal: { tx: 65, ty: 2 },
};
