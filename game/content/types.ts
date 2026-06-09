// file: game/content/types.ts
//
// ContentPack is the single source of truth for all authorable content:
// sprites, entity tunings, levels, and story. The built-in pack is derived
// from the current LEVELS + framePaths registries; the user pack lives in
// localStorage. Editors mutate the user pack; the runtime merges built-in
// and user (user wins on id collisions).

import type { LevelSpawns } from '../types';
import type { ThemeName } from '../render/Theme';

export const PACK_VERSION = 1 as const;

// ─── Branded id types — keep ids from being silently mixed up ────────────────
export type SpriteId    = string & { readonly __brand?: 'SpriteId' };
export type EntityId    = string & { readonly __brand?: 'EntityId' };
export type LevelId     = string & { readonly __brand?: 'LevelId' };
export type ChapterId   = string & { readonly __brand?: 'ChapterId' };
export type StoryCardId = string & { readonly __brand?: 'StoryCardId' };

// ─── Sprite asset (single image or horizontal frame strip) ───────────────────
export interface SpriteAsset {
  id:      SpriteId;
  name:    string;
  /** PNG, either a single frame or a horizontal strip with `frames` cells. */
  dataUrl: string;
  /** Width of one frame in source-pixels. */
  width:   number;
  /** Height of one frame in source-pixels. */
  height:  number;
  /** Number of frames packed horizontally in `dataUrl`. 1 = static image. */
  frames:  number;
  /** Cycle rate when frames > 1. */
  fps:     number;
}

// ─── Entity tuning unions ────────────────────────────────────────────────────
export type EntityBase =
  | 'walker'
  | 'hopper'
  | 'mushroom'
  | 'coin'
  | 'question_block'
  | 'castle';

/** Stat overrides per base. Anything omitted falls back to the engine default. */
export interface WalkerStats {
  speed?: number;
  hitboxW?: number;
  hitboxH?: number;
  ledgeAware?: boolean;
}
export interface HopperStats {
  hopIntervalFrames?: number;
  hopVx?: number;
  hopVy?: number;
  hitboxW?: number;
  hitboxH?: number;
}
export interface MushroomStats {
  vx?: number;
  grants?: 'big';
}
export interface CoinStats {
  scoreValue?: number;
}
export interface QuestionBlockStats {
  contains?: EntityId | 'mushroom'; // built-in default = mushroom
}
export interface CastleStats {
  widthTiles?: number;
  heightTiles?: number;
  bodyColor?: string;
  flagColor?: string;
  gateStyle?: 'arch' | 'rect';
}

export type EntityStats =
  | { base: 'walker';         stats: WalkerStats }
  | { base: 'hopper';         stats: HopperStats }
  | { base: 'mushroom';       stats: MushroomStats }
  | { base: 'coin';           stats: CoinStats }
  | { base: 'question_block'; stats: QuestionBlockStats }
  | { base: 'castle';         stats: CastleStats };

export interface EntityDef {
  id:       EntityId;
  base:     EntityBase;
  name:     string;
  /** Optional sprite override; null = use engine's procedural draw. */
  spriteId: SpriteId | null;
  /** Partial stat override matching the base. */
  stats:    Partial<WalkerStats & HopperStats & MushroomStats &
                    CoinStats   & QuestionBlockStats & CastleStats>;
}

// ─── Level def ───────────────────────────────────────────────────────────────
export interface LevelDef {
  id:        LevelId;
  name:      string;
  theme:     ThemeName;
  width:     number;
  height:    number;
  rows:      string[];            // buildLevel DSL strings — re-validated on load
  spawns:    LevelSpawns;
  chapterId?: ChapterId;
  intro?:    StoryCardId[];
  outro?:    StoryCardId[];
}

// ─── Story ───────────────────────────────────────────────────────────────────
export interface StoryCard {
  id:        StoryCardId;
  speaker?:  string;
  /** Sprite shown left of the text. Optional. */
  portrait?: SpriteId;
  /** Single string; "\n" splits lines. */
  text:      string;
}

export interface Chapter {
  id:       ChapterId;
  name:     string;
  levelIds: LevelId[];
  intro?:   StoryCardId[];
}

// ─── Pack ────────────────────────────────────────────────────────────────────
export interface PackMeta {
  id:      string;
  name:    string;
  author:  string;
  /** Pack format version. Bumped when types here change incompatibly. */
  version: typeof PACK_VERSION;
}

export interface ContentPack {
  meta:     PackMeta;
  sprites:  Record<string, SpriteAsset>;
  entities: Record<string, EntityDef>;
  levels:   Record<string, LevelDef>;
  story: {
    chapters: Chapter[];
    cards:    Record<string, StoryCard>;
  };
}

/** Pack kinds that ContentStore can fork / list / delete. */
export type PackItemKind = 'sprite' | 'entity' | 'level' | 'card' | 'chapter';
