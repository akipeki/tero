'use client';

import { useLayoutEffect, useRef, type MutableRefObject } from 'react';
import type { StoryView } from '@/game/types';

/**
 * Dialogue box for story cards. The card itself arrives as a prop; the
 * typewriter progress arrives ~45×/s through `revealRef`, which writes to the
 * DOM directly so the rest of GameContainer doesn't re-render per letter.
 */
export default function StoryBox({
  view,
  revealRef,
  onAdvance,
  onSkip,
}: {
  view: StoryView;
  revealRef: MutableRefObject<((revealed: number) => void) | null>;
  onAdvance: () => void;
  onSkip: () => void;
}) {
  const shownRef = useRef<HTMLSpanElement>(null);
  const restRef  = useRef<HTMLSpanElement>(null);
  const nextRef  = useRef<HTMLSpanElement>(null);

  // useLayoutEffect: reset before paint so a new card never flashes the old text.
  useLayoutEffect(() => {
    const text = view.text;
    const reveal = (n: number) => {
      if (!shownRef.current || !restRef.current || !nextRef.current) return;
      shownRef.current.textContent = text.slice(0, n);
      // The unrevealed rest is laid out invisibly so the box never resizes.
      restRef.current.textContent  = text.slice(n);
      nextRef.current.style.visibility = n >= text.length ? 'visible' : 'hidden';
    };
    reveal(0);
    revealRef.current = reveal;
    return () => { if (revealRef.current === reveal) revealRef.current = null; };
  }, [view, revealRef]);

  return (
    <div
      className="absolute inset-x-0 bottom-0 flex justify-center select-none"
      style={{ padding: '0 3% 3%', fontFamily: 'var(--font-pixel, monospace)' }}
      onPointerDown={(e) => { e.preventDefault(); onAdvance(); }}
      role="dialog"
      aria-live="polite"
      aria-label={view.speaker ? `${view.speaker} says` : 'Story'}
    >
      <div
        style={{
          display: 'flex',
          gap: '3%',
          alignItems: 'flex-start',
          width: '100%',
          background: 'rgba(26,28,44,0.94)',
          border: '3px solid #fff1e8',
          boxShadow: '0 0 0 3px #1a1c2c',
          padding: 'clamp(8px, 2vw, 18px)',
          cursor: 'pointer',
        }}
      >
        {view.portraitSrc && (
          <div
            aria-hidden
            style={{
              flexShrink: 0,
              width: 'clamp(40px, 9vw, 96px)',
              aspectRatio: '1',
              border: '2px solid #5d6a8a',
              background: `#29366f url(${view.portraitSrc}) no-repeat 0 0 / ${(view.portraitFrames ?? 1) * 100}% 100%`,
            }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          {view.speaker && (
            <p style={{ color: '#ffcd75', fontSize: 'clamp(8px, 1.4vw, 14px)', marginBottom: '0.8em' }}>
              {view.speaker}
            </p>
          )}
          <p
            style={{
              color: '#fff1e8',
              fontSize: 'clamp(9px, 1.6vw, 16px)',
              lineHeight: 1.7,
              whiteSpace: 'pre-line',
              fontStyle: view.speaker ? undefined : 'italic',
            }}
          >
            <span ref={shownRef} />
            <span ref={restRef} style={{ visibility: 'hidden' }} />
          </p>
          <div
            className="flex justify-between items-center"
            style={{ marginTop: '0.8em', fontSize: 'clamp(7px, 1.1vw, 11px)', color: '#94b0c2' }}
          >
            <button
              type="button"
              onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); onSkip(); }}
              style={{ fontFamily: 'inherit', color: 'inherit', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              aria-label="Skip story"
            >
              ESC SKIP
            </button>
            <span>
              {view.index + 1}/{view.total}{' '}
              <span ref={nextRef} style={{ color: '#a7f070' }}>▶ ENTER</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
