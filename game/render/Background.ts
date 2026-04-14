// file: game/render/Background.ts

import { drawBackgroundScene } from './backgrounds/BackgroundScene';

let currentCamX = 0;

export function updateBackground(camX: number): void {
  currentCamX = camX;
}

export function drawBackground(ctx: CanvasRenderingContext2D): void {
  drawBackgroundScene(ctx, currentCamX);
}