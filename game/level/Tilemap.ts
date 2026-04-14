// file: game/level/Tilemap.ts

import { TILE_SIZE, VIEWPORT_W } from '../constants';
import { TileType } from '../types';
import { drawHazardTile, drawPlatformTile, drawSolidTile } from '../render/sprites/TileSprites';

export class Tilemap {
  readonly width: number;
  readonly height: number;
  readonly pixelWidth: number;
  readonly pixelHeight: number;
  private tiles: number[];

  constructor(tiles: number[], width: number, height: number) {
    this.tiles = tiles;
    this.width = width;
    this.height = height;
    this.pixelWidth = width * TILE_SIZE;
    this.pixelHeight = height * TILE_SIZE;
  }

  tileAt(tx: number, ty: number): TileType {
    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) {
      return TileType.SOLID;
    }

    return this.tiles[ty * this.width + tx] as TileType;
  }

  tileAtWorld(wx: number, wy: number): TileType {
    return this.tileAt(Math.floor(wx / TILE_SIZE), Math.floor(wy / TILE_SIZE));
  }

  solidAt(wx: number, wy: number): boolean {
    const t = this.tileAtWorld(wx, wy);
    return t === TileType.SOLID || t === TileType.PLATFORM;
  }

  hazardAt(wx: number, wy: number): boolean {
    return this.tileAtWorld(wx, wy) === TileType.HAZARD;
  }

  setTile(tx: number, ty: number, type: TileType): void {
    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) return;
    this.tiles[ty * this.width + tx] = type;
  }

  draw(ctx: CanvasRenderingContext2D, camX: number): void {
    const startTX = Math.max(0, Math.floor(camX / TILE_SIZE) - 1);
    const endTX = Math.min(this.width - 1, startTX + Math.ceil(VIEWPORT_W / TILE_SIZE) + 2);

    for (let ty = 0; ty < this.height; ty++) {
      for (let tx = startTX; tx <= endTX; tx++) {
        const tile = this.tileAt(tx, ty);
        if (tile === TileType.AIR) continue;

        const sx = tx * TILE_SIZE - camX;
        const sy = ty * TILE_SIZE;

        switch (tile) {
          case TileType.SOLID:
            drawSolidTile(ctx, sx, sy);
            break;

          case TileType.PLATFORM:
            drawPlatformTile(ctx, sx, sy);
            break;

          case TileType.HAZARD:
            drawHazardTile(ctx, sx, sy);
            break;
        }
      }
    }
  }
}