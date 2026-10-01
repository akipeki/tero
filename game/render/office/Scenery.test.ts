import { describe, it, expect } from 'vitest';
import { Tilemap } from '../../level/Tilemap';
import { buildLevel } from '../../level/buildLevel';
import { TILE_SIZE } from '../../constants';
import { TileType } from '../../types';
import { layoutScenery } from './Scenery';
import { GAGS, GAG_IDS } from './gags';
import { LEVELS } from '../../level/levels';
import { defaultPack } from '../../content/defaultPack';

function mapOf(level: (typeof LEVELS)[number]): Tilemap {
  return new Tilemap([...level.tiles], level.width, level.height);
}

describe('gag library', () => {
  it('every gag draws something', () => {
    for (const id of GAG_IDS) {
      const r = GAGS[id].draw();
      expect(r.w * r.h, id).toBeGreaterThan(0);
      let any = false;
      for (let y = 0; y < r.h && !any; y++) for (let x = 0; x < r.w && !any; x++) any = r.opaque(x, y);
      expect(any, id).toBe(true);
    }
  });
});

describe('layoutScenery', () => {
  for (const level of LEVELS) {
    it(`fills "${level.name}" deterministically with floor props on flat floor`, () => {
      const map = mapOf(level);
      const a = layoutScenery(map, { levelId: level.id });
      const b = layoutScenery(map, { levelId: level.id });
      expect(a).toEqual(b);
      // something every ~screen (viewport is 480 wide)
      expect(a.length).toBeGreaterThanOrEqual(Math.floor(map.pixelWidth / 480));

      for (const g of a.filter((g) => GAGS[g.id].kind === 'floor')) {
        const w = GAGS[g.id].draw().w;
        const h = GAGS[g.id].draw().h;
        const row = (g.y + h) / TILE_SIZE;
        expect(Number.isInteger(row), g.id).toBe(true);
        for (let tx = Math.floor(g.x / TILE_SIZE); tx <= Math.floor((g.x + w - 1) / TILE_SIZE); tx++) {
          expect(map.tileAt(tx, row), `${g.id} @${tx}`).toBe(TileType.SOLID);
        }
      }
    });
  }

  it('every scenery gag in the story script finds a spot', () => {
    for (const level of LEVELS) {
      const authored = defaultPack.levels[`b_level_${level.id}`].scenery ?? [];
      const out = layoutScenery(mapOf(level), { levelId: level.id, authored });
      for (const a of authored) {
        expect(out.some((g) => g.id === a.gag && g.x === a.tx * TILE_SIZE), `${level.name}: ${a.gag}`).toBe(true);
      }
    }
  });

  it("never auto-fills Dad's story-only clues", () => {
    for (const level of LEVELS) {
      for (const mood of ['tame', 'unhinged'] as const) {
        const out = layoutScenery(mapOf(level), { levelId: level.id, mood });
        expect(out.some((g) => (GAGS[g.id] as { storyOnly?: boolean }).storyOnly), level.name).toBe(false);
      }
    }
  });

  it('tame levels never auto-fill tier-2 gags; unhinged ones lead with them', () => {
    for (const level of LEVELS) {
      const map = mapOf(level);
      const tame = layoutScenery(map, { levelId: level.id, mood: 'tame' });
      expect(tame.every((g) => GAGS[g.id].tier === 1), level.name).toBe(true);
      const wild = layoutScenery(map, { levelId: level.id, mood: 'unhinged' });
      expect(GAGS[wild[0].id].tier, level.name).toBe(2);
    }
  });

  it('auto gags never overlap authored gags of the same kind', () => {
    for (const level of LEVELS) {
      const authored = defaultPack.levels[`b_level_${level.id}`].scenery ?? [];
      const out = layoutScenery(mapOf(level), { levelId: level.id, authored });
      const placed = out.slice(0, out.filter((g) => authored.some((a) => a.gag === g.id && a.tx * TILE_SIZE === g.x)).length);
      const autos = out.slice(placed.length);
      for (const g of autos) {
        const w = GAGS[g.id].draw().w;
        for (const a of placed) {
          if (GAGS[a.id].kind !== GAGS[g.id].kind) continue;
          const aw = GAGS[a.id].draw().w;
          expect(g.x + w <= a.x || g.x >= a.x + aw, `${level.name}: ${g.id} overlaps ${a.id}`).toBe(true);
        }
      }
    }
  });

  it("puts each floor's crayon slogan centred above the elevator", () => {
    for (const level of LEVELS) {
      const writing = defaultPack.levels[`b_level_${level.id}`].goalWriting;
      expect(writing, level.name).toBeTruthy();
      // Goal sprite: 3 tiles wide, starting one tile left of goal.tx.
      const centerX = (level.spawns.goal.tx - 1) * TILE_SIZE + (3 * TILE_SIZE) / 2;
      const out = layoutScenery(mapOf(level), { levelId: level.id, goalWriting: { gag: writing!, centerX } });
      const g = out.find((p) => p.id === writing)!;
      const w = GAGS[g.id].draw().w;
      expect(Math.abs(g.x + w / 2 - centerX), level.name).toBeLessThanOrEqual(1);
      // nothing else hanging over it
      for (const o of out) {
        if (o === g || GAGS[o.id].kind !== 'hang') continue;
        const ow = GAGS[o.id].draw().w;
        expect(o.x + ow <= g.x || o.x >= g.x + w, `${level.name}: ${o.id}`).toBe(true);
      }
    }
  });

  it('places authored gags, skips unknown ones and respects keepClear', () => {
    const { tiles, width, height } = buildLevel([
      '#'.repeat(40), ...Array(7).fill('.'.repeat(40)), '#'.repeat(40),
    ]);
    const map = new Tilemap(tiles, width, height);
    const out = layoutScenery(map, {
      levelId: 't',
      authored: [{ tx: 2, gag: 'copier_slain' }, { tx: 10, gag: 'nope' }],
      keepClear: [[0, 40 * TILE_SIZE]],
    });
    expect(out[0]).toMatchObject({ id: 'copier_slain', x: 64 });
    expect(out.filter((g) => GAGS[g.id].kind === 'floor')).toHaveLength(1);
  });
});
