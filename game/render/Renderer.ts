// file: game/render/Renderer.ts

import { drawBackground, updateBackground } from './Background';
import type { Tilemap } from '../level/Tilemap';
import type { creaturesAndObjects } from '../creaturesAndObjects/creaturesAndObjects';
import type { ParticleSystem } from '../ParticleSystem';
import type { ScreenShake } from '../ScreenShake';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;
  }

  render(
    camX: number,
    map: Tilemap,
    entities: creaturesAndObjects[],
    particles: ParticleSystem,
    shake: ScreenShake,
  ): void {
    const ctx = this.ctx;

    ctx.save();

    // Screen shake offset
    shake.apply(ctx);

    // Background
    updateBackground(camX);
    drawBackground(ctx);

    // Tiles
    map.draw(ctx, camX);

    // Entities
    for (const e of entities) {
      if (e.active) e.draw(ctx, camX);
    }

    // Particles
    particles.draw(ctx, camX);

    ctx.restore();
  }

  drawTitleBackground(): void {
    drawBackground(this.ctx);
  }

  get context() {
    return this.ctx;
  }
}