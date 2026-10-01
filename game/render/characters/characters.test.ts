import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Raster } from '../pixel/Raster';
import { DRAGON_ANIMS, DRAGON_FRAME, drawDragon, renderDragonStrip, type DragonAnimName } from './dragon';
import { drawClerk, drawManager, HUMAN_FRAME } from './humans';
import { framePaths } from '../sprites/PlayerSpriteAssets';

function bottomRowOpaque(r: Raster): boolean {
  for (let x = 0; x < r.w; x++) if (r.opaque(x, r.h - 1)) return true;
  return false;
}

/** Width/height from a PNG's IHDR chunk. */
function pngSize(path: string): { w: number; h: number } {
  const b = readFileSync(path);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

describe('Raster', () => {
  it('outline surrounds a shape without touching it', () => {
    const r = new Raster(8, 8);
    r.rect(3, 3, 2, 2, '#ffffff');
    r.outline('#000000');
    expect(r.opaque(2, 3)).toBe(true);
    expect(r.opaque(2, 2)).toBe(false); // 4-neighbour: no corners
  });
});

describe('dragon rig', () => {
  it('stands on the bottom row in every grounded pose', () => {
    const grounded: DragonAnimName[] = ['idle', 'walk', 'duck', 'hurt', 'lose', 'win'];
    for (const name of grounded) {
      for (const pose of DRAGON_ANIMS[name].poses) expect(bottomRowOpaque(drawDragon(pose))).toBe(true);
    }
  });

  it('framePaths and the generated PNGs match the rig (run `npm run sprites` if this fails)', () => {
    for (const [name, anim] of Object.entries(DRAGON_ANIMS)) {
      const def = framePaths[name as DragonAnimName];
      expect(def.frames).toBe(anim.poses.length);
      expect(def.fps).toBe(anim.fps);
      const size = pngSize(join(process.cwd(), 'public', def.src));
      expect(size).toEqual({ w: DRAGON_FRAME * anim.poses.length, h: DRAGON_FRAME });
      expect(renderDragonStrip(name as DragonAnimName).w).toBe(size.w);
    }
  });
});

describe('human rigs', () => {
  it('stand on the bottom row', () => {
    for (let f = 0; f < 4; f++) expect(bottomRowOpaque(drawClerk(f))).toBe(true);
    expect(drawManager(false).h).toBe(HUMAN_FRAME);
    expect(bottomRowOpaque(drawManager(false))).toBe(true);
  });
});
