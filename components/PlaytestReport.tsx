'use client';

// The playtest report: per-floor numbers and heat maps of where players
// die, quit, get stuck and get rescued. Data lives in localStorage
// (game/Playtest.ts); testers export it as a file and you import theirs.

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { LEVELS, type LevelDef } from '@/game/level/levels';
import {
  loadSessions, importSessions, clearSessions, setTesterName,
  type PlaytestSession, type PlaytestEvent,
} from '@/game/Playtest';
import { TileType } from '@/game/types';

const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb); }; };
const refresh = () => listeners.forEach((l) => l());
const snapshot = () => JSON.stringify(loadSessions());
const testerSnapshot = () => window.localStorage.getItem('tero:tester') ?? '';

const PX = 6;           // heat-map pixels per tile
const ROWS = 9;         // the visible rows

const FONT: React.CSSProperties = { fontFamily: 'var(--font-pixel, monospace)' };
/** The game's pixel button, sized down for a document page. */
const BTN: React.CSSProperties = { fontSize: 11, padding: '8px 12px' };

interface FloorStats {
  level: LevelDef;
  events: PlaytestEvent[];
  players: number;
  clears: number;
  deaths: number;
  quits: number;
  stuck: number;
  rescues: number;
  medianClearMs: number | null;
  causes: [string, number][];
}

function stats(sessions: PlaytestSession[]): FloorStats[] {
  return LEVELS.map((level) => {
    const events = sessions.flatMap((s) => s.events.filter((e) => e.level === level.id));
    const entered = new Set(sessions.filter((s) => s.events.some((e) => e.level === level.id && e.t === 'start')).map((s) => s.id));
    const cleared = new Set(sessions.filter((s) => s.events.some((e) => e.level === level.id && e.t === 'clear')).map((s) => s.id));
    const times = events.filter((e) => e.t === 'clear' && typeof e.d === 'number').map((e) => e.d as number).sort((a, b) => a - b);
    const causes = new Map<string, number>();
    for (const e of events) if (e.t === 'death') causes.set(String(e.d ?? 'unknown'), (causes.get(String(e.d ?? 'unknown')) ?? 0) + 1);
    return {
      level,
      events,
      players: entered.size,
      clears: cleared.size,
      deaths: events.filter((e) => e.t === 'death').length,
      quits: events.filter((e) => e.t === 'quit').length,
      stuck: events.filter((e) => e.t === 'stuck').length,
      rescues: events.filter((e) => e.t === 'rescue').length,
      medianClearMs: times.length ? times[Math.floor(times.length / 2)] : null,
      causes: [...causes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3),
    };
  });
}

