// file: game/level/level4.ts
//
// Floor 13 — Legal. 80 × 15. ABANDON HOPE. BILLED HOURLY. The floor of RED
// TAPE (~): not solid, but sticky: Tero wades through it slowly and can
// barely jump out of it. Any fire burns it, even a puff.
//
//   0–13   a first patch of tape to wade through or burn
//  14–31   the tape curtain (cols 25–26) right before a pit: burn it, then
//          take a running jump
//  32–47   Project Orphanage; tape in front of a paper wall
//  48–60   the tape web over the tacks (burn it or take the desk above)
//  61–79   a last tape strip, the elevator
//
// Legend: # solid · = desk · ^ tacks · % paperwork · ~ red tape.

import type { LevelSpawns } from '../types';
import { buildLevel } from './buildLevel';

const ROWS = [
  '################################################################################', // 0  ceiling
  '.........................~~.....................................................', // 1  tape curtain
  '.........................~~.....................................................', // 2
  '.........................~~...................%.....========....................', // 3  paper wall · desk over the web
  '.........................~~...........===.....%.................................', // 4
  '................===......~~......===........~~%......~~~~~~........====.........', // 5  tape web
  '..........~~~~...........~~.................~~%......~~~~~~.....................', // 6
  '..........~~~~...........~~.................~~%......~~~~~~...~~~~..............', // 7  player row
  '############################...#######################^^^^##########..##########', // 8  floor
  '############################...#####################################..##########', // 9
  '############################...#####################################..##########', // 10
  '############################...#####################################..##########', // 11
  '############################...#####################################..##########', // 12
  '############################...#####################################..##########', // 13
  '############################...#####################################..##########', // 14
];

const LEVEL = buildLevel(ROWS);

export const level4Tiles   = LEVEL.tiles;
export const LEVEL4_WIDTH  = LEVEL.width;
export const LEVEL4_HEIGHT = LEVEL.height;

export const level4Spawns: LevelSpawns = {
  player: { tx: 2, ty: 7 },
  enemies: [
    { type: 'walker',  tx: 16, ty: 7 },
    { type: 'vampire', tx: 21, ty: 7 },   // the lawyers
    { type: 'walker',  tx: 35, ty: 7 },
    { type: 'pig',     tx: 40, ty: 7 },
    { type: 'vampire', tx: 50, ty: 7 },
    { type: 'walker',  tx: 61, ty: 7 },
    { type: 'vampire', tx: 72, ty: 7 },
  ],
  blocks: [
    { type: 'question', tx: 6,  ty: 4 },
    { type: 'question', tx: 39, ty: 1 },
  ],
  coins: [
    { tx: 11, ty: 7 }, { tx: 12, ty: 7 },                     // in the first tape
    { tx: 17, ty: 4 }, { tx: 29, ty: 5 },
    { tx: 34, ty: 4 }, { tx: 47, ty: 7 },                     // behind the paper wall
    { tx: 53, ty: 2 }, { tx: 56, ty: 2 }, { tx: 59, ty: 2 },  // the desk route
    { tx: 68, ty: 4 }, { tx: 69, ty: 4 },
  ],
  checkpoints: [
    { tx: 32, ty: 6 },
    { tx: 49, ty: 6 },
  ],
  goal: { tx: 76, ty: 2 },
};
