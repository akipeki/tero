// file: game/render/Renderer.ts

import { VIEWPORT_W, VIEWPORT_H } from '../constants';
import { P } from '../palette';
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

    // Background (fixed to viewport)
    updateBackground(camX);
    drawBackground(ctx);

    // Tiles
    map.draw(ctx, camX);

    // Entities (sorted by draw order — background first)
    for (const e of entities) {
      if (e.active) e.draw(ctx, camX);
    }

    // Particles
    particles.draw(ctx, camX);

    ctx.restore();
  }

  /** Draw the animated background only (used for title screen canvas layer) */
  drawTitleBackground(): void {
    drawBackground(this.ctx);
  }

  get context() { return this.ctx; }
}
