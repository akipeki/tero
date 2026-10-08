// file: game/interludes/Interlude.ts
//
// ── INTERLUDES ── the moments where the office takes over the game and it
// briefly turns into something else: a corporate acquisition, a 3D shooter,
// an RPG performance review… The story script starts one with
// `effect: 'interlude:<id>'` on a trigger; the world freezes, the interlude
// runs with the same controls (move, JUMP, FIRE, DADA), and when it's done
// the platformer picks up exactly where it left off.
//
// An interlude either takes over the whole screen or (`overlay = true`)
// draws on top of the frozen level.

import type { InputHandler } from '../InputHandler';
import type { AudioManager } from '../AudioManager';
import type { ScreenShake } from '../ScreenShake';

export const INTERLUDE_IDS = [
  'acquisition', 'unskippable_ad', 'cubicle3d', 'review', 'muzak', 'terms', 'nap', 'desktop',
] as const;
export type InterludeId = typeof INTERLUDE_IDS[number];

export interface InterludeHost {
  readonly input: InputHandler;
  readonly audio: AudioManager;
  readonly shake: ScreenShake;
  /** The big centre-screen shout. */
  callout(text: string): void;
}

export abstract class Interlude {
  /** Set when it's over; Game resumes the level next tick. */
  done = false;
  /** Ticks since it started (60 per second). */
  t = 0;
  /** Draw over the frozen level instead of taking over the screen. */
  overlay = false;
  /** Hide the Tero overlay sprite (the interlude draws its own, if any). */
  get hidesPlayer(): boolean { return !this.overlay; }
  /** Shown in the playtest log. */
  abstract readonly id: InterludeId;

  /** One fixed 60 Hz tick. */
  abstract update(host: InterludeHost): void;
  /** Draws onto the 480×270 game canvas. */
  abstract draw(ctx: CanvasRenderingContext2D): void;
}
