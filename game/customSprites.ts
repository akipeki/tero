// file: game/customSprites.ts
//
// ── YOUR OWN SPRITES ── list the images you've made here.
//
// Put the PNGs in public/sprites/… and add their names below. Anything not
// listed keeps the built-in, code-drawn art, so you can replace one thing at
// a time (start with the player's idle animation).
//
//   player   public/sprites/player/<animation>.png
//            idle, walk, jump, fall, duck, hurt, lose, win, breathe, glide
//   enemies  public/sprites/enemies/<enemy>.png
//            clerk, manager, syncer, guard, rat, pig, robot, plant, gorilla, vampire
//   props    public/sprites/props/<prop id>.png
//            any id from game/render/office/gags.ts, e.g. fridge_notes
//   dad      public/sprites/player/dad.png  (one square frame; set `dad: true`)
//   art      public/sprites/art/<slot>.png
//            bosses, Elvis, Dad's things, fire, gadgets — sizes and frame
//            order in game/artSlots.ts (and on the /art page)
//
// Image rules
//   • PNG with a transparent background.
//   • Animations: frames side by side in one row. Frames are SQUARE, so the
//     frame count is width ÷ height (512×64 → 8 frames). If yours aren't
//     square, give `frames` explicitly.
//   • Characters face RIGHT, feet on the bottom edge, centred.
//   • Any resolution — big AI images are scaled down smoothly to game size.

import type { PlayerFrameName } from './render/sprites/PlayerSpriteAssets';
import type { WalkerVariant, HopperVariant } from './creaturesAndObjects/enemyKinds';
import type { GagId } from './render/office/gags';
import type { ArtSlotId } from './artSlots';

export interface CustomAnim {
  /** Override the frame count when frames aren't square. */
  frames?: number;
  /** Playback speed (player animations; walk follows distance instead). */
  fps?: number;
}

export interface CustomSprites {
  player: Partial<Record<PlayerFrameName, CustomAnim>>;
  enemies: Partial<Record<WalkerVariant | HopperVariant, CustomAnim>>;
  props: GagId[];
  art?: ArtSlotId[];
  /** Use public/sprites/player/dad.png for Dad (escape, nap, race, portraits). */
  dad?: boolean;
}

export const CUSTOM_SPRITES: CustomSprites = {
  // e.g. player: { idle: { fps: 6 } },
  player: {},
  // e.g. enemies: { pig: {} },
  enemies: {},
  // e.g. props: ['fridge_notes'],
  props: [],
  // e.g. art: ['elvis', 'board_heads'],
  art: [],
  // dad: true,
  dad: false,
};
