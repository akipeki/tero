// file: game/Game.ts

import { t, tf } from './i18n';
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
import { enemyClass } from './creaturesAndObjects/enemyKinds';
import { Mushroom } from './creaturesAndObjects/Mushroom';
import { QuestionBlock } from './creaturesAndObjects/QuestionBlock';
import { Goal } from './creaturesAndObjects/Goal';
import { Coin } from './creaturesAndObjects/Coin';
import { Checkpoint } from './creaturesAndObjects/Checkpoint';
import { Flame, burnTileFx } from './creaturesAndObjects/Flame';
import { drawWalkerSprite } from './render/sprites/WalkerSprite';
import { FireSpread } from './level/FireSpread';
import { drawBubble } from './creaturesAndObjects/freed';
import { Halvorsen } from './creaturesAndObjects/Halvorsen';
import { Board } from './creaturesAndObjects/Board';
import { Recruiter } from './creaturesAndObjects/Recruiter';
import type { Boss } from './creaturesAndObjects/Boss';
import { Fax, Spring, ChutePickup, drawCanopy, DadThing, DAD_THINGS, ElvisNpc, Npc, Barrel } from './creaturesAndObjects/Gadgets';
import { Grenade, BLAST_TILES } from './creaturesAndObjects/Grenade';
import { drawElvisAt } from './render/office/ventArt';
import type { ElvisPose } from './render/characters/creatures';
import { Run, bestRun, unlocks } from './Run';
import { setCasualFriday } from './Mode';
import { PlaytestLog, type PlaytestEventType } from './Playtest';
import { Cctv } from './creaturesAndObjects/Cctv';
import { DadFollower, Debris, drawFloorSigns } from './creaturesAndObjects/Escape';
import { overlaps } from './physics/AABB';
import { Camera } from './Camera';
import { ParticleSystem } from './ParticleSystem';
import { ScreenShake } from './ScreenShake';
import { Renderer } from './render/Renderer';
import { InputHandler } from './InputHandler';
import { AudioManager } from './AudioManager';
import { Stats } from './Stats';
import { saveSettings, loadSettings } from './Settings';
import { GameState, Action, PlayerState, TileType } from './types';
import {
  CHAIN_BONUS, SQUASH_STRENGTH, WALK_STRIDE_PX, WALK_BOB_PX, STORY_BLIP_EVERY,
  STORY_INPUT_GRACE, TANTRUM_MAX, TANTRUM_FRAMES, RAGE_STOMP, BOSS_VALUE, RAGE_PAPER, RAGE_COIN, FLAME_EVERY, FLAME_SPEED,
  FLAME_LIFE, PUFF_LIFE, PUFF_SPEED, PUFF_COOLDOWN, HITSTOP_STOMP, HITSTOP_FREE,
  SYNC_FRAMES, RAGE_SYNC,
  HITSTOP_HURT,
} from './constants';
import { updateBackground } from './render/Background';
import { layoutScenery, setScenery } from './render/office/Scenery';
import { setDecor, isDecorId } from './render/office/decor';
import { getPlayerFrame, framePaths } from './render/sprites/PlayerSpriteAssets';
import type { creaturesAndObjects, UpdateCtx } from './creaturesAndObjects/creaturesAndObjects';
import type { HudData, PlayerRenderData, RunStats, StoryView } from './types';
import { FIXED_DT, MAX_FRAME_TIME, VIEWPORT_W, VIEWPORT_H, STARTING_LIVES, TILE_SIZE } from './constants';

/** The whole game, for the share card after the last floor. */
export interface FinalRun {
  totalMs: number;
  splits: { name: string; timeMs: number }[];
  sentHome: number;
  deaths: number;
  tantrums: number;
  syncs: number;
  things: string[];
  thingsTotal: number;
  bestMs: number | null;
  newRecord: boolean;
  /** Played with Bring Your Kid to Work Day. */
  assist?: boolean;
}

interface EndScreenPayload {
  state: 'WIN' | 'GAME_OVER';
  /** What got Tero in the end (for the HR exit interview). */
  cause?: string;
  /** Set after the last floor: the whole run. */
  final?: FinalRun;
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
  private flames:   Flame[] = [];
  private boss:     Boss | null = null;
  private faxes:    Fax[] = [];
  private springs:  Spring[] = [];
  private cameras:  Cctv[] = [];
  private chutes:   ChutePickup[] = [];
  private things:   DadThing[] = [];
  // The vents
  private elvisNpc: ElvisNpc | null = null;
  private npcs:     (Npc | Barrel)[] = [];
  private grenades: Grenade[] = [];
  private elvisYelp = 0;
  private run = new Run();
  private wasDead = false;
  private log = new PlaytestLog();
  // ── Phase 5: the weird stuff ──
  /** Fire spreading tile to tile through paper and red tape. */
  private fire = new FireSpread();
  private tick = 0;
  /** Tero's speech bubble during play. */
  private bark: { text: string; t: number } | null = null;
  private barkCooldown = 0;
  private callCooldown = 0;
  /** Ticks standing still (Tero gets bored and calls for Dad). */
  private idleTicks = 0;
  private wasHiddenBark = false;
  /** Furthest point reached on this floor, and ticks since it last grew. */
  private progressX = 0;
  private stuckTicks = 0;
  /** Guards that came down the vents (capped so alarms don't flood the floor). */
  private alarmGuards: Walker[] = [];
  /** Tero is down the phone line, on his way to `to`. */
  private faxing: { to: Fax; t: number } | null = null;
  /** Ticks left looking like a bad photocopy. */
  private faxedFrames = 0;
  // The escape run
  private dad: DadFollower | null = null;
  private debris: Debris[] = [];
  private escapeFrames = 0;
  private debrisTimer = 0;
  private goal!: Goal;
  /** Ticks the world stays frozen so a hit lands (hit-stop). */
  private hitStop = 0;
  /** Tantrum state last tick — to catch the moment it ends. */
  private wasTantrum = false;
  private wasHidden = false;
  /** Whoever has Tero trapped in a quick sync. */
  private syncPartner: Walker | null = null;
  private syncTipShown = false;

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
  /** The job application window opens (true) or closes (false). */
  onQuiz?:         (open: boolean) => void;
  /** Big centre-screen shout: "TANTRUM READY!", "TANTRUM!!", "...hic." */
  onCallout?:      (text: string) => void;

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

  /** The job application: the world waits until the right answer is given. */
  private openQuiz(): void {
    this.stats.pause();
    this.state = GameState.QUIZ;
    this.onQuiz?.(true);
    this.syncHud();
  }

  /** React: the application was submitted (`wrong` = answers rejected first). */
  quizDone(wrong: number): void {
    if (this.state !== GameState.QUIZ) return;
    this.note('quiz', wrong);
    this.onQuiz?.(false);
    this.stats.resume();
    this.state = GameState.PLAYING;
    this.syncHud();
  }

  /** Sound for the application window: 'error' (wrong) or 'yes'. */
  quizSound(kind: 'error' | 'yes'): void {
    this.audio.init();
    this.audio.play(kind === 'error' ? 'error' : 'goal');
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
      case GameState.QUIZ:      return;   // React has the window open
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
      this.note('quit');
      this.log.flush();
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
        // User levels or the last built-in → back to the title, and the
        // next PLAY starts a new game from Floor 1.
        if (idx === this.builtInPlaylist.length - 1) saveSettings({ lastLevelId: this.builtInPlaylist[0] });
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
  private playStory(cardIds: readonly string[] | undefined, then: () => void, extra: StoryCard[] = []): void {
    const store = contentStore();
    const cards = [...(cardIds ?? [])
      .map((id) => store.getCard(id))
      .filter((c): c is StoryCard => c !== null), ...extra]
      .map((c) => ({ ...c, text: t(c.text), speaker: c.speaker && t(c.speaker) }));   // in the player's language
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
    this.audio.play('plop');
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

    // Hit-stop: everything holds still for a beat; only the shake keeps going.
    if (this.hitStop > 0) {
      this.hitStop--;
      this.shake.update();
      return;
    }

    const ctx: UpdateCtx = {
      map: this.map,
      particles: this.particles,
      audio: this.audio,
      shake: this.shake,
      dt: FIXED_DT,
    };

    if (this.faxing) { this.updateFaxing(ctx); return; }
    if (this.faxedFrames > 0) this.faxedFrames--;

    // Feed input into player
    this.player.actions         = this.input.bits;
    this.player.jumpJustPressed = this.input.jumpPressed;
    this.player.jumpHeld        = this.input.jump;

    this.player.update(ctx);
    this.watchProgress();
    this.updateFire();
    this.updateGadgets(ctx);
    if (this.dad && this.updateEscape(ctx)) return;

    // Death → respawn or game over
    if (this.player.deadTimerDone) {
      if (this.player.lives <= 0) {
        this.endRun('GAME_OVER');
        return;
      }
      if (this.boss?.fighting) this.endBossFight(false);
      this.debris = [];
      // Re-spawn at the most recently triggered checkpoint, else the level start.
      this.player.respawn(
        Math.floor(this.player.spawnX / TILE_SIZE),
        Math.floor((this.player.spawnY + this.player.h) / TILE_SIZE),
      );
      this.dad?.reset(this.player);
      this.syncHud();
    }

    // Walkers
    for (const w of this.walkers) {
      w.update(ctx);
      const stomped = w.checkPlayerInteraction(this.player, ctx);
      if (stomped) this.recordStomp();
    }
    this.updateWatchers();

    // Hoppers
    for (const h of this.hoppers) {
      h.update(ctx);
      const stomped = h.checkPlayerInteraction(this.player, ctx);
      if (stomped) this.recordStomp();
    }

    // Flames burn paper and (tantrum flames) free whoever they touch.
    for (const f of this.flames) {
      f.update(ctx);
      if (f.rageEarned) this.player.addRage(f.rageEarned);
      for (const [tx, ty] of f.burntTiles) this.fire.spread(this.map, tx, ty);
      if (!f.frees || !f.active) continue;
      for (const e of [...this.walkers, ...this.hoppers]) {
        if (e.hittable && overlaps(f, e)) e.burn(ctx);
      }
    }
    this.updateBurning(ctx);
    this.updateJobs(ctx);
    this.updateBoss(ctx);
    this.countSentHome();

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
        if (c.bribe) this.say(pick(['Mine now.', 'Thank you.', '...Still mad.']));
        this.stats.addCoin();
        this.player.addRage(RAGE_COIN);
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
      this.playStory(this.levelPack?.outro, () => this.endRun('WIN'), this.secretEnding());
      return;
    }

    if (this.player.justHurt) {
      this.player.justHurt = false;
      this.hitStop = HITSTOP_HURT;
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
    this.flames    = this.flames.filter(f => f.active);

    this.syncHud();
  }

  // ─── The weird stuff (Phase 5) ─────────────────────────────────────────────

  /** Tero says something over his head. Rate-limited unless `force`. */
  private say(text: string, force = false): void {
    if (!force && this.barkCooldown > 0) return;
    this.bark = { text, t: 90 };
    this.barkCooldown = 120;
  }

  private updateBurning(ctx: UpdateCtx): void {
    this.tick++;
    this.fire.step(this.map, (tx, ty, first) => {
      burnTileFx(ctx, tx, ty);
      this.player.addRage(RAGE_PAPER);
      if (first) this.audio.play('burn');
    });
  }

  /** Everyone near a raging toddler runs. */
  private panicAround(x: number, tiles: number): void {
    const r = tiles * TILE_SIZE;
    for (const w of this.walkers) {
      if (!w.hittable || Math.abs(w.cx - x) > r || w.panic > 0) continue;
      w.flee(x, 150);
      if (Math.random() < 0.3) w.say(pick(['RUN!', 'HR!!', 'MOMMY', 'NOT MY JOB', 'I HAVE A MEETING']));
    }
    for (const h of this.hoppers) {
      if (h.hittable && Math.abs(h.cx - x) <= r && h.panic === 0) h.flee(x, 150);
    }
  }

  /** Everybody does their job: pigs bribe, guards check badges, robots copy,
   *  rats steal, gorillas shake the floor. Plus Tero's own chatter. */
  private updateJobs(ctx: UpdateCtx): void {
    const p = this.player;
    if (this.bark && --this.bark.t <= 0) this.bark = null;
    if (this.barkCooldown > 0) this.barkCooldown--;
    if (this.callCooldown > 0) this.callCooldown--;
    if (this.input.callPressed && !p.isDead && this.callCooldown === 0) this.callDada();

    // Tero's chatter
    if (!p.isDead && p.onGround && Math.abs(p.vx) < 0.1 && !p.inSync && !p.isHidden) {
      if (++this.idleTicks === 8 * 60) this.say('Dada?', true);
    } else this.idleTicks = 0;
    if (p.isHidden && !this.wasHiddenBark && Math.random() < 0.5) this.say('Shh.');
    this.wasHiddenBark = p.isHidden;
    if (p.justHurt && !p.isDead) this.say(pick(['Owie!', 'No fair!', 'BAD.']), true);

    const jumped = this.input.jumpPressed && p.vy < -5;
    const near = (x: number, bottom: number, tiles: number) =>
      Math.abs(p.cx - x) < tiles * TILE_SIZE && Math.abs(p.bottom - bottom) < 40;

    for (const w of this.walkers) {
      if (!w.hittable || p.isDead) continue;
      const dx = p.cx - w.cx;
      switch (w.variant) {
        case 'pig':     // "Let's make this go away."
          if (w.jobCooldown === 0 && w.onGround && w.panic === 0 && near(w.cx, w.bottom, 6)) {
            w.jobCooldown = 260;
            w.facingRight = dx > 0;
            w.say(pick(['BRIBE?', 'FOR YOUR TROUBLE', 'HUSH MONEY']));
            this.coins.push(new Coin(0, 0).throwFrom(w.cx, w.y, Math.sign(dx) * Math.min(4, Math.max(1.5, Math.abs(dx) / 40)), -5));
          }
          break;
        case 'robot':   // copies whatever Tero does
          if (jumped && Math.abs(dx) < 10 * TILE_SIZE) {
            w.hop();
            if (w.jobCooldown === 0) { w.say('COPY.'); w.jobCooldown = 200; }
          }
          break;
        case 'guard':   // badge, please
          if (w.chase > 0) w.hunt(p.cx, w.chase);
          else if (w.jobCooldown === 0 && !p.isHidden && near(w.cx, w.bottom, 5) && (dx > 0) === w.facingRight) {
            w.say('BADGE?!');
            w.hunt(p.cx, 120);
            w.jobCooldown = 320;
          }
          break;
        case 'rat':     // anything shiny
          for (const c of this.coins) {
            if (c.takeable && !c.bribe && overlaps(c, w)) {
              c.steal();
              w.loot++;
              w.say('MINE.');
            }
          }
          break;
      }
    }
    for (const h of this.hoppers) {
      if (h.variant === 'gorilla' && h.landed && h.hittable && near(h.cx, h.bottom, 5) && p.onGround && !p.isDead) {
        // the floor shakes; Tero gets bounced
        p.vy = -5;
        this.shake.trigger(4);
        this.audio.play('stomp');
        if (Math.random() < 0.4) h.say('CHEST BEAT!');
      }
    }
    void ctx;
  }

  /** Hop on Elvis. */
  private startRide(): void {
    this.player.riding = true;
    this.elvisNpc = null;
    this.audio.play('woof');
    this.say('Giddy-up!', true);
  }

  /** The grenade goes off: everyone nearby resigns on the spot. */
  private blast(ctx: UpdateCtx, x: number, y: number): void {
    const r = BLAST_TILES * TILE_SIZE;
    this.audio.play('boom');
    this.shake.trigger(12);
    this.hitStop = 10;
    this.particles.confetti(x, y);
    this.particles.burst(x, y, 30, '#f4f1e6', '#ffffff');      // resignation letters everywhere
    this.particles.burst(x, y, 20, '#ff8c3a', '#ffd23f');
    let n = 0;
    for (const e of [...this.walkers, ...this.hoppers]) {
      if (e.hittable && Math.hypot(e.cx - x, e.cy - y) < r) { e.burn(ctx); n++; }
    }
    if (this.boss?.fighting && Math.abs(this.boss.cx - x) < r * 1.6) this.boss.blast(ctx, x);
    // paperwork and red tape in range go up too
    const tx0 = Math.floor((x - r * 0.6) / TILE_SIZE), tx1 = Math.floor((x + r * 0.6) / TILE_SIZE);
    for (let ty = 1; ty < 8; ty++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        const t = this.map.tileAt(tx, ty);
        if (t !== TileType.PAPER && t !== TileType.TAPE) continue;
        this.map.setTile(tx, ty, TileType.AIR);
        burnTileFx(ctx, tx, ty);
        this.fire.spread(this.map, tx, ty);
      }
    }
    this.note('grenade', n);
    this.onCallout?.(n === 1 ? '1 RESIGNATION!' : n ? tf('{n} RESIGNATIONS!', { n }) : 'BOOM. (NOBODY THERE.)');
  }

