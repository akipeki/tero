import { CAMERA_LERP, VIEWPORT_W } from './constants';

export class Camera {
  x = 0;
  private levelW: number;

  constructor(levelPixelWidth: number) {
    this.levelW = levelPixelWidth;
  }

  /** Smooth-follow a world-x position (center of player) */
  follow(targetX: number): void {
    const ideal = targetX - VIEWPORT_W / 2;
    this.x += (ideal - this.x) * CAMERA_LERP;
    // Guard: levels narrower than the viewport produce a negative max — keep cam at 0.
    const maxX = Math.max(0, this.levelW - VIEWPORT_W);
    this.x = Math.max(0, Math.min(this.x, maxX));
    this.x = Math.round(this.x); // integer pixels = sharp edges
  }
}
