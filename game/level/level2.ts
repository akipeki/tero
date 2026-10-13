// file: game/level/level2.ts
//
// Floor 6 — The Cubicle Farm. 92 × 15. The floor of QUICK SYNCS: syncers
// (shirt sleeves, lanyard, mug) don't hurt you, but if one sees you, you're
// stuck in a conversation (mash jump). Duck to hide in a cardboard box;
// walls and cubicle partitions block their view.
//
//   0–18   the opening: a clerk, Dad's mug, the first desks
//  19–33   the long quiet corridor — one syncer pacing between two cabinets
//  34–64   THE CUBICLE MAZE: a syncer in every cubicle; hop the partitions
//          when they look away, or sneak along the desks above
//  65–74   a pit, Doris
//  75      the glass door that shuts behind you
//  76–90   MINI-BOSS: Chad from Talent Acquisition. He asks Tero's age,
//          offers the Junior Trainee Program and an application form
//          (only one answer is accepted). Then it's a fight.
//
// Legend: # solid · = desk (one-way) · ^ thumbtacks.

import type { LevelSpawns } from '../types';
import { buildLevel } from './buildLevel';

const ROWS = [
  '############################################################################################', // 0  ceiling
  '...........................................................................................#', // 1
  '...........................................................................................#', // 2
  '............===............................................................................#', // 3  high desks
  '.........................................===...===...===...===.............................#', // 4  desks over the cubicles
  '....===........===....................................................===......===...===...#', // 5
  '.......................................#.....#.....#.....#.....#...........................#', // 6  cubicle partitions
  '...................#.............#.....#.....#.....#.....#.....#...........................#', // 7  player row
  '########..########################################################...#######################', // 8  floor
  '########..########################################################...#######################', // 9
  '########..########################################################...#######################', // 10
  '########..########################################################...#######################', // 11
  '########..########################################################...#######################', // 12
  '########..########################################################...#######################', // 13
  '########..########################################################...#######################', // 14
];

const LEVEL = buildLevel(ROWS);

export const level2Tiles   = LEVEL.tiles;
export const LEVEL2_WIDTH  = LEVEL.width;
export const LEVEL2_HEIGHT = LEVEL.height;

export const level2Spawns: LevelSpawns = {
  player: { tx: 2, ty: 7 },
  enemies: [
    { type: 'walker', tx: 15, ty: 7 },
    { type: 'syncer', tx: 26, ty: 7 },   // the corridor
    { type: 'syncer', tx: 42, ty: 7 },   // the maze, one per cubicle
    { type: 'syncer', tx: 48, ty: 7 },
    { type: 'syncer', tx: 54, ty: 7 },
    { type: 'syncer', tx: 60, ty: 7 },
    { type: 'walker', tx: 72, ty: 7 },

  ],
  blocks: [
    { type: 'question', tx: 8,  ty: 4 },
    { type: 'question', tx: 71, ty: 2 },
  ],
  coins: [
    { tx: 5, ty: 4 }, { tx: 13, ty: 2 }, { tx: 16, ty: 4 },
    { tx: 26, ty: 7 },                                           // bait
    { tx: 42, ty: 3 }, { tx: 48, ty: 3 }, { tx: 54, ty: 3 }, { tx: 60, ty: 3 },
    { tx: 67, ty: 6 }, { tx: 73, ty: 6 },
  ],
  checkpoints: [
    { tx: 36, ty: 6 },
    { tx: 64, ty: 6 },
    { tx: 73, ty: 6 },
  ],
  gadgets: [
    { type: 'thing', tx: 55, ty: 3, id: 'drawing' },   // one of Dad's things
  ],
  goal: { tx: 88, ty: 2, kind: 'broken' },   // OUT OF ORDER — into the pipe
  boss: { type: 'recruiter', arenaTx: 76 },
};