  /** "DADA!!" — useless, mostly. Enemies look round; Dad's things answer. */
  private callDada(): void {
    const p = this.player;
    this.callCooldown = 90;
    this.say('DADA!!', true);
    this.audio.play('dada');
    this.shake.trigger(2);
    const r = 8 * TILE_SIZE;
    for (const w of this.walkers) {
      if (w.hittable && Math.abs(w.cx - p.cx) < r && w.talking === 0) { w.facingRight = p.cx > w.cx; w.puzzled = 50; }
    }
    for (const h of this.hoppers) if (h.hittable && Math.abs(h.cx - p.cx) < r) h.say('?', 40);
    // Hot or cold: a Dad thing nearby sparkles back.
    for (const t of this.things) {
      if (t.active && Math.abs(t.cx - p.cx) < 14 * TILE_SIZE) {
        this.particles.burst(t.cx, t.cy, 16, '#ff77a8', '#ffffff');
        this.audio.play('checkpoint');
      }
    }
  }

  /** Elvis, under Tero. */
  private drawRide(ctx: CanvasRenderingContext2D, alpha: number): void {
    const p = this.player;
    const a = this.state === GameState.PLAYING ? alpha : 1;
    const camX = Math.round(this.camera.at(alpha));
    const footX = p.prevCx + (p.cx - p.prevCx) * a;
    const footY = p.prevFootY + (p.bottom - p.prevFootY) * a;
    const pose: ElvisPose =
      this.elvisYelp > 0 ? 'yelp'
      : !p.onGround ? 'jump'
      : Math.abs(p.vx) > 0.4 ? (`run${Math.floor(p.walkDistance / 12) % 4}` as ElvisPose)
      : 'run0';
    drawElvisAt(ctx, footX - camX - (p.facingRight ? 8 : -8) + this.shake.offsetX, footY + this.shake.offsetY, pose, p.facingRight);
  }

