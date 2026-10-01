// file: game/creaturesAndObjects/enemyKinds.ts
//
// Every enemy is a Walker or a Hopper with a variant that sets its size,
// speed and look. Level data names the variant directly (`type: 'pig'`);
// the original 'walker' / 'hopper' types are the office clerk and manager.

import { ENEMY_SPEED } from '../constants';

export type WalkerVariant = 'clerk' | 'guard' | 'rat' | 'pig' | 'robot' | 'plant';
export type HopperVariant = 'manager' | 'gorilla' | 'vampire';

export interface WalkerSpec {
  w: number;
  h: number;
  /** Patrol speed (px/tick). 0 = stays put. */
  speed: number;
  /** False = landing on it hurts (piranha-plant rules). */
  stompable: boolean;
  /** Stomp particle colours. */
  burst: [string, string];
}

export interface HopperSpec {
  w: number;
  h: number;
  interval: number;
  vy: number;
  vx: number;
  burst: [string, string];
}

export const WALKERS: Record<WalkerVariant, WalkerSpec> = {
  clerk: { w: 24, h: 24, speed: ENEMY_SPEED, stompable: true,  burst: ['#ff004d', '#7f0026'] },
  guard: { w: 24, h: 26, speed: 1.7, stompable: true,  burst: ['#3f5090', '#1d2647'] },
  rat:   { w: 20, h: 18, speed: 2.4, stompable: true,  burst: ['#8e8a94', '#f2a0b0'] },
  pig:   { w: 28, h: 26, speed: 0.8, stompable: true,  burst: ['#f0a0a8', '#e8b72f'] },
  robot: { w: 24, h: 28, speed: 1.0, stompable: true,  burst: ['#a9b3bd', '#ff3b3b'] },
  plant: { w: 22, h: 28, speed: 0,   stompable: false, burst: ['#3f9a48', '#c8323a'] },
};

export const HOPPERS: Record<HopperVariant, HopperSpec> = {
  manager: { w: 24, h: 24, interval: 70, vy: -8.5,  vx: 1.8, burst: ['#ff77a8', '#7f0026'] },
  gorilla: { w: 28, h: 28, interval: 90, vy: -10.5, vx: 2.4, burst: ['#3b3a40', '#ff3b3b'] },
  vampire: { w: 24, h: 26, interval: 55, vy: -7.5,  vx: 3.0, burst: ['#1d1d24', '#9c1f2b'] },
};

export type EnemyType = 'walker' | 'hopper' | Exclude<WalkerVariant, 'clerk'> | Exclude<HopperVariant, 'manager'>;

export const ENEMY_TYPES: readonly EnemyType[] = [
  'walker', 'hopper', 'guard', 'rat', 'pig', 'robot', 'plant', 'gorilla', 'vampire',
];

/** Which class and variant a level's enemy type spawns. */
export function enemyClass(type: EnemyType):
  | { cls: 'walker'; variant: WalkerVariant }
  | { cls: 'hopper'; variant: HopperVariant } {
  if (type === 'walker') return { cls: 'walker', variant: 'clerk' };
  if (type === 'hopper') return { cls: 'hopper', variant: 'manager' };
  if (type in HOPPERS) return { cls: 'hopper', variant: type as HopperVariant };
  return { cls: 'walker', variant: type as WalkerVariant };
}
