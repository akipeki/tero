'use client';

import { useEffect, useRef, useState, useCallback, useMemo, useSyncExternalStore } from 'react';
import { Game, type FinalRun } from '@/game/Game';
import { renderShareCard, shareText } from '@/game/ShareCard';
import { formatMs, unlocks } from '@/game/Run';
import { GameState, Action } from '@/game/types';
import { VIEWPORT_W, VIEWPORT_H, TILE_SIZE, STARTING_LIVES, BIG_SPRITE_SCALE, TANTRUM_MAX } from '@/game/constants';
import type { HudData, PlayerRenderData, RunStats, StoryView } from '@/game/types';
import StoryBox from './StoryBox';
import { GAME_SUBTITLE, GAME_TITLE_LINES } from '@/game/title';
import { loadSettings, saveSettings } from '@/game/Settings';
import { framePaths } from '@/game/render/sprites/PlayerSpriteAssets';
import { initCustomSprites } from '@/game/render/customImages';
import { drawHideBox } from '@/game/render/characters/humans';

let hideBoxCache = '';
/** The cardboard box as a data URL, drawn once by its pixel rig. */
function hideBoxUrl(): string {
  if (!hideBoxCache) hideBoxCache = drawHideBox().toCanvas().toDataURL();
  return hideBoxCache;
}

interface EndScreenPayload {
  state: 'WIN' | 'GAME_OVER';
  cause?: string;
  final?: FinalRun;
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
  /** Tero hiding (ducking still) is a cardboard box. */
  const boxDivRef      = useRef<HTMLDivElement>(null);
  const canvasScaleRef = useRef(1);
  const lastSrcRef     = useRef<string>('');
  const reducedMotionRef = useRef(false);
  const storyRevealRef = useRef<((revealed: number) => void) | null>(null);
  const [story, setStory] = useState<StoryView | null>(null);

  const [hud, setHud] = useState<HudData>({
    lives: STARTING_LIVES, maxLives: STARTING_LIVES, isBig: false, coins: 0, state: GameState.TITLE,
    rage: 0, tantrum: false, sentHome: 0, boss: null, countdown: null, runMs: 0, assist: false, grenades: 0,
  });
  /** The job application window (Floor 6). */
  const [quizOpen, setQuizOpen] = useState(false);
  /** Big centre-screen shout ("TANTRUM!!"); the key restarts the animation. */
  const [callout, setCallout] = useState<{ id: number; text: string } | null>(null);
  const initialSettings = useMemo(() => loadSettings(), []);
  const [muted, setMuted]   = useState(initialSettings.muted);
  const [volume, setVolume] = useState(initialSettings.volume);
  const [endScreen, setEndScreen] = useState<EndScreenPayload | null>(null);
  const [isTouch] = useState(detectTouch);
  const [isFullscreen, setIsFullscreen] = useState(false);
  /** Speedrun timer in the HUD (T toggles it; remembered). */
  const [showTimer, setShowTimer] = useState(initialSettings.showTimer ?? false);
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
    game.onQuiz = setQuizOpen;
    game.onStoryReveal = (n) => storyRevealRef.current?.(n);
    game.onChain = (chainSize, bonus) => {
      if (bonus > 0) pushFloater(`+${bonus} CHAIN×${chainSize}`);
    };
    let calloutTimer: ReturnType<typeof setTimeout> | null = null;
    game.onCallout = (text) => {
      const id = Date.now();
      setCallout({ id, text });
      if (calloutTimer) clearTimeout(calloutTimer);
      calloutTimer = setTimeout(() => setCallout(null), 1600);
    };

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = mq.matches;
    const onMq = () => { reducedMotionRef.current = mq.matches; };
    mq.addEventListener('change', onMq);

