
// file: game/creaturesAndObjects/creaturesAndObjects.ts

import type { Tilemap } from '../level/Tilemap';
import type { ParticleSystem } from '../ParticleSystem';
import type { AudioManager } from '../AudioManager';
import type { ScreenShake } from '../ScreenShake';

/** Shared context passed into every entity each update tick */
export interface UpdateCtx {
  map: Tilemap;
  particles: ParticleSystem;
  audio: AudioManager;
  shake: ScreenShake;
  dt: number;
}

export abstract class creaturesAndObjects {
  x: number;
  y: number;
  w: number;
  h: number;
  vx = 0;
  vy = 0;
  onGround = false;
  active = true;   // false → removed from world next tick

  constructor(x: number, y: number, w: number, h: number) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  get left()   { return this.x; }
  get right()  { return this.x + this.w; }
  get top()    { return this.y; }
  get bottom() { return this.y + this.h; }
  get cx()     { return this.x + this.w / 2; }
  get cy()     { return this.y + this.h / 2; }

  abstract update(ctx: UpdateCtx): void;
  abstract draw(ctx: CanvasRenderingContext2D, camX: number): void;
}
