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
      {/* Windows 3.1-style message box */}
      <div style={{ width: '100%', background: WIN.face, cursor: 'pointer', ...bevel(false), boxShadow: '3px 3px 0 rgba(0,0,0,0.45)' }}>
        <div
          className="flex justify-between items-center"
          style={{
            background: WIN.title, color: '#ffffff',
            fontSize: 'clamp(7px, 1.2vw, 12px)', padding: '0.45em 0.7em', letterSpacing: '0.05em',
          }}
        >
          <span>{view.speaker ?? 'MEMO'}</span>
          <span aria-hidden style={{ opacity: 0.8 }}>{view.index + 1}/{view.total}</span>
        </div>

        <div style={{ display: 'flex', gap: '3%', alignItems: 'flex-start', padding: 'clamp(8px, 1.8vw, 16px)' }}>
          {view.portraitSrc && (
            <div
              aria-hidden
              style={{
                flexShrink: 0,
                width: 'clamp(40px, 9vw, 96px)',
                aspectRatio: '1',
                imageRendering: 'pixelated',
                ...bevel(true),
                background: `#008080 url(${view.portraitSrc}) no-repeat`,
                ...portraitCrop(view.portraitFrames ?? 1),
              }}
            />
          )}
          <p
            style={{
              flex: 1,
              minWidth: 0,
              color: '#000000',
              fontSize: 'clamp(9px, 1.6vw, 16px)',
              lineHeight: 1.7,
              whiteSpace: 'pre-line',
              fontStyle: view.speaker ? undefined : 'italic',
            }}
          >
            <span ref={shownRef} />
            <span ref={restRef} style={{ visibility: 'hidden' }} />
          </p>
        </div>

        <div
          className="flex justify-end"
          style={{ gap: '0.8em', padding: '0 clamp(8px, 1.8vw, 16px) clamp(8px, 1.8vw, 16px)', fontSize: 'clamp(7px, 1.1vw, 11px)' }}
        >
          <button
            type="button"
            onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); onSkip(); }}
            style={winButton}
            aria-label="Skip story"
          >
            CANCEL (ESC)
          </button>
          <span ref={nextRef} style={{ ...winButton, fontWeight: 'bold', outline: '1px solid #000', outlineOffset: '-4px' }}>
            OK ▶
          </span>
        </div>
      </div>
    </div>
  );
}

/** Character sprites are full-body; zoom the first frame 2× onto the head,
 *  which sits in the upper-middle of the frame. */
const PORTRAIT_ZOOM = 2;
const HEAD_LEFT = 0.34;  // left edge of the crop, as a fraction of one frame
const HEAD_TOP  = 0.1;
function portraitCrop(frames: number): React.CSSProperties {
  // background-position % aligns p% of the image with p% of the box:
  // offset = p * (imageSize - boxSize), solved for p.
  const x = (HEAD_LEFT * PORTRAIT_ZOOM) / (frames * PORTRAIT_ZOOM - 1);
  const y = (HEAD_TOP * PORTRAIT_ZOOM) / (PORTRAIT_ZOOM - 1);
  return {
    backgroundSize: `${frames * PORTRAIT_ZOOM * 100}% ${PORTRAIT_ZOOM * 100}%`,
    backgroundPosition: `${x * 100}% ${y * 100}%`,
  };
}

const WIN = {
  face:   '#c0c0c0',
  light:  '#ffffff',
  shadow: '#808080',
  dark:   '#000000',
  title:  '#000080',
} as const;

/** Classic 3D bevel: raised (buttons, windows) or sunken (fields, insets). */
function bevel(sunken: boolean): React.CSSProperties {
  const [tl, br] = sunken ? [WIN.shadow, WIN.light] : [WIN.light, WIN.shadow];
  return {
    borderStyle: 'solid',
    borderWidth: 2,
    borderColor: `${tl} ${br} ${br} ${tl}`,
    outline: `1px solid ${WIN.dark}`,
  };
}

const winButton: React.CSSProperties = {
  fontFamily: 'inherit',
  fontSize: 'inherit',
  color: '#000000',
  background: WIN.face,
  padding: '0.6em 1.1em',
  cursor: 'pointer',
  ...bevel(false),
};
