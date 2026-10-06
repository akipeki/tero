// file: game/level/level1.ts
//
// Floor 1 — The Mailroom. 80 × 15, built as the showcase floor:
//
//   0–12   start: memo on the wall, a cabinet that keeps the first clerk
//          off the spawn, a desk, Dad's old desk
//          (the story fills the tantrum meter there)
//  13–14   a leak to hop
//  15–33   THE MONDAY RUSH: a crowd penned in by a wall of paperwork —
//          the first tantrum
//  34      the paper wall: burn a hole (a tiny puff does it)
//  35–49   the slain copier, Gary from IT, a water-cooler checkpoint, a pit
//  50–55   the big leak, crossed on desks
//  56–63   cabinets and a high shelf; the supply-closet stash hides behind
//          paper up there (secret)
//  64–79   a pit, the last stretch, the elevator
//
// The camera only scrolls sideways and shows rows 0–8; rows 9–14 are
// foundation. Legend: # solid · = desk (one-way) · ^ leak · % paperwork.

import type { LevelSpawns } from '../types';
import { buildLevel } from './buildLevel';

const ROWS = [
  '################################################################################', // 0  ceiling
  '..................................%.........................%...................', // 1
  '..................................%.........................%...................', // 2  stash behind paper
  '..................................%......................=======................', // 3  high shelf
  '..................................%.................==..........................', // 4
  '..................................%.............................................', // 5
  '.....===..........................%..............==....==.#####.................', // 6
  '....#.............................%.......................#####......#..........', // 7  player row
  '#############^^###########################..######^^^^^^########..##############', // 8  floor
  '##########################################..####################..##############', // 9
  '##########################################..####################..##############', // 10
  '##########################################..####################..##############', // 11
  '##########################################..####################..##############', // 12
  '##########################################..####################..##############', // 13
  '##########################################..####################..##############', // 14
];

const LEVEL = buildLevel(ROWS);

export const level1Tiles  = LEVEL.tiles;
export const LEVEL_WIDTH  = LEVEL.width;
export const LEVEL_HEIGHT = LEVEL.height;

export const level1Spawns: LevelSpawns = {
  player: { tx: 2, ty: 7 },

  enemies: [
    { type: 'walker', tx: 9,  ty: 7 },   // the first clerk: learn to stomp
    // The Monday rush — penned between the leak and the paper wall
    { type: 'walker', tx: 21, ty: 7 },
    { type: 'walker', tx: 23, ty: 7 },
    { type: 'walker', tx: 25, ty: 7 },
    { type: 'walker', tx: 27, ty: 7 },
    { type: 'walker', tx: 29, ty: 7 },
    { type: 'hopper', tx: 31, ty: 7 },
    { type: 'walker', tx: 38, ty: 7 },
    { type: 'hopper', tx: 47, ty: 7 },
    { type: 'walker', tx: 67, ty: 7 },
    { type: 'hopper', tx: 72, ty: 7 },
    { type: 'walker', tx: 75, ty: 7 },
  ],

  blocks: [
    { type: 'question', tx: 6,  ty: 4 },
    { type: 'question', tx: 45, ty: 4 },
  ],

  coins: [
    { tx: 3,  ty: 7 }, { tx: 4,  ty: 7 },
    { tx: 13, ty: 6 }, { tx: 14, ty: 6 },                     // over the leak
    { tx: 20, ty: 7 }, { tx: 24, ty: 7 }, { tx: 28, ty: 7 },  // in the rush
    { tx: 35, ty: 7 },                                        // through the hole
    { tx: 42, ty: 6 }, { tx: 43, ty: 6 },                     // over the pit
    { tx: 49, ty: 5 }, { tx: 52, ty: 3 }, { tx: 53, ty: 3 }, { tx: 55, ty: 5 },
    // the supply-closet stash, behind the paper on the high shelf
    { tx: 61, ty: 2 }, { tx: 62, ty: 2 }, { tx: 63, ty: 2 }, { tx: 62, ty: 1 }, { tx: 63, ty: 1 },
    { tx: 64, ty: 6 }, { tx: 65, ty: 6 },                     // over the pit
    { tx: 72, ty: 6 }, { tx: 73, ty: 6 },
  ],

  checkpoints: [
    { tx: 40, ty: 6 },
  ],

  goal: { tx: 76, ty: 2 },
};
