// file: game/render/backgrounds/BackgroundScene.ts

import { drawSky } from './SkyRenderer';
import { drawStarField } from './StarField';
import { drawHillLayer } from './HillRenderer';
import { drawBuildingLayer } from './BuildingRenderer';
import { isOffice } from '../Theme';
import { drawOfficeBackground } from '../office/OfficeBackground';

const LAYER_FACTORS = {
  hills: 0.15,
  buildings: 0.4,
} as const;

export function drawBackgroundScene(
  ctx: CanvasRenderingContext2D,
  camX: number,
): void {
  if (isOffice()) return drawOfficeBackground(ctx, camX);
  drawSky(ctx);
  drawStarField(ctx);
  drawHillLayer(ctx, -(camX * LAYER_FACTORS.hills), 'back');
  drawHillLayer(ctx, -(camX * LAYER_FACTORS.hills), 'front');
  drawBuildingLayer(ctx, -(camX * LAYER_FACTORS.buildings));
}