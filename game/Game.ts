
import { setTheme } from './render/Theme';
import { level1Visuals } from './level/levelVisuals';
import { Tilemap } from './level/Tilemap';
import { level1Tiles, level1Spawns, LEVEL_WIDTH, LEVEL_HEIGHT } from './level/level1';
import { Player } from './creaturesAndObjects/Player';
import { Walker } from './creaturesAndObjects/Walker';
import { Mushroom } from './creaturesAndObjects/Mushroom';
import { QuestionBlock } from './creaturesAndObjects/QuestionBlock';
import { Goal } from './creaturesAndObjects/Goal';
import { Camera } from './Camera';
import { ParticleSystem } from './ParticleSystem';
import { ScreenShake } from './ScreenShake';
import { Renderer } from './render/Renderer';
import { InputHandler } from './InputHandler';
import { AudioManager } from './AudioManager';
import { GameState, Action } from './types';
import { updateBackground } from './render/Background';
import type { creaturesAndObjects, UpdateCtx } from './creaturesAndObjects/creaturesAndObjects';
import type { HudData } from './types';
import {
  FIXED_DT, MAX_FRAME_TIME, VIEWPORT_W, VIEWPORT_H, STARTING_LIVES,
} from './constants';

export class Game {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private input: InputHandler;
  private audio: AudioManager;
  private particles: ParticleSystem;
  private shake: ScreenShake;

  private map!: Tilemap;
  private camera!: Camera;
  private player!: Player;
  private entities: creaturesAndObjects[] = [];
  private walkers: Walker[] = [];
  private qblocks: QuestionBlock[] = [];
  private mushrooms: Mushroom[] = [];
  private goal!: Goal;

  private state: GameState = GameState.TITLE;
  private accumulator = 0;
  private lastTime    = 0;
  private rafId       = 0;

