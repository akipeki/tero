// file: game/level/level5.ts
//
// Floor 21 — R&D (Rage & Depression). 80 × 15. The floor of PROTOTYPES:
// fax machines are teleporters (stand at one, press DOWN; you come out the
// other end a grainy copy) and the SYNERGY SPRING launches you over walls.
// The experiments got out: flesh-eating plants and robots.
//
//   0–13   the fax that sends you into...
//  14–28   THE CLEAN ROOM: sealed glass; the axed PC; fax out again
//  29–44   Dad's cot; a wall too tall to jump, a spring in front of it
//  45–62   the intern wheel, the VP of Sales (a poodle)
//  63–72   a spill too wide to jump — fax across
//  73–79   the elevator
//
// Legend: # solid · = desk · ^ hazard. Gadgets are entities (see spawns).

import type { LevelSpawns } from '../types';
import { buildLevel } from './buildLevel';

const ROWS = [
  '################################################################################', // 0  ceiling
  '..............#.............#...................................................', // 1
  '..............#.............#...................................................', // 2
  '..............#.............#.............##....................................', // 3  the tall wall
  '..............#.............#.............##..............===...................', // 4
  '..............#...===.......#.......===...##........===.........................', // 5  desks
  '..............#.............#.............##....................................', // 6
  '..............#.............#.............##....................................', // 7  player row
  '################################################..#############^^^^^^^^^^#######', // 8  floor
  '################################################..##############################', // 9
  '################################################..##############################', // 10
  '################################################..##############################', // 11
  '################################################..##############################', // 12
  '################################################..##############################', // 13
  '################################################..##############################', // 14
];

const LEVEL = buildLevel(ROWS);

export const level5Tiles   = LEVEL.tiles;
export const LEVEL5_WIDTH  = LEVEL.width;
export const LEVEL5_HEIGHT = LEVEL.height;

export const level5Spawns: LevelSpawns = {
  player: { tx: 2, ty: 7 },
  enemies: [
    { type: 'robot',  tx: 9,  ty: 7 },
    { type: 'plant',  tx: 22, ty: 7 },   // the experiment in the clean room
    { type: 'walker', tx: 33, ty: 7 },
    { type: 'plant',  tx: 39, ty: 7 },
    { type: 'robot',  tx: 46, ty: 7 },
    { type: 'hopper', tx: 55, ty: 7 },
    { type: 'robot',  tx: 76, ty: 7 },
  ],
  blocks: [
    { type: 'question', tx: 5,  ty: 4 },
    { type: 'question', tx: 37, ty: 2 },
  ],
  coins: [
    { tx: 17, ty: 7 }, { tx: 19, ty: 4 }, { tx: 20, ty: 4 }, { tx: 25, ty: 7 },   // the clean room
    { tx: 42, ty: 1 }, { tx: 43, ty: 1 },                                     // top of the wall
    { tx: 48, ty: 6 }, { tx: 49, ty: 6 }, { tx: 53, ty: 4 }, { tx: 59, ty: 3 },
  ],
  checkpoints: [
    { tx: 31, ty: 6 },
    { tx: 57, ty: 6 },
  ],
  gadgets: [
    { type: 'thing', tx: 18, ty: 4, id: 'slipper' },   // one of Dad's things
    { type: 'fax', tx: 11, ty: 7, to: 1 },   // 0: into the clean room
    { type: 'fax', tx: 16, ty: 7 },          // 1: OUT ONLY
    { type: 'fax', tx: 26, ty: 7, to: 3 },   // 2: out of the clean room
    { type: 'fax', tx: 30, ty: 7 },          // 3: OUT ONLY
    { type: 'spring', tx: 40, ty: 7 },       // over the tall wall
    { type: 'fax', tx: 61, ty: 7, to: 6 },   // 5: across the spill
    { type: 'fax', tx: 74, ty: 7 },          // 6: OUT ONLY
  ],
  goal: { tx: 77, ty: 2 },
};
