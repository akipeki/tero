// file: game/interludes/teroSprite.ts
//
// Tero drawn straight onto the canvas (the interludes don't use the DOM
// overlay). Uses whatever strips framePaths points at, so the user's own
// sprites show up here too once they're in.

import { framePaths, PLAYER_FRAME_PX, type PlayerFrameName } from '../render/sprites/PlayerSpriteAssets';

const images = new Map<string, HTMLImageElement>();

function image(src: string): HTMLImageElement | null {
  if (typeof Image === 'undefined') return null;
  let img = images.get(src);
  if (!img) {
    img = new Image();
    img.src = src;
    images.set(src, img);
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}

/** Draws Tero with his feet at (footX, footY), `size` px tall. */
export function drawTero(
  ctx: CanvasRenderingContext2D, anim: PlayerFrameName, frame: number,
  footX: number, footY: number, size = 40, flip = false,
): void {
  const def = framePaths[anim];
  const img = image(def.src);
  if (!img) return;
  const fw = img.naturalWidth / def.frames, fh = img.naturalHeight;
  const f = ((frame % def.frames) + def.frames) % def.frames;
  const k = size / (fh || PLAYER_FRAME_PX);
  const dw = fw * k, dh = fh * k;
  ctx.save();
  ctx.translate(Math.round(footX), Math.round(footY));
  if (flip) ctx.scale(-1, 1);
  ctx.imageSmoothingEnabled = k < 1;
  ctx.drawImage(img, f * fw, 0, fw, fh, -dw / 2, -dh, dw, dh);
  ctx.restore();
}

/** Starts loading every strip, so the first interlude frame isn't empty. */
export function preloadTero(): void {
  for (const def of Object.values(framePaths)) image(def.src);
}
