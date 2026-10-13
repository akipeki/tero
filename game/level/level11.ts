// file: game/level/level11.ts
//
// Floor 3 — Compliance. 84 × 15. THE SURVEILLANCE FLOOR: hundreds of
// old-school cameras on the ceiling, pointing every which way (at the
// wall, at the ceiling, at each other), plus cameras on a bin, a
// fern, the coffee machine, both sides of the toilet doors, the pillars
// and the walls. Only three
// of them are real (the ones with a light cone): get seen and the alarm
// drops guards. Hide behind the pillars, or duck and stand still: nobody
// suspects a cardboard box. This is where the camera mechanic is learnt;
// Floor 27 is where it gets serious.
//
//   0–12   the lobby: WE ARE WATCHING YOU
//  13–30   the first real camera; the bin under surveillance
//  31–46   Dad's beach calendar; a gap
//  47–62   the toilets (cameras inside, for your safety); a real camera
//  63–83   the coffee machine, the camera watching a camera, the elevator
//
// Legend: # solid · = desk (one-way) · ^ thumbtacks. Cameras are gadgets.

import type { LevelSpawns } from '../types';
import { buildLevel } from './buildLevel';

const ROWS = [
  '####################################################################################',  // 0  ceiling (hundreds of cameras hang here)
  '....................................................................................',  // 1
  '....................................................................................',  // 2
  '....................................................................................',  // 3
  '..........====..........................====......................====..............',  // 4  desks
  '........................#..............................#............................',  // 5  pillars: hide behind them
  '.....==.................#.......===....................#.....==.....................',  // 6
  '........................#..............................#............................',  // 7  player row
  '######################################..############################^^#####...######',  // 8  floor: a gap at 38, tacks at 68, a gap at 75
  '######################################..###################################...######',  // 9
  '######################################..###################################...######',  // 10
  '######################################..###################################...######',  // 11
  '######################################..###################################...######',  // 12
  '######################################..###################################...######',  // 13
  '######################################..###################################...######',  // 14
];

const LEVEL = buildLevel(ROWS);

export const level11Tiles   = LEVEL.tiles;
export const LEVEL11_WIDTH  = LEVEL.width;
export const LEVEL11_HEIGHT = LEVEL.height;

