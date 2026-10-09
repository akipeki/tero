// file: game/render/sprites/dadSprite.ts
//
// Where Dad's picture comes from: your own public/sprites/player/dad.png when
// game/customSprites.ts says `dad: true`, else the built-in render that
// `npm run sprites` writes to public/images/dragon/dad.png.
//
// One square frame, any resolution (64×64 is native; bigger is scaled down
// smoothly). Facing right, feet on the bottom edge.

import { CUSTOM_SPRITES } from '../../customSprites';

export const DAD_SRC = CUSTOM_SPRITES.dad ? '/sprites/player/dad.png' : '/images/dragon/dad.png';

/** Smooth a big hand-made picture when shrinking it; keep native pixel art crisp. */
export function smoothDad(ctx: CanvasRenderingContext2D, img: HTMLImageElement, drawnSize: number): void {
  ctx.imageSmoothingEnabled = img.naturalWidth > drawnSize * 1.5;
}