function fmt(ms: number | null): string {
  if (ms === null) return '–';
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function PlaytestReport() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => '[]');
  const tester = useSyncExternalStore(subscribe, testerSnapshot, () => '');
  const sessions = useMemo(() => JSON.parse(raw) as PlaytestSession[], [raw]);
  const floors = useMemo(() => stats(sessions), [sessions]);
  const [note, setNote] = useState('');

  const exportLog = () => {
    const blob = new Blob([JSON.stringify(sessions, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `where-is-dada-playtest-${(tester || 'anonymous').replace(/\W+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importLogs = async (files: FileList | null) => {
    let added = 0;
    for (const f of Array.from(files ?? [])) {
      try { added += importSessions(JSON.parse(await f.text()) as PlaytestSession[]); } catch { /* not a log */ }
    }
    setNote(`IMPORTED ${added} SESSION${added === 1 ? '' : 'S'}.`);
    refresh();
  };

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px 64px' }}>
      <h1 style={{ ...FONT, color: '#6cc24a', fontSize: 'clamp(16px, 3vw, 28px)', margin: 0 }}>PLAYTEST REPORT</h1>
      <p style={{ color: '#c2c3c7', fontSize: 14, maxWidth: 720 }}>
        Everything the game logged in this browser, plus any logs you import. Nothing is sent anywhere.
        Testers: type your name, play, then press <b>Export my log</b> and send the file.
        See <code>docs/PLAYTEST.md</code> for how to run a session.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', margin: '16px 0' }}>
        <label style={{ fontSize: 14 }}>
          Tester name{' '}
          <input
            defaultValue={tester}
            onBlur={(e) => { setTesterName(e.target.value); refresh(); }}
            style={{ background: '#1b1620', color: '#fff1e8', border: '1px solid #83769c', padding: '4px 8px' }}
            aria-label="Tester name (used for new sessions on this computer)"
          />
        </label>
        <button className="pixel-btn" style={BTN} onClick={exportLog} disabled={!sessions.length}>⬇ EXPORT MY LOG</button>
        <label className="pixel-btn" style={{ ...BTN, cursor: 'pointer' }}>
          ⬆ IMPORT LOGS
          <input type="file" accept="application/json,.json" multiple hidden onChange={(e) => importLogs(e.target.files)} />
        </label>
        <button
          className="pixel-btn"
          style={{ ...BTN, borderColor: '#d83b3b', color: '#d83b3b' }}
          onClick={() => { if (window.confirm('Delete every playtest session stored in this browser?')) { clearSessions(); refresh(); } }}
        >
          ✕ CLEAR
        </button>
        {note && <span style={{ ...FONT, color: '#ffd23f', fontSize: 11 }} role="status">{note}</span>}
      </div>

      <p style={{ ...FONT, fontSize: 11, color: '#a7f070' }}>
        {sessions.length} SESSION{sessions.length === 1 ? '' : 'S'} · {new Set(sessions.map((s) => s.tester)).size} TESTER(S)
        · {sessions.filter((s) => s.assist).length} WITH KID MODE
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 13, minWidth: 760 }}>
          <thead>
            <tr style={{ color: '#ffd23f', textAlign: 'left' }}>
              {['Floor', 'Players', 'Cleared', 'Deaths', 'Deaths / player', 'Quits', 'Stuck', 'Rescues', 'Median time', 'Top killers'].map((h) => (
                <th key={h} style={{ padding: '6px 10px', borderBottom: '1px solid #2a2f4a' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {floors.map((f) => {
              const rate = f.players ? f.clears / f.players : 0;
              const hot = f.players && f.deaths / f.players > 6;
              return (
                <tr key={f.level.id}>
                  <td style={td}>{f.level.name}</td>
                  <td style={td}>{f.players}</td>
                  <td style={{ ...td, color: f.players && rate < 0.6 ? '#ff3b1f' : undefined }}>
                    {f.clears}{f.players ? ` (${Math.round(rate * 100)}%)` : ''}
                  </td>
                  <td style={td}>{f.deaths}</td>
                  <td style={{ ...td, color: hot ? '#ff3b1f' : undefined }}>{f.players ? (f.deaths / f.players).toFixed(1) : '–'}</td>
                  <td style={{ ...td, color: f.quits ? '#ff77a8' : undefined }}>{f.quits}</td>
                  <td style={{ ...td, color: f.stuck ? '#ffd23f' : undefined }}>{f.stuck}</td>
                  <td style={td}>{f.rescues}</td>
                  <td style={td}>{fmt(f.medianClearMs)}</td>
                  <td style={td}>{f.causes.map(([c, n]) => `${c} ×${n}`).join(', ') || '–'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2 style={{ ...FONT, fontSize: 14, color: '#fff1e8', marginTop: 32 }}>HEAT MAPS</h2>
      <p style={{ fontSize: 13, color: '#c2c3c7' }}>
        <Dot color="#ff3b1f" /> death &nbsp; <Dot color="#ffd23f" /> stuck 20 s &nbsp; <Dot color="#ff77a8" /> quit &nbsp;
        <Dot color="#29adff" /> rescued from a pit (kid mode) &nbsp; <Dot color="#a7f070" /> found a Dad thing
      </p>
      {floors.map((f) => <HeatMap key={f.level.id} floor={f} />)}
    </main>
  );
}

const td: React.CSSProperties = { padding: '6px 10px', borderBottom: '1px solid #1e2133' };

function Dot({ color }: { color: string }) {
  return <span style={{ display: 'inline-block', width: 10, height: 10, background: color, borderRadius: 5, verticalAlign: 'middle' }} />;
}

const EVENT_COLOR: Partial<Record<PlaytestEvent['t'], string>> = {
  death: 'rgba(255,59,31,0.55)',
  stuck: 'rgba(255,210,63,0.75)',
  quit: 'rgba(255,119,168,0.9)',
  rescue: 'rgba(41,173,255,0.75)',
  thing: 'rgba(167,240,112,0.9)',
};

function HeatMap({ floor }: { floor: FloorStats }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { level, events } = floor;
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    c.width = level.width * PX;
    c.height = ROWS * PX;
    const g = c.getContext('2d')!;
    g.fillStyle = '#1a1c2c';
    g.fillRect(0, 0, c.width, c.height);
    for (let ty = 0; ty < ROWS; ty++) {
      for (let tx = 0; tx < level.width; tx++) {
        const t = level.tiles[ty * level.width + tx];
        const color =
          t === TileType.SOLID ? '#4a4f63'
          : t === TileType.PLATFORM ? '#8a8f96'
          : t === TileType.HAZARD ? '#7f2a2a'
          : t === TileType.PAPER ? '#e8e2cf'
          : t === TileType.TAPE ? '#b0444f'
          : null;
        if (!color) continue;
        g.fillStyle = color;
        g.fillRect(tx * PX, ty * PX, PX, t === TileType.PLATFORM ? 2 : PX);
      }
    }
    for (const e of events) {
      const color = EVENT_COLOR[e.t];
      if (!color) continue;
      g.fillStyle = color;
      g.beginPath();
      g.arc(e.tx * PX, Math.min(ROWS - 0.5, e.ty) * PX, e.t === 'quit' ? 4 : 3, 0, Math.PI * 2);
      g.fill();
    }
  }, [level, events]);

  return (
    <figure style={{ margin: '18px 0' }}>
      <figcaption style={{ ...FONT, fontSize: 11, color: '#ffd23f', marginBottom: 6 }}>
        {level.name.toUpperCase()} · {floor.deaths} DEATHS · {floor.stuck} STUCK · {floor.quits} QUITS
      </figcaption>
      <div style={{ overflowX: 'auto' }}>
        <canvas
          ref={ref}
          style={{ imageRendering: 'pixelated', width: level.width * PX, height: ROWS * PX, display: 'block' }}
          role="img"
          aria-label={`${level.name}: ${floor.deaths} deaths, ${floor.stuck} stuck, ${floor.quits} quits`}
        />
      </div>
    </figure>
  );
}
