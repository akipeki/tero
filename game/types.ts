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
}

// ─── Tiles ───────────────────────────────────────────────────────────────────
export const enum TileType {
  AIR      = 0,
  SOLID    = 1,
  PLATFORM = 2,
  HAZARD   = 3,
}

// ─── Player state ────────────────────────────────────────────────────────────
export const enum PlayerState {
  IDLE        = 'IDLE',
  WALK        = 'WALK',
  JUMP        = 'JUMP',
  FALL        = 'FALL',
  BIG_IDLE    = 'BIG_IDLE',
  BIG_WALK    = 'BIG_WALK',
  BIG_JUMP    = 'BIG_JUMP',
  BIG_FALL    = 'BIG_FALL',
  HURT_FLASH  = 'HURT_FLASH',
  DEAD        = 'DEAD',
  WIN         = 'WIN',
}

// ─── Entity types / createtures and objects types ────────────────────────────────────────────────────────────
export const enum creaturesAndObjectsType {
  PLAYER       = 'PLAYER',
  WALKER       = 'WALKER',
  MUSHROOM     = 'MUSHROOM',
  QUESTION_BLOCK = 'QUESTION_BLOCK',
  GOAL         = 'GOAL',
}

// ─── Spawn definitions (in level data) ───────────────────────────────────────
export interface EnemySpawn { type: 'walker'; tx: number; ty: number }
export interface BlockSpawn  { type: 'question'; tx: number; ty: number }
export interface GoalSpawn   { tx: number; ty: number }
export interface PlayerSpawn { tx: number; ty: number }

export interface LevelSpawns {
  player:  PlayerSpawn;
  enemies: EnemySpawn[];
  blocks:  BlockSpawn[];
  goal:    GoalSpawn;
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
  lives: number;
  isBig: boolean;
  state: GameState;
}
