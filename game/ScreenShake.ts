import { SHAKE_DECAY } from './constants';

export class ScreenShake {
  private intensity = 0;

  trigger(amount: number): void {
    this.intensity = Math.max(this.intensity, amount);
  }

  update(): void {
    this.intensity *= SHAKE_DECAY;
    if (this.intensity < 0.05) this.intensity = 0;
  }

  apply(ctx: CanvasRenderingContext2D): void {
    if (this.intensity === 0) return;
    ctx.translate(
      (Math.random() - 0.5) * this.intensity * 2,
      (Math.random() - 0.5) * this.intensity * 2,
    );
  }
}
