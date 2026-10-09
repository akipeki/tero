// file: game/Playtest.ts
//
// The playtest log: where players die, give up, get stuck and use what.
// Local only — nothing leaves the browser. /playtest shows it as heat maps
// per floor; testers can export their log as a file and send it to you,
// and you can import several to see them together.

const KEY = 'tero:playtest';
const MAX_SESSIONS = 60;

export type PlaytestEventType =
  | 'start'     // a floor was entered
  | 'clear'     // a floor was finished (detail: time ms)
  | 'death'     // detail: cause
  | 'gameover'
  | 'quit'      // left mid-floor (quit to title or closed the tab)
  | 'stuck'     // 20 s without getting any further
  | 'quiz'      // the job application (detail: answers rejected first)
  | 'grenade'   // the grenade went off (detail: how many resigned)
  | 'interlude' // a genre break started (detail: which)
  | 'tantrum' | 'sync' | 'alarm' | 'thing' | 'rescue';

export interface PlaytestEvent {
  t: PlaytestEventType;
  /** Built-in level id ('1', '2' …) */
  level: string;
  /** World tile position. */
  tx: number;
  ty: number;
  /** Cause of death, time, item id… */
  d?: string | number;
  /** ms since the session started */
  at: number;
}

export interface PlaytestSession {
  id: string;
  /** Who played (testers can type a name on the /playtest page). */
  tester: string;
  startedAt: number;
  assist: boolean;
  events: PlaytestEvent[];
}

function readAll(): PlaytestSession[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(window.localStorage.getItem(KEY) ?? '[]') as PlaytestSession[]; } catch { return []; }
}

function writeAll(sessions: PlaytestSession[]): void {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(KEY, JSON.stringify(sessions.slice(-MAX_SESSIONS))); } catch { /* full or blocked */ }
}

/** One page load = one session. */
export class PlaytestLog {
  private session: PlaytestSession;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.session = {
      id: Math.random().toString(36).slice(2, 10),
      tester: (typeof window !== 'undefined' && window.localStorage?.getItem('tero:tester')) || 'anonymous',
      startedAt: Date.now(),
      assist: false,
      events: [],
    };
  }

  setAssist(on: boolean): void { this.session.assist = this.session.assist || on; }

  record(t: PlaytestEventType, levelId: string, x: number, y: number, d?: string | number): void {
    this.session.events.push({
      t,
      level: levelId.replace(/^b_level_/, ''),
      tx: Math.round(x / 32),
      ty: Math.round(y / 32),
      d,
      at: Date.now() - this.session.startedAt,
    });
    // Save soon, not on every event (localStorage is slow-ish).
    if (this.saveTimer === null) this.saveTimer = setTimeout(() => this.flush(), 1000);
  }

  /** Write now (page closing, level end). */
  flush(): void {
    if (this.saveTimer !== null) { clearTimeout(this.saveTimer); this.saveTimer = null; }
    if (this.session.events.length === 0) return;
    const all = readAll().filter((s) => s.id !== this.session.id);
    all.push(this.session);
    writeAll(all);
  }
}

// ─── For the /playtest page ──────────────────────────────────────────────────

export function loadSessions(): PlaytestSession[] { return readAll(); }

/** Merge imported sessions (from testers' exported files) into this browser. */
export function importSessions(more: PlaytestSession[]): number {
  const all = readAll();
  const known = new Set(all.map((s) => s.id));
  const fresh = more.filter((s) => s && Array.isArray(s.events) && !known.has(s.id));
  writeAll([...all, ...fresh]);
  return fresh.length;
}

export function clearSessions(): void {
  if (typeof window === 'undefined') return;
  try { window.localStorage.removeItem(KEY); } catch { /* ignore */ }
}

export function setTesterName(name: string): void {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem('tero:tester', name.trim().slice(0, 40) || 'anonymous'); } catch { /* ignore */ }
}
