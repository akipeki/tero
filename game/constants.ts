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

// ─── Tantrum ────────────────────────────────────────────────────────────────
// Tero's anger fills a meter; when it's full, FIRE starts a TANTRUM: a
// stream of baby fire that turns workers back into people and sends them home.
export const TANTRUM_MAX        = 100;
export const RAGE_HURT          = 35;   // getting hurt is unfair
export const RAGE_DEATH         = 50;   // dying is very unfair (so struggling players get help)
export const RAGE_STOMP         = 12;
export const RAGE_COIN          = 3;
export const RAGE_PAPER         = 2;
export const TANTRUM_FRAMES     = 300;  // 5 s
export const TANTRUM_SPEED      = 1.3;  // walk-speed multiplier while raging
export const FLAME_EVERY        = 2;    // ticks between flames in the stream
export const FLAME_SPEED        = 5.5;
export const FLAME_LIFE         = 24;   // ≈ 4 tiles of reach
export const PUFF_LIFE          = 9;    // the little hiccup puff: ≈ 1.5 tiles
export const PUFF_SPEED         = 4.5;
export const PUFF_COOLDOWN      = 20;
// Hit-stop: the world freezes for a few ticks so hits land.
export const HITSTOP_STOMP      = 4;
export const HITSTOP_FREE       = 2;
export const HITSTOP_HURT       = 6;

// Score values
export const COIN_VALUE         = 10;
export const STOMP_VALUE        = 100;
export const CHAIN_BONUS        = 50;  // added per consecutive air-stomp
export const SENT_HOME_VALUE    = 150; // a freed worker is worth more than a squashed one
export const BOSS_VALUE         = 1000; // on top of SENT_HOME_VALUE

// ─── Animation ──────────────────────────────────────────────────────────────
export const WALK_ANIM_FPS      = 8;
/** World pixels travelled per walk-cycle frame. Animation follows distance,
 *  not time, so the feet don't slide at low speeds. */
export const WALK_STRIDE_PX     = 14;
/** How much of Player.scaleX/Y squash reaches the screen (0 = off, 1 = full).
 *  Detailed art distorts badly at full strength. */
export const SQUASH_STRENGTH    = 0.35;
/** Vertical bob (world px) on each step of a walk cycle. */
export const WALK_BOB_PX        = 1.5;
/** Sprite scale while caffeinated (the "big" power-up). Matches the hitbox
 *  growing from 28 to 44 px tall. */
export const BIG_SPRITE_SCALE   = 1.5;

// ─── Story ───────────────────────────────────────────────────────────────────
/** Typewriter speed for story cards (characters per 60 Hz tick ≈ 45 chars/s). */
export const STORY_CHARS_PER_TICK = 0.75;
/** Play the typing blip every N revealed characters. */
export const STORY_BLIP_EVERY     = 3;
/** Ticks after a sequence opens during which advance/skip input is ignored,
 *  so a jump pressed mid-run doesn't skip a story beat it walked into. */
export const STORY_INPUT_GRACE    = 20;

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
