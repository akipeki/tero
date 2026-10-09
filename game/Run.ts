// file: game/Run.ts
//
// The whole-game run, across floors: splits, totals and Dad's things. It's
// what the share card at the end shows, and what speedrunners race. Saved
// to localStorage so a reload mid-run doesn't lose it.
//
//   start()        a fresh run (Floor 1 from the title)
//   floorCleared() a split for that floor + its totals
//   event()        counts tantrums, deaths, faxes, syncs as they happen

const RUN_KEY  = 'tero:run';
const BEST_KEY = 'tero:bestRun';
const UNLOCK_KEY = 'tero:unlocks';
const THINGS_KEY = 'tero:dadThings';

export type RunEvent = 'tantrum' | 'death' | 'sync' | 'fax' | 'alarm';

export interface Split { levelId: string; name: string; timeMs: number }

export interface RunData {
  splits:   Split[];
  sentHome: number;
  coins:    number;
  events:   Record<RunEvent, number>;
  /** Dad's things picked up during this run (ids). */
  things:   string[];
  finished: boolean;
  /** Any floor cleared with Bring Your Kid to Work Day on. */
  assist?:  boolean;
  /** Hand grenades carried (the resistance gives one). */
  grenades?: number;
}

function fresh(): RunData {
  return {
    splits: [], sentHome: 0, coins: 0, things: [], finished: false,
    events: { tantrum: 0, death: 0, sync: 0, fax: 0, alarm: 0 },
  };
}

function read<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try { const raw = window.localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : null; } catch { return null; }
}
function write(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

export class Run {
  data: RunData = read<RunData>(RUN_KEY) ?? fresh();

  start(): void {
    this.data = fresh();
    this.save();
  }

  event(e: RunEvent): void {
    this.data.events[e]++;
    this.save();
  }

  thing(id: string): void {
    if (!this.data.things.includes(id)) this.data.things.push(id);
    const all = new Set(read<string[]>(THINGS_KEY) ?? []);
    all.add(id);
    write(THINGS_KEY, [...all]);
    this.save();
  }

  giveGrenade(): void { this.data.grenades = 1; this.save(); }
  /** Uses one if there is one. */
  useGrenade(): boolean {
    if (!this.data.grenades) return false;
    this.data.grenades--;
    this.save();
    return true;
  }

  /** Records a cleared floor. Replaces an earlier split for the same floor
   *  (a replay) so the totals stay honest. */
  floorCleared(levelId: string, name: string, timeMs: number, sentHome: number, coins: number, last: boolean, assist = false): void {
    if (assist) this.data.assist = true;
    this.data.splits = this.data.splits.filter((s) => s.levelId !== levelId);
    this.data.splits.push({ levelId, name, timeMs });
    this.data.sentHome += sentHome;
    this.data.coins += coins;
    if (last) {
      this.data.finished = true;
      write(UNLOCK_KEY, { ...unlocks(), casualFriday: true });
      // Assisted runs don't set speedrun records.
      const best = bestRun();
      if (!this.data.assist && (best === null || this.totalMs < best)) write(BEST_KEY, this.totalMs);
    }
    this.save();
  }

  get totalMs(): number { return this.data.splits.reduce((t, s) => t + s.timeMs, 0); }

  private save(): void { write(RUN_KEY, this.data); }
}

/** Best full-game time in ms, or null. */
export function bestRun(): number | null { return read<number>(BEST_KEY); }

export interface Unlocks { casualFriday?: boolean }
export function unlocks(): Unlocks { return read<Unlocks>(UNLOCK_KEY) ?? {}; }

/** Every one of Dad's things ever found, across runs. */
export function thingsEverFound(): string[] { return read<string[]>(THINGS_KEY) ?? []; }

export function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}.${String(Math.floor((ms % 1000) / 10)).padStart(2, '0')}`;
}
