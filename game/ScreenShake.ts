import { SHAKE_DECAY } from './constants';

/** Screen shake on/off (Settings; off by default with reduced motion). */
let shakeOn = true;
export function setShakeEnabled(on: boolean): void { shakeOn = on; }

export class ScreenShake {
  private intensity = 0;
  /** Offset for the current tick. Rolled once per update so the canvas and
   *  the DOM player overlay shake by exactly the same amount. */
  offsetX = 0;
  offsetY = 0;

  trigger(amount: number): void {
    if (!shakeOn) return;
    this.intensity = Math.max(this.intensity, amount);
  }

  update(): void {
    this.intensity *= SHAKE_DECAY;
    if (this.intensity < 0.05) this.intensity = 0;
    this.offsetX = this.intensity === 0 ? 0 : Math.round((Math.random() - 0.5) * this.intensity * 2);
    this.offsetY = this.intensity === 0 ? 0 : Math.round((Math.random() - 0.5) * this.intensity * 2);
  }

  apply(ctx: CanvasRenderingContext2D): void {
    if (this.offsetX === 0 && this.offsetY === 0) return;
    ctx.translate(this.offsetX, this.offsetY);
  }
}
