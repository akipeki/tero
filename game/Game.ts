// file: game/Game.ts

import { setTheme } from './render/Theme';
import { Tilemap } from './level/Tilemap';
import { LEVELS, validateLevel as validateBuiltinLevel, type LevelDef } from './level/levels';
import { buildLevel } from './level/buildLevel';
import { contentStore } from './content/ContentStore';
import type { LevelDef as PackLevelDef, StoryCard } from './content/types';
import { findMissingCardRefs } from './content/story/validate';
import { StoryPlayer } from './StoryPlayer';
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
import { GameState, Action, PlayerState } from './types';
import {
  CHAIN_BONUS, SQUASH_STRENGTH, WALK_STRIDE_PX, WALK_BOB_PX, STORY_BLIP_EVERY,
  STORY_INPUT_GRACE,
} from './constants';
import { updateBackground } from './render/Background';
import { layoutScenery, setScenery } from './render/office/Scenery';
import { getPlayerFrame, framePaths } from './render/sprites/PlayerSpriteAssets';
import type { creaturesAndObjects, UpdateCtx } from './creaturesAndObjects/creaturesAndObjects';
import type { HudData, PlayerRenderData, RunStats, StoryView } from './types';
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
  private story = new StoryPlayer();
  /** Last revealed-char count sent to the overlay (avoids redundant writes). */
  private storyRevealSent = -1;
  /** Ticks since the current sequence opened (for STORY_INPUT_GRACE). */
  private storyAge = 0;
  /** Pack definition of the current level — carries intro/outro/triggers. */
  private levelPack: PackLevelDef | null = null;
  /** Indices of mid-level triggers already played this attempt. */
  private firedTriggers = new Set<number>();

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
  /** New story card (or null when the sequence ends). */
  onStory?:        (view: StoryView | null) => void;
  /** Typewriter progress for the current card — fires every few ticks. */
  onStoryReveal?:  (revealed: number) => void;

  private uiActionUnsub: (() => void) | null = null;
  private pendingEnter = false;
  private pendingRetry = false;
  private pendingQuit  = false;
  private pendingSkip  = false;

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

    // Catch story typos (e.g. a deleted card still listed in a level) early.
    for (const msg of findMissingCardRefs(contentStore().merged)) {
      console.warn(`[Tero] missing story card: ${msg}`);
    }
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
  signal(ui: 'enter' | 'retry' | 'quit' | 'skip'): void {
    if (ui === 'enter') this.pendingEnter = true;
    if (ui === 'retry') this.pendingRetry = true;
    if (ui === 'quit')  this.pendingQuit  = true;
    if (ui === 'skip')  this.pendingSkip  = true;
  }

  /** External: jump to a level by full pack ID (e.g. `b_level_1` or `u_level_xxx`). */
  selectLevel(id: string): void {
    if (!contentStore().getLevel(id)) return;
    this.currentLevelId = id;
    this.enterPlaying(true);
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

    // How far we are between the last update and the next one. Rendering at
    // this fraction keeps motion smooth on displays faster than 60 Hz.
    this.render(this.accumulator / FIXED_DT);
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
      case GameState.STORY:     return this.updateStory();
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
      this.enterPlaying(true);
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
        this.enterPlaying(true);
      } else {
        // User levels or the last built-in → back to the title.
        this.state = GameState.TITLE;
        this.syncHud();
      }
    }
  }

  private updateStory(): void {
    if (this.storyAge++ < STORY_INPUT_GRACE) {
      this.pendingEnter = this.pendingSkip = false;
    } else if (this.input.pause || this.pendingSkip) {
      this.pendingEnter = false;
      this.pendingSkip = false;
      this.story.skip();
    } else if (this.pendingEnter || this.input.justPressedAction(Action.JUMP)) {
      this.pendingEnter = false;
      const before = this.story.index;
      this.story.advance();
      if (this.story.active && this.story.index !== before) this.emitStoryCard();
    }
    if (!this.story.active) return;

    this.story.tick();
    const n = this.story.revealed;
    if (n !== this.storyRevealSent) {
      if (Math.floor(n / STORY_BLIP_EVERY) !== Math.floor(this.storyRevealSent / STORY_BLIP_EVERY)) {
        this.audio.play('text');
      }
      this.storyRevealSent = n;
      this.onStoryReveal?.(n);
    }
  }

  /** Shows `cardIds` over the frozen world, then runs `then`. The run timer
   *  is paused for the duration. Missing ids are skipped. */
  private playStory(cardIds: readonly string[] | undefined, then: () => void): void {
    const store = contentStore();
    const cards = (cardIds ?? [])
      .map((id) => store.getCard(id))
      .filter((c): c is StoryCard => c !== null);
    if (cards.length === 0) { then(); return; }

    this.stats.pause();
    this.state = GameState.STORY;
    this.storyAge = 0;
    this.story.start(cards, () => {
      this.onStory?.(null);
      this.stats.resume();
      then();
      this.syncHud();
    });
    this.emitStoryCard();
    this.syncHud();
  }

  private emitStoryCard(): void {
    const card = this.story.card;
    if (!card) return;
    const portrait = card.portrait ? contentStore().getSprite(card.portrait) : null;
    this.storyRevealSent = -1;
    this.onStory?.({
      speaker: card.speaker,
      portraitSrc: portrait?.dataUrl,
      portraitFrames: portrait?.frames,
      text: card.text,
      index: this.story.index,
      total: this.story.total,
    });
  }

  private resumePlaying = (): void => {
    this.state = GameState.PLAYING;
  };

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
      this.stats.pause(); // stop the clock at the goal, not after the outro
      this.playStory(this.levelPack?.outro, () => this.endRun('WIN'));
      return;
    }

    this.particles.update();
    this.shake.update();
    this.camera.follow(this.player.cx);
    this.checkStoryTriggers();

    // Cull inactive
    this.walkers   = this.walkers.filter(w => w.active);
    this.hoppers   = this.hoppers.filter(h => h.active);
    this.mushrooms = this.mushrooms.filter(m => m.active);
    this.coins     = this.coins.filter(c => c.active);

    this.syncHud();
  }

  private checkStoryTriggers(): void {
    const triggers = this.levelPack?.triggers;
    if (!triggers || this.player.isDead) return;
    for (let i = 0; i < triggers.length; i++) {
      if (this.firedTriggers.has(i)) continue;
      if (this.player.cx < triggers[i].tx * TILE_SIZE) continue;
      this.firedTriggers.add(i);
      this.playStory(triggers[i].cards, this.resumePlaying);
      return; // one beat at a time; the next fires on a later tick
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  private render(alpha: number): void {
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
        updateBackground(Math.round(this.camera?.x ?? 0));
        this.renderer.drawTitleBackground();
        break;
      case GameState.PLAYING:
      case GameState.PAUSED:
      case GameState.GAME_OVER:
      case GameState.WIN:
      case GameState.STORY:
        // The canvas is low-res pixel art, so the world scrolls in whole pixels.
        this.renderer.render(Math.round(this.camera.at(alpha)), this.map, allEntities, this.particles, this.shake);
        break;
    }

    this.syncPlayerOverlay(alpha);
  }

  private syncPlayerOverlay(alpha: number): void {
    if (!this.onPlayerRender) return;
    const visible =
      this.player && this.camera && this.state !== GameState.TITLE;
    if (!visible) { this.onPlayerRender(null); return; }

    const p = this.player;
    // Freeze interpolation while the simulation is paused.
    const a = this.state === GameState.PLAYING ? alpha : 1;
    const camX = this.camera.at(a);
    const footX = p.prevCx    + (p.cx     - p.prevCx)    * a;
    const footY = p.prevFootY + (p.bottom - p.prevFootY) * a;

    let frame = getPlayerFrame(p.state);
    let frameIdx = 0;
    let bobY = 0;
    const walking = p.state === PlayerState.WALK || p.state === PlayerState.BIG_WALK;
    if (walking) {
      const stride = frame.stride ?? WALK_STRIDE_PX;
      const step = Math.floor(p.walkDistance / stride);
      if (frame.frames > 1) {
        // A real walk cycle carries its own bob in the art.
        frameIdx = step % frame.frames;
      } else {
        // Two-pose fallback: alternate the walk and idle images per stride,
        // lifting on the passing pose of each step.
        frame = step % 2 === 0 ? framePaths.walk : framePaths.idle;
        bobY = -WALK_BOB_PX * Math.abs(Math.sin((Math.PI * p.walkDistance) / stride));
      }
    } else if (frame.frames > 1) {
      frameIdx = Math.floor((performance.now() / 1000) * frame.fps) % frame.frames;
    }

    this.onPlayerRender({
      screenX: footX - camX + this.shake.offsetX,
      screenY: footY + this.shake.offsetY,
      bobY,
      facingRight: p.facingRight,
      src: frame.src,
      frames: frame.frames,
      frameIdx,
      scaleX: 1 + (p.scaleX - 1) * SQUASH_STRENGTH,
      scaleY: 1 + (p.scaleY - 1) * SQUASH_STRENGTH,
      shouldFlash: p.shouldFlash,
      big: p.isBig,
    });
  }

  // ─── Level setup ───────────────────────────────────────────────────────────

  /** Loads the current level. `withIntro` plays the chapter/level intro
   *  first — true when arriving fresh, false on retry/restart. */
  private enterPlaying(withIntro = false): void {
    this.audio.init();
    this.audio.stopMusic();
    if (this.story.active) { this.story.cancel(); this.onStory?.(null); }
    this.loadLevel();
    this.audio.startMusic();
    this.stats.reset();
    this.onScore?.(this.stats.score);
    this.onEndScreen?.(null);
    saveSettings({ lastLevelId: this.currentLevelId });
    this.state = GameState.PLAYING;
    if (withIntro) this.playStory(this.introCardIds(), this.resumePlaying);
    this.syncHud();
  }

  /** Chapter intro (if this level opens a chapter) followed by the level intro. */
  private introCardIds(): string[] {
    const chapter = contentStore().merged.story.chapters
      .find((c) => c.levelIds[0] === this.currentLevelId);
    return [...(chapter?.intro ?? []), ...(this.levelPack?.intro ?? [])];
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
    this.levelPack = contentStore().getLevel(this.currentLevelId);
    this.firedTriggers.clear();
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
    this.camera.snap(this.player.cx);

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

    // Office gags: authored story hints + seeded auto-fill. Kept clear of the
    // elevator so the goal always reads.
    setScenery(L.theme === 'office'
      ? layoutScenery(this.map, {
          levelId: L.id,
          authored: this.levelPack?.scenery,
          keepClear: [[this.goal.x - 40, this.goal.x + this.goal.w + 40]],
        })
      : []);
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
