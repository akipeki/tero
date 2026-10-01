// file: game/render/sprites/PlayerSpriteAssets.ts
//
// Per-PlayerState frame definitions. Each state maps to one of:
//   - a single image  (frames: 1 — image is shown statically)
//   - a sprite sheet  (frames: N — horizontal strip cycled at `fps`)
//
// Game.syncPlayerOverlay picks the frame; GameContainer draws it via CSS
// `background-image` + `background-position`. Swapping in a 6-frame walk
// cycle is just:
//
//   walk: { src: '/images/tero/Tero_Walk_6.png', frames: 6, fps: 10 }
//
// The walk strip advances by distance walked (WALK_STRIDE_PX), not `fps`.
// Leave a few transparent pixels around each cell: hi-res strips are filtered
// smoothly and would otherwise bleed into the neighbouring frame.

import { PlayerState } from '../../types';

export type PlayerFrameName =
  | 'idle' | 'walk' | 'jump' | 'fall' | 'duck' | 'hurt' | 'lose' | 'win';

export interface FrameDef {
  /** Path to image (single PNG or horizontal sprite sheet). */
  src: string;
  /** Number of frames in the sheet. 1 = static image. */
  frames: number;
  /** Frames per second for animated sheets. */
  fps: number;
}

export const framePaths: Record<PlayerFrameName, FrameDef> = {
  idle: { src: '/images/tero/Tero_Idle.png', frames: 1, fps: 1 },
  walk: { src: '/images/tero/Tero_Walk.png', frames: 1, fps: 1 },
  jump: { src: '/images/tero/Tero_Jump.png', frames: 1, fps: 1 },
  fall: { src: '/images/tero/Tero_Fall.png', frames: 1, fps: 1 },
  duck: { src: '/images/tero/Tero_Duck.png', frames: 1, fps: 1 },
  hurt: { src: '/images/tero/Tero_Hurt.png', frames: 1, fps: 1 },
  lose: { src: '/images/tero/Tero_Lose.png', frames: 1, fps: 1 },
  win:  { src: '/images/tero/Tero_Win.png',  frames: 1, fps: 1 },
};

/** Critical frames worth preloading via <link rel="preload"> in the page head. */
export const criticalFrames: readonly string[] = [
  framePaths.idle.src,
  framePaths.walk.src,
  framePaths.jump.src,
  framePaths.fall.src,
];

export function getPlayerFrame(state: PlayerState): FrameDef {
  switch (state) {
    case PlayerState.WALK:
    case PlayerState.BIG_WALK:   return framePaths.walk;
    case PlayerState.JUMP:
    case PlayerState.BIG_JUMP:   return framePaths.jump;
    case PlayerState.FALL:
    case PlayerState.BIG_FALL:   return framePaths.fall;
    case PlayerState.DUCK:       return framePaths.duck;
    case PlayerState.HURT_FLASH: return framePaths.hurt;
    case PlayerState.DEAD:       return framePaths.lose;
    case PlayerState.WIN:        return framePaths.win;
    default:                     return framePaths.idle;
  }
}

/** Back-compat — returns the image src (string) for the state. */
export function getPlayerFrameSrc(state: PlayerState): string {
  return getPlayerFrame(state).src;
}
