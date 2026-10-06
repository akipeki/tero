import type { EnemyType } from './creaturesAndObjects/enemyKinds';

// ─── Game State ──────────────────────────────────────────────────────────────
export const enum GameState {
  TITLE     = 'TITLE',
  PLAYING   = 'PLAYING',
  PAUSED    = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
  WIN       = 'WIN',
  /** A story sequence is on screen; the world is frozen behind it. */
  STORY     = 'STORY',
}

// ─── Input ───────────────────────────────────────────────────────────────────
export const enum Action {
  LEFT  = 1 << 0,
  RIGHT = 1 << 1,
  JUMP  = 1 << 2,
  PAUSE = 1 << 3,
  DOWN  = 1 << 4,
  /** Breathe fire: a little puff, or the full TANTRUM when the meter is full. */
  FIRE  = 1 << 5,
}

// ─── Tiles ───────────────────────────────────────────────────────────────────
export const enum TileType {
  AIR        = 0,
  SOLID      = 1,
  PLATFORM   = 2,
  HAZARD     = 3,
  CHECKPOINT = 4,
  COIN       = 5,
  /** A stack of paperwork: solid until Tero's fire burns it away. */
  PAPER      = 6,
  /** A projected slide bullet point: a one-way platform the boss's clicker
   *  moves around. Only placed at runtime, never in level rows. */
  BULLET     = 7,
  /** Red tape (Legal): not solid, but sticky — slow feet, weak jumps.
   *  Any fire burns it. */
  TAPE       = 8,
}

// ─── Player state ────────────────────────────────────────────────────────────
export const enum PlayerState {
  IDLE        = 'IDLE',
  WALK        = 'WALK',
  JUMP        = 'JUMP',
  FALL        = 'FALL',
  DUCK        = 'DUCK',
  BIG_IDLE    = 'BIG_IDLE',
  BIG_WALK    = 'BIG_WALK',
  BIG_JUMP    = 'BIG_JUMP',
  BIG_FALL    = 'BIG_FALL',
  HURT_FLASH  = 'HURT_FLASH',
  DEAD        = 'DEAD',
  WIN         = 'WIN',
}

// ─── Entity types / createtures and objects types ────────────────────────────
export const enum creaturesAndObjectsType {
  PLAYER         = 'PLAYER',
  WALKER         = 'WALKER',
  HOPPER         = 'HOPPER',
  MUSHROOM       = 'MUSHROOM',
  QUESTION_BLOCK = 'QUESTION_BLOCK',
  GOAL           = 'GOAL',
  COIN           = 'COIN',
  CHECKPOINT     = 'CHECKPOINT',
}

// ─── Spawn definitions (in level data) ───────────────────────────────────────
export interface EnemySpawn { type: EnemyType; tx: number; ty: number }
export interface BlockSpawn  { type: 'question'; tx: number; ty: number }
export interface GoalSpawn   { tx: number; ty: number }
export interface PlayerSpawn { tx: number; ty: number }
export interface CoinSpawn   { tx: number; ty: number }
export interface CheckpointSpawn { tx: number; ty: number }
/** R&D prototypes. A fax's `to` is the index of another fax in the same
 *  list (omit it for an OUT ONLY machine). */
export type GadgetSpawn =
  | { type: 'fax'; tx: number; ty: number; to?: number }
  | { type: 'spring'; tx: number; ty: number }
  /** A ceiling security camera sweeping between `sweep` angles (radians
   *  from straight down; negative = left). */
  | { type: 'camera'; tx: number; ty: number; sweep?: [number, number] };
/** A boss and the left column of its one-screen arena. */
export interface BossSpawn { type: 'halvorsen'; arenaTx: number }

export interface LevelSpawns {
  player:      PlayerSpawn;
  enemies:     EnemySpawn[];
  blocks:      BlockSpawn[];
  goal:        GoalSpawn;
  coins?:      CoinSpawn[];
  checkpoints?: CheckpointSpawn[];
  /** The floor's boss. While it lives the elevator stays shut. */
  boss?:       BossSpawn;
  gadgets?:    GadgetSpawn[];
}

// ─── Particle ────────────────────────────────────────────────────────────────
export interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  color: string; size: number;
}

// ─── HUD sync callback (game → React) ────────────────────────────────────────
export interface HudData {
  lives:    number;
  maxLives: number;
  isBig:    boolean;
  coins:    number;
  state:    GameState;
  /** Tantrum meter, 0..TANTRUM_MAX. During a tantrum: the time left. */
  rage:     number;
  /** True while the tantrum is running. */
  tantrum:  boolean;
  /** Workers freed this run — the "sent home" counter. */
  sentHome: number;
  /** The boss bar, while a boss fight is on. */
  boss:     { name: string; hp: number; maxHp: number; slide: string } | null;
}

// ─── End-of-run stats shown on Game Over / Win screens ───────────────────────
export interface RunStats {
  coins:        number;
  enemiesStomped: number;
  /** Workers turned back into people and sent home to their kids. */
  sentHome:     number;
  timeMs:       number;
}

// ─── Player render data (game → React DOM overlay) ───────────────────────────
export interface PlayerRenderData {
  /** Foot-centre in viewport (game) pixels — interpolated, camera- and
   *  shake-adjusted, NOT rounded. The overlay snaps to device pixels. */
  screenX: number;
  screenY: number;
  /** Extra vertical offset (game px, negative = up) from the walk bob.
   *  Kept separate so the UI can drop it under prefers-reduced-motion. */
  bobY: number;
  facingRight: boolean;
  /** Image path. For sprite sheets this is the horizontal strip. */
  src: string;
  /** Number of horizontal frames in `src`. 1 = static image. */
  frames: number;
  /** Which cell of the strip to show (0 when frames === 1). */
  frameIdx: number;
  /** Squash/stretch, already damped by SQUASH_STRENGTH. */
  scaleX: number;
  scaleY: number;
  shouldFlash: boolean;
  /** Caffeinated — drawn BIG_SPRITE_SCALE larger. */
  big: boolean;
  /** Mid-tantrum: the overlay glows red and trembles. */
  tantrum: boolean;
  /** Ducking still: drawn as a cardboard box instead of Tero. */
  hiding: boolean;
  /** Just came out of a fax machine: a grainy black-and-white copy. */
  faxed: boolean;
}

// ─── Story overlay (game → React) ────────────────────────────────────────────
export interface StoryView {
  speaker?: string;
  /** Portrait image (first frame of a strip is shown). */
  portraitSrc?: string;
  portraitFrames?: number;
  text: string;
  /** 0-based position in the current sequence. */
  index: number;
  total: number;
}