  /** Everyone Tero has freed so far waits by the elevator, cheering. */
  private drawCheering(ctx: CanvasRenderingContext2D, camX: number): void {
    if (!this.goal || this.goal.locked) return;
    const n = Math.min(6, this.run.data.sentHome + this.stats.sentHome);
    const kinds = ['clerk', 'syncer', 'guard', 'pig', 'rat', 'robot'] as const;
    for (let i = 0; i < n; i++) {
      const x = this.goal.x - 14 - i * 20;
      if (x - camX < -30 || x - camX > VIEWPORT_W + 30) continue;
      const kind = kinds[i % kinds.length] === 'robot' ? 'clerk' : kinds[i % kinds.length];
      const hop = Math.round(Math.abs(Math.sin(this.tick / 9 + i * 1.3)) * 4);
      drawWalkerSprite(ctx, {
        x: x - 11, y: this.goal.y + this.goal.h - 24 - hop, w: 22, h: 24, camX,
        facingRight: false, animFrame: 0, dying: false, scaleY: 1, variant: kind, freed: true,
      });
      if (i === 0 && Math.floor(this.tick / 120) % 2 === 0) {
        drawBubble(ctx, pick(['GO TERO!', 'GO TERO!', 'THANK U'], Math.floor(this.tick / 240)), x - camX, this.goal.y + this.goal.h - 30 - hop);
      }
    }
  }

  /** All nine of Dad's things found: a few extra lines before the end. */
  private secretEnding(): StoryCard[] {
    const last = this.builtInPlaylist.indexOf(this.currentLevelId) === this.builtInPlaylist.length - 1;
    if (!last || this.run.data.things.length < Object.keys(DAD_THINGS).length) return [];
    return [
      { id: 'b_card_secret_0', speaker: 'DAD', portrait: 'b_sprite_dad', text: 'My watch. My book. Your drawing.\n...You found all of it.' },
      { id: 'b_card_secret_1', speaker: 'TERO (AGE 2)', portrait: 'b_sprite_player_idle', text: 'Dada things.\nDada HOME.' },
      { id: 'b_card_secret_2', text: 'THE DRAWING NOW HANGS ON THE FRIDGE.\nTHE WATCH STILL SAYS MARCH.\nDAD NEVER FIXED IT. ON PURPOSE.' },
    ];
  }

  // ─── Playtest log & assist ─────────────────────────────────────────────────

  /** Log an event at Tero's position (built-in floors only). */
  private note(t: PlaytestEventType, d?: string | number, x = this.player?.cx ?? 0, y = this.player?.bottom ?? 0): void {
    if (!this.currentLevelId.startsWith('b_level_')) return;
    this.log.record(t, this.currentLevelId, x, y, d);
  }

  /** The page is closing: log a quit if a floor was in progress, and save. */
  recordQuit(): void {
    if (this.state === GameState.PLAYING || this.state === GameState.PAUSED || this.state === GameState.STORY) this.note('quit');
    this.log.flush();
  }

  /** Bring Your Kid to Work Day on/off (title or pause menu). */
  setAssist(on: boolean): void {
    if (this.player) this.player.assist = on;
    this.log.setAssist(on);
    saveSettings({ assist: on });
    this.syncHud();
  }

  /** 20 s without getting any further = stuck (not counted in boss fights). */
  private watchProgress(): void {
    const p = this.player;
    if (p.isDead || this.boss?.fighting || this.faxing) return;
    if (p.cx > this.progressX + 16) { this.progressX = p.cx; this.stuckTicks = 0; return; }
    if (++this.stuckTicks === 20 * 60) { this.note('stuck'); this.stuckTicks = 0; }
  }

  // ─── Fire & tantrum ────────────────────────────────────────────────────────

  /** FIRE: full meter → TANTRUM; otherwise a tiny hiccup puff that only
   *  singes paper. During the tantrum Tero breathes a stream of fire. */
  private updateFire(): void {
    const p = this.player;
    if (p.rageJustFilled) {
      p.rageJustFilled = false;
      this.audio.play('ready');
      this.onCallout?.('TANTRUM READY!  PRESS X');
    }

    if (this.input.firePressed && !p.isDead && !p.isWin) {
      if (p.startTantrum()) {
        this.run.event('tantrum');
        this.note('tantrum');
        this.audio.play('roar');
        this.audio.setTantrum(true);
        this.shake.trigger(8);
        this.hitStop = 8;
        this.onCallout?.('TANTRUM!!');
        this.panicAround(p.cx, 7);
      } else if (!p.isTantrum && p.puffCooldown === 0) {
        p.puffCooldown = PUFF_COOLDOWN;
        this.breathe(PUFF_SPEED, PUFF_LIFE, false);
        this.audio.play('puff');
        if (Math.random() < 0.15) this.say(pick(['Pff.', 'Hic.', 'Fire... soon.']));
      }
    }

    if (p.isTantrum) {
      if (p.tantrumFrames % 30 === 0) this.panicAround(p.cx, 6);   // newcomers panic too
      if (p.tantrumFrames % FLAME_EVERY === 0) this.breathe(FLAME_SPEED, FLAME_LIFE, true);
      if (p.tantrumFrames % 9 === 0) this.audio.play('fire');
      this.shake.trigger(1.5);
    } else if (this.wasTantrum) {
      this.audio.setTantrum(false);
      if (!p.isDead) this.onCallout?.('...hic.');
      if (!p.isDead) this.say(pick(['Better.', 'Nap now?', 'Hic.']), true);
    }
    this.wasTantrum = p.isTantrum;
  }

  /** One flame from Tero's mouth, in the direction he faces. */
  private breathe(speed: number, life: number, frees: boolean): void {
    const p = this.player;
    const dir = p.facingRight ? 1 : -1;
    const mouthX = p.facingRight ? p.right + 2 : p.left - 2;
    const mouthY = p.top + p.h * (p.ducking ? 0.5 : 0.35);
    const jitter = frees ? (Math.random() - 0.5) * 1.2 : 0;
    this.flames.push(new Flame(mouthX, mouthY, dir * speed + p.vx * 0.5, jitter, life, frees));
  }

  // ─── R&D gadgets ───────────────────────────────────────────────────────────

