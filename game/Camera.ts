import { CAMERA_LERP, VIEWPORT_W } from './constants';

export class Camera {
  /** Sub-pixel position. Rounding is a render concern — storing a rounded
   *  value here made the lerp stall below ~4px and then jump. */
  x = 0;
  /** Position before the latest follow() — used for render interpolation. */
  prevX = 0;
  private levelW: number;

  constructor(levelPixelWidth: number) {
    this.levelW = levelPixelWidth;
  }

  /** Smooth-follow a world-x position (center of player) */
  follow(targetX: number): void {
    this.prevX = this.x;
    const ideal = targetX - VIEWPORT_W / 2;
    this.x += (ideal - this.x) * CAMERA_LERP;
    // Guard: levels narrower than the viewport produce a negative max — keep cam at 0.
    const maxX = Math.max(0, this.levelW - VIEWPORT_W);
    this.x = Math.max(0, Math.min(this.x, maxX));
  }

  /** Jump straight to a target without easing (level start). */
  snap(targetX: number): void {
    const maxX = Math.max(0, this.levelW - VIEWPORT_W);
    this.x = this.prevX = Math.max(0, Math.min(targetX - VIEWPORT_W / 2, maxX));
  }

  /** Interpolated position between the last two updates. */
  at(alpha: number): number {
    return this.prevX + (this.x - this.prevX) * alpha;
  }
}
