'use client';

import { useState } from 'react';
import Link from 'next/link';
import FieldEditor from './FieldEditor';

type Tab = 'levels' | 'entities' | 'sprites' | 'story' | 'pack';

const TABS: { id: Tab; label: string; ready: boolean }[] = [
  { id: 'levels',   label: 'LEVELS',   ready: true  },
  { id: 'entities', label: 'ENTITIES', ready: false },
  { id: 'sprites',  label: 'SPRITES',  ready: false },
  { id: 'story',    label: 'STORY',    ready: false },
  { id: 'pack',     label: 'PACK',     ready: false },
];

export default function EditorShell() {
  const [tab, setTab] = useState<Tab>('levels');

  return (
    <div
      style={{
        height: '100vh', width: '100vw', display: 'grid',
        gridTemplateColumns: '220px 1fr',
        fontFamily: 'var(--font-pixel, monospace)',
      }}
    >
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside
        style={{
          background: '#1a1c2c',
          borderRight: '2px solid #2d2f44',
          padding: '20px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        <div>
          <Link
            href="/"
            style={{ color: '#ef7d57', fontSize: 18, letterSpacing: '0.1em', textDecoration: 'none' }}
          >
            ◀ TERO
          </Link>
          <p style={{ marginTop: 6, fontSize: 10, color: '#c2c3c7' }}>STUDIO</p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => t.ready && setTab(t.id)}
              disabled={!t.ready}
              style={{
                textAlign: 'left',
                padding: '10px 12px',
                fontFamily: 'inherit',
                fontSize: 11,
                letterSpacing: '0.08em',
                background: tab === t.id ? '#29adff' : 'transparent',
                color: tab === t.id ? '#1a1c2c' : (t.ready ? '#fff1e8' : '#555567'),
                border: '1px solid ' + (tab === t.id ? '#29adff' : '#2d2f44'),
                cursor: t.ready ? 'pointer' : 'not-allowed',
                borderRadius: 4,
              }}
              aria-current={tab === t.id ? 'page' : undefined}
            >
              {t.label}
              {!t.ready && <span style={{ marginLeft: 8, fontSize: 9, color: '#555567' }}>·SOON</span>}
            </button>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', fontSize: 9, color: '#555567', lineHeight: 1.6 }}>
          <p>EDITS SAVE TO YOUR BROWSER.</p>
          <p style={{ marginTop: 6 }}>PHASE 1: FOUNDATION ✓<br/>PHASE 2: LEVELS ← HERE</p>
        </div>
      </aside>

      {/* ── Main panel ──────────────────────────────────────────────────────── */}
      <main style={{ overflow: 'hidden', position: 'relative' }}>
        {tab === 'levels' && <FieldEditor />}
        {tab !== 'levels' && (
          <div
            style={{
              height: '100%', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 14, color: '#c2c3c7', gap: 12,
            }}
          >
            <p>COMING IN A LATER PHASE.</p>
          </div>
        )}
      </main>
    </div>
  );
}
