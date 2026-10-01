// file: game/render/office/Scenery.ts
//
// Places background gags along a level and draws them between the parallax
// background and the tiles (they scroll with the world).
//
// Authored placements (story hints) come from the level's `scenery`; the
// rest of the level is filled automatically so every screen has something
// stupid on it. The fill is seeded by level id, so a level always looks the
// same.

import { TILE_SIZE } from '../../constants';
import { TileType } from '../../types';
import type { Tilemap } from '../../level/Tilemap';
import type { SceneryPlacement, GagMood } from '../../content/types';
import type { Raster } from '../pixel/Raster';
import { GAGS, GAG_IDS, isGagId, type Gag, type GagId } from './gags';

export interface PlacedGag {
  id: GagId;
  /** World-space top-left. */
  x: number;
  y: number;
}

/** Average spacing of auto-placed gags, in world px. */
const FILL_MIN = 150;
const FILL_MAX = 230;
/** Auto gags keep this far away from authored ones. */
const AUTHORED_CLEARANCE = 110;
/** Rows the floor props may stand on (the visible ground band). */
const FLOOR_ROWS = [6, 7, 8];

// ─── Art cache ───────────────────────────────────────────────────────────────

const rasters = new Map<GagId, Raster>();
const canvases = new Map<GagId, HTMLCanvasElement>();

function raster(id: GagId): Raster {
  let r = rasters.get(id);
  if (!r) { r = GAGS[id].draw(); rasters.set(id, r); }
  return r;
}

function canvas(id: GagId): HTMLCanvasElement {
  let c = canvases.get(id);
  if (!c) { c = raster(id).toCanvas(); canvases.set(id, c); }
  return c;
}

// ─── Layout ──────────────────────────────────────────────────────────────────

function floorRow(map: Tilemap, tx: number): number {
  for (const ty of FLOOR_ROWS) {
    const t = map.tileAt(tx, ty);
    if (t === TileType.SOLID) return ty;
    if (t === TileType.HAZARD) return -1;
  }
  return -1;
}

/** Top-left for a floor gag at world x, or null if the floor isn't flat there. */
function floorSpot(map: Tilemap, id: GagId, x: number): { x: number; y: number } | null {
  const r = raster(id);
  const t0 = Math.floor(x / TILE_SIZE), t1 = Math.floor((x + r.w - 1) / TILE_SIZE);
  const row = floorRow(map, t0);
  if (row < 0) return null;
  for (let tx = t0 + 1; tx <= t1; tx++) if (floorRow(map, tx) !== row) return null;
  return { x, y: row * TILE_SIZE - r.h };
}

function hangSpot(map: Tilemap, x: number): { x: number; y: number } {
  const ceiling = map.tileAt(Math.floor(x / TILE_SIZE), 0) === TileType.SOLID ? TILE_SIZE : 0;
  return { x, y: ceiling };
}

function spot(map: Tilemap, id: GagId, x: number): { x: number; y: number } | null {
  return GAGS[id].kind === 'floor' ? floorSpot(map, id, x) : hangSpot(map, x);
}

/** Small deterministic PRNG (mulberry32). */
function rng(seedText: string): () => number {
  let a = 0;
  for (const ch of seedText) a = (Math.imul(a ^ ch.charCodeAt(0), 2654435761) >>> 0);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(items: T[], rand: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface LayoutOptions {
  levelId: string;
  authored?: SceneryPlacement[];
  /** World-x ranges where floor gags must not go (e.g. the goal). */
  keepClear?: [number, number][];
  /** 'tame' uses only tier-1 gags; 'unhinged' adds tier 2 and uses it first. */
  mood?: GagMood;
}

export function layoutScenery(map: Tilemap, opts: LayoutOptions): PlacedGag[] {
  const out: PlacedGag[] = [];
  const authoredX: number[] = [];

  for (const a of opts.authored ?? []) {
    if (!isGagId(a.gag)) { console.warn(`[Tero] unknown scenery gag "${a.gag}"`); continue; }
    const s = spot(map, a.gag, a.tx * TILE_SIZE);
    if (!s) { console.warn(`[Tero] no flat floor for "${a.gag}" at tile ${a.tx}`); continue; }
    out.push({ id: a.gag, ...s });
    authoredX.push(s.x);
  }

  const rand = rng(opts.levelId);
  // Deck order = preference: unhinged levels burn through tier 2 first.
  const deck = (kind: 'floor' | 'hang'): GagId[] => {
    const of = (tier: 1 | 2) => shuffled(GAG_IDS.filter((id) => {
      const g: Gag = GAGS[id];
      return g.kind === kind && g.tier === tier && !g.storyOnly;
    }), rand);
    return opts.mood === 'unhinged' ? [...of(2), ...of(1)] : of(1);
  };
  const decks: Record<'floor' | 'hang', GagId[]> = { floor: deck('floor'), hang: deck('hang') };
  const used = new Set(out.map((g) => g.id));
  const draw = (kind: 'floor' | 'hang'): GagId => {
    // prefer gags not already in this level; cycle the deck
    const deck = decks[kind];
    const i = Math.max(0, deck.findIndex((id) => !used.has(id)));
    const [id] = deck.splice(i, 1);
    deck.push(id);
    used.add(id);
    return id;
  };
  const blocked = (x: number, w: number) =>
    authoredX.some((ax) => Math.abs(ax - x) < AUTHORED_CLEARANCE) ||
    (opts.keepClear ?? []).some(([a, b]) => x < b && x + w > a);

  for (let x = 128 + rand() * 64; x < map.pixelWidth - 160; x += FILL_MIN + rand() * (FILL_MAX - FILL_MIN)) {
    const wantFloor = rand() < 0.55;
    const tryOrder: ('floor' | 'hang')[] = wantFloor ? ['floor', 'hang'] : ['hang', 'floor'];
    for (const kind of tryOrder) {
      const id = draw(kind);
      const gx = Math.round(x);
      const s = spot(map, id, gx);
      if (!s || (kind === 'floor' && blocked(gx, raster(id).w)) || (kind === 'hang' && blocked(gx, 0))) continue;
      out.push({ id, ...s });
      break;
    }
  }
  return out;
}

// ─── Runtime state + draw ────────────────────────────────────────────────────

let current: PlacedGag[] = [];

export function setScenery(gags: PlacedGag[]): void {
  current = gags;
}

/** Hanging banners first so floor props overlap them, never the reverse. */
export function drawScenery(ctx: CanvasRenderingContext2D, camX: number, viewW: number): void {
  if (current.length === 0 || typeof document === 'undefined') return;
  for (const pass of ['hang', 'floor'] as const) {
    for (const g of current) {
      if (GAGS[g.id].kind !== pass) continue;
      const c = canvas(g.id);
      const sx = Math.round(g.x - camX);
      if (sx + c.width < 0 || sx > viewW) continue;
      ctx.drawImage(c, sx, g.y);
    }
  }
}
