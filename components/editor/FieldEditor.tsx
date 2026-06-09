'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { contentStore } from '@/game/content/ContentStore';
import type { LevelDef } from '@/game/content/types';
import type { ThemeName } from '@/game/render/Theme';

// ─── DSL paintable chars ─────────────────────────────────────────────────────
type Brush = '.' | '#' | '=' | '^';
const BRUSHES: { ch: Brush; label: string; swatch: string }[] = [
  { ch: '.', label: 'AIR',      swatch: '#0e0e16' },
  { ch: '#', label: 'SOLID',    swatch: '#c2c3c7' },
  { ch: '=', label: 'PLATFORM', swatch: '#ab5236' },
  { ch: '^', label: 'HAZARD',   swatch: '#ff004d' },
];

const THEMES: ThemeName[] = ['ember', 'mint', 'dusk'];

// Render colour for each tile on the editor canvas.
const TILE_COLORS: Record<Brush, string> = {
  '.': '#0e0e16',
  '#': '#5f574f',
  '=': '#ab5236',
  '^': '#ff004d',
};

const MIN_W = 12;
const MAX_W = 200;
const MIN_H = 8;
const MAX_H = 30;

const NEW_LEVEL_DEFAULT_W = 40;
const NEW_LEVEL_DEFAULT_H = 15;

