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
import type { SceneryPlacement, GagMood, GagDensity } from '../../content/types';
import type { DecorId } from './decor';
import type { Raster } from '../pixel/Raster';
import { GAGS, GAG_IDS, isGagId, type Gag, type GagId } from './gags';
import { mute } from './mute';

export interface PlacedGag {
  id: GagId;
  /** World-space top-left. */
  x: number;
  y: number;
}

/** Spacing between auto-placed gags, in world px, per density. */
const FILL: Record<GagDensity, [number, number]> = {
  normal: [300, 440],
  sparse: [460, 640],
};
/** Gap auto gags keep from authored gags of the same kind (world px). */
const AUTHORED_GAP = 24;
/** How far floor props sit back from the carpet edge (world px). */
export const WALL_SETBACK = 4;
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
  if (!c) {
    c = raster(id).toCanvas();
    // Props are scenery: muted so platforms and pickups stand out. Tero's
    // crayon slogans stay bright — they mark the exit.
    if (!id.startsWith('crayon_')) mute(c, 0.7, '#a8a294', 0.2);
    canvases.set(id, c);
  }
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
  // Stand a few px back from the carpet's front edge: reads as "against the
  // wall", i.e. scenery, not something in Tero's path.
  return { x, y: row * TILE_SIZE - r.h - WALL_SETBACK };
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
  /** A hanging gag centred over world-x `centerX` — Tero's slogan above the
   *  elevator, where Mario would have his flagpole. */
  goalWriting?: { gag: string; centerX: number };
  density?: GagDensity;
  /** Floor décor — gags with a `floors` list only auto-fill on those floors. */
  decor?: DecorId;
}

export function layoutScenery(map: Tilemap, opts: LayoutOptions): PlacedGag[] {
  const out: PlacedGag[] = [];
  const authored: { kind: 'floor' | 'hang'; x0: number; x1: number }[] = [];

  for (const a of opts.authored ?? []) {
    if (!isGagId(a.gag)) { console.warn(`[Tero] unknown scenery gag "${a.gag}"`); continue; }
    const s = spot(map, a.gag, a.tx * TILE_SIZE);
    if (!s) { console.warn(`[Tero] no flat floor for "${a.gag}" at tile ${a.tx}`); continue; }
    out.push({ id: a.gag, ...s });
    authored.push({ kind: GAGS[a.gag].kind, x0: s.x, x1: s.x + raster(a.gag).w });
  }

  if (opts.goalWriting) {
    const { gag, centerX } = opts.goalWriting;
    if (!isGagId(gag)) console.warn(`[Tero] unknown goal writing "${gag}"`);
    else {
      const x = Math.round(centerX - raster(gag).w / 2);
      out.push({ id: gag, ...hangSpot(map, centerX), x });
      authored.push({ kind: GAGS[gag].kind, x0: x, x1: x + raster(gag).w });
    }
  }

  const rand = rng(opts.levelId);
  // Deck order = preference: unhinged levels burn through tier 2 first.
  const deck = (kind: 'floor' | 'hang'): GagId[] => {
    const of = (tier: 1 | 2) => shuffled(GAG_IDS.filter((id) => {
      const g: Gag = GAGS[id];
      return g.kind === kind && g.tier === tier && !g.storyOnly &&
        (!g.floors || g.floors.includes(opts.decor ?? 'cubicles'));
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
  // Banners and floor props live in different bands, so only same-kind
  // authored gags block; the keep-clear zones block everything.
  const blocked = (kind: 'floor' | 'hang', x: number, w: number) =>
    authored.some((a) => a.kind === kind && x < a.x1 + AUTHORED_GAP && x + w > a.x0 - AUTHORED_GAP) ||
    (opts.keepClear ?? []).some(([a, b]) => x < b && x + w > a);

  const [fillMin, fillMax] = FILL[opts.density ?? 'normal'];
  for (let x = 128 + rand() * 64; x < map.pixelWidth - 160; x += fillMin + rand() * (fillMax - fillMin)) {
    const wantFloor = rand() < 0.55;
    const tryOrder: ('floor' | 'hang')[] = wantFloor ? ['floor', 'hang'] : ['hang', 'floor'];
    for (const kind of tryOrder) {
      const id = draw(kind);
      const gx = Math.round(x);
      const s = spot(map, id, gx);
      if (!s || blocked(kind, gx, raster(id).w)) continue;
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