  private updateGadgets(ctx: UpdateCtx): void {
    const p = this.player;
    for (const s of this.springs) { s.update(); s.check(p, ctx); }
    this.elvisNpc?.update();
    for (const n of this.npcs) n.update(ctx);
    if (p.bumped) { p.bumped = false; this.elvisYelp = 20; this.say(pick(['Whoa!', 'Sorry Elvis!', 'Oops.']), true); }
    if (this.elvisYelp > 0) this.elvisYelp--;
    if (this.input.throwPressed && !p.isDead && !p.inSync && this.run.useGrenade()) {
      const dir = p.facingRight ? 1 : -1;
      this.grenades.push(new Grenade(p.cx + dir * 10, p.top + 6, dir * 4.5 + p.vx * 0.5, -6));
      this.say(pick(['Catch!', 'Present!', 'For Dada!']), true);
      this.audio.play('puff');
    }
    for (const g of this.grenades) {
      g.update(ctx);
      if (g.exploded) this.blast(ctx, g.cx, g.cy);
    }
    this.grenades = this.grenades.filter((g) => g.active);
    for (const thing of this.things) {
      thing.update();
      if (thing.check(p)) {
        const info = DAD_THINGS[thing.id];
        this.run.thing(thing.id);
        this.note('thing', thing.id);
        this.say('Dada\'s!', true);
        this.audio.play('dada');
        this.particles.burst(thing.cx, thing.cy, 14, '#ff77a8', '#ffffff');
        this.onCallout?.(info ? `${t(info.name)}: ${t(info.note)}` : 'ONE OF DAD\'S THINGS');
      }
    }
    if (p.rescued) { p.rescued = false; this.note('rescue', undefined, p.deathX, p.deathY); }
    if (p.isDead !== this.wasDead) {
      if (p.isDead) { this.run.event('death'); this.note('death', p.lastCause, p.deathX, p.deathY); }
      this.wasDead = p.isDead;
    }
    for (const c of this.chutes) {
      c.update();
      if (c.check(p)) {
        this.audio.play('powerup');
        this.particles.confetti(c.cx, c.cy);
        this.onCallout?.('GOLDEN PARACHUTE!  HOLD JUMP TO GLIDE');
      }
    }
    for (const c of this.cameras) {
      c.update();
      if (p.isTantrum) continue;
      if (c.watch(p, this.map) === 'alarm') this.soundAlarm(c);
    }
    const down = this.input.justPressedAction(Action.DOWN);
    for (const f of this.faxes) {
      f.update(ctx);
      const near = !p.isDead && f.touches(p);
      f.setNear(near);
      if (!near || !down || p.inSync || p.isTantrum) continue;
      if (f.to === null || !this.faxes[f.to]) {
        f.jammed = 50;
        this.audio.play('block');
        continue;
      }
      f.busy = 36;
      this.run.event('fax');
      this.faxing = { to: this.faxes[f.to], t: 36 };
      this.audio.play('fax');
      return;
    }
  }

  /** The way home: Monday is coming. Returns true if time ran out. */
  private updateEscape(ctx: UpdateCtx): boolean {
    const p = this.player;
    this.dad!.follow(p);
    if (--this.escapeFrames <= 0) {
      this.onCallout?.('IT\'S MONDAY.');
      this.audio.play('death');
      this.endRun('GAME_OVER');
      return true;
    }
    if (this.escapeFrames === 15 * 60) this.onCallout?.('15 SECONDS TO MONDAY!');
    // Ceiling tiles fall ahead of Tero
    if (--this.debrisTimer <= 0) {
      this.debrisTimer = 50 + Math.floor(Math.random() * 50);
      const x = p.cx + 70 + Math.random() * 160;
      if (this.map.tileAtWorld(x, 4) === TileType.SOLID && x < this.map.pixelWidth - 3 * TILE_SIZE) this.debris.push(new Debris(x));
    }
    for (const d of this.debris) {
      d.update(ctx);
      if (d.hits(p)) { p.hurt(ctx, 'ceiling tile'); d.active = false; }
    }
    this.debris = this.debris.filter((d) => d.active);
    return false;
  }

  /** A camera saw Tero: sirens, and guards drop from the vents. */
  private soundAlarm(c: Cctv): void {
    this.audio.play('alarm');
    this.run.event('alarm');
    this.note('alarm');
    this.shake.trigger(3);
    this.player.addRage(RAGE_SYNC);
    this.onCallout?.('INTRUDER!  (IT\'S A BABY)');
    this.alarmGuards = this.alarmGuards.filter((g) => g.active && g.hittable);
    const tx = Math.floor(c.cx / TILE_SIZE);
    for (const off of [-2, 2]) {
      if (this.alarmGuards.length >= 4) break;
      const gx = tx + off;
      if (this.map.tileAt(gx, 2) !== TileType.AIR) continue;
      const g = new Walker(gx, 3, 'guard');
      g.facingRight = this.player.cx > g.cx;
      this.walkers.push(g);
      this.alarmGuards.push(g);
      this.particles.burst(g.cx, TILE_SIZE + 4, 6, '#8a8f96', '#c9ced6');
    }
  }

  /** On the line: Tero is invisible; the camera pans to the receiving fax. */
  private updateFaxing(ctx: UpdateCtx): void {
    const job = this.faxing!;
    for (const f of this.faxes) f.update(ctx);
    this.particles.update();
    this.shake.update();
    this.camera.follow(job.to.cx);
    if (--job.t > 0) return;
    const p = this.player;
    p.x = job.to.cx - p.w / 2;
    p.y = job.to.bottom - p.h;
    p.vx = 0;
    p.vy = -4;
    p.syncPrev();
    job.to.busy = 20;
    this.faxedFrames = 100;
    this.faxing = null;
    this.audio.play('fax');
    this.particles.burst(p.cx, p.cy, 10, '#f4f1e6', '#5a5f68');
  }

  // ─── Quick syncs & hiding ──────────────────────────────────────────────────

  /** Syncers who see Tero (or bump into him) trap him in a conversation.
   *  Ducking makes him a cardboard box: they just see a box. */
  private updateWatchers(): void {
    const p = this.player;
    if (p.isHidden !== this.wasHidden) {
      if (p.isHidden) this.audio.play('hide');
      this.wasHidden = p.isHidden;
    }
    if (this.syncPartner && !p.inSync) {
      this.syncPartner.talking = Math.min(this.syncPartner.talking, 10);
      this.syncPartner = null;
    }
    if (p.isDead || p.isTantrum || p.inSync) return;
    for (const w of this.walkers) {
      if (!w.sightTiles || !w.hittable || w.talking > 0) continue;
      const noticed = overlaps(p, w) || w.canSee(p.cx, p.bottom, this.map);
      if (!noticed) continue;
      if (p.isHidden) {
        if (w.puzzled === 0) w.puzzled = 50;
        continue;
      }
      if (p.syncImmune > 0) continue;
      p.startSync(SYNC_FRAMES);
      this.run.event('sync');
      this.note('sync');
      w.startTalking(SYNC_FRAMES + 30, p.cx > w.cx);
      this.syncPartner = w;
      p.addRage(RAGE_SYNC);
      this.audio.play('sync');
      this.shake.trigger(2);
      if (!this.syncTipShown) {
        this.syncTipShown = true;
        this.onCallout?.('MASH JUMP TO WRAP IT UP');
      }
      return;
    }
  }

