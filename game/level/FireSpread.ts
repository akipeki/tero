// file: game/level/FireSpread.ts
//
// Fire travels through paperwork and red tape like a fuse: a burnt tile
// lights its four neighbours a few ticks later, and so on.

import { TileType } from '../types';
import type { Tilemap } from './Tilemap';

const DELAY = 5;   // ticks before a neighbour catches

const burnable = (t: TileType) => t === TileType.PAPER || t === TileType.TAPE;

export class FireSpread {
  private queue: { tx: number; ty: number; due: number }[] = [];
  private tick = 0;

  get burning(): boolean { return this.queue.length > 0; }

  clear(): void { this.queue = []; }

  /** A tile at (tx, ty) just burnt: queue its burnable neighbours. */
  spread(map: Tilemap, tx: number, ty: number): void {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = tx + dx, y = ty + dy;
      if (!burnable(map.tileAt(x, y))) continue;
      if (this.queue.some((b) => b.tx === x && b.ty === y)) continue;
      this.queue.push({ tx: x, ty: y, due: this.tick + DELAY });
    }
  }

  /** Advance a tick; burns whatever is due and calls `onBurn` for each. */
  step(map: Tilemap, onBurn: (tx: number, ty: number, first: boolean) => void): void {
    this.tick++;
    if (!this.queue.length) return;
    const due = this.queue.filter((b) => b.due <= this.tick);
    this.queue = this.queue.filter((b) => b.due > this.tick);
    due.forEach((b, i) => {
      if (!burnable(map.tileAt(b.tx, b.ty))) return;
      map.setTile(b.tx, b.ty, TileType.AIR);
      onBurn(b.tx, b.ty, i === 0);
      this.spread(map, b.tx, b.ty);
    });
  }
}