export default function FieldEditor() {
  const store = useMemo(() => contentStore(), []);
  const [, forceRender] = useState(0);

  // Subscribe to store changes
  useEffect(() => store.subscribe(() => forceRender(v => v + 1)), [store]);

  // ─── Selection ─────────────────────────────────────────────────────────────
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const level = selectedId ? store.getLevel(selectedId) : null;
  const isBuiltIn = selectedId ? store.isBuiltIn(selectedId) : false;

  const [brush, setBrush] = useState<Brush>('#');

  // List of available levels
  const allLevels = useMemo(() => {
    const merged = store.merged.levels;
    return Object.values(merged).sort((a, b) => a.name.localeCompare(b.name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, store.merged]);

  // Auto-select first level if none chosen
  useEffect(() => {
    if (!selectedId && allLevels.length > 0) setSelectedId(allLevels[0].id);
  }, [selectedId, allLevels]);

  // ─── Mutations ─────────────────────────────────────────────────────────────
  const updateLevel = useCallback((next: LevelDef) => {
    if (store.isBuiltIn(next.id)) return; // safety
    store.putLevel(next);
  }, [store]);

  const setTile = useCallback((tx: number, ty: number, ch: Brush) => {
    if (!level || isBuiltIn) return;
    const row = level.rows[ty];
    if (!row || tx < 0 || tx >= row.length) return;
    if (row[tx] === ch) return;
    const nextRow = row.slice(0, tx) + ch + row.slice(tx + 1);
    const rows = level.rows.slice();
    rows[ty] = nextRow;
    updateLevel({ ...level, rows });
  }, [level, isBuiltIn, updateLevel]);

  const handleNewLevel = useCallback(() => {
    const blank: LevelDef = makeBlankLevel(`u_level_${freshId()}`, NEW_LEVEL_DEFAULT_W, NEW_LEVEL_DEFAULT_H);
    store.putLevel(blank);
    setSelectedId(blank.id);
  }, [store]);

  const handleFork = useCallback(() => {
    if (!selectedId) return;
    const newId = store.forkBuiltIn('level', selectedId);
    setSelectedId(newId);
  }, [store, selectedId]);

  const handleDelete = useCallback(() => {
    if (!selectedId || isBuiltIn) return;
    if (!confirm(`Delete "${level?.name}"? This cannot be undone.`)) return;
    store.deleteUserItem('level', selectedId);
    setSelectedId(null);
  }, [store, selectedId, isBuiltIn, level]);

  const handleResize = useCallback((newW: number, newH: number) => {
    if (!level || isBuiltIn) return;
    const w = Math.max(MIN_W, Math.min(MAX_W, Math.floor(newW)));
    const h = Math.max(MIN_H, Math.min(MAX_H, Math.floor(newH)));
    const rows = Array.from({ length: h }, (_, ty) => {
      const old = level.rows[ty] ?? '';
      if (old.length === w) return old;
      if (old.length > w)   return old.slice(0, w);
      return old + '.'.repeat(w - old.length);
    });
    updateLevel({ ...level, width: w, height: h, rows });
  }, [level, isBuiltIn, updateLevel]);

  const handleTestPlay = useCallback(() => {
    if (!selectedId) return;
    window.open(`/game?level=${encodeURIComponent(selectedId)}`, '_blank', 'noopener');
  }, [selectedId]);

  // ─── Painting (pointer drag) ───────────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paintingRef = useRef(false);
  const cellSizeRef = useRef(16);

  // Draw the level to canvas whenever the rows change.
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !level) return;

    // Fit the canvas into the available width while keeping square cells.
    const containerW = c.parentElement?.clientWidth ?? 800;
    const containerH = c.parentElement?.clientHeight ?? 600;
    const cell = Math.max(
      6,
      Math.floor(Math.min(containerW / level.width, containerH / level.height)),
    );
    cellSizeRef.current = cell;
    c.width  = level.width  * cell;
    c.height = level.height * cell;

    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    for (let ty = 0; ty < level.height; ty++) {
      const row = level.rows[ty];
      for (let tx = 0; tx < level.width; tx++) {
        const ch = (row[tx] ?? '.') as Brush;
        ctx.fillStyle = TILE_COLORS[ch] ?? TILE_COLORS['.'];
        ctx.fillRect(tx * cell, ty * cell, cell, cell);

        // Subtle grid line every 4 tiles
        if (tx % 4 === 0 || ty % 4 === 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.04)';
          ctx.fillRect(tx * cell, ty * cell, 1, cell);
          if (ty % 4 === 0) ctx.fillRect(tx * cell, ty * cell, cell, 1);
        }
      }
    }
  }, [level]);

  const cellAtPointer = useCallback((e: React.PointerEvent) => {
    const c = canvasRef.current;
    if (!c) return null;
    const rect = c.getBoundingClientRect();
    const scaleX = c.width  / rect.width;
    const scaleY = c.height / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top)  * scaleY;
    return {
      tx: Math.floor(cx / cellSizeRef.current),
      ty: Math.floor(cy / cellSizeRef.current),
    };
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!level || isBuiltIn) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    paintingRef.current = true;
    const pt = cellAtPointer(e);
    if (pt) setTile(pt.tx, pt.ty, brush);
  }, [level, isBuiltIn, brush, cellAtPointer, setTile]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!paintingRef.current || !level || isBuiltIn) return;
    const pt = cellAtPointer(e);
    if (pt) setTile(pt.tx, pt.ty, brush);
  }, [level, isBuiltIn, brush, cellAtPointer, setTile]);

  const onPointerUp = useCallback(() => { paintingRef.current = false; }, []);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateRows: 'auto 1fr',
        height: '100%',
        background: '#0e0e16',
      }}
    >
      {/* ── Top toolbar ──────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          padding: '12px 16px',
          borderBottom: '1px solid #2d2f44',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <select
          value={selectedId ?? ''}
          onChange={(e) => setSelectedId(e.target.value)}
          style={selectStyle}
          aria-label="Select level"
        >
          <option value="" disabled>SELECT LEVEL…</option>
          {allLevels.map((L) => (
            <option key={L.id} value={L.id}>
              {store.isBuiltIn(L.id) ? '📦 ' : '✏️ '}{L.name}
            </option>
          ))}
        </select>

        <button style={btnStyle} onClick={handleNewLevel}>+ NEW</button>
        {selectedId && isBuiltIn && (
          <button style={btnStyle} onClick={handleFork}>FORK TO EDIT</button>
        )}
        {selectedId && !isBuiltIn && (
          <button style={{ ...btnStyle, borderColor: '#ff004d', color: '#ff004d' }} onClick={handleDelete}>
            DELETE
          </button>
        )}

        <span style={{ flex: 1 }} />

        <button
          style={{ ...btnStyle, background: '#a7f070', color: '#0e0e16', borderColor: '#a7f070' }}
          onClick={handleTestPlay}
          disabled={!selectedId}
          title={selectedId ? 'Open level in /game (new tab)' : ''}
        >
          ▶ TEST PLAY
        </button>
      </div>

      {/* ── Body: brush + canvas + metadata panel ────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 260px', height: '100%', overflow: 'hidden' }}>
        {/* Brush column */}
        <div style={{
          borderRight: '1px solid #2d2f44', padding: 12,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <p style={{ fontSize: 9, color: '#c2c3c7', letterSpacing: '0.1em' }}>BRUSH</p>
          {BRUSHES.map((b) => (
            <button
              key={b.ch}
              onClick={() => setBrush(b.ch)}
              style={{
                ...brushStyle,
                outline: brush === b.ch ? '2px solid #29adff' : '1px solid #2d2f44',
              }}
              aria-pressed={brush === b.ch}
              aria-label={b.label}
            >
              <span style={{
                display: 'inline-block', width: 18, height: 18,
                background: b.swatch, border: '1px solid #2d2f44', marginRight: 6,
                verticalAlign: 'middle',
              }} />
              <span style={{ fontSize: 9, verticalAlign: 'middle' }}>{b.label}</span>
            </button>
          ))}
        </div>

        {/* Canvas */}
        <div style={{ padding: 16, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
          {level ? (
            <div>
              {isBuiltIn && (
                <p style={{ fontSize: 10, color: '#ffcd75', marginBottom: 8 }}>
                  📦 BUILT-IN LEVEL — read-only. Click <b>FORK TO EDIT</b> to make a copy.
                </p>
              )}
              <canvas
                ref={canvasRef}
                style={{
                  imageRendering: 'pixelated',
                  border: '1px solid #2d2f44',
                  cursor: isBuiltIn ? 'not-allowed' : 'crosshair',
                  touchAction: 'none',
                  maxWidth: '100%',
                  background: '#000',
                }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
              />
            </div>
          ) : (
            <p style={{ color: '#c2c3c7', marginTop: 80 }}>
              No level selected. Click <b>+ NEW</b> to create one.
            </p>
          )}
        </div>

        {/* Metadata + spawn summary panel */}
        <div style={{ borderLeft: '1px solid #2d2f44', padding: 12, overflow: 'auto' }}>
          {level && (
            <MetadataPanel
              level={level}
              isBuiltIn={isBuiltIn}
              onChange={updateLevel}
              onResize={handleResize}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function MetadataPanel({
  level, isBuiltIn, onChange, onResize,
}: {
  level: LevelDef;
  isBuiltIn: boolean;
  onChange: (L: LevelDef) => void;
  onResize: (w: number, h: number) => void;
}) {
  const disabled = isBuiltIn;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 10 }}>
      <Section title="METADATA">
        <Field label="NAME">
          <input
            value={level.name}
            disabled={disabled}
            onChange={(e) => onChange({ ...level, name: e.target.value })}
            style={inputStyle}
          />
        </Field>
        <Field label="THEME">
          <select
            value={level.theme}
            disabled={disabled}
            onChange={(e) => onChange({ ...level, theme: e.target.value as ThemeName })}
            style={selectStyle}
          >
            {THEMES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
          </select>
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Field label="WIDTH">
            <input
              type="number" min={MIN_W} max={MAX_W} value={level.width}
              disabled={disabled}
              onChange={(e) => onResize(parseInt(e.target.value, 10) || level.width, level.height)}
              style={inputStyle}
            />
          </Field>
          <Field label="HEIGHT">
            <input
              type="number" min={MIN_H} max={MAX_H} value={level.height}
              disabled={disabled}
              onChange={(e) => onResize(level.width, parseInt(e.target.value, 10) || level.height)}
              style={inputStyle}
            />
          </Field>
        </div>
      </Section>

      <Section title="SPAWNS (READ-ONLY V1)">
        <p style={{ color: '#c2c3c7', lineHeight: 1.5 }}>
          • Player @ ({level.spawns.player.tx},{level.spawns.player.ty})<br/>
          • Goal @ ({level.spawns.goal.tx},{level.spawns.goal.ty})<br/>
          • {level.spawns.enemies.length} enemies<br/>
          • {level.spawns.blocks.length} ? blocks<br/>
          • {(level.spawns.coins ?? []).length} coins<br/>
          • {(level.spawns.checkpoints ?? []).length} checkpoints
        </p>
        <p style={{ marginTop: 8, fontSize: 9, color: '#555567' }}>
          Drag-to-place entity editing arrives in Phase 3.
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: 9, letterSpacing: '0.1em', color: '#c2c3c7', marginBottom: 6 }}>{title}</p>
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 8,
        padding: 10, background: '#1a1c2c', border: '1px solid #2d2f44', borderRadius: 4,
      }}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 9, letterSpacing: '0.08em' }}>
      <span style={{ color: '#c2c3c7' }}>{label}</span>
      {children}
    </label>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const btnStyle: React.CSSProperties = {
  fontFamily: 'inherit', fontSize: 10, letterSpacing: '0.08em',
  background: 'transparent', color: '#fff1e8',
  border: '1px solid #fff1e8', padding: '8px 14px',
  cursor: 'pointer', borderRadius: 4,
};
const selectStyle: React.CSSProperties = {
  fontFamily: 'inherit', fontSize: 10, letterSpacing: '0.05em',
  background: '#1a1c2c', color: '#fff1e8',
  border: '1px solid #2d2f44', padding: '8px 12px',
  cursor: 'pointer', borderRadius: 4,
};
const inputStyle: React.CSSProperties = {
  fontFamily: 'inherit', fontSize: 11,
  background: '#0e0e16', color: '#fff1e8',
  border: '1px solid #2d2f44', padding: '8px 10px',
  borderRadius: 4,
};
const brushStyle: React.CSSProperties = {
  background: 'transparent', border: '1px solid #2d2f44',
  cursor: 'pointer', textAlign: 'left', padding: '4px 6px',
  color: '#fff1e8', fontFamily: 'inherit', borderRadius: 4,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function makeBlankLevel(id: string, w: number, h: number): LevelDef {
  const rows: string[] = [];
  for (let ty = 0; ty < h; ty++) {
    if (ty === 0) rows.push('#'.repeat(w));        // ceiling
    else if (ty >= h - 6) rows.push('#'.repeat(w)); // ground + underground
    else rows.push('.'.repeat(w));                  // sky
  }
  return {
    id,
    name: 'Untitled',
    theme: 'ember',
    width: w,
    height: h,
    rows,
    spawns: {
      player: { tx: 2, ty: h - 7 },
      enemies: [],
      blocks: [],
      coins: [],
      checkpoints: [],
      goal: { tx: w - 4, ty: 2 },
    },
  };
}

let _idSeq = 0;
function freshId(): string { _idSeq++; return `${Date.now().toString(36)}_${_idSeq}`; }
