// file: game/creaturesAndObjects/Boss.ts
//
// What Game needs from a boss. Each boss owns a one-screen arena starting at
// `arenaTx`; Game locks the camera, shuts the door at `arenaTx - 1`, keeps
// the elevator closed until the boss walks out, and reads the one-tick flags.

import type { creaturesAndObjects, UpdateCtx } from './creaturesAndObjects';
import type { Player } from './Player';
import type { Flame } from './Flame';
import type { WalkerVariant, HopperVariant } from './enemyKinds';

export type BossPhase = 'waiting' | 'fight' | 'freed' | 'gone';

export interface Boss extends creaturesAndObjects {
  readonly name: string;
  /** Second line of the boss bar (current slide, heads left…). */
  readonly subtitle: string;
  readonly hp: number;
  readonly maxHp: number;
  readonly arenaTx: number;
  readonly arenaLeft: number;
  phase: BossPhase;
  readonly fighting: boolean;
  introDone: boolean;
  // one-tick flags Game reads and clears
  justHit: boolean;
  wantsIntern: boolean;
  freedNow: boolean;
  walkedOut: boolean;
  /** Workers to spawn already-freed (a hydra head resigning). */
  resigned: { variant: WalkerVariant | HopperVariant; x: number; y: number }[];

  start(map: UpdateCtx['map']): void;
  reset(map: UpdateCtx['map']): void;
  playerInArena(player: Player): boolean;
  tick(ctx: UpdateCtx, player: Player, flames: Flame[]): void;
  drawBackdrop(ctx: CanvasRenderingContext2D, camX: number): void;
}