    preloadPlayerFrames();
    // Your own images from game/customSprites.ts; the player's frame list is
    // updated when they load, so preload again for the new files.
    initCustomSprites().then(preloadPlayerFrames);
    game.onPlayerRender = (data: PlayerRenderData | null) => {
      const div = playerDivRef.current;
      if (!div) return;

      const box = boxDivRef.current;
      if (!data) {
        div.style.display = 'none';
        if (box) box.style.display = 'none';
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

      if (box) {
        if (!box.style.backgroundImage) box.style.backgroundImage = `url(${hideBoxUrl()})`;
        box.style.display = data.hiding ? 'block' : 'none';
        if (data.hiding) {
          box.style.width  = `${34 * s}px`;
          box.style.height = `${24 * s}px`;
          box.style.transform = `translate3d(${snap(cx - 17 * s)}px,${snap(footY - 24 * s)}px,0)`;
          div.style.display = 'none';
          return;
        }
      }

      div.style.transform = [
        `translate3d(${cx}px,${footY}px,0)`,
        `scaleX(${facingRight ? 1 : -1})`,
        `scale(${scaleX},${scaleY})`,
        `translate(${-spriteSize / 2}px,${-spriteSize}px)`,
      ].join(' ');

      div.style.width   = `${spriteSize}px`;
      div.style.height  = `${spriteSize}px`;
      div.style.opacity = shouldFlash ? '0.65' : '1';
      // Tantrum: red-hot glow (static under reduced motion — no flicker).
      div.style.filter = data.tantrum
        ? `drop-shadow(0 0 ${still ? 3 : 2 + Math.round(Math.random() * 3)}px #ff3b1f) saturate(1.5) brightness(1.08)`
        : data.faxed ? 'grayscale(1) contrast(1.8) brightness(1.1)'
        : '';
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
    const onLeave = () => game.recordQuit();
    window.addEventListener('pagehide', onLeave);

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
      window.removeEventListener('pagehide', onLeave);
      game.recordQuit();
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

  // T toggles the speedrun timer.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || (e.key !== 't' && e.key !== 'T')) return;
      setShowTimer((v) => { saveSettings({ showTimer: !v }); return !v; });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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

  const { state, lives, maxLives, isBig, coins, rage, tantrum, sentHome, boss, countdown, runMs, assist, grenades } = hud;
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

        <div
          ref={boxDivRef}
          style={{
            position: 'absolute', left: 0, top: 0, display: 'none', pointerEvents: 'none',
            backgroundSize: '100% 100%', imageRendering: 'pixelated', willChange: 'transform',
          }}
          role="img"
          aria-label="Tero hiding in a cardboard box"
        />

        {/* ── TANTRUM ── red edges while Tero rages */}
        {tantrum && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: 'inset 0 0 60px 12px rgba(255,40,20,0.55)',
              animation: 'tero-pulse 0.35s ease-in-out infinite alternate',
            }}
          />
        )}

        {/* ── CALLOUT ── "TANTRUM READY!", "TANTRUM!!", "...hic." */}
        {callout && (
          <p
            key={callout.id}
            className="absolute left-0 right-0 text-center pointer-events-none select-none"
            role="status"
            style={{
              top: '22%',
              fontFamily: 'var(--font-pixel, monospace)',
              fontSize: callout.text.startsWith('TANTRUM!!') ? 'clamp(20px, 5vw, 52px)' : 'clamp(11px, 2.4vw, 24px)',
              color: callout.text.startsWith('...') ? '#fff1e8' : '#ffd23f',
              textShadow: '3px 3px 0 #d83b3b, 5px 5px 0 #000',
              animation: 'tero-callout 1.5s ease-out',
              margin: 0,
            }}
          >
            {callout.text}
          </p>
        )}

        {/* ── JOB APPLICATION ── */}
        {quizOpen && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(10,10,20,0.55)' }}>
            <JobApplication
              onSound={(k) => gameRef.current?.quizSound(k)}
              onDone={(wrong) => gameRef.current?.quizDone(wrong)}
            />
          </div>
        )}

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
            ARROWS / WASD &nbsp;|&nbsp; SPACE = JUMP &nbsp;|&nbsp; DOWN = HIDE &nbsp;|&nbsp; X = FIRE &nbsp;|&nbsp; C = DADA! &nbsp;|&nbsp; G = GRENADE &nbsp;|&nbsp; M = MUTE &nbsp;|&nbsp; T = TIMER
          </p>
          <button className="pixel-btn mt-10" onClick={handleStart} aria-label="Start game">▶ PLAY</button>
          <div className="flex flex-wrap justify-center gap-3">
            <ModeToggle
              setting="assist" label="♥ BRING YOUR KID TO WORK DAY" color="#a7f070"
              onChange={(on) => gameRef.current?.setAssist(on)}
            />
            <CasualFridayToggle />
          </div>
        </PixelOverlay>
      )}

      {/* ── PAUSED: a Windows 95 dialog ── */}
      {isPaused && (
        <PixelOverlay dim>
          <Win95 title="PAUSED.EXE" onClose={handlePauseToggle}>
            <p style={{ margin: '4px 0 14px', lineHeight: 1.45 }}>
              ⓘ&nbsp; This game has performed a legal operation<br />and has been paused. Press ESC to resume.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <button style={W95_BTN} onClick={handlePauseToggle} aria-label="Resume">Resume</button>
              <button style={W95_BTN} onClick={handleRetry} aria-label="Restart level">Restart floor</button>
              <ModeToggle
                variant="win95" setting="assist" label="Kid mode" color="#1b5e20"
                onChange={(on) => gameRef.current?.setAssist(on)}
              />
              <QuitButton onQuit={() => gameRef.current?.signal('quit')} />
            </div>
          </Win95>
        </PixelOverlay>
      )}

      {/* ── GAME OVER: the HR exit interview ── */}
      {isGameOver && endScreen && (
        <PixelOverlay dim style={{ background: 'rgba(10,0,0,0.82)' }}>
          <ExitInterview stats={endScreen.stats} cause={endScreen.cause} onRetry={handleRetry} />
        </PixelOverlay>
      )}

      {/* ── THE END: the whole run, and a card to share ── */}
      {isWin && endScreen?.final && (
        <FinalScreen run={endScreen.final} onAgain={handleNext} />
      )}

      {/* ── WIN ── */}
      {isWin && endScreen && !endScreen.final && (
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
            <TantrumMeter rage={rage} tantrum={tantrum} />
            {assist && <span style={{ color: '#a7f070' }} title="Bring Your Kid to Work Day: no lives lost">♥ KID</span>}
            {grenades > 0 && <span style={{ color: '#ffd23f' }} title="A hand grenade full of resignation letters. G to throw.">💣 G</span>}
            <span style={{ color: '#a7f070' }} title="Workers sent home to their kids">⌂ {sentHome}</span>
          </div>

          {boss && <BossBar boss={boss} />}
          {showTimer && (
            <p
              className="absolute right-4 select-none pointer-events-none"
              style={{ top: 44, margin: 0, fontFamily: 'var(--font-pixel, monospace)', fontSize: 'clamp(8px, 1.4vw, 13px)', color: '#a7f070', textShadow: '2px 2px 0 #000' }}
              aria-label="Run time"
            >
              RUN {formatMs(runMs)}
            </p>
          )}
          {countdown !== null && (
            <p
              className="absolute left-1/2 -translate-x-1/2 select-none pointer-events-none"
              style={{
                top: 40, margin: 0, fontFamily: 'var(--font-pixel, monospace)',
                fontSize: 'clamp(10px, 2vw, 20px)', textShadow: '2px 2px 0 #000',
                color: countdown <= 15 ? '#ff3b1f' : '#ffd23f',
              }}
              role="timer"
            >
              WEEKEND IN {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
            </p>
          )}

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
            <MobileBtn onDown={() => mobileDown(Action.CALL)} onUp={() => mobileUp(Action.CALL)}>📣</MobileBtn>
            {grenades > 0 && <MobileBtn onDown={() => mobileDown(Action.THROW)} onUp={() => mobileUp(Action.THROW)}>💣</MobileBtn>}
            <MobileBtn onDown={() => mobileDown(Action.FIRE)} onUp={() => mobileUp(Action.FIRE)}>🔥</MobileBtn>
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
        ● {stats.coins} &nbsp;|&nbsp; ⌂ {stats.sentHome}
      </p>
      <p className="pixel-hint mt-2" style={{ color: '#a7f070' }}>
        {stats.sentHome === 0 ? 'NOBODY WENT HOME.'
          : stats.sentHome === 1 ? '1 WORKER SENT HOME TO THEIR KIDS.'
          : `${stats.sentHome} WORKERS SENT HOME TO THEIR KIDS.`}
      </p>
      {best && (
        <p className="pixel-hint mt-3" style={{ color: '#c2c3c7' }}>
          BEST&nbsp;{formatTime(best.timeMs)}&nbsp;·&nbsp;{best.score}
        </p>
      )}
    </div>
  );
}

// ─── Windows 95 ───────────────────────────────────────────────────────────────
const W95_FONT = 'Tahoma, "MS Sans Serif", "Segoe UI", Arial, sans-serif';
const W95_BTN: React.CSSProperties = {
  fontFamily: W95_FONT, fontSize: 13, color: '#1b1620', background: '#c0c0c0', padding: '4px 14px',
  border: '2px solid', borderColor: '#ffffff #404040 #404040 #ffffff', boxShadow: 'inset -1px -1px #808080',
  cursor: 'pointer', minWidth: 90,
};

function Win95({ title, children, onClose }: { title: string; children: React.ReactNode; onClose?: () => void }) {
  return (
    <div
      role="dialog"
      aria-label={title}
      style={{
        fontFamily: W95_FONT, fontSize: 13, color: '#1b1620', background: '#c0c0c0', textAlign: 'left',
        border: '2px solid', borderColor: '#ffffff #404040 #404040 #ffffff', boxShadow: '4px 4px 0 rgba(0,0,0,0.5)',
        width: 'min(92vw, 440px)', padding: 3,
      }}
    >
      <div style={{ background: 'linear-gradient(90deg, #000080, #1084d0)', color: '#fff', fontWeight: 700, padding: '3px 4px', display: 'flex', alignItems: 'center' }}>
        <span style={{ flex: 1 }}>{title}</span>
        <span aria-hidden style={{ ...W95_BTN, minWidth: 0, padding: '0 5px', fontSize: 11, marginRight: 2 }}>_</span>
        <span aria-hidden style={{ ...W95_BTN, minWidth: 0, padding: '0 5px', fontSize: 11, marginRight: 2 }}>□</span>
        <button style={{ ...W95_BTN, minWidth: 0, padding: '0 5px', fontSize: 11 }} onClick={onClose} aria-label="Close">×</button>
      </div>
      <div style={{ padding: '12px 14px 14px' }}>{children}</div>
    </div>
  );
}

// ─── The job application (Floor 6) ────────────────────────────────────────────
const ANSWERS = [
  { key: 'A', text: 'Bring equality to this world.' },
  { key: 'B', text: 'Stop climate change.' },
  { key: 'C', text: 'A home, food and education for my loved ones.' },
  { key: 'D', text: 'Bring peace and justice for all of us.' },
  { key: 'E', text: 'Make more millions for the owners of this company.' },
] as const;
const RIGHT = 'E';
const REJECTIONS = [
  'ERROR 403: ANSWER NOT ALIGNED WITH COMPANY VALUES.',
  'THAT\'S NOT VERY TEAM PLAYER OF YOU.',
  'HAVE YOU TRIED WANTING MONEY?',
  'PLEASE TRY AGAIN. WITH PASSION.',
  'THIS ANSWER HAS BEEN FORWARDED TO HR.',
];

/** Only one answer is accepted. The others shake, go red and get an error. */
function JobApplication({ onSound, onDone }: { onSound: (k: 'error' | 'yes') => void; onDone: (wrong: number) => void }) {
  const [wrong, setWrong] = useState<string[]>([]);
  const [shaking, setShaking] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(false);
  const rejections = useRef(0);
  const done = useRef(onDone);
  useEffect(() => { done.current = onDone; }, [onDone]);

  useEffect(() => {
    if (!accepted) return;
    const t = setTimeout(() => done.current(rejections.current), 2600);
    return () => clearTimeout(t);
  }, [accepted]);

  const choose = (key: string) => {
    if (accepted) return;
    if (key !== RIGHT) {
      setWrong((w) => (w.includes(key) ? w : [...w, key]));
      setShaking(key);
      setTimeout(() => setShaking((s) => (s === key ? null : s)), 450);
      setError(REJECTIONS[rejections.current % REJECTIONS.length]);
      rejections.current++;
      onSound('error');
      return;
    }
    setAccepted(true);
    setError('');
    onSound('yes');
  };

  return (
    <Win95 title="JOB_APPLICATION.EXE">
      <p style={{ margin: '0 0 2px', fontWeight: 700 }}>JUNIOR TRAINEE PROGRAM · APPLICANT: TERO (AGE 2)</p>
      <p style={{ margin: '0 0 10px' }}>Q1 of 1: <b>Why do you want to work?</b></p>
      <div role="radiogroup" aria-label="Why do you want to work?" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {ANSWERS.map((a) => {
          const isWrong = wrong.includes(a.key);
          const isRight = accepted && a.key === RIGHT;
          return (
            <button
              key={a.key}
              role="radio"
              aria-checked={isRight}
              onClick={() => choose(a.key)}
              style={{
                ...W95_BTN, textAlign: 'left', width: '100%',
                background: isRight ? '#3fd84a' : isWrong ? '#d83b3b' : W95_BTN.background,
                color: isWrong ? '#ffffff' : '#1b1620',
                animation: shaking === a.key ? 'tero-shake 0.45s' : undefined,
              }}
            >
              {a.key}) {a.text}
            </button>
          );
        })}
      </div>
      <p role="status" style={{ minHeight: 20, margin: '10px 0 0', color: accepted ? '#1b5e20' : '#b00020', fontWeight: 700 }}>
        {accepted ? '✔ CHAD: YES!! So happy to hear that. Good vibes only. ✨' : error && `⛔ ${error}`}
      </p>
      {accepted && (
        <div style={{ textAlign: 'right', marginTop: 8 }}>
          <button style={W95_BTN} onClick={() => onDone(rejections.current)} autoFocus>Submit</button>
        </div>
      )}
    </Win95>
  );
}

