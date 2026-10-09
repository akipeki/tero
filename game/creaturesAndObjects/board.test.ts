import { describe, expect, it } from 'vitest';
import { Board } from './Board';
import { Player } from './Player';
import { Flame } from './Flame';
import { Debris } from './Escape';
import { Tilemap } from '../level/Tilemap';
import { ParticleSystem } from '../ParticleSystem';
import { ScreenShake } from '../ScreenShake';
import { level6Tiles, level6Spawns, LEVEL6_WIDTH, LEVEL6_HEIGHT } from '../level/level6';
import { level9Spawns, LEVEL9_WIDTH } from '../level/level9';
import type { UpdateCtx } from './creaturesAndObjects';
import type { AudioManager } from '../AudioManager';

const ctx = (): UpdateCtx => ({
  map: new Tilemap([...level6Tiles], LEVEL6_WIDTH, LEVEL6_HEIGHT),
  particles: new ParticleSystem(),
  audio: { play: () => {} } as unknown as AudioManager,
  shake: new ScreenShake(),
  dt: 1 / 60,
});

type HeadView = { state: string; x: number; y: number };
const headsOf = (b: Board) => (b as unknown as { heads: HeadView[] }).heads;

/** A Tero standing far off to the left, out of harm's way. */
const bystander = () => { const p = new Player(64 * 32 + 40, 7 * 32 - 28, 3); (p as unknown as { invincible: number }).invincible = 100000; return p; };

describe('THE BOARD', () => {
  const ARENA = level6Spawns.boss!.arenaTx;

  it('has five heads, and a lunge ends with a head dizzy on the floor', () => {
    const c = ctx();
    const b = new Board(ARENA);
    b.start();
    expect(b.hp).toBe(5);
    let down = false;
    for (let i = 0; i < 600 && !down; i++) {
      b.tick(c, bystander(), []);
      down = headsOf(b).some((h) => h.state === 'down');
    }
    expect(down).toBe(true);
  });

  it('stomping a dizzy head makes it resign; five resignations end the meeting', () => {
    const c = ctx();
    const b = new Board(ARENA);
    b.start();
    for (let n = 0; n < 5; n++) {
      let head: HeadView | undefined;
      for (let i = 0; i < 900 && !head; i++) {
        b.tick(c, bystander(), []);
        head = headsOf(b).find((h) => h.state === 'down');
      }
      expect(head).toBeDefined();
      const p = new Player(head!.x + 9, head!.y - 28 - 2, 3);
      p.prevBottom = head!.y - 2;
      p.vy = 4;
      p.y += 4;
      b.tick(c, p, []);
      expect(b.hp).toBe(4 - n);
      expect(b.resigned.length).toBe(1);
      b.resigned = [];
    }
    expect(b.phase).toBe('freed');
    expect(b.freedNow).toBe(true);
    for (let i = 0; i < 200 && !b.walkedOut; i++) b.tick(c, bystander(), []);
    expect(b.walkedOut).toBe(true);
  });

  it('dragon fire burns a head down', () => {
    const c = ctx();
    const b = new Board(ARENA);
    b.start();
    const h = headsOf(b)[0];
    for (let i = 0; i < 12; i++) b.tick(c, bystander(), [new Flame(h.x + 20, h.y + 16, 0, 0, 20, true)]);
    expect(b.hp).toBe(4);
  });
});

describe('the way home', () => {
  it('is 33 floors long, with time on the clock', () => {
    const esc = level9Spawns.escape!;
    expect(esc.floors).toBe(33);
    expect(LEVEL9_WIDTH).toBeGreaterThanOrEqual(esc.floors * esc.cols);
    expect(esc.seconds).toBeGreaterThan(40);
  });

  it('a ceiling tile warns, then falls and shatters on the floor', () => {
    const c = ctx();
    const d = new Debris(5 * 32);
    const y0 = d.y;
    for (let i = 0; i < 30; i++) d.update(c);
    expect(d.y).toBe(y0);                 // still warning
    for (let i = 0; i < 120 && d.active; i++) d.update(c);
    expect(d.active).toBe(false);
  });
});
