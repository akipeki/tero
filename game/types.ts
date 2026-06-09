// ─── Game State ──────────────────────────────────────────────────────────────
export const enum GameState {
  TITLE     = 'TITLE',
  PLAYING   = 'PLAYING',
  PAUSED    = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
  WIN       = 'WIN',
}

// ─── Input ───────────────────────────────────────────────────────────────────
export const enum Action {
  LEFT  = 1 << 0,
  RIGHT = 1 << 1,
  JUMP  = 1 << 2,
  PAUSE = 1 << 3,
  DOWN  = 1 << 4,
}

// ─── Tiles ───────────────────────────────────────────────────────────────────
export const enum TileType {
  AIR        = 0,
  SOLID      = 1,
  PLATFORM   = 2,
  HAZARD     = 3,
  CHECKPOINT = 4,
  COIN       = 5,
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
export interface EnemySpawn { type: 'walker' | 'hopper'; tx: number; ty: number }
export interface BlockSpawn  { type: 'question'; tx: number; ty: number }
export interface GoalSpawn   { tx: number; ty: number }
export interface PlayerSpawn { tx: number; ty: number }
export interface CoinSpawn   { tx: number; ty: number }
export interface CheckpointSpawn { tx: number; ty: number }

export interface LevelSpawns {
  player:      PlayerSpawn;
  enemies:     EnemySpawn[];
  blocks:      BlockSpawn[];
  goal:        GoalSpawn;
  coins?:      CoinSpawn[];
  checkpoints?: CheckpointSpawn[];
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
}

// ─── End-of-run stats shown on Game Over / Win screens ───────────────────────
export interface RunStats {
  coins:        number;
  enemiesStomped: number;
  timeMs:       number;
}

// ─── Player render data (game → React DOM overlay) ───────────────────────────
export interface PlayerRenderData {
  x: number;
  y: number;
  w: number;
  h: number;
  camX: number;
  facingRight: boolean;
  /** Image path. For sprite sheets this is the strip; UI cycles via background-position. */
  frameSrc: string;
  /** Number of horizontal frames in `frameSrc`. 1 = static image. */
  frames: number;
  /** Cycle rate when frames > 1. */
  fps: number;
  scaleX: number;
  scaleY: number;
  shouldFlash: boolean;
}