/** Quitting asks first. */
function QuitButton({ onQuit }: { onQuit: () => void }) {
  const [asking, setAsking] = useState(false);
  if (!asking) return <button style={W95_BTN} onClick={() => setAsking(true)} aria-label="Quit to title">Quit to title</button>;
  return (
    <div style={{ width: '100%', marginTop: 10, borderTop: '1px solid #808080', paddingTop: 10, textAlign: 'center' }} role="alertdialog" aria-label="Are you sure?">
      <p style={{ margin: '0 0 8px' }}>⚠ Are you sure? Your manager will see this.</p>
      <button style={{ ...W95_BTN, marginRight: 8 }} onClick={onQuit}>Yes</button>
      <button style={W95_BTN} onClick={() => setAsking(false)} autoFocus>No</button>
    </div>
  );
}

// ─── Game over: the HR exit interview ─────────────────────────────────────────
const CAUSE_TEXT: Record<string, string> = {
  pit: 'Fell through the org chart', tacks: 'Workplace hazard (thumbtacks)', walker: 'A coworker', clerk: 'A coworker',
  hopper: 'Middle management', manager: 'Middle management', guard: 'Security', rat: 'A rat (corporate)',
  pig: 'A VP', robot: 'Automation', plant: 'The office plant', gorilla: 'Senior leadership',
  vampire: 'Legal', syncer: 'A quick sync', halvorsen: 'A PowerPoint', 'the board': 'The Board',
  recruiter: 'Talent Acquisition',
  'ceiling tile': 'The building itself', unknown: 'Synergy',
};

