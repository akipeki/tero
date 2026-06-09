// file: game/Settings.ts
//
// Tiny localStorage wrapper for persisted player preferences.
// Survives reloads, ignores all errors (private-mode browsers, etc).

const KEY = 'tero:settings';

export interface PersistedSettings {
  muted:        boolean;
  volume:       number;     // 0..1
  lastLevelId?: string;
}

const DEFAULTS: PersistedSettings = {
  muted: false,
  volume: 0.7,
};

export function loadSettings(): PersistedSettings {
  if (typeof window === 'undefined') return { ...DEFAULTS };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<PersistedSettings>;
    return {
      muted:       parsed.muted ?? DEFAULTS.muted,
      volume:      typeof parsed.volume === 'number' ? clamp01(parsed.volume) : DEFAULTS.volume,
      lastLevelId: parsed.lastLevelId,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(partial: Partial<PersistedSettings>): void {
  if (typeof window === 'undefined') return;
  try {
    const cur = loadSettings();
    const next = { ...cur, ...partial };
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch { /* ignore */ }
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
