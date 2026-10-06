// file: game/level/level6.ts
//
// Floor 33 — The Shareholders' Sanctum. 80 × 15. The finale:
//
//   0–56   the penthouse: a champagne spill, marble steps, gold desks,
//          a pit or two, the Ferrari parked indoors
//  57–62   DAD, at his desk. He has a deliverable due.
//  63      the glass door that shuts behind you
//  64–78   THE ARENA: THE BOARD — five executives on long pinstripe necks
//          rising from one boardroom table (Board.ts). The elevator home
//          stays shut until the Board resigns.
//
// Legend: # solid · = desk · ^ hazard.

import type { LevelSpawns } from '../types';
import { buildLevel } from './buildLevel';

const ROWS = [
  '################################################################################', // 0  ceiling
  '...............................................................................#', // 1
  '...............................................................................#', // 2
  '...............................................................................#', // 3
  '....................====.................====..................................#', // 4  gold desks
  '...........................====....##..............===.........................#', // 5  marble steps
  '.................##...............###..........................................#', // 6
  '................###..............####..........................................#', // 7  player row
  '###########^^^##########...###########^^#######...##############################', // 8  floor
  '########################...####################...##############################', // 9
  '########################...####################...##############################', // 10
  '########################...####################...##############################', // 11
  '########################...####################...##############################', // 12
  '########################...####################...##############################', // 13
  '########################...####################...##############################', // 14
];

const LEVEL = buildLevel(ROWS);

export const level6Tiles   = LEVEL.tiles;
export const LEVEL6_WIDTH  = LEVEL.width;
export const LEVEL6_HEIGHT = LEVEL.height;

export const level6Spawns: LevelSpawns = {
  player: { tx: 2, ty: 7 },
  enemies: [
    { type: 'pig',     tx: 8,  ty: 7 },
    { type: 'vampire', tx: 21, ty: 7 },
    { type: 'guard',   tx: 30, ty: 7 },
    { type: 'gorilla', tx: 42, ty: 7 },
    { type: 'robot',   tx: 54, ty: 7 },
  ],
  blocks: [
    { type: 'question', tx: 6,  ty: 4 },
    { type: 'question', tx: 43, ty: 1 },
  ],
  coins: [
    { tx: 11, ty: 6 }, { tx: 12, ty: 5 }, { tx: 13, ty: 6 },
    { tx: 21, ty: 3 }, { tx: 22, ty: 3 },
    { tx: 25, ty: 6 }, { tx: 28, ty: 4 }, { tx: 29, ty: 4 },
    { tx: 38, ty: 6 }, { tx: 39, ty: 6 },
    { tx: 48, ty: 6 }, { tx: 52, ty: 4 },
  ],
  checkpoints: [
    { tx: 31, ty: 6 },
    { tx: 61, ty: 6 },
  ],
  goal: { tx: 76, ty: 2 },
  boss: { type: 'board', arenaTx: 64 },
};