function ExitInterview({ stats, cause, onRetry }: { stats: RunStats; cause?: string; onRetry: () => void }) {
  const PAPER = '#f4f1e6', INK = '#1b1620';
  const box = (checked: boolean) => (checked ? '☒' : '☐');
  return (
    <div
      role="dialog"
      aria-label="Exit interview"
      style={{
        background: PAPER, color: INK, width: 'min(92vw, 460px)', padding: '18px 22px 20px', textAlign: 'left',
        fontFamily: '"Courier New", Courier, monospace', fontSize: 13, boxShadow: '6px 6px 0 rgba(0,0,0,0.6)',
        transform: 'rotate(-1deg)', border: '1px solid #c9bf9f',
      }}
    >
      <p style={{ margin: 0, fontWeight: 700, letterSpacing: 1 }}>EXIT INTERVIEW · FORM HR-404</p>
      <p style={{ margin: '2px 0 12px', fontSize: 11 }}>Please complete in triplicate. Crayon accepted.</p>
      <p style={{ margin: '6px 0' }}>EMPLOYEE: <b>TERO (AGE 2)</b></p>
      <p style={{ margin: '6px 0' }}>REASON FOR LEAVING:<br />
        {box(true)} Died &nbsp; {box(false)} Promoted &nbsp; {box(false)} Quiet quitting
      </p>
      <p style={{ margin: '6px 0' }}>CAUSE: <u>{CAUSE_TEXT[cause ?? 'unknown'] ?? cause}</u></p>
      <p style={{ margin: '6px 0' }}>
        TIME SERVED: {formatTime(stats.timeMs)} &nbsp; FLOPPIES: {stats.coins} &nbsp; SENT HOME: {stats.sentHome}
      </p>
      <p style={{ margin: '6px 0' }}>WOULD YOU RECOMMEND THIS COMPANY TO A FRIEND?<br />
        {box(false)} No &nbsp; {box(true)} No
      </p>
      <p style={{ margin: '10px 0 0' }}>SIGNATURE: <span style={{ fontFamily: 'var(--font-pixel, monospace)', color: '#d83b3b', fontSize: 15, display: 'inline-block', transform: 'rotate(-6deg)' }}>TERO</span></p>
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <button
          className="pixel-btn"
          style={{ borderColor: '#d83b3b', color: '#d83b3b', background: PAPER }}
          onClick={onRetry}
          aria-label="Retry level"
        >
          ↺ RE-APPLY
        </button>
      </div>
    </div>
  );
}

