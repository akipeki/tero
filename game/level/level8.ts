// file: game/level/level8.ts
//
// Floor 30 — The Executive Wing. 80 × 15. Executives never hit the ground:
// grab the GOLDEN PARACHUTE on its pedestal, then hold jump while falling
// to glide over chasms no toddler could jump.
//
//   0–11   the pedestal and the parachute
//  12–19   chasm 1: learn to glide
//  20–37   the pigs' island; chasm 2 with floppies up in the bonus sky
//  38–45   the executive mezzanine
//  46–56   the great chasm: glide from the mezzanine
//  57–79   trickle-down, the elevator
//
// Legend: # solid · = desk · ^ hazard. The parachute is a gadget (spawns).

import type { LevelSpawns } from '../types';
import { buildLevel } from './buildLevel';

const ROWS = [
  '################################################################################', // 0  ceiling
  '................................................................................', // 1
  '................................===.............................................', // 2  bonus sky
  '........................===.....................................................', // 3
  '................................................................................', // 4
  '......................................########..............===.................', // 5  the mezzanine
  '.....===..............................########..................................', // 6
  '......................................########..................................', // 7  player row
  '############........#########........#########...........#########^^############', // 8  floor
  '############........#########........#########...........#######################', // 9
  '############........#########........#########...........#######################', // 10
  '############........#########........#########...........#######################', // 11
  '############........#########........#########...........#######################', // 12
  '############........#########........#########...........#######################', // 13
  '############........#########........#########...........#######################', // 14
];

const LEVEL = buildLevel(ROWS);

export const level8Tiles   = LEVEL.tiles;
export const LEVEL8_WIDTH  = LEVEL.width;
export const LEVEL8_HEIGHT = LEVEL.height;

export const level8Spawns: LevelSpawns = {
  player: { tx: 2, ty: 7 },
  enemies: [
    { type: 'pig',     tx: 22, ty: 7 },
    { type: 'gorilla', tx: 26, ty: 7 },
    { type: 'vampire', tx: 41, ty: 4 },   // on the mezzanine
    { type: 'pig',     tx: 59, ty: 7 },
    { type: 'plant',   tx: 64, ty: 7 },
    { type: 'gorilla', tx: 70, ty: 7 },
  ],
  blocks: [
    { type: 'question', tx: 9,  ty: 3 },
    { type: 'question', tx: 61, ty: 2 },
  ],
  coins: [
    { tx: 14, ty: 5 }, { tx: 16, ty: 5 }, { tx: 18, ty: 5 },     // chasm 1
    { tx: 25, ty: 2 },
    { tx: 32, ty: 1 }, { tx: 33, ty: 1 }, { tx: 34, ty: 1 },     // bonus sky
    { tx: 48, ty: 4 }, { tx: 51, ty: 4 }, { tx: 54, ty: 4 },     // the great chasm
    { tx: 66, ty: 6 }, { tx: 67, ty: 6 },
  ],
  checkpoints: [
    { tx: 21, ty: 6 },
    { tx: 57, ty: 6 },
  ],
  gadgets: [
    { type: 'thing', tx: 35, ty: 1, id: 'book' },   // one of Dad's things
    { type: 'chute', tx: 6, ty: 5 },
  ],
  goal: { tx: 76, ty: 2 },
};
