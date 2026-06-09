// file: game/constants.ts

// ─── Physics ────────────────────────────────────────────────────────────────
export const TILE_SIZE          = 32;
export const GRAVITY            = 0.55;
export const MAX_FALL_SPD       = 14;
export const WALK_SPEED         = 3.5;
export const RUN_ACCEL          = 0.4;
export const FRICTION           = 0.85;
export const AIR_FRICTION       = 0.95;
export const JUMP_FORCE         = -13.2;  // bumped from -12.5 — block row at ty=4 was on the edge
export const JUMP_CUT           = 0.45;   // vy multiplier when jump released (edge-only now)
export const STOMP_BOUNCE       = -7;
export const COYOTE_TIME        = 8;      // frames
export const JUMP_BUFFER        = 8;      // frames
export const INVINCIBLE_FRAMES  = 90;
export const ENEMY_SPEED        = 1.2;

// Score values
export const COIN_VALUE         = 10;
export const STOMP_VALUE        = 100;
export const CHAIN_BONUS        = 50;  // added per consecutive air-stomp

// ─── Animation ──────────────────────────────────────────────────────────────
export const WALK_ANIM_FPS      = 8;

// ─── Viewport ───────────────────────────────────────────────────────────────
export const VIEWPORT_W         = 480;
export const VIEWPORT_H         = 270;

// ─── Game ────────────────────────────────────────────────────────────────────
export const STARTING_LIVES     = 3;
export const FIXED_DT           = 1 / 60;
export const MAX_FRAME_TIME     = 0.1;    // cap deltaTime to avoid spiral
export const DEAD_TIMER_FRAMES  = 70;     // shortened from 120 — repeat deaths felt slow

// ─── Camera ─────────────────────────────────────────────────────────────────
export const CAMERA_LERP        = 0.12;

// ─── Screen shake ────────────────────────────────────────────────────────────
export const SHAKE_DECAY        = 0.85;

// ─── Particles ───────────────────────────────────────────────────────────────
export const PARTICLE_GRAVITY   = 0.25;