  // ─── Boss ──────────────────────────────────────────────────────────────────

  private updateBoss(ctx: UpdateCtx): void {
    const b = this.boss;
    if (!b) return;
    if (b.phase === 'waiting' && b.introDone && !this.player.isDead && b.playerInArena(this.player)) {
      this.startBossFight();
    }
    b.tick(ctx, this.player, this.flames);

    if (b.justHit) {
      b.justHit = false;
      this.hitStop = 8;
      this.player.addRage(RAGE_STOMP);
    }
    for (const r of b.resigned) {
      // A hydra head resigns: out pops a worker, already on the way home.
      const tx = Math.floor(r.x / TILE_SIZE), ty = Math.floor(r.y / TILE_SIZE);
      const e = enemyClass(r.variant === 'clerk' ? 'walker' : r.variant === 'manager' ? 'hopper' : r.variant);
      if (e.cls === 'walker') { const w = new Walker(tx, ty, e.variant); this.walkers.push(w); w.burn(ctx); }
      else { const h = new Hopper(tx, ty, e.variant); this.hoppers.push(h); h.burn(ctx); }
    }
    b.resigned = [];
    if (b.wantsIntern) {
      b.wantsIntern = false;
      const inArena = this.walkers.filter((w) => w.hittable && w.x >= b.arenaLeft).length;
      if (inArena < 2) this.walkers.push(new Walker(b.arenaTx + 1, 7, 'clerk'));
    }
    if (b.freedNow) {
      b.freedNow = false;
      this.stats.addSentHome();
      this.stats.score += BOSS_VALUE;
      this.onScore?.(this.stats.score);
      this.hitStop = 20;
      this.shake.trigger(10);
      this.audio.setBoss(false);
      this.setArenaDoor(false);   // he walks out the way Tero came in
      this.onCallout?.('MEETING ADJOURNED');
    }
    if (b.walkedOut) {
      b.walkedOut = false;
      this.camera.unlock();
      this.goal.locked = false;
      this.audio.play('unlock');
      this.particles.confetti(this.goal.cx, this.goal.y + 40);
    }
  }

  private startBossFight(): void {
    const b = this.boss!;
    b.start(this.map);
    this.setArenaDoor(true);
    this.camera.lock(b.arenaLeft, b.arenaLeft);
    this.audio.setBoss(true);
    this.onCallout?.('MEETING IN PROGRESS');
  }

  /** Tero died mid-meeting: open up and reset for the next attempt. */
  private endBossFight(won: boolean): void {
    const b = this.boss;
    if (!b) return;
    if (!won) b.reset(this.map);
    this.setArenaDoor(false);
    this.camera.unlock();
    this.audio.setBoss(false);
  }

  /** The glass door at the arena's left edge. */
  private setArenaDoor(closed: boolean): void {
    const b = this.boss;
    if (!b) return;
    for (let ty = 1; ty <= 7; ty++) this.map.setTile(b.arenaTx - 1, ty, closed ? TileType.SOLID : TileType.AIR);
    if (closed) this.particles.burst(b.arenaLeft - 16, 7 * TILE_SIZE, 8, '#c9ced6', '#ffffff');
  }

  /** Workers freed this tick (by stomp, fire or tantrum body-slam). */
  private countSentHome(): void {
    let n = 0;
    for (const e of [...this.walkers, ...this.hoppers]) {
      if (!e.sentHome) continue;
      e.sentHome = false;
      // A rat sent home drops what it stole.
      if (e instanceof Walker && e.loot > 0) {
        for (let i = 0; i < e.loot; i++) {
          this.coins.push(new Coin(0, 0).throwFrom(e.cx, e.y, (i - (e.loot - 1) / 2) * 1.5, -4));
        }
        e.loot = 0;
      }
      this.stats.addSentHome();
      n++;
    }
    if (n === 0) return;
    if (n >= 3) this.say('Bye bye!', true);
    else if (Math.random() < 0.25) this.say(pick(['Go home.', 'Nap time.', 'Bonk.', 'Bye!']));
    this.hitStop = Math.max(this.hitStop, HITSTOP_FREE);
    this.onScore?.(this.stats.score);
  }

  private checkStoryTriggers(): void {
    const triggers = this.levelPack?.triggers;
    if (!triggers || this.player.isDead) return;
    for (let i = 0; i < triggers.length; i++) {
      if (this.firedTriggers.has(i)) continue;
      if (this.player.cx < triggers[i].tx * TILE_SIZE) continue;
      this.firedTriggers.add(i);
      const effect = triggers[i].effect;
      this.playStory(triggers[i].cards, () => {
        if (effect === 'tantrum') this.player.addRage(TANTRUM_MAX);
        if (effect === 'boss' && this.boss) this.boss.introDone = true;
        if (effect === 'quiz') { this.openQuiz(); return; }
        if (effect === 'ride') this.startRide();
        if (effect === 'grenade') {
          this.run.giveGrenade();
          this.audio.play('powerup');
          this.onCallout?.('GOT: A HAND GRENADE  (G TO THROW)');
        }
        this.resumePlaying();
      });
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
      ...this.faxes,
      ...this.springs,
      ...this.cameras,
      ...this.chutes,
      ...this.things,
      ...this.npcs,
      ...(this.elvisNpc ? [this.elvisNpc] : []),
      ...this.grenades,
      ...this.debris,
      ...(this.boss ? [this.boss] : []),
      ...this.flames,
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
      case GameState.QUIZ:
        // The canvas is low-res pixel art, so the world scrolls in whole pixels.
        const esc = this.currentRuntimeLevel?.spawns.escape;
        this.renderer.render(
          Math.round(this.camera.at(alpha)), this.map, allEntities, this.particles, this.shake,
          (c, x) => {
            this.boss?.drawBackdrop(c, x);
            if (esc) drawFloorSigns(c, x, esc.floors, esc.cols);
          },
        );
        this.dad?.draw(ctx, Math.round(this.camera.at(alpha)) - this.shake.offsetX);
        if (this.player.gliding) {
          const camX = Math.round(this.camera.at(alpha));
          const a = this.state === GameState.PLAYING ? alpha : 1;
          const footY = this.player.prevFootY + (this.player.bottom - this.player.prevFootY) * a;
          drawCanopy(ctx, this.player.cx - camX + this.shake.offsetX, footY + this.shake.offsetY);
        }
        this.drawCheering(ctx, Math.round(this.camera.at(alpha)));
        if (this.player.riding && !this.player.isDead) this.drawRide(ctx, alpha);
        const say = this.player.inSync ? '...' : this.bark?.text;
        if (say) {
          // Tero's side of the conversation (or whatever he's yelling)
          drawBubble(ctx, say, this.player.cx - Math.round(this.camera.at(alpha)) + this.shake.offsetX, this.player.bottom - 46);
        }
        break;
    }

    this.syncPlayerOverlay(alpha);
  }

