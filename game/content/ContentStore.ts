// file: game/content/ContentStore.ts
//
// Single shared source of truth for all content. Wraps the read-only built-in
// pack and a mutable user pack persisted to localStorage. Editors mutate the
// user pack; the runtime reads through the merged view.
//
// Fork-on-edit: any built-in id you want to mutate must first be cloned via
// `forkBuiltIn` into the user pack with a fresh `u_` id.

import { defaultPack } from './defaultPack';
import { validatePack, migratePack } from './serialize';
import type {
  ContentPack, EntityDef, LevelDef, SpriteAsset, StoryCard, Chapter,
  PackItemKind, PACK_VERSION as PV,
} from './types';
import { PACK_VERSION } from './types';

const STORAGE_KEY = 'tero:pack:user';
const SAVE_DEBOUNCE_MS = 250;

type Listener = () => void;

function emptyUserPack(): ContentPack {
  return {
    meta: {
      id:      `tero-user-${Math.random().toString(36).slice(2, 8)}`,
      name:    'My Pack',
      author:  '',
      version: PACK_VERSION as typeof PV,
    },
    sprites:  {},
    entities: {},
    levels:   {},
    story: {
      chapters: [],
      cards:    {},
    },
  };
}

export class ContentStore {
  private user: ContentPack = emptyUserPack();
  private listeners = new Set<Listener>();
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.loadFromStorage();
  }

  // ─── Public read API ───────────────────────────────────────────────────────

  get builtin(): ContentPack { return defaultPack; }
  get userPack(): ContentPack { return this.user; }

  /** Returns the merged pack (built-in + user). User wins on id collision. */
  get merged(): ContentPack {
    return {
      meta:     this.user.meta,
      sprites:  { ...defaultPack.sprites,  ...this.user.sprites },
      entities: { ...defaultPack.entities, ...this.user.entities },
      levels:   { ...defaultPack.levels,   ...this.user.levels },
      story: {
        // Built-in chapters first, user chapters appended.
        chapters: [...defaultPack.story.chapters, ...this.user.story.chapters],
        cards:    { ...defaultPack.story.cards, ...this.user.story.cards },
      },
    };
  }

  getLevel(id: string): LevelDef | null {
    return this.user.levels[id] ?? defaultPack.levels[id] ?? null;
  }
  getSprite(id: string): SpriteAsset | null {
    return this.user.sprites[id] ?? defaultPack.sprites[id] ?? null;
  }
  getEntity(id: string): EntityDef | null {
    return this.user.entities[id] ?? defaultPack.entities[id] ?? null;
  }
  getCard(id: string): StoryCard | null {
    return this.user.story.cards[id] ?? defaultPack.story.cards[id] ?? null;
  }

  isBuiltIn(id: string): boolean { return id.startsWith('b_'); }

  // ─── Mutations (always on the user pack) ───────────────────────────────────

  putLevel(L: LevelDef): void {
    if (this.isBuiltIn(L.id)) {
      throw new Error(`Refusing to overwrite built-in level ${L.id}; fork first.`);
    }
    this.user.levels[L.id] = L;
    this.scheduleSave();
  }
  putSprite(s: SpriteAsset): void {
    if (this.isBuiltIn(s.id)) {
      throw new Error(`Refusing to overwrite built-in sprite ${s.id}; fork first.`);
    }
    this.user.sprites[s.id] = s;
    this.scheduleSave();
  }
  putEntity(e: EntityDef): void {
    if (this.isBuiltIn(e.id)) {
      throw new Error(`Refusing to overwrite built-in entity ${e.id}; fork first.`);
    }
    this.user.entities[e.id] = e;
    this.scheduleSave();
  }
  putCard(c: StoryCard): void {
    if (this.isBuiltIn(c.id)) {
      throw new Error(`Refusing to overwrite built-in card ${c.id}; fork first.`);
    }
    this.user.story.cards[c.id] = c;
    this.scheduleSave();
  }
  putChapter(c: Chapter): void {
    if (this.isBuiltIn(c.id)) {
      throw new Error(`Refusing to overwrite built-in chapter ${c.id}; fork first.`);
    }
    const existing = this.user.story.chapters.findIndex(x => x.id === c.id);
    if (existing >= 0) this.user.story.chapters[existing] = c;
    else this.user.story.chapters.push(c);
    this.scheduleSave();
  }

  deleteUserItem(kind: PackItemKind, id: string): void {
    if (this.isBuiltIn(id)) return; // built-ins can't be deleted, only forked
    switch (kind) {
      case 'sprite':  delete this.user.sprites[id]; break;
      case 'entity':  delete this.user.entities[id]; break;
      case 'level':   delete this.user.levels[id]; break;
      case 'card':    delete this.user.story.cards[id]; break;
      case 'chapter':
        this.user.story.chapters = this.user.story.chapters.filter(c => c.id !== id);
        break;
    }
    this.scheduleSave();
  }

  /** Clones a built-in into the user pack with a fresh id. Returns the new id. */
  forkBuiltIn(kind: 'level',   id: string): string;
  forkBuiltIn(kind: 'sprite',  id: string): string;
  forkBuiltIn(kind: 'entity',  id: string): string;
  forkBuiltIn(kind: 'card',    id: string): string;
  forkBuiltIn(kind: 'chapter', id: string): string;
  forkBuiltIn(kind: PackItemKind, id: string): string {
    const newId = `u_${kind}_${freshSuffix()}`;
    switch (kind) {
      case 'sprite': {
        const src = defaultPack.sprites[id];
        if (!src) throw new Error(`No built-in sprite ${id}`);
        this.user.sprites[newId] = { ...structuredClone(src), id: newId, name: `${src.name} (copy)` };
        break;
      }
      case 'entity': {
        const src = defaultPack.entities[id];
        if (!src) throw new Error(`No built-in entity ${id}`);
        this.user.entities[newId] = { ...structuredClone(src), id: newId, name: `${src.name} (copy)` };
        break;
      }
      case 'level': {
        const src = defaultPack.levels[id];
        if (!src) throw new Error(`No built-in level ${id}`);
        this.user.levels[newId] = { ...structuredClone(src), id: newId, name: `${src.name} (copy)` };
        break;
      }
      case 'card': {
        const src = defaultPack.story.cards[id];
        if (!src) throw new Error(`No built-in card ${id}`);
        this.user.story.cards[newId] = { ...structuredClone(src), id: newId };
        break;
      }
      case 'chapter': {
        const src = defaultPack.story.chapters.find(c => c.id === id);
        if (!src) throw new Error(`No built-in chapter ${id}`);
        this.user.story.chapters.push({ ...structuredClone(src), id: newId, name: `${src.name} (copy)` });
        break;
      }
    }
    this.scheduleSave();
    return newId;
  }

  // ─── Subscribe / save ──────────────────────────────────────────────────────

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    for (const fn of this.listeners) fn();
  }

  /** Forces an immediate write (skipping the debounce). Useful in tests. */
  flush(): void {
    if (this.saveTimer !== null) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    this.writeNow();
  }

  private scheduleSave(): void {
    this.emit();
    if (this.saveTimer !== null) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      this.writeNow();
    }, SAVE_DEBOUNCE_MS);
  }

  private writeNow(): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.user));
    } catch {
      // Quota or private-mode failures degrade gracefully.
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    let raw: string | null;
    try { raw = window.localStorage.getItem(STORAGE_KEY); } catch { return; }
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as unknown;
      const migrated = migratePack(parsed);
      this.user = validatePack(migrated);
    } catch (err) {
      // Corrupt blob — leave defaults in place but log so the user can recover.
      console.warn('[Tero] discarding malformed user pack:', err);
    }
  }

  // ─── Import / export ───────────────────────────────────────────────────────

  /** Returns a Blob suitable for download. */
  exportJsonBlob(): Blob {
    return new Blob([JSON.stringify(this.user, null, 2)], { type: 'application/json' });
  }

  /** Parses + validates an imported pack. Caller decides replace vs merge. */
  importJson(text: string, mode: 'replace' | 'merge' = 'replace'): void {
    const parsed = JSON.parse(text) as unknown;
    const migrated = migratePack(parsed);
    const pack = validatePack(migrated);
    if (mode === 'replace') {
      this.user = pack;
    } else {
      this.user = {
        meta:     this.user.meta,
        sprites:  { ...this.user.sprites,  ...pack.sprites },
        entities: { ...this.user.entities, ...pack.entities },
        levels:   { ...this.user.levels,   ...pack.levels },
        story: {
          chapters: [...this.user.story.chapters, ...pack.story.chapters],
          cards:    { ...this.user.story.cards, ...pack.story.cards },
        },
      };
    }
    this.scheduleSave();
  }

  /** Empties the user pack and writes immediately. */
  resetUserPack(): void {
    this.user = emptyUserPack();
    this.flush();
    this.emit();
  }
}

// ─── Singleton ──────────────────────────────────────────────────────────────

let _instance: ContentStore | null = null;

/** Lazily-instantiated module-global ContentStore.
 *  Use this from React components; pass an explicit instance in tests. */
export function contentStore(): ContentStore {
  if (!_instance) _instance = new ContentStore();
  return _instance;
}

// ─── Internal helpers ────────────────────────────────────────────────────────

let _seq = 0;
function freshSuffix(): string {
  _seq++;
  return `${Date.now().toString(36)}_${_seq}`;
}
