// file: game/render/backgrounds/BackgroundScene.ts

import { drawSky } from './SkyRenderer';
import { drawStarField } from './StarField';
import { drawHillLayer } from './HillRenderer';
import { drawBuildingLayer } from './BuildingRenderer';

const LAYER_FACTORS = {
  hills: 0.15,
  buildings: 0.4,
} as const;

export function drawBackgroundScene(
  ctx: CanvasRenderingContext2D,
  camX: number,
): void {
  drawSky(ctx);
  drawStarField(ctx);
  drawHillLayer(ctx, -(camX * LAYER_FACTORS.hills), 'back');
  drawHillLayer(ctx, -(camX * LAYER_FACTORS.hills), 'front');
  drawBuildingLayer(ctx, -(camX * LAYER_FACTORS.buildings));
}