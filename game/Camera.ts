import { CAMERA_LERP, VIEWPORT_W, VIEWPORT_H } from './constants';

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
    this.x = Math.max(0, Math.min(this.x, this.levelW - VIEWPORT_W));
    this.x = Math.round(this.x); // integer pixels = sharp edges
  }
}
