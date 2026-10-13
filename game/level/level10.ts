// file: game/level/level10.ts
//
// THE VENTS — between Floor 6 and Floor 12. 96 × 15. The elevator was out
// of order, so Tero jumped into a pipe. Inside the ventilation ducts lives
// ELVIS, the office dog the company got because it was trendy and stopped
// feeding when it cut costs. He's big and kind, and Tero rides him.
//
// A feel-good floor: no enemies, no pits, bumps don't hurt while riding.
// Floppies, one of Dad's things, and some story you won't get anywhere
// else. Nobody upstairs knows this place exists: rainbows, smileys and
// slogans on the walls.
//
//   0–10   drop in from the pipe; Elvis is sitting there (meeting)
//  11–37   the first ride: floor fans to jump, crates, ledges
//  38–52   THE RESISTANCE: old workers who resist... leaving. A grenade.
//  53–77   the second ride; Elvis remembers a tired grey dragon
//  78–95   the graffiti gallery; the vent out to Floor 12
//
// Legend: # solid · = ledge · ^ floor fan.

import type { LevelSpawns } from '../types';
import { buildLevel } from './buildLevel';

const ROWS = [
  '################################################################################################', // 0  duct ceiling
  '................................................................................................', // 1
  '................................................................................................', // 2
  '..................................................................====..........................', // 3  the high ledge
  '..........................====..................................................................', // 4
  '..............................................................===.......#.....====..............', // 5  ledges
  '.......................#...............................#...............##.......................', // 6
  '.............#........##..........#....................##.............###...........#...........', // 7  player row
  '################^^############^^##########################^^^#############^^####################', // 8  duct floor (^ = fans)
  '################################################################################################', // 9
  '################################################################################################', // 10
  '################################################################################################', // 11
  '################################################################################################', // 12
  '################################################################################################', // 13
  '################################################################################################', // 14
];

const LEVEL = buildLevel(ROWS);

export const level10Tiles   = LEVEL.tiles;
export const LEVEL10_WIDTH  = LEVEL.width;
export const LEVEL10_HEIGHT = LEVEL.height;

export const level10Spawns: LevelSpawns = {
  player: { tx: 2, ty: 7 },
  enemies: [],
  blocks: [
    { type: 'question', tx: 20, ty: 4 },
  ],
  coins: [
    { tx: 16, ty: 5 }, { tx: 17, ty: 5 },
    { tx: 26, ty: 3 }, { tx: 27, ty: 3 }, { tx: 28, ty: 3 }, { tx: 29, ty: 3 },
    { tx: 30, ty: 5 }, { tx: 31, ty: 5 },
    { tx: 58, ty: 5 }, { tx: 59, ty: 4 }, { tx: 60, ty: 5 },
    { tx: 63, ty: 4 }, { tx: 72, ty: 3 },
    { tx: 74, ty: 5 }, { tx: 75, ty: 5 },
    { tx: 78, ty: 4 }, { tx: 79, ty: 4 }, { tx: 80, ty: 4 }, { tx: 81, ty: 4 },
  ],
  checkpoints: [
    { tx: 37, ty: 6 },
    { tx: 53, ty: 6 },
  ],
  gadgets: [
    { type: 'elvis', tx: 9, ty: 7 },
    // the resistance, round their barrel fire
    { type: 'barrel', tx: 45, ty: 7 },
    { type: 'npc', tx: 43, ty: 7, variant: 'clerk', facingRight: true, lines: ['WE RESIST.', 'SINCE 1987.'] },
    { type: 'npc', tx: 44, ty: 7, variant: 'guard', facingRight: true, lines: ['OFF DUTY. FOREVER.'] },
    { type: 'npc', tx: 46, ty: 7, variant: 'syncer', lines: ['NO MORE SYNCS.'] },
    { type: 'npc', tx: 47, ty: 7, variant: 'pig', lines: ['EX-VP. NOW: VIBES.'] },
    { type: 'thing', tx: 68, ty: 2, id: 'sandwich' },   // one of Dad's things
  ],
  goal: { tx: 92, ty: 2, kind: 'vent', label: 'FLOOR 12' },
};
