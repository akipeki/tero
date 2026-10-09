// file: game/level/level3.ts
//
// Floor 12 — The Boardroom. 80 × 15. Ends in the chapter's boss fight:
//
//   0–25   thumbtacks by the door, the long boardroom table (clerks above
//          and below), Dad's calendar
//  26–28   a pit
//  29–47   the paper avalanche (burn through), a desk over the tacks
//  48–53   a filing-cabinet staircase
//  54–62   checkpoint, then the glass door (column 63) that shuts behind you
//  64–78   THE ARENA: Mr. Halvorsen's Q3 review, one screen wide. The
//          slides' bullet points are the platforms (see Halvorsen.ts).
//          The elevator stays shut until the meeting is over.
//
// Legend: # solid · = desk (one-way) · ^ thumbtacks · % paperwork.

import type { LevelSpawns } from '../types';
import { buildLevel } from './buildLevel';

const ROWS = [
  '################################################################################', // 0  ceiling
  '...............................................................................#', // 1
  '...............................................................................#', // 2
  '....................................%..........................................#', // 3  the paper avalanche
  '....................................%..........................................#', // 4
  '....................................%%...=====....##...........................#', // 5  desk over the tacks · cabinet stairs
  '..........===============...........%%...........####..........................#', // 6  the long boardroom table
  '....................................%%..........######.........................#', // 7  player row
  '#######^^#################...#############^^^###################################', // 8  floor
  '##########################...###################################################', // 9
  '##########################...###################################################', // 10
  '##########################...###################################################', // 11
  '##########################...###################################################', // 12
  '##########################...###################################################', // 13
  '##########################...###################################################', // 14
];

const LEVEL = buildLevel(ROWS);

export const level3Tiles   = LEVEL.tiles;
export const LEVEL3_WIDTH  = LEVEL.width;
export const LEVEL3_HEIGHT = LEVEL.height;

export const level3Spawns: LevelSpawns = {
  player: { tx: 2, ty: 7 },
  enemies: [
    { type: 'walker', tx: 14, ty: 5 },   // pacing the table
    { type: 'walker', tx: 20, ty: 5 },
    { type: 'walker', tx: 17, ty: 7 },   // under it
    { type: 'hopper', tx: 32, ty: 7 },
    { type: 'walker', tx: 40, ty: 7 },
    { type: 'hopper', tx: 46, ty: 7 },
    { type: 'walker', tx: 56, ty: 7 },
  ],
  blocks: [
    { type: 'question', tx: 5,  ty: 4 },
    { type: 'question', tx: 31, ty: 4 },
  ],
  coins: [
    { tx: 11, ty: 5 }, { tx: 13, ty: 5 }, { tx: 22, ty: 5 }, { tx: 24, ty: 5 },  // on the table
    { tx: 26, ty: 6 }, { tx: 27, ty: 5 }, { tx: 28, ty: 6 },                // over the pit
    { tx: 38, ty: 7 },                                                  // behind the avalanche
    { tx: 42, ty: 4 }, { tx: 44, ty: 4 },
    { tx: 50, ty: 4 }, { tx: 51, ty: 4 },                                 // top of the stairs
  ],
  checkpoints: [
    { tx: 29, ty: 6 },
    { tx: 59, ty: 6 },
  ],
  gadgets: [
    { type: 'thing', tx: 37, ty: 4, id: 'photo' },   // one of Dad's things
  ],
  goal: { tx: 76, ty: 2 },
  boss: { type: 'halvorsen', arenaTx: 64 },
};