  // React HUD sync
  onHudUpdate?: (data: HudData) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.input    = new InputHandler();
    this.audio    = new AudioManager();
    this.particles = new ParticleSystem();
    this.shake    = new ScreenShake();
  }

  start(): void {
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.loop);
  }

  stop(): void {
    cancelAnimationFrame(this.rafId);
    this.input.destroy();
    this.audio.stopMusic();
  }

  // ─── Game loop ───────────────────────────────────────────────────────────────

  private loop = (now: number): void => {
    const frameTime = Math.min((now - this.lastTime) / 1000, MAX_FRAME_TIME);
    this.lastTime   = now;

    // Fixed-timestep update
    this.accumulator += frameTime;
    while (this.accumulator >= FIXED_DT) {
      this.update();
      this.accumulator -= FIXED_DT;
    }

    this.render();
    this.rafId = requestAnimationFrame(this.loop);
  };

  // ─── Update ──────────────────────────────────────────────────────────────────

  private update(): void {
    this.input.tick();

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
        window.__enterPressed) {
      window.__enterPressed = false;
      this.enterPlaying();
    }
  }

  private updatePaused(): void {
    if (this.input.pause) this.state = GameState.PLAYING;
  }

  private updateGameOver(): void {
    if (window.__retryPressed || this.input.justPressedAction(Action.LEFT)) {
      window.__retryPressed = false;
      this.enterPlaying();
    }
  }

  private updateWin(): void {
    if (window.__enterPressed) {
      window.__enterPressed = false;
      this.state = GameState.TITLE;
    }
  }

  private updatePlaying(): void {
    if (this.input.pause) {
      this.state = GameState.PAUSED;
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
    this.player.actions        = this.input.bits;
    this.player.jumpJustPressed = this.input.jumpPressed;
    this.player.jumpHeld        = this.input.jump;

    // Player update
    this.player.update(ctx);

    // Handle player death
    if (this.player.deadTimerDone) {
      if (this.player.lives <= 0) {
        this.state = GameState.GAME_OVER;
        this.syncHud();
        return;
      }
      this.player.respawn(level1Spawns.player.tx, level1Spawns.player.ty);
      this.syncHud();
    }

    // Walkers
    for (const w of this.walkers) {
      w.update(ctx);
      w.checkPlayerInteraction(this.player, ctx);
    }

    // ? blocks
    for (const qb of this.qblocks) {
      qb.update(ctx);
      qb.checkPlayerHit(this.player, ctx);
      if (qb.pendingSpawn) {
        const m = qb.pendingSpawn;
        qb.pendingSpawn = null;
        this.mushrooms.push(m);
        this.entities.push(m);
      }
    }

    // Mushrooms
    for (const m of this.mushrooms) {
      m.update(ctx);
      m.checkCollect(this.player, ctx);
    }

    // Goal
    if (this.goal.checkTrigger(this.player, ctx)) {
      this.goal.update(ctx);
      this.state = GameState.WIN;
      this.syncHud();
      return;
    }
    this.goal.update(ctx);

    // Particles & shake
    this.particles.update();
    this.shake.update();

    // Camera
    this.camera.follow(this.player.cx);

    // Remove dead entities
    this.walkers   = this.walkers.filter(w => w.active);
    this.mushrooms = this.mushrooms.filter(m => m.active);

    this.syncHud();
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  private render(): void {
    const ctx = this.renderer.context;

    // Always clear
    ctx.clearRect(0, 0, VIEWPORT_W, VIEWPORT_H);

    const allEntities: creaturesAndObjects[] = [
      ...this.qblocks,
      this.goal,
      ...this.mushrooms,
      ...this.walkers,
      this.player,
    ].filter(Boolean);

    switch (this.state) {
      case GameState.TITLE:
        // Canvas shows animated background; text overlay is rendered by React HTML
        updateBackground(this.camera?.x ?? 0);
        this.renderer.drawTitleBackground();
        break;

      case GameState.PLAYING:
      case GameState.PAUSED:
      case GameState.GAME_OVER:
      case GameState.WIN:
        // Canvas renders the game world; overlays (pause/gameover/win) are React HTML
        this.renderer.render(
          this.camera.x, this.map, allEntities, this.particles, this.shake,
        );
        break;
    }
  }

  // ─── Level setup ─────────────────────────────────────────────────────────────

  private enterPlaying(): void {
    this.audio.init();       // no-op after first call; creates AudioContext on first
    this.audio.stopMusic();  // cancel any running loops cleanly
    this.loadLevel();
    this.audio.startMusic(); // always restart fresh
    this.state = GameState.PLAYING;
    this.syncHud();
  }

  private loadLevel(): void {
  setTheme(level1Visuals.theme);

  this.map = new Tilemap([...level1Tiles], LEVEL_WIDTH, LEVEL_HEIGHT);
  this.camera = new Camera(this.map.pixelWidth);
  this.particles.clear();

  // Player
  const { player: ps } = level1Spawns;
  const spawnX = ps.tx * 32;
  const spawnY = ps.ty * 32;
  this.player = new Player(spawnX, spawnY, STARTING_LIVES);
  this.player.spawnX = spawnX;
  this.player.spawnY = spawnY;

  // Enemies
  this.walkers = level1Spawns.enemies.map(s => new Walker(s.tx, s.ty));

  // Question blocks
  this.qblocks = level1Spawns.blocks.map(s => new QuestionBlock(s.tx, s.ty));
  for (const qb of this.qblocks) {
    this.map.setTile(qb.tx, qb.ty, 1);
  }

  this.mushrooms = [];

  // Goal
  this.goal = new Goal(level1Spawns.goal.tx, level1Spawns.goal.ty);

  // Render ordering list
  this.entities = [];
}

  // ─── HUD sync ────────────────────────────────────────────────────────────────

  private syncHud(): void {
    this.onHudUpdate?.({
      lives: this.player?.lives ?? STARTING_LIVES,
      isBig: this.player?.isBig ?? false,
      state: this.state,
    });
  }

  // ─── Resize ──────────────────────────────────────────────────────────────────

    resize(): void {
      // The canvas internal resolution is fixed; CSS handles scaling
    }

  get audioManager(): AudioManager  { return this.audio; }
  get currentState(): GameState     { return this.state; }
  get inputHandler(): InputHandler  { return this.input; }

}