  private syncPlayerOverlay(alpha: number): void {
    if (!this.onPlayerRender) return;
    const visible =
      this.player && this.camera && this.state !== GameState.TITLE && !this.faxing;
    if (!visible) { this.onPlayerRender(null); return; }

    const p = this.player;
    // Freeze interpolation while the simulation is paused.
    const a = this.state === GameState.PLAYING ? alpha : 1;
    const camX = this.camera.at(a);
    const footX = p.prevCx    + (p.cx     - p.prevCx)    * a;
    const footY = p.prevFootY + (p.bottom - p.prevFootY) * a;

    let frame = getPlayerFrame(p.state);
    // Fire and the parachute have their own poses.
    const breathing = p.isTantrum || p.puffCooldown > PUFF_COOLDOWN - 10;
    if (!p.isDead && breathing && !p.ducking) frame = framePaths.breathe;
    else if (p.gliding) frame = framePaths.glide;
    else if (p.riding && !p.isDead) frame = p.onGround && Math.abs(p.vx) > 0.4 ? framePaths.win : p.onGround ? framePaths.idle : framePaths.jump;
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
      screenY: footY + this.shake.offsetY - (p.riding && !p.isDead ? 26 : 0),   // on Elvis's back
      bobY,
      facingRight: p.facingRight,
      src: frame.src,
      frames: frame.frames,
      frameIdx,
      scaleX: 1 + (p.scaleX - 1) * SQUASH_STRENGTH,
      scaleY: 1 + (p.scaleY - 1) * SQUASH_STRENGTH,
      shouldFlash: p.shouldFlash,
      big: p.isBig,
      tantrum: p.isTantrum,
      hiding: p.isHidden,
      faxed: this.faxedFrames > 0,
    });
  }

  // ─── Level setup ───────────────────────────────────────────────────────────

  /** Loads the current level. `withIntro` plays the chapter/level intro
   *  first — true when arriving fresh, false on retry/restart. */
  private enterPlaying(withIntro = false): void {
    this.audio.init();
    this.audio.stopMusic();
    if (this.story.active) { this.story.cancel(); this.onStory?.(null); }
    if (withIntro && this.currentLevelId === this.builtInPlaylist[0]) this.run.start();
    const assist = !!loadSettings().assist;
    this.log.setAssist(assist);
    const casual = !!unlocks().casualFriday && !!loadSettings().casualFriday;
    setCasualFriday(casual);
    this.audio.setCasual(casual);
    this.loadLevel();
    this.player.assist = assist;
    this.progressX = this.player.cx;
    this.stuckTicks = 0;
    this.note('start');
    this.audio.setFloorMood(this.floorMood());
    // Every floor plays the theme its own way; the vents have Elvis's song.
    const decor = this.levelPack?.decor;
    this.audio.setArrangement(decor);
    this.audio.setBaseSong(decor === 'vents' ? 'vents' : 'main');
    this.audio.setTantrum(false);
    this.audio.setBoss(false);
    this.wasTantrum = false;
    this.hitStop = 0;
    this.audio.startMusic();
    this.stats.reset();
    this.onScore?.(this.stats.score);
    this.onEndScreen?.(null);
    saveSettings({ lastLevelId: this.currentLevelId });
    this.state = GameState.PLAYING;
    if (withIntro) this.playStory(this.introCardIds(), this.startAfterIntro);
    this.syncHud();
  }

  /** 0 on the first built-in floor → 1 on the last; user levels stay at 0. */
  private floorMood(): number {
    const idx = this.builtInPlaylist.indexOf(this.currentLevelId);
    return idx > 0 ? idx / (this.builtInPlaylist.length - 1) : 0;
  }

  /** Fresh arrival on a floor: Tero calls out for Dad, then play. */
  private startAfterIntro = (): void => {
    this.audio.play('dada');
    this.resumePlaying();
  };

  /** Chapter intro (if this level opens a chapter) followed by the level intro. */
  private introCardIds(): string[] {
    const chapter = contentStore().merged.story.chapters
      .find((c) => c.levelIds[0] === this.currentLevelId);
    return [...(chapter?.intro ?? []), ...(this.levelPack?.intro ?? [])];
  }

  private recordStomp(): void {
    this.hitStop = HITSTOP_STOMP;
    this.player.addRage(RAGE_STOMP);
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
    this.flames = [];

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
      const e = enemyClass(s.type);
      if (e.cls === 'walker') this.walkers.push(new Walker(s.tx, s.ty, e.variant));
      else this.hoppers.push(new Hopper(s.tx, s.ty, e.variant));
    }

    this.qblocks = L.spawns.blocks.map(s => new QuestionBlock(s.tx, s.ty));
    for (const qb of this.qblocks) this.map.setTile(qb.tx, qb.ty, 1);

    this.coins = (L.spawns.coins ?? []).map(c => new Coin(c.tx, c.ty));
    this.checkpoints = (L.spawns.checkpoints ?? []).map(c => new Checkpoint(c.tx, c.ty));

    this.mushrooms = [];
    this.goal = new Goal(L.spawns.goal.tx, L.spawns.goal.ty);
    this.goal.kind = L.spawns.goal.kind ?? 'elevator';
    this.goal.label = L.spawns.goal.label ?? '';
    const bs = L.spawns.boss;
    this.boss = !bs ? null
      : bs.type === 'board' ? new Board(bs.arenaTx)
      : bs.type === 'recruiter' ? new Recruiter(bs.arenaTx)
      : new Halvorsen(bs.arenaTx);
    // Gadgets: faxes keep their index in the list so `to` can point at one.
    this.faxes = [];
    this.springs = [];
    this.cameras = [];
    this.chutes = [];
    this.things = [];
    this.elvisNpc = null;
    this.npcs = [];
    this.grenades = [];
    this.elvisYelp = 0;
    this.wasDead = false;
    this.alarmGuards = [];
    const gadgets = L.spawns.gadgets ?? [];
    const faxIndex = new Map<number, number>();
    gadgets.forEach((g, i) => { if (g.type === 'fax') faxIndex.set(i, faxIndex.size); });
    for (const g of gadgets) {
      if (g.type === 'spring') this.springs.push(new Spring(g.tx, g.ty));
      else if (g.type === 'camera') this.cameras.push(new Cctv(g.tx, g.ty, g.sweep));
      else if (g.type === 'chute') this.chutes.push(new ChutePickup(g.tx, g.ty));
      else if (g.type === 'elvis') this.elvisNpc = new ElvisNpc(g.tx, g.ty);
      else if (g.type === 'npc') this.npcs.push(new Npc(g.tx, g.ty, g.variant, g.lines, g.facingRight));
      else if (g.type === 'barrel') this.npcs.push(new Barrel(g.tx, g.ty));
      else if (g.type === 'thing') {
        // Already found on an earlier attempt this run? Then it's gone.
        if (!this.run.data.things.includes(g.id)) this.things.push(new DadThing(g.tx, g.ty, g.id));
      }
      else if (g.type === 'fax') this.faxes.push(new Fax(g.tx, g.ty, g.to !== undefined ? faxIndex.get(g.to) ?? null : null));
    }
    this.faxing = null;
    this.faxedFrames = 0;
    this.fire.clear();
    this.bark = null;
    this.idleTicks = 0;
    const esc = L.spawns.escape;
    this.dad = esc ? new DadFollower() : null;
    this.dad?.reset(this.player);
    this.debris = [];
    this.escapeFrames = esc ? Math.round(esc.seconds * 60 * (loadSettings().assist ? 1.5 : 1)) : 0;
    this.debrisTimer = 120;
    this.goal.locked = this.boss !== null;

    // Each office floor has its own décor; unknown ids fall back to cubicles.
    const decor = this.levelPack?.decor;
    setDecor(decor && isDecorId(decor) ? decor : undefined);

    // Office gags: authored story hints + seeded auto-fill. Kept clear of the
    // elevator so the goal always reads.
    setScenery(L.theme === 'office'
      ? layoutScenery(this.map, {
          levelId: L.id,
          authored: this.levelPack?.scenery,
          mood: this.levelPack?.gagMood,
          density: this.levelPack?.gagDensity,
          decor: decor && isDecorId(decor) ? decor : 'cubicles',
          goalWriting: this.levelPack?.goalWriting
            ? { gag: this.levelPack.goalWriting, centerX: this.goal.x + this.goal.w / 2 }
            : undefined,
          keepClear: [
            [this.goal.x - 40, this.goal.x + this.goal.w + 40],
            ...(this.levelPack?.quietZones ?? []).map(([a, b]): [number, number] => [a * TILE_SIZE, (b + 1) * TILE_SIZE]),
          ],
        })
      : []);
  }

  private endRun(outcome: 'WIN' | 'GAME_OVER'): void {
    const L = this.currentRuntimeLevel ?? this.resolveCurrentLevel();
    const stats: RunStats = {
      coins: this.stats.coins,
      enemiesStomped: this.stats.enemiesStomped,
      sentHome: this.stats.sentHome,
      timeMs: Math.floor(this.stats.elapsedMs()),
    };
    let best = this.stats.getBest(L.id);
    let newBest = false;
    let final: FinalRun | undefined;
    this.note(outcome === 'WIN' ? 'clear' : 'gameover', outcome === 'WIN' ? stats.timeMs : undefined);
    this.log.flush();
    if (outcome === 'WIN') {
      newBest = this.stats.saveBestIfBetter(L.id);
      if (newBest) best = { timeMs: stats.timeMs, score: this.stats.score };
      const idx = this.builtInPlaylist.indexOf(this.currentLevelId);
      if (idx >= 0) {
        const last = idx === this.builtInPlaylist.length - 1;
        const prevBest = bestRun();
        this.run.floorCleared(this.currentLevelId, L.name, stats.timeMs, stats.sentHome, stats.coins, last, this.player.assist);
        if (last) {
          const d = this.run.data;
          final = {
            totalMs: this.run.totalMs,
            splits: d.splits.map((s) => ({ name: s.name, timeMs: s.timeMs })),
            sentHome: d.sentHome,
            deaths: d.events.death,
            tantrums: d.events.tantrum,
            syncs: d.events.sync,
            things: [...d.things],
            thingsTotal: Object.keys(DAD_THINGS).length,
            bestMs: bestRun(),
            newRecord: !d.assist && (prevBest === null || this.run.totalMs < prevBest),
            assist: !!d.assist,
          };
        }
      }
    }
    this.state = outcome === 'WIN' ? GameState.WIN : GameState.GAME_OVER;
    this.onEndScreen?.({
      state: outcome,
      cause: this.player?.lastCause,
      final,
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
      // While raging, the meter shows how much tantrum is left.
      rage:     this.player?.isTantrum
        ? (this.player.tantrumFrames / TANTRUM_FRAMES) * TANTRUM_MAX
        : this.player?.rage ?? 0,
      tantrum:  this.player?.isTantrum ?? false,
      sentHome: this.stats.sentHome,
      assist:   this.player?.assist ?? false,
      grenades: this.run.data.grenades ?? 0,
      runMs:    this.run.totalMs + (this.state === GameState.PLAYING || this.state === GameState.PAUSED ? this.stats.elapsedMs() : 0),
      countdown: this.dad ? Math.max(0, Math.ceil(this.escapeFrames / 60)) : null,
      boss:     this.boss?.fighting
        ? { name: this.boss.name, hp: this.boss.hp, maxHp: this.boss.maxHp, slide: this.boss.subtitle }
        : null,
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

/** A random line (or the `i`th, for stable picks). */
function pick<T>(xs: readonly T[], i?: number): T {
  return xs[i !== undefined ? i % xs.length : Math.floor(Math.random() * xs.length)];
}
