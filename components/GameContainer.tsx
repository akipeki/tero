'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Game } from '@/game/Game';
import { GameState, Action } from '@/game/types';
import { VIEWPORT_W, VIEWPORT_H, TILE_SIZE, STARTING_LIVES, BIG_SPRITE_SCALE } from '@/game/constants';
import type { HudData, PlayerRenderData, RunStats, StoryView } from '@/game/types';
import StoryBox from './StoryBox';
import { GAME_SUBTITLE, GAME_TITLE_LINES } from '@/game/title';
import { loadSettings, saveSettings } from '@/game/Settings';
import { framePaths } from '@/game/render/sprites/PlayerSpriteAssets';

interface EndScreenPayload {
  state: 'WIN' | 'GAME_OVER';
  stats: RunStats;
  best: { timeMs: number; score: number } | null;
  newBest: boolean;
  levelId: string;
  levelName: string;
  hasNextLevel: boolean;
}

// ─── Sprite display tuning ──────────────────────────────────────────────────
// Sprites render as squares 2 tiles tall. Bump SPRITE_TILES if you want a
// chunkier character — physics hitbox is independent (SMALL_W/H in Player.ts).
const SPRITE_TILES = 2;

/** Source frame widths, filled in as the player images preload. Frames wider
 *  than the sprite's world size are hi-res art and get smooth filtering;
 *  narrower ones are native pixel art and stay pixelated. */
const frameWidths = new Map<string, number>();
function preloadPlayerFrames(): void {
  for (const def of Object.values(framePaths)) {
    if (frameWidths.has(def.src)) continue;
    const img = new Image();
    img.onload = () => frameWidths.set(def.src, img.naturalWidth / def.frames);
    img.src = def.src;
  }
}
function imageRenderingFor(src: string): string {
  const w = frameWidths.get(src);
  // Unknown yet → assume hi-res; shrinking with nearest-neighbour is what
  // made detailed sprites shimmer.
  return w === undefined || w > TILE_SIZE * SPRITE_TILES ? 'auto' : 'pixelated';
}

// Detect touch-capable devices once, server-safe.
function detectTouch(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || (navigator.maxTouchPoints ?? 0) > 0;
}

