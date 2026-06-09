// file: game/content/serialize.ts
//
// JSON validation + version migration for ContentPack. Any data that crosses
// a trust boundary (import from file, localStorage read) must pass through
// `validatePack` so the runtime never deals with malformed shapes.

import type { ContentPack, LevelDef, EntityDef } from './types';
import { PACK_VERSION } from './types';
import { buildLevel } from '../level/buildLevel';

export class PackValidationError extends Error {
  constructor(message: string, public readonly path: string) {
    super(`[ContentPack] ${path}: ${message}`);
    this.name = 'PackValidationError';
  }
}

/** Lightweight runtime type-guard. Throws `PackValidationError` on the first
 *  problem so the caller can show it to the user. */
export function validatePack(raw: unknown): ContentPack {
  const p = ensureObject(raw, 'root');

  // meta
  const meta = ensureObject(p.meta, 'meta');
  ensureString(meta.id,     'meta.id');
  ensureString(meta.name,   'meta.name');
  ensureString(meta.author, 'meta.author');
  if (meta.version !== PACK_VERSION) {
    throw new PackValidationError(
      `unsupported pack version ${String(meta.version)}; expected ${PACK_VERSION}`,
      'meta.version',
    );
  }

  // sprites
  const sprites = ensureObject(p.sprites, 'sprites');
  for (const [k, v] of Object.entries(sprites)) {
    const s = ensureObject(v, `sprites.${k}`);
    ensureString(s.id,      `sprites.${k}.id`);
    ensureString(s.name,    `sprites.${k}.name`);
    ensureString(s.dataUrl, `sprites.${k}.dataUrl`);
    ensureNumber(s.width,   `sprites.${k}.width`);
    ensureNumber(s.height,  `sprites.${k}.height`);
    ensureNumber(s.frames,  `sprites.${k}.frames`);
    ensureNumber(s.fps,     `sprites.${k}.fps`);
  }

  // entities
  const entities = ensureObject(p.entities, 'entities');
  for (const [k, v] of Object.entries(entities)) {
    const e = ensureObject(v, `entities.${k}`);
    ensureString(e.id,   `entities.${k}.id`);
    ensureString(e.base, `entities.${k}.base`);
    ensureString(e.name, `entities.${k}.name`);
    if (e.spriteId !== null && typeof e.spriteId !== 'string') {
      throw new PackValidationError('spriteId must be string or null', `entities.${k}.spriteId`);
    }
    ensureObject(e.stats, `entities.${k}.stats`);
  }

  // levels
  const levels = ensureObject(p.levels, 'levels');
  for (const [k, v] of Object.entries(levels)) {
    const L = ensureObject(v, `levels.${k}`);
    ensureString(L.id,    `levels.${k}.id`);
    ensureString(L.name,  `levels.${k}.name`);
    ensureString(L.theme, `levels.${k}.theme`);
    ensureNumber(L.width, `levels.${k}.width`);
    ensureNumber(L.height,`levels.${k}.height`);
    if (!Array.isArray(L.rows)) {
      throw new PackValidationError('rows must be string[]', `levels.${k}.rows`);
    }
    // Re-run buildLevel as the canonical row-shape check.
    try { buildLevel(L.rows as string[]); }
    catch (err) {
      throw new PackValidationError((err as Error).message, `levels.${k}.rows`);
    }
    ensureObject(L.spawns, `levels.${k}.spawns`);
  }

  // story
  const story = ensureObject(p.story, 'story');
  if (!Array.isArray(story.chapters)) {
    throw new PackValidationError('chapters must be Chapter[]', 'story.chapters');
  }
  ensureObject(story.cards, 'story.cards');

  return p as unknown as ContentPack;
}

/** Future-proofing hook. Today every pack has version === 1; this is where
 *  we'll branch when we bump it. */
export function migratePack(raw: unknown): unknown {
  const p = (raw ?? {}) as { meta?: { version?: number } };
  const v = p.meta?.version ?? PACK_VERSION;
  if (v === PACK_VERSION) return raw;
  // v < PACK_VERSION → would call individual migrators here.
  throw new PackValidationError(
    `cannot migrate pack from v${v} to v${PACK_VERSION}`, 'meta.version',
  );
}

/** Removes runtime-only entity defaults so the export JSON stays small. */
export function stripEmpty<T extends Partial<LevelDef | EntityDef>>(v: T): T {
  const out = { ...v } as Record<string, unknown>;
  for (const k of Object.keys(out)) {
    if (out[k] === undefined) delete out[k];
  }
  return out as T;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function ensureObject(v: unknown, path: string): Record<string, unknown> {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) {
    throw new PackValidationError(`expected object, got ${describe(v)}`, path);
  }
  return v as Record<string, unknown>;
}
function ensureString(v: unknown, path: string): string {
  if (typeof v !== 'string') {
    throw new PackValidationError(`expected string, got ${describe(v)}`, path);
  }
  return v;
}
function ensureNumber(v: unknown, path: string): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    throw new PackValidationError(`expected number, got ${describe(v)}`, path);
  }
  return v;
}
function describe(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}
