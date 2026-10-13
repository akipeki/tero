import { describe, expect, it } from 'vitest';
import { Walker } from './Walker';
import { Player } from './Player';
import { Tilemap } from '../level/Tilemap';
import { ParticleSystem } from '../ParticleSystem';
import { ScreenShake } from '../ScreenShake';
import type { UpdateCtx } from './creaturesAndObjects';
import type { AudioManager } from '../AudioManager';

const ctx = (): UpdateCtx => ({
  map: new Tilemap(new Array(20 * 10).fill(0), 20, 10),
  particles: new ParticleSystem(),
  audio: { play: () => {} } as unknown as AudioManager,
  shake: new ScreenShake(),
  dt: 1 / 60,
});

describe('office plants and fire', () => {
  it('bites when you walk into it, but not while it sulks after a puff', () => {
    const c = ctx();
    const plant = new Walker(5, 5, 'plant');
    const touch = () => {
      const p = new Player(plant.x, plant.y, 3);
      plant.checkPlayerInteraction(p, c);
      return p.lives < 3 || p.isInvincible;
    };
    expect(touch()).toBe(true);
    plant.shut = 90;
    expect(touch()).toBe(false);
    for (let i = 0; i < 90; i++) plant.update(c);
    expect(touch()).toBe(true);
  });
});
