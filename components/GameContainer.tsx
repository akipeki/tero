'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Heart, Volume2, VolumeX } from 'lucide-react';
import { Game } from '@/game/Game';
import { GameState, Action } from '@/game/types';
import { VIEWPORT_W, VIEWPORT_H } from '@/game/constants';
import type { HudData } from '@/game/types';

export default function GameContainer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef   = useRef<Game | null>(null);
  const wrapRef   = useRef<HTMLDivElement>(null);
  const [hud, setHud] = useState<HudData>({ lives: 3, isBig: false, state: GameState.TITLE });
  const [muted, setMuted] = useState(false);

  // ─── Init game ────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width  = VIEWPORT_W;
    canvas.height = VIEWPORT_H;
    const game = new Game(canvas);
    game.onHudUpdate = setHud;
    gameRef.current  = game;
    game.start();
    return () => { game.stop(); gameRef.current = null; };
  }, []);

  // ─── Scale canvas to fill container while keeping aspect ratio ───────────
  useEffect(() => {
    const wrap   = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const resize = () => {
      const scale = Math.min(wrap.clientWidth / VIEWPORT_W, wrap.clientHeight / VIEWPORT_H);
      canvas.style.width  = `${Math.floor(VIEWPORT_W * scale)}px`;
      canvas.style.height = `${Math.floor(VIEWPORT_H * scale)}px`;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  // ─── Input helpers ────────────────────────────────────────────────────────
  const mobileDown = useCallback((action: Action) => {
    gameRef.current?.audioManager.init();
    gameRef.current?.inputHandler.setMobile(action, true);
  }, []);
  const mobileUp = useCallback((action: Action) => {
    gameRef.current?.inputHandler.setMobile(action, false);
  }, []);

  const handleStart = () => {
    window.__enterPressed = true;
    gameRef.current?.audioManager.init();
  };
  const handleRetry = () => {
    window.__retryPressed = true;
    gameRef.current?.audioManager.init();
  };
  const handleMute = () => {
    gameRef.current?.audioManager.toggleMute();
    setMuted(m => !m);
  };

  const { state, lives, isBig } = hud;
  const isPlaying  = state === GameState.PLAYING;
  const isPaused   = state === GameState.PAUSED;
  const isTitle    = state === GameState.TITLE;
  const isGameOver = state === GameState.GAME_OVER;
  const isWin      = state === GameState.WIN;

  return (
    <div
      ref={wrapRef}
      className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden"
      style={{ touchAction: 'none' }}
    >
      {/* ── Game canvas (pixel art world) ── */}
      <canvas ref={canvasRef} />

      {/* ════════════════════════════════════════════════════════════════════
          All text/UI overlays are plain HTML — renders at native screen
          resolution so fonts are crisp at any screen size.
      ════════════════════════════════════════════════════════════════════ */}

      {/* ── TITLE SCREEN ── */}
      {isTitle && (
        <PixelOverlay>
          <p className="pixel-title text-5xl" style={{ color: '#ef7d57' }}>TERO</p>
          <p className="pixel-sub mt-6" style={{ color: '#fff1e8' }}>PRESS ENTER OR TAP TO PLAY</p>
          <p className="pixel-hint mt-4" style={{ color: '#a7f070' }}>
            ARROWS / WASD &nbsp;|&nbsp; SPACE = JUMP
          </p>
          <button className="pixel-btn mt-10" onClick={handleStart}>▶ PLAY</button>
        </PixelOverlay>
      )}

      {/* ── PAUSED ── */}
      {isPaused && (
        <PixelOverlay dim>
          <p className="pixel-title" style={{ color: '#fff1e8' }}>PAUSED</p>
          <p className="pixel-hint mt-6" style={{ color: '#c2c3c7' }}>ESC TO RESUME</p>
        </PixelOverlay>
      )}

      {/* ── GAME OVER ── */}
      {isGameOver && (
        <PixelOverlay dim style={{ background: 'rgba(10,0,0,0.82)' }}>
          <p className="pixel-title" style={{ color: '#ff004d' }}>GAME OVER</p>
          <p className="pixel-sub mt-4" style={{ color: '#fff1e8' }}>
            {'♥'.repeat(Math.max(0, lives))}{'♡'.repeat(Math.max(0, 3 - lives))}
          </p>
          <button className="pixel-btn mt-8" style={{ borderColor: '#ff004d', color: '#ff004d' }} onClick={handleRetry}>
            ↺ RETRY
          </button>
        </PixelOverlay>
      )}

      {/* ── WIN ── */}
      {isWin && (
        <PixelOverlay dim style={{ background: 'rgba(0,20,0,0.82)' }}>
          <p className="pixel-title" style={{ color: '#a7f070' }}>YOU WIN!</p>
          <p className="pixel-hint mt-6" style={{ color: '#fff1e8' }}>CONGRATULATIONS</p>
          <button className="pixel-btn mt-8" style={{ borderColor: '#a7f070', color: '#a7f070' }} onClick={handleStart}>
            ▶ PLAY AGAIN
          </button>
        </PixelOverlay>
      )}

      {/* ── HUD (lives + mute) ── */}
      {isPlaying && (
        <>
          {/* Character name + lives */}
          <div className="absolute top-3 left-4 flex items-center gap-2 select-none pointer-events-none"
               style={{ fontFamily: 'var(--font-pixel, monospace)', fontSize: 'clamp(9px, 1.6vw, 16px)' }}>
            <span style={{ color: isBig ? '#ff77a8' : '#29adff' }}>
              {isBig ? 'BIG TERO' : 'TERO'}
            </span>
            <span className="flex items-center gap-1" style={{ marginLeft: 6 }}>
              {Array.from({ length: lives }).map((_, i) => (
                <Heart
                  key={i}
                  size="1.2em"
                  fill={isBig ? '#ffcd75' : '#ff004d'}
                  color={isBig ? '#ffcd75' : '#ff004d'}
                />
              ))}
              {Array.from({ length: Math.max(0, 3 - lives) }).map((_, i) => (
                <Heart
                  key={`e${i}`}
                  size="1.2em"
                  fill="#3a3328"
                  color="#3a3328"
                />
              ))}
            </span>
          </div>

          {/* Mute button */}
          <button
            className="absolute top-3 right-4 flex items-center justify-center select-none"
            style={{
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,241,232,0.3)',
              borderRadius: 6,
              padding: '6px 8px',
              cursor: 'pointer',
              color: '#fff1e8',
            }}
            onClick={handleMute}
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted
              ? <VolumeX size={20} color="#fff1e8" />
              : <Volume2 size={20} color="#fff1e8" />
            }
          </button>
        </>
      )}

      {/* ── Mobile D-pad (shown during play) ── */}
      {isPlaying && (
        <>
          <div className="absolute bottom-5 left-4 flex gap-2 select-none">
            <MobileBtn onDown={() => mobileDown(Action.LEFT)} onUp={() => mobileUp(Action.LEFT)}>◀</MobileBtn>
            <MobileBtn onDown={() => mobileDown(Action.RIGHT)} onUp={() => mobileUp(Action.RIGHT)}>▶</MobileBtn>
          </div>
          <div className="absolute bottom-5 right-4 select-none">
            <MobileBtn large onDown={() => mobileDown(Action.JUMP)} onUp={() => mobileUp(Action.JUMP)}>▲</MobileBtn>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Overlay wrapper ──────────────────────────────────────────────────────────

function PixelOverlay({
  children,
  dim = false,
  style,
}: {
  children: React.ReactNode;
  dim?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center text-center px-4"
      style={{
        background: dim ? 'rgba(10,10,20,0.75)' : undefined,
        fontFamily: 'var(--font-pixel, monospace)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Mobile button ────────────────────────────────────────────────────────────

function MobileBtn({
  children, onDown, onUp, large = false,
}: {
  children: React.ReactNode;
  onDown: () => void;
  onUp: () => void;
  large?: boolean;
}) {
  const size = large ? 60 : 52;
  return (
    <button
      style={{
        width: size, height: size,
        fontFamily: 'var(--font-pixel, monospace)',
        fontSize: large ? 22 : 18,
        color: '#fff1e8',
        background: 'rgba(0,0,0,0.6)',
        border: '2px solid rgba(255,241,232,0.35)',
        borderRadius: 8,
        cursor: 'pointer',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); onDown(); }}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </button>
  );
}
