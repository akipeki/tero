// file: game/Game.ts

import { setTheme } from './render/Theme';
import { Tilemap } from './level/Tilemap';
import { LEVELS, validateLevel as validateBuiltinLevel, type LevelDef } from './level/levels';
import { buildLevel } from './level/buildLevel';
import { contentStore } from './content/ContentStore';
import type { LevelDef as PackLevelDef } from './content/types';
import { Player } from './creaturesAndObjects/Player';
import { Walker } from './creaturesAndObjects/Walker';
import { Hopper } from './creaturesAndObjects/Hopper';
import { Mushroom } from './creaturesAndObjects/Mushroom';
import { QuestionBlock } from './creaturesAndObjects/QuestionBlock';
import { Goal } from './creaturesAndObjects/Goal';
import { Coin } from './creaturesAndObjects/Coin';
import { Checkpoint } from './creaturesAndObjects/Checkpoint';
import { Camera } from './Camera';
import { ParticleSystem } from './ParticleSystem';
import { ScreenShake } from './ScreenShake';
import { Renderer } from './render/Renderer';
import { InputHandler } from './InputHandler';
import { AudioManager } from './AudioManager';
import { Stats } from './Stats';
import { saveSettings, loadSettings } from './Settings';
import { GameState, Action } from './types';
import { CHAIN_BONUS } from './constants';
import { updateBackground } from './render/Background';
import { getPlayerFrame } from './render/sprites/PlayerSpriteAssets';
import type { creaturesAndObjects, UpdateCtx } from './creaturesAndObjects/creaturesAndObjects';
import type { HudData, PlayerRenderData, RunStats } from './types';
import { FIXED_DT, MAX_FRAME_TIME, VIEWPORT_W, VIEWPORT_H, STARTING_LIVES, TILE_SIZE } from './constants';

interface EndScreenPayload {
  state: 'WIN' | 'GAME_OVER';
  stats: RunStats;
  best: { timeMs: number; score: number } | null;
  newBest: boolean;
  levelId: string;
  levelName: string;
  hasNextLevel: boolean;
}

export class Game {
  private renderer: Renderer;
  private input: InputHandler;
  private audio: AudioManager;
  private particles: ParticleSystem;
  private shake: ScreenShake;
  private stats = new Stats();

  private map!: Tilemap;
  private camera!: Camera;
  private player!: Player;
  private walkers:  Walker[]  = [];
  private hoppers:  Hopper[]  = [];
  private qblocks:  QuestionBlock[] = [];
  private mushrooms: Mushroom[] = [];
  private coins:    Coin[] = [];
  private checkpoints: Checkpoint[] = [];
  private goal!: Goal;

  private state: GameState = GameState.TITLE;
  private accumulator = 0;
  private lastTime    = 0;
  private rafId       = 0;
  private running     = false;

  /** ID of the level currently being played. May be a built-in (`b_level_*`)
   *  or a user-created level (`u_level_*`) — both are resolved via ContentStore. */
  private currentLevelId: string = `b_level_${LEVELS[0].id}`;
  /** Playlist: built-in levels in registry order. User levels can be tested
   *  one-off via signal('selectLevel', id) but don't auto-advance. */
  private builtInPlaylist: readonly string[] = LEVELS.map(L => `b_level_${L.id}`);

  private resolveCurrentLevel(): LevelDef {
    const def = contentStore().getLevel(this.currentLevelId);
    if (!def) {
      // Fall back to the first built-in if a stale id sneaks in.
      this.currentLevelId = this.builtInPlaylist[0];
      const fallback = contentStore().getLevel(this.currentLevelId);
      if (!fallback) throw new Error('No playable level available');
      return packLevelToRuntime(fallback);
    }
    return packLevelToRuntime(def);
  }

  // React sync callbacks
  onHudUpdate?:    (data: HudData) => void;
  onPlayerRender?: (data: PlayerRenderData | null) => void;
  onEndScreen?:    (data: EndScreenPayload | null) => void;
  onScore?:        (score: number) => void;
  onChain?:        (chainSize: number, bonus: number) => void;

