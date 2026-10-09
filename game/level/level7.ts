// file: game/level/level7.ts
//
// Floor 27 — Security. 80 × 15. THE PANOPTICON: ceiling cameras sweep cones
// of light. Get seen and the alarm drops guards from the vents. Pillars
// block the view; a Tero hiding in his box (hold DOWN, stand still) is
// just a box. Fewer guards walk the floor — the cameras are the enemy.
//
// Legend: # solid · = catwalk desk · ^ tacks. Cameras are gadgets (spawns).

import type { LevelSpawns } from '../types';
import { buildLevel } from './buildLevel';

const ROWS = [
  '################################################################################', // 0  ceiling (cameras hang here)
  '................................................................................', // 1
  '................................................................................', // 2
  '................................................................................', // 3
  '....................====.........====..........====........====.................', // 4  catwalks
  '..................#...........#.............#...........#.......................', // 5  pillars block the cameras
  '........==........#...........#.............#...........#.......................', // 6
  '..................#...........#.............#...........#.......................', // 7  player row
  '########################################..##########################^^##########', // 8  floor
  '########################################..######################################', // 9
  '########################################..######################################', // 10
  '########################################..######################################', // 11
  '########################################..######################################', // 12
  '########################################..######################################', // 13
  '########################################..######################################', // 14
];

const LEVEL = buildLevel(ROWS);

export const level7Tiles   = LEVEL.tiles;
export const LEVEL7_WIDTH  = LEVEL.width;
export const LEVEL7_HEIGHT = LEVEL.height;

export const level7Spawns: LevelSpawns = {
  player: { tx: 2, ty: 7 },
  enemies: [
    { type: 'guard', tx: 11, ty: 7 },
    { type: 'rat',   tx: 26, ty: 7 },
    { type: 'robot', tx: 48, ty: 7 },
    { type: 'guard', tx: 61, ty: 7 },
    { type: 'rat',   tx: 72, ty: 7 },
  ],
  blocks: [
    { type: 'question', tx: 9,  ty: 3 },
    { type: 'question', tx: 49, ty: 1 },
  ],
  coins: [
    { tx: 21, ty: 3 }, { tx: 22, ty: 3 }, { tx: 34, ty: 3 }, { tx: 35, ty: 3 },
    { tx: 40, ty: 6 }, { tx: 41, ty: 6 }, { tx: 60, ty: 3 }, { tx: 61, ty: 3 },
    { tx: 68, ty: 6 }, { tx: 69, ty: 6 },
  ],
  checkpoints: [
    { tx: 31, ty: 6 },
    { tx: 57, ty: 6 },
  ],
  gadgets: [
    { type: 'thing', tx: 48, ty: 3, id: 'buspass' },   // one of Dad's things
    { type: 'camera', tx: 14, ty: 1 },
    { type: 'camera', tx: 25, ty: 1, sweep: [-0.6, 1.0] },
    { type: 'camera', tx: 38, ty: 1 },
    { type: 'camera', tx: 51, ty: 1, sweep: [-1.0, 0.5] },
    { type: 'camera', tx: 64, ty: 1 },
  ],
  goal: { tx: 76, ty: 2 },
};