function formatTime(ms: number): string {
  const total = Math.floor(ms / 10);
  const m = Math.floor(total / 6000);
  const s = Math.floor((total % 6000) / 100);
  const cs = total % 100;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

export default function GameContainer() {
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const gameRef        = useRef<Game | null>(null);
  const wrapRef        = useRef<HTMLDivElement>(null);
  const viewportRef    = useRef<HTMLDivElement>(null);
  const playerDivRef   = useRef<HTMLDivElement>(null);
  const canvasScaleRef = useRef(1);
  const lastSrcRef     = useRef<string>('');
  const reducedMotionRef = useRef(false);
  const storyRevealRef = useRef<((revealed: number) => void) | null>(null);
  const [story, setStory] = useState<StoryView | null>(null);

  const [hud, setHud] = useState<HudData>({
    lives: STARTING_LIVES, maxLives: STARTING_LIVES, isBig: false, coins: 0, state: GameState.TITLE,
  });
  const initialSettings = useMemo(() => loadSettings(), []);
  const [muted, setMuted]   = useState(initialSettings.muted);
  const [volume, setVolume] = useState(initialSettings.volume);
  const [endScreen, setEndScreen] = useState<EndScreenPayload | null>(null);
  const [isTouch] = useState(detectTouch);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [score, setScore] = useState(0);
  /** Ephemeral "+50 CHAIN" floaters above the HUD. */
  const [floaters, setFloaters] = useState<{ id: number; text: string }[]>([]);
  const floaterIdRef = useRef(0);
  const pushFloater = useCallback((text: string) => {
    const id = ++floaterIdRef.current;
    setFloaters((cur) => [...cur, { id, text }]);
    setTimeout(() => setFloaters((cur) => cur.filter((f) => f.id !== id)), 900);
  }, []);

  // ─── Init game ────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width  = VIEWPORT_W;
    canvas.height = VIEWPORT_H;
    const game = new Game(canvas);
    game.onHudUpdate = setHud;
    game.onEndScreen = setEndScreen;
    game.onScore = (s) => setScore(s);
    game.onStory = setStory;
    game.onStoryReveal = (n) => storyRevealRef.current?.(n);
    game.onChain = (chainSize, bonus) => {
      if (bonus > 0) pushFloater(`+${bonus} CHAIN×${chainSize}`);
    };

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = mq.matches;
    const onMq = () => { reducedMotionRef.current = mq.matches; };
    mq.addEventListener('change', onMq);

    preloadPlayerFrames();
    game.onPlayerRender = (data: PlayerRenderData | null) => {
      const div = playerDivRef.current;
      if (!div) return;

      if (!data) {
        div.style.display = 'none';
        return;
      }

      const s = canvasScaleRef.current;
      const { screenX, screenY, bobY, facingRight, src, frames, frameIdx, shouldFlash } = data;
      const still = reducedMotionRef.current;
      const scaleX = still ? 1 : data.scaleX;
      const scaleY = still ? 1 : data.scaleY;

      // Snap to the physical pixel grid, not the game grid: moves stay smooth
      // at any canvas scale while edges never straddle two device pixels.
      const dpr  = window.devicePixelRatio || 1;
      const snap = (v: number) => Math.round(v * dpr) / dpr;
      const spriteSize = TILE_SIZE * SPRITE_TILES * s * (data.big ? BIG_SPRITE_SCALE : 1);
      const cx    = snap(screenX * s);
      const footY = snap((screenY + (still ? 0 : bobY)) * s);

      div.style.transform = [
        `translate3d(${cx}px,${footY}px,0)`,
        `scaleX(${facingRight ? 1 : -1})`,
        `scale(${scaleX},${scaleY})`,
        `translate(${-spriteSize / 2}px,${-spriteSize}px)`,
      ].join(' ');

      div.style.width   = `${spriteSize}px`;
      div.style.height  = `${spriteSize}px`;
      div.style.opacity = shouldFlash ? '0.65' : '1';
      div.style.display = 'block';

      // Single images and strips share one path: a strip is just frames > 1.
      if (lastSrcRef.current !== src) {
        div.style.backgroundImage = `url(${src})`;
        lastSrcRef.current = src;
      }
      div.style.imageRendering     = imageRenderingFor(src);
      div.style.backgroundSize     = `${frames * spriteSize}px ${spriteSize}px`;
      div.style.backgroundPosition = `${-frameIdx * spriteSize}px 0`;
    };

    gameRef.current = game;
    game.start();

    // Honour ?level=<id> — jumps straight into PLAYING with that level.
    // Used by the Field Editor's Test ▶ button: /game?level=u_level_xxx.
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const levelId = params.get('level');
      if (levelId) game.selectLevel(levelId);
    }

    // Apply initial volume
    // (AudioManager stores muted flag separately; volume slider scales master gain via setMuted equivalent.)
    return () => {
      mq.removeEventListener('change', onMq);
      game.stop();
      gameRef.current = null;
    };
    // pushFloater is a stable useCallback ref; safe to omit from deps without
    // re-creating the game instance on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reduced-motion: pause screen shake by toggling a global flag on the canvas.
  // (Not wired all the way through — kept lightweight; future: pass into Game.)

  // Volume effect — set the master gain scale directly (proportional, not just mute).
  useEffect(() => {
    const g = gameRef.current?.audioManager;
    if (!g) return;
    if (muted || volume === 0) {
      g.setMuted(true);
    } else {
      g.setMuted(false);
      g.setMasterVolume(volume);
    }
    saveSettings({ muted, volume });
  }, [muted, volume]);

  // Fullscreen state listener
  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  // ─── Scale canvas to fill container while keeping aspect ratio ───────────
  useEffect(() => {
    const wrap     = wrapRef.current;
    const canvas   = canvasRef.current;
    const viewport = viewportRef.current;
    if (!wrap || !canvas || !viewport) return;
    const resize = () => {
      const scale = Math.min(wrap.clientWidth / VIEWPORT_W, wrap.clientHeight / VIEWPORT_H);
      canvasScaleRef.current = scale;
      const w = Math.floor(VIEWPORT_W * scale);
      const h = Math.floor(VIEWPORT_H * scale);
      canvas.style.width  = `${w}px`;
      canvas.style.height = `${h}px`;
      viewport.style.width  = `${w}px`;
      viewport.style.height = `${h}px`;
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

  const handleStart = useCallback(() => {
    gameRef.current?.audioManager.init();
    gameRef.current?.signal('enter');
  }, []);
  const handleRetry = useCallback(() => {
    gameRef.current?.audioManager.init();
    gameRef.current?.signal('retry');
  }, []);
  const handleNext = useCallback(() => {
    gameRef.current?.audioManager.init();
    gameRef.current?.signal('enter');
  }, []);
  const handleStorySkip = useCallback(() => {
    gameRef.current?.signal('skip');
  }, []);
  const handleMute = useCallback(() => setMuted(m => !m), []);
  const handlePauseToggle = useCallback(() => {
    const game = gameRef.current;
    if (!game) return;
    game.inputHandler.setMobile(Action.PAUSE, true);
    requestAnimationFrame(() => game.inputHandler.setMobile(Action.PAUSE, false));
  }, []);

  const handleFullscreen = useCallback(async () => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await wrap.requestFullscreen?.();
  }, []);

  const { state, lives, maxLives, isBig, coins } = hud;
  const isPlaying  = state === GameState.PLAYING;
  const isPaused   = state === GameState.PAUSED;
  const isTitle    = state === GameState.TITLE;
  const isGameOver = state === GameState.GAME_OVER;
  const isWin      = state === GameState.WIN;

  const livesArr = useMemo(
    () => Array.from({ length: maxLives }).map((_, i) => i < lives),
    [lives, maxLives],
  );

  return (
    <div
      ref={wrapRef}
      className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden"
      style={{ touchAction: 'none' }}
    >
      <div ref={viewportRef} style={{ position: 'relative', flexShrink: 0 }}>
        <canvas ref={canvasRef} style={{ imageRendering: 'pixelated', display: 'block' }} />

        <div
          ref={playerDivRef}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            transformOrigin: '0 0',
            pointerEvents: 'none',
            display: 'none',
            willChange: 'transform',
            backgroundRepeat: 'no-repeat',
          }}
          role="img"
          aria-label="player"
        />

        {/* ── STORY ── inside the viewport so the box sits on the game area */}
        {story && (
          <StoryBox
            view={story}
            revealRef={storyRevealRef}
            onAdvance={handleNext}
            onSkip={handleStorySkip}
          />
        )}
      </div>

      {/* ── TITLE ── */}
      {isTitle && (
        <PixelOverlay dim>
          <h1 className="pixel-title" style={{ color: '#6cc24a', fontSize: 'clamp(26px, 6.5vw, 72px)', lineHeight: 1.15 }}>
            {GAME_TITLE_LINES.map((line) => <span key={line} className="block">{line}</span>)}
          </h1>
          <p className="pixel-sub mt-3" style={{ color: '#ffd23f', letterSpacing: '0.2em' }}>{GAME_SUBTITLE}</p>
          <p className="pixel-sub mt-6" style={{ color: '#fff1e8' }}>PRESS ENTER OR TAP TO PLAY</p>
          <p className="pixel-hint mt-4" style={{ color: '#a7f070' }}>
            ARROWS / WASD &nbsp;|&nbsp; SPACE = JUMP &nbsp;|&nbsp; DOWN = DUCK &nbsp;|&nbsp; M = MUTE
          </p>
          <button className="pixel-btn mt-10" onClick={handleStart} aria-label="Start game">▶ PLAY</button>
        </PixelOverlay>
      )}

      {/* ── PAUSED ── */}
      {isPaused && (
        <PixelOverlay dim>
          <p className="pixel-title" style={{ color: '#fff1e8' }}>PAUSED</p>
          <p className="pixel-hint mt-6" style={{ color: '#c2c3c7' }}>ESC / P TO RESUME</p>
          <div className="mt-6 flex flex-col items-center gap-3">
            <button className="pixel-btn" onClick={handlePauseToggle} aria-label="Resume">▶ RESUME</button>
            <button className="pixel-btn" onClick={handleRetry} aria-label="Restart level">↺ RESTART</button>
            <button
              className="pixel-btn"
              onClick={() => { gameRef.current?.signal('quit'); }}
              aria-label="Back to title"
            >
              ⌂ TITLE
            </button>
          </div>
        </PixelOverlay>
      )}

      {/* ── GAME OVER ── */}
      {isGameOver && endScreen && (
        <PixelOverlay dim style={{ background: 'rgba(10,0,0,0.82)' }}>
          <p className="pixel-title" style={{ color: '#ff004d' }}>GAME OVER</p>
          <StatsBlock stats={endScreen.stats} best={endScreen.best} />
          <button
            className="pixel-btn mt-8"
            style={{ borderColor: '#ff004d', color: '#ff004d' }}
            onClick={handleRetry}
            aria-label="Retry level"
          >
            ↺ RETRY
          </button>
        </PixelOverlay>
      )}

      {/* ── WIN ── */}
      {isWin && endScreen && (
        <PixelOverlay dim style={{ background: 'rgba(0,20,0,0.82)' }}>
          <p className="pixel-title" style={{ color: '#a7f070' }}>
            {endScreen.hasNextLevel ? 'LEVEL CLEAR!' : 'YOU WIN!'}
          </p>
          <p className="pixel-hint mt-2" style={{ color: '#fff1e8' }}>{endScreen.levelName}</p>
          {endScreen.newBest && (
            <p className="pixel-hint mt-2" style={{ color: '#ffcd75' }}>★ NEW BEST ★</p>
          )}
          <StatsBlock stats={endScreen.stats} best={endScreen.best} />
          <button
            className="pixel-btn mt-8"
            style={{ borderColor: '#a7f070', color: '#a7f070' }}
            onClick={handleNext}
            aria-label={endScreen.hasNextLevel ? 'Next level' : 'Back to title'}
          >
            {endScreen.hasNextLevel ? '▶ NEXT' : '▶ PLAY AGAIN'}
          </button>
        </PixelOverlay>
      )}

      {/* ── HUD ── */}
      {isPlaying && (
        <>
          <div
            className="absolute top-3 left-4 flex items-center gap-3 select-none pointer-events-none"
            style={{ fontFamily: 'var(--font-pixel, monospace)', fontSize: 'clamp(9px, 1.6vw, 16px)' }}
          >
            <span style={{ color: isBig ? '#ff77a8' : '#29adff' }}>
              {isBig ? 'BIG TERO' : 'TERO'}
            </span>
            <span className="flex items-center gap-1">
              {livesArr.map((alive, i) => (
                <PixelHeart key={i} filled={alive} big={isBig} />
              ))}
            </span>
            <span style={{ color: '#ffcd75' }}>● {coins}</span>
            <span style={{ color: '#fff1e8' }}>{score.toString().padStart(5, '0')}</span>
          </div>

          {/* Chain bonus floaters */}
          <div
            className="absolute top-12 left-4 pointer-events-none select-none"
            style={{ fontFamily: 'var(--font-pixel, monospace)', fontSize: 'clamp(9px, 1.4vw, 14px)' }}
            aria-live="polite"
          >
            {floaters.map((f) => (
              <p
                key={f.id}
                style={{
                  color: '#a7f070',
                  textShadow: '2px 2px 0 #000',
                  margin: 0,
                  animation: 'tero-float 0.9s ease-out forwards',
                }}
              >
                {f.text}
              </p>
            ))}
          </div>

          {/* Top-right controls cluster */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <IconButton onClick={handleFullscreen} ariaLabel={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
              {isFullscreen ? '⤡' : '⤢'}
            </IconButton>
            <IconButton onClick={handleMute} ariaLabel={muted ? 'Unmute' : 'Mute'}>
              {muted ? '🔇' : '🔊'}
            </IconButton>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => { setMuted(false); setVolume(parseFloat(e.target.value)); }}
              aria-label="Volume"
              style={{ width: 64, accentColor: '#ef7d57' }}
            />
          </div>
        </>
      )}

      {/* ── Mobile D-pad (only on touch devices) ── */}
      {isPlaying && isTouch && (
        <>
          <div className="absolute bottom-5 left-4 flex gap-2 select-none">
            <MobileBtn onDown={() => mobileDown(Action.LEFT)} onUp={() => mobileUp(Action.LEFT)}>◀</MobileBtn>
            <MobileBtn onDown={() => mobileDown(Action.RIGHT)} onUp={() => mobileUp(Action.RIGHT)}>▶</MobileBtn>
            <MobileBtn onDown={() => mobileDown(Action.DOWN)} onUp={() => mobileUp(Action.DOWN)}>▼</MobileBtn>
          </div>
          <div className="absolute bottom-5 right-4 flex gap-2 select-none">
            <MobileBtn onDown={handlePauseToggle} onUp={() => {}}>‖</MobileBtn>
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

// ─── End-of-run stat block ────────────────────────────────────────────────────
function StatsBlock({
  stats, best,
}: {
  stats: RunStats;
  best: { timeMs: number; score: number } | null;
}) {
  return (
    <div className="mt-6" style={{ fontFamily: 'var(--font-pixel, monospace)' }}>
      <p className="pixel-sub" style={{ color: '#fff1e8' }}>
        TIME&nbsp;{formatTime(stats.timeMs)}
      </p>
      <p className="pixel-sub mt-2" style={{ color: '#ffcd75' }}>
        ● {stats.coins} &nbsp;|&nbsp; KO {stats.enemiesStomped}
      </p>
      {best && (
        <p className="pixel-hint mt-3" style={{ color: '#c2c3c7' }}>
          BEST&nbsp;{formatTime(best.timeMs)}&nbsp;·&nbsp;{best.score}
        </p>
      )}
    </div>
  );
}

// ─── Pixel-art heart (replaces lucide-react Heart for visual consistency) ─────
function PixelHeart({ filled, big }: { filled: boolean; big: boolean }) {
  const colorFill = big ? '#ffcd75' : '#ff004d';
  const colorEmpty = '#3a3328';
  const c = filled ? colorFill : colorEmpty;
  return (
    <svg
      width="1.1em"
      height="1.1em"
      viewBox="0 0 8 7"
      shapeRendering="crispEdges"
      style={{ verticalAlign: 'middle' }}
      aria-hidden="true"
    >
      {/* row 0 */}
      <rect x="1" y="0" width="2" height="1" fill={c} />
      <rect x="5" y="0" width="2" height="1" fill={c} />
      {/* row 1 */}
      <rect x="0" y="1" width="8" height="1" fill={c} />
      {/* row 2 */}
      <rect x="0" y="2" width="8" height="1" fill={c} />
      {/* row 3 */}
      <rect x="1" y="3" width="6" height="1" fill={c} />
      {/* row 4 */}
      <rect x="2" y="4" width="4" height="1" fill={c} />
      {/* row 5 */}
      <rect x="3" y="5" width="2" height="1" fill={c} />
    </svg>
  );
}

// ─── Icon button used in the HUD ──────────────────────────────────────────────
function IconButton({
  children, onClick, ariaLabel,
}: {
  children: React.ReactNode;
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      aria-label={ariaLabel}
      onClick={onClick}
      style={{
        background: 'rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,241,232,0.3)',
        borderRadius: 6,
        padding: '4px 8px',
        cursor: 'pointer',
        color: '#fff1e8',
        fontSize: 16,
        lineHeight: 1,
      }}
    >
      {children}
    </button>
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
      aria-label="control"
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
        touchAction: 'none',
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