  private uiActionUnsub: (() => void) | null = null;
  private pendingEnter = false;
  private pendingRetry = false;
  private pendingQuit  = false;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas);
    this.input = new InputHandler();
    this.audio = new AudioManager();
    this.particles = new ParticleSystem();
    this.shake = new ScreenShake();

    // Bridge keyboard UI edges (Enter / R) into the loop without window globals.
    this.uiActionUnsub = this.input.onUiAction((a) => {
      if (a === 'enter') this.pendingEnter = true;
      if (a === 'retry') this.pendingRetry = true;
    });
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.loop);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    this.input.destroy();
    this.audio.stopMusic();
    this.uiActionUnsub?.();
    this.uiActionUnsub = null;
  }

  /** Called by React to trigger UI button → game-state transitions. */
  signal(ui: 'enter' | 'retry' | 'quit'): void {
    if (ui === 'enter') this.pendingEnter = true;
    if (ui === 'retry') this.pendingRetry = true;
    if (ui === 'quit')  this.pendingQuit  = true;
  }

  /** External: jump to a level by full pack ID (e.g. `b_level_1` or `u_level_xxx`). */
  selectLevel(id: string): void {
    if (!contentStore().getLevel(id)) return;
    this.currentLevelId = id;
    this.enterPlaying();
  }

  // ─── Game loop ─────────────────────────────────────────────────────────────

  private loop = (now: number): void => {
    if (!this.running) return;
    const frameTime = Math.min((now - this.lastTime) / 1000, MAX_FRAME_TIME);
    this.lastTime   = now;

    this.accumulator += frameTime;
    while (this.accumulator >= FIXED_DT) {
      this.update();
      this.accumulator -= FIXED_DT;
    }

    this.render();
    this.rafId = requestAnimationFrame(this.loop);
  };

  // ─── Update ────────────────────────────────────────────────────────────────

  private update(): void {
    this.input.tick();
    if (this.input.muteJustPressed) this.audio.toggleMute();

    switch (this.state) {
      case GameState.TITLE:     return this.updateTitle();
      case GameState.PLAYING:   return this.updatePlaying();
      case GameState.PAUSED:    return this.updatePaused();
      case GameState.GAME_OVER: return this.updateGameOver();
      case GameState.WIN:       return this.updateWin();
    }
  }

  private updateTitle(): void {
    if (this.input.justPressedAction(Action.JUMP) ||
        this.input.justPressedAction(Action.RIGHT) ||
        this.pendingEnter) {
      this.pendingEnter = false;
      // Resume at the last-played level if known; otherwise start at the first.
      const last = loadSettings().lastLevelId;
      if (last && contentStore().getLevel(last)) {
        this.currentLevelId = last;
      } else {
        this.currentLevelId = this.builtInPlaylist[0];
      }
      this.enterPlaying();
    }
  }

  private updatePaused(): void {
    if (this.pendingQuit) {
      this.pendingQuit = false;
      this.stats.resume(); // discard run timer; we're leaving the level
      this.state = GameState.TITLE;
      this.onEndScreen?.(null);
      this.syncHud();
      return;
    }
    if (this.pendingRetry) {
      this.pendingRetry = false;
      this.enterPlaying();
      return;
    }
    if (this.input.pause || this.pendingEnter) {
      this.pendingEnter = false;
      this.stats.resume();
      this.state = GameState.PLAYING;
      this.syncHud();
    }
  }

  private updateGameOver(): void {
    if (this.pendingRetry || this.input.justPressedAction(Action.JUMP)) {
      this.pendingRetry = false;
      this.onEndScreen?.(null);
      this.enterPlaying();
    }
  }

  private updateWin(): void {
    if (this.pendingEnter || this.input.justPressedAction(Action.JUMP)) {
      this.pendingEnter = false;
      this.onEndScreen?.(null);
      const idx = this.builtInPlaylist.indexOf(this.currentLevelId);
      if (idx >= 0 && idx < this.builtInPlaylist.length - 1) {
        this.currentLevelId = this.builtInPlaylist[idx + 1];
        this.enterPlaying();
      } else {
        // User levels or the last built-in → back to the title.
        this.state = GameState.TITLE;
        this.syncHud();
      }
    }
  }

  private updatePlaying(): void {
    if (this.input.pause) {
      this.stats.pause();
      this.state = GameState.PAUSED;
      this.syncHud();
      return;
    }

    const ctx: UpdateCtx = {
      map: this.map,
      particles: this.particles,
      audio: this.audio,
      shake: this.shake,
      dt: FIXED_DT,
    };

    // Feed input into player
    this.player.actions         = this.input.bits;
    this.player.jumpJustPressed = this.input.jumpPressed;
    this.player.jumpHeld        = this.input.jump;

    this.player.update(ctx);

    // Death → respawn or game over
    if (this.player.deadTimerDone) {
      if (this.player.lives <= 0) {
        this.endRun('GAME_OVER');
        return;
      }
      // Re-spawn at the most recently triggered checkpoint, else the level start.
      this.player.respawn(
        Math.floor(this.player.spawnX / TILE_SIZE),
        Math.floor((this.player.spawnY + this.player.h) / TILE_SIZE),
      );
      this.syncHud();
    }

    // Walkers
    for (const w of this.walkers) {
      w.update(ctx);
      const stomped = w.checkPlayerInteraction(this.player, ctx);
      if (stomped) this.recordStomp();
    }
    // Hoppers
    for (const h of this.hoppers) {
      h.update(ctx);
      const stomped = h.checkPlayerInteraction(this.player, ctx);
      if (stomped) this.recordStomp();
    }

    // ? blocks
    for (const qb of this.qblocks) {
      qb.update(ctx);
      qb.checkPlayerHit(this.player, ctx);
      if (qb.pendingSpawn) {
        const m = qb.pendingSpawn;
        qb.pendingSpawn = null;
        this.mushrooms.push(m);
      }
    }

    // Mushrooms
    for (const m of this.mushrooms) {
      m.update(ctx);
      m.checkCollect(this.player, ctx);
    }

    // Coins
    for (const c of this.coins) {
      c.update(ctx);
      if (c.checkCollect(this.player, ctx)) {
        this.stats.addCoin();
        this.onScore?.(this.stats.score);
      }
    }

    // Checkpoints
    for (const cp of this.checkpoints) {
      cp.update(ctx);
      cp.checkTrigger(this.player, ctx);
    }

    // Goal
    this.goal.update(ctx);
    if (this.goal.checkTrigger(this.player, ctx)) {
      this.endRun('WIN');
      return;
    }

    this.particles.update();
    this.shake.update();
    this.camera.follow(this.player.cx);

    // Cull inactive
    this.walkers   = this.walkers.filter(w => w.active);
    this.hoppers   = this.hoppers.filter(h => h.active);
    this.mushrooms = this.mushrooms.filter(m => m.active);
    this.coins     = this.coins.filter(c => c.active);

    this.syncHud();
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  private render(): void {
    const ctx = this.renderer.context;
    ctx.clearRect(0, 0, VIEWPORT_W, VIEWPORT_H);

    // Drawn entities exclude Player (DOM overlay handles it).
    const allEntities: creaturesAndObjects[] = [
      ...this.checkpoints,
      ...this.qblocks,
      this.goal,
      ...this.coins,
      ...this.mushrooms,
      ...this.walkers,
      ...this.hoppers,
    ].filter(Boolean);

    switch (this.state) {
      case GameState.TITLE:
        updateBackground(this.camera?.x ?? 0);
        this.renderer.drawTitleBackground();
        break;
      case GameState.PLAYING:
      case GameState.PAUSED:
      case GameState.GAME_OVER:
      case GameState.WIN:
        this.renderer.render(this.camera.x, this.map, allEntities, this.particles, this.shake);
        break;
    }

    this.syncPlayerOverlay();
  }

  private syncPlayerOverlay(): void {
    if (!this.onPlayerRender) return;
    const visible =
      this.player && this.camera && this.state !== GameState.TITLE;
    if (!visible) { this.onPlayerRender(null); return; }
    const frame = getPlayerFrame(this.player.state);
    this.onPlayerRender({
      x: this.player.x,
      y: this.player.y,
      w: this.player.w,
      h: this.player.h,
      camX: this.camera.x,
      facingRight: this.player.facingRight,
      frameSrc: frame.src,
      frames: frame.frames,
      fps: frame.fps,
      scaleX: this.player.scaleX,
      scaleY: this.player.scaleY,
      shouldFlash: this.player.shouldFlash,
    });
  }

  // ─── Level setup ───────────────────────────────────────────────────────────

  private enterPlaying(): void {
    this.audio.init();
    this.audio.stopMusic();
    this.loadLevel();
    this.audio.startMusic();
    this.stats.reset();
    this.onScore?.(this.stats.score);
    this.onEndScreen?.(null);
    saveSettings({ lastLevelId: this.currentLevelId });
    this.state = GameState.PLAYING;
    this.syncHud();
  }

  private recordStomp(): void {
    const chain = this.player.airChain;
    this.stats.addStomp(chain);
    const bonus = Math.max(0, chain - 1) * CHAIN_BONUS;
    this.onChain?.(chain, bonus);
    this.onScore?.(this.stats.score);
  }

  private currentRuntimeLevel: LevelDef | null = null;

  private loadLevel(): void {
    const L = this.resolveCurrentLevel();
    validateBuiltinLevel(L);
    this.currentRuntimeLevel = L;
    setTheme(L.theme);

    this.map = new Tilemap([...L.tiles], L.width, L.height);
    this.camera = new Camera(this.map.pixelWidth);
    this.particles.clear();

    const { player: ps } = L.spawns;
    const spawnX = ps.tx * TILE_SIZE;
    const spawnY = ps.ty * TILE_SIZE;
    this.player = new Player(spawnX, spawnY, STARTING_LIVES);
    this.player.spawnX = spawnX;
    this.player.spawnY = spawnY;

    this.walkers = [];
    this.hoppers = [];
    for (const s of L.spawns.enemies) {
      if (s.type === 'walker') this.walkers.push(new Walker(s.tx, s.ty));
      else if (s.type === 'hopper') this.hoppers.push(new Hopper(s.tx, s.ty));
    }

    this.qblocks = L.spawns.blocks.map(s => new QuestionBlock(s.tx, s.ty));
    for (const qb of this.qblocks) this.map.setTile(qb.tx, qb.ty, 1);

    this.coins = (L.spawns.coins ?? []).map(c => new Coin(c.tx, c.ty));
    this.checkpoints = (L.spawns.checkpoints ?? []).map(c => new Checkpoint(c.tx, c.ty));

    this.mushrooms = [];
    this.goal = new Goal(L.spawns.goal.tx, L.spawns.goal.ty);
  }

  private endRun(outcome: 'WIN' | 'GAME_OVER'): void {
    const L = this.currentRuntimeLevel ?? this.resolveCurrentLevel();
    const stats: RunStats = {
      coins: this.stats.coins,
      enemiesStomped: this.stats.enemiesStomped,
      timeMs: Math.floor(this.stats.elapsedMs()),
    };
    let best = this.stats.getBest(L.id);
    let newBest = false;
    if (outcome === 'WIN') {
      newBest = this.stats.saveBestIfBetter(L.id);
      if (newBest) best = { timeMs: stats.timeMs, score: this.stats.score };
    }
    this.state = outcome === 'WIN' ? GameState.WIN : GameState.GAME_OVER;
    this.onEndScreen?.({
      state: outcome,
      stats,
      best,
      newBest,
      levelId: this.currentLevelId,
      levelName: L.name,
      hasNextLevel:
        this.builtInPlaylist.indexOf(this.currentLevelId) >= 0 &&
        this.builtInPlaylist.indexOf(this.currentLevelId) < this.builtInPlaylist.length - 1,
    });
    this.syncHud();
  }

  // ─── HUD sync ──────────────────────────────────────────────────────────────

  private syncHud(): void {
    this.onHudUpdate?.({
      lives:    this.player?.lives ?? STARTING_LIVES,
      maxLives: STARTING_LIVES,
      isBig:    this.player?.isBig ?? false,
      coins:    this.stats.coins,
      state:    this.state,
    });
  }

  // ─── Accessors ─────────────────────────────────────────────────────────────

  get audioManager(): AudioManager  { return this.audio; }
  get currentState(): GameState     { return this.state; }
  get inputHandler(): InputHandler  { return this.input; }
  get playingLevelId(): string      { return this.currentLevelId; }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert a ContentPack LevelDef (rows-based) into the runtime LevelDef
 *  (tile-array based) the engine expects. Throws on malformed rows. */
function packLevelToRuntime(p: PackLevelDef): LevelDef {
  const { tiles, width, height } = buildLevel(p.rows);
  if (width !== p.width || height !== p.height) {
    // The author can set width/height in metadata; trust the rows.
    return {
      id: p.id,
      name: p.name,
      theme: p.theme,
      tiles,
      width,
      height,
      spawns: p.spawns,
    };
  }
  return {
    id: p.id,
    name: p.name,
    theme: p.theme,
    tiles,
    width,
    height,
    spawns: p.spawns,
  };
}
