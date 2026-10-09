import { CAMERA_LERP, VIEWPORT_W } from './constants';

export class Camera {
  /** Sub-pixel position. Rounding is a render concern — storing a rounded
   *  value here made the lerp stall below ~4px and then jump. */
  x = 0;
  /** Position before the latest follow() — used for render interpolation. */
  prevX = 0;
  private levelW: number;
  /** Boss arenas pin the camera: [minX, maxX] in world px, or null. */
  private lockRange: [number, number] | null = null;

  constructor(levelPixelWidth: number) {
    this.levelW = levelPixelWidth;
  }

  /** Smooth-follow a world-x position (center of player) */
  follow(targetX: number): void {
    this.prevX = this.x;
    // A lock moves the ideal, not the camera, so it glides into an arena.
    const [minX, maxX] = this.range();
    const ideal = Math.max(minX, Math.min(targetX - VIEWPORT_W / 2, maxX));
    this.x += (ideal - this.x) * CAMERA_LERP;
    // Guard: levels narrower than the viewport produce a negative max — keep cam at 0.
    const levelMax = Math.max(0, this.levelW - VIEWPORT_W);
    this.x = Math.max(0, Math.min(this.x, levelMax));
  }

  /** Keep the camera within [minX, maxX] until `unlock()` (it eases there). */
  lock(minX: number, maxX: number): void {
    this.lockRange = [minX, maxX];
  }

  unlock(): void {
    this.lockRange = null;
  }

  get locked(): boolean { return this.lockRange !== null; }

  private range(): [number, number] {
    const maxX = Math.max(0, this.levelW - VIEWPORT_W);
    if (!this.lockRange) return [0, maxX];
    return [Math.max(0, this.lockRange[0]), Math.min(maxX, this.lockRange[1])];
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