export const level11Spawns: LevelSpawns = {
  player: { tx: 2, ty: 7 },
  enemies: [
    { type: 'walker', tx: 9,  ty: 7 },
    { type: 'rat',    tx: 29, ty: 7 },
    { type: 'walker', tx: 47, ty: 7 },
    { type: 'guard',  tx: 64, ty: 7 },
    { type: 'walker', tx: 72, ty: 7 },
  ],
  blocks: [
    { type: 'question', tx: 18, ty: 4 },
    { type: 'question', tx: 49, ty: 4 },
  ],
  coins: [
    { tx: 11, ty: 3 }, { tx: 12, ty: 3 }, { tx: 33, ty: 5 }, { tx: 38, ty: 6 }, { tx: 39, ty: 6 },
    { tx: 41, ty: 3 }, { tx: 42, ty: 3 }, { tx: 61, ty: 5 }, { tx: 67, ty: 3 }, { tx: 68, ty: 3 },
    { tx: 76, ty: 5 },
  ],
  checkpoints: [
    { tx: 30, ty: 6 },
    { tx: 58, ty: 6 },
  ],
  gadgets: [
    { type: 'thing', tx: 34, ty: 4, id: 'badge' },   // one of Dad's things
    // the three real ones
    { type: 'camera', tx: 20, ty: 1 },
    { type: 'camera', tx: 43, ty: 1, sweep: [-0.6, 0.9] },
    { type: 'camera', tx: 59, ty: 1, sweep: [-0.9, 0.5] },
    // and everyone else's
    { type: 'camera', tx: 2, ty: 1, fake: true, aim: -2.6 },
    { type: 'camera', tx: 8, ty: 1, fake: true, aim: -1.2 },
    { type: 'camera', tx: 11, ty: 1, fake: true, aim: 3.0 },
    { type: 'camera', tx: 14, ty: 1, fake: true, aim: 0.9 },
    { type: 'camera', tx: 17, ty: 1, fake: true, aim: -0.4 },
    { type: 'camera', tx: 23, ty: 1, fake: true, aim: 1.6 },
    { type: 'camera', tx: 26, ty: 1, fake: true, aim: -3.0 },
    { type: 'camera', tx: 29, ty: 1, fake: true, aim: 0.2 },
    { type: 'camera', tx: 32, ty: 1, fake: true, aim: 2.8 },
    { type: 'camera', tx: 35, ty: 1, fake: true, aim: -2.0 },
    { type: 'camera', tx: 38, ty: 1, fake: true, aim: 1.2 },
    { type: 'camera', tx: 41, ty: 1, fake: true, aim: -0.9 },
    { type: 'camera', tx: 47, ty: 1, fake: true, aim: 2.5 },
    { type: 'camera', tx: 50, ty: 1, fake: true, aim: -1.6 },
    { type: 'camera', tx: 53, ty: 1, fake: true, aim: 0.5 },
    { type: 'camera', tx: 56, ty: 1, fake: true, aim: -2.6 },
    { type: 'camera', tx: 62, ty: 1, fake: true, aim: 2.2 },
    { type: 'camera', tx: 65, ty: 1, fake: true, aim: -1.2 },
    { type: 'camera', tx: 68, ty: 1, fake: true, aim: 3.0 },
    { type: 'camera', tx: 71, ty: 1, fake: true, aim: 0.9 },
    { type: 'camera', tx: 74, ty: 1, fake: true, aim: -0.4 },
    { type: 'camera', tx: 77, ty: 1, fake: true, aim: 1.6 },
    { type: 'camera', tx: 80, ty: 1, fake: true, aim: -3.0 },
    // on the pillars (both sides, high and low)
    { type: 'camera', tx: 25, ty: 5, fake: true, aim: 1.3, mount: 'left' },
    { type: 'camera', tx: 25, ty: 7, fake: true, aim: 2.4, mount: 'left' },
    { type: 'camera', tx: 23, ty: 5, fake: true, aim: -0.8, mount: 'right' },
    { type: 'camera', tx: 23, ty: 6, fake: true, aim: -2.2, mount: 'right' },
    { type: 'camera', tx: 56, ty: 5, fake: true, aim: 0.6, mount: 'left' },
    { type: 'camera', tx: 56, ty: 6, fake: true, aim: 2.9, mount: 'left' },
    { type: 'camera', tx: 54, ty: 5, fake: true, aim: -1.5, mount: 'right' },
    { type: 'camera', tx: 54, ty: 7, fake: true, aim: -0.3, mount: 'right' },
    // on the back wall
    { type: 'camera', tx: 4,  ty: 3, fake: true, aim: 0.7,  mount: 'wall' },
    { type: 'camera', tx: 10, ty: 3, fake: true, aim: -2.4, mount: 'wall' },
    { type: 'camera', tx: 15, ty: 3, fake: true, aim: -0.6, mount: 'wall' },
    { type: 'camera', tx: 28, ty: 3, fake: true, aim: 2.1,  mount: 'wall' },
    { type: 'camera', tx: 35, ty: 3, fake: true, aim: 0.3,  mount: 'wall' },
    { type: 'camera', tx: 47, ty: 2, fake: true, aim: -1.1, mount: 'wall' },
    { type: 'camera', tx: 51, ty: 3, fake: true, aim: 1.6,  mount: 'wall' },
    { type: 'camera', tx: 63, ty: 3, fake: true, aim: -2.8, mount: 'wall' },
    { type: 'camera', tx: 70, ty: 2, fake: true, aim: 0.9,  mount: 'wall' },
    { type: 'camera', tx: 74, ty: 3, fake: true, aim: -0.5, mount: 'wall' },
    { type: 'camera', tx: 78, ty: 3, fake: true, aim: 2.6,  mount: 'wall' },
  ],
  goal: { tx: 80, ty: 2 },
};