// ─── Casual Friday (unlocked by finishing the game) ───────────────────────────
// Read from localStorage after hydration (the server always renders "off").
const modeListeners = new Set<() => void>();
const subscribeModes = (cb: () => void) => { modeListeners.add(cb); return () => { modeListeners.delete(cb); }; };

function CasualFridayToggle() {
  const unlocked = useSyncExternalStore(subscribeModes, () => !!unlocks().casualFriday, () => false);
  if (!unlocked) return null;
  return <ModeToggle setting="casualFriday" label="🌺 CASUAL FRIDAY" color="#ff77a8" />;
}

/** On/off button for a saved setting; `onChange` tells the running game. */
function ModeToggle({ setting, label, color, onChange, variant = 'pixel' }: {
  setting: 'casualFriday' | 'assist'; label: string; color: string; onChange?: (on: boolean) => void;
  variant?: 'pixel' | 'win95';
}) {
  const on = useSyncExternalStore(subscribeModes, () => !!loadSettings()[setting], () => false);
  const toggle = () => {
    saveSettings({ [setting]: !on });
    onChange?.(!on);
    modeListeners.forEach((l) => l());
  };
  if (variant === 'win95') {
    return (
      <button style={{ ...W95_BTN, color: on ? color : '#1b1620' }} onClick={toggle} aria-pressed={on}>
        {on ? '☑' : '☐'} {label}
      </button>
    );
  }
  return (
    <button
      className="pixel-btn mt-4"
      style={{ borderColor: on ? color : '#83769c', color: on ? color : '#c2c3c7', fontSize: 'clamp(8px, 1.4vw, 13px)' }}
      onClick={toggle}
      aria-pressed={on}
    >
      {label}: {on ? 'ON' : 'OFF'}
    </button>
  );
}

