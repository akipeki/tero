// file: game/content/defaultPack.ts
//
// The read-only built-in pack. Derived from the existing engine registries:
//   - LEVELS  → game/level/levels.ts
//   - frames  → game/render/sprites/PlayerSpriteAssets.ts
// Built-in ids are prefixed `b_` so user ids (`u_`) never collide.

import { LEVELS } from '../level/levels';
import { framePaths } from '../render/sprites/PlayerSpriteAssets';
import type {
  ContentPack, LevelDef, SpriteAsset, EntityDef, Chapter, StoryCard,
} from './types';
import { PACK_VERSION } from './types';

// ─── Sprites: one per built-in player frame ──────────────────────────────────
const sprites: Record<string, SpriteAsset> = Object.fromEntries(
  Object.entries(framePaths).map(([name, def]) => {
    const id = `b_sprite_player_${name}`;
    return [id, {
      id,
      name:    `Player · ${name}`,
      dataUrl: def.src,
      // Source PNGs are 200×200; v1 doesn't try to introspect on disk.
      width:   200,
      height:  200,
      frames:  def.frames,
      fps:     def.fps,
    } satisfies SpriteAsset];
  }),
);

// ─── Entities: the six engine-supported bases ────────────────────────────────
// Stats are left empty — the engine defaults take effect when stats are omitted.
function entity(id: string, base: EntityDef['base'], name: string): EntityDef {
  return { id, base, name, spriteId: null, stats: {} };
}

const entities: Record<string, EntityDef> = {
  b_entity_walker:          entity('b_entity_walker',          'walker',         'Walker'),
  b_entity_hopper:          entity('b_entity_hopper',          'hopper',         'Hopper'),
  b_entity_mushroom:        entity('b_entity_mushroom',        'mushroom',       'Mushroom'),
  b_entity_coin:            entity('b_entity_coin',            'coin',           'Coin'),
  b_entity_question_block:  entity('b_entity_question_block',  'question_block', 'Question Block'),
  b_entity_castle:          entity('b_entity_castle',          'castle',         'Castle Goal'),
};

// ─── Levels: turn LEVELS registry into LevelDef ──────────────────────────────
// We can't recover the DSL row strings from the flattened tile arrays, so we
// rebuild the rows from the tile array on import. (Lossy: dot vs zero, etc.,
// don't apply — char mapping is fixed.)
import { TileType } from '../types';

const TILE_TO_CHAR: Record<number, string> = {
  [TileType.AIR]:      '.',
  [TileType.SOLID]:    '#',
  [TileType.PLATFORM]: '=',
  [TileType.HAZARD]:   '^',
};

function rowsFromTiles(tiles: number[], width: number, height: number): string[] {
  const out: string[] = [];
  for (let ty = 0; ty < height; ty++) {
    let row = '';
    for (let tx = 0; tx < width; tx++) {
      row += TILE_TO_CHAR[tiles[ty * width + tx]] ?? '.';
    }
    out.push(row);
  }
  return out;
}

const levels: Record<string, LevelDef> = Object.fromEntries(
  LEVELS.map((L) => {
    const id = `b_level_${L.id}`;
    return [id, {
      id,
      name:   L.name,
      theme:  L.theme,
      width:  L.width,
      height: L.height,
      rows:   rowsFromTiles(L.tiles, L.width, L.height),
      spawns: L.spawns,
    } satisfies LevelDef];
  }),
);

// ─── Story: one default chapter listing the built-in levels ──────────────────
const defaultChapter: Chapter = {
  id:       'b_chapter_main',
  name:     'The Journey',
  levelIds: Object.keys(levels),
};

const cards: Record<string, StoryCard> = {};

export const defaultPack: ContentPack = {
  meta: {
    id:      'tero-builtin',
    name:    'TERO — Built-in',
    author:  'Studio',
    version: PACK_VERSION,
  },
  sprites,
  entities,
  levels,
  story: {
    chapters: [defaultChapter],
    cards,
  },
};