// ─── The end ──────────────────────────────────────────────────────────────────
function FinalScreen({ run, onAgain }: { run: FinalRun; onAgain: () => void }) {
  const [card, setCard] = useState<HTMLCanvasElement | null>(null);
  const [note, setNote] = useState('');
  useEffect(() => {
    let alive = true;
    renderShareCard(run).then((c) => { if (alive) setCard(c); });
    return () => { alive = false; };
  }, [run]);

  const save = () => {
    if (!card) return;
    const a = document.createElement('a');
    a.href = card.toDataURL('image/png');
    a.download = 'where-is-dada.png';
    a.click();
  };
  const share = async () => {
    const text = shareText(run);
    try {
      const blob = card ? await new Promise<Blob | null>((r) => card.toBlob(r, 'image/png')) : null;
      const file = blob ? new File([blob], 'where-is-dada.png', { type: 'image/png' }) : null;
      if (file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setNote('COPIED! PASTE IT ANYWHERE.');
    } catch {
      setNote('COULD NOT SHARE. TRY SAVE IMAGE.');
    }
  };

  return (
    <PixelOverlay dim style={{ background: 'rgba(10,12,24,0.94)', overflowY: 'auto', justifyContent: 'flex-start', paddingTop: 16 }}>
      <p className="pixel-title" style={{ color: '#6cc24a', fontSize: 'clamp(16px, 4vw, 40px)' }}>YOU GOT DAD BACK.</p>
      {card && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={card.toDataURL('image/png')}
          alt={shareText(run)}
          style={{ width: 'min(86vw, 640px)', imageRendering: 'pixelated', marginTop: 12, border: '2px solid #2a2f4a' }}
        />
      )}
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <button className="pixel-btn" onClick={save} aria-label="Save the card as an image">⬇ SAVE IMAGE</button>
        <button className="pixel-btn" onClick={share} aria-label="Share the card">↗ SHARE</button>
        <button className="pixel-btn" style={{ borderColor: '#a7f070', color: '#a7f070' }} onClick={onAgain} aria-label="Play again">▶ PLAY AGAIN</button>
      </div>
      {note && <p className="pixel-hint mt-3" style={{ color: '#ffd23f' }} role="status">{note}</p>}
      <details className="mt-4" style={{ color: '#c2c3c7', fontFamily: 'var(--font-pixel, monospace)', fontSize: 'clamp(8px, 1.3vw, 12px)' }}>
        <summary style={{ cursor: 'pointer' }}>SPLITS · {formatMs(run.totalMs)}{run.bestMs !== null ? ` · BEST ${formatMs(run.bestMs)}` : ''}</summary>
        <table style={{ margin: '8px auto', borderSpacing: '12px 4px' }}>
          <tbody>
            {run.splits.map((s) => (
              <tr key={s.name}><td style={{ textAlign: 'left' }}>{s.name.toUpperCase()}</td><td>{formatMs(s.timeMs)}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </PixelOverlay>
  );
}

// ─── Boss bar ─────────────────────────────────────────────────────────────────
function BossBar({ boss }: { boss: NonNullable<HudData['boss']> }) {
  const pct = Math.round((boss.hp / boss.maxHp) * 100);
  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 text-center select-none pointer-events-none"
      style={{ bottom: 12, fontFamily: 'var(--font-pixel, monospace)', fontSize: 'clamp(8px, 1.4vw, 13px)', width: 'min(60%, 420px)' }}
      aria-label={`${boss.name}: ${boss.hp} of ${boss.maxHp}`}
    >
      <p style={{ color: '#fff1e8', textShadow: '2px 2px 0 #000', margin: '0 0 4px' }}>
        {boss.name} <span style={{ color: '#ffd23f' }}>· {boss.slide}</span>
      </p>
      <div style={{ height: '0.9em', border: '2px solid #fff1e8', background: '#1b1620', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, width: `${pct}%`, background: '#d83b3b', transition: 'width 200ms steps(4)' }} />
      </div>
    </div>
  );
}

// ─── Tantrum meter ────────────────────────────────────────────────────────────
function TantrumMeter({ rage, tantrum }: { rage: number; tantrum: boolean }) {
  const full = rage >= TANTRUM_MAX;
  const pct = Math.round((rage / TANTRUM_MAX) * 100);
  return (
    <span className="flex items-center gap-1" aria-label={`Tantrum meter ${pct} percent`}>
      <span style={{ color: full || tantrum ? '#ff3b1f' : '#c2c3c7' }}>{tantrum ? 'RAAH' : full ? 'X!' : 'GRR'}</span>
      <span
        style={{
          display: 'inline-block', width: '5.5em', height: '0.8em',
          border: '2px solid #fff1e8', background: '#1b1620', position: 'relative',
          animation: full && !tantrum ? 'tero-pulse 0.3s steps(2) infinite alternate' : undefined,
        }}
      >
        <span
          style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`,
            background: tantrum || full ? '#ff3b1f' : '#ef7d57',
            transition: 'width 120ms linear',
          }}
        />
      </span>
    </span>
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
