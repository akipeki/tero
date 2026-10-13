import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PlaytestLog, loadSessions, importSessions, clearSessions } from './Playtest';
import { Player } from './creaturesAndObjects/Player';
import { Tilemap } from './level/Tilemap';
import { buildLevel } from './level/buildLevel';
import { ParticleSystem } from './ParticleSystem';
import { ScreenShake } from './ScreenShake';
import type { UpdateCtx } from './creaturesAndObjects/creaturesAndObjects';
import type { AudioManager } from './AudioManager';

function fakeStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => { m.set(k, v); },
    removeItem: (k: string) => { m.delete(k); },
  };
}

describe('playtest log', () => {
  beforeEach(() => { vi.stubGlobal('window', { localStorage: fakeStorage() }); });
  afterEach(() => { vi.unstubAllGlobals(); });

  it('records events in tiles with the floor id, and saves on flush', () => {
    const log = new PlaytestLog();
    log.record('death', 'b_level_3', 20 * 32 + 5, 7 * 32, 'pit');
    log.flush();
    const [s] = loadSessions();
    expect(s.events[0]).toMatchObject({ t: 'death', level: '3', tx: 20, ty: 7, d: 'pit' });
  });

  it('imports testers\' logs once', () => {
    const log = new PlaytestLog();
    log.record('start', 'b_level_1', 0, 0);
    log.flush();
    const mine = loadSessions();
    const theirs = [{ id: 'abc', tester: 'Sam', startedAt: 0, assist: false, events: [] }];
    expect(importSessions([...mine, ...theirs])).toBe(1);
    expect(importSessions(theirs)).toBe(0);
    expect(loadSessions()).toHaveLength(2);
    clearSessions();
    expect(loadSessions()).toHaveLength(0);
  });
});

describe('Bring Your Kid to Work Day', () => {
  const ctx = (): UpdateCtx => {
    const b = buildLevel(['....', '....', '....', '....', '....', '....', '....', '....', '##..', '##..', '##..', '##..']);
    return { map: new Tilemap(b.tiles, b.width, b.height), particles: new ParticleSystem(), audio: { play: () => {} } as unknown as AudioManager, shake: new ScreenShake(), dt: 1 / 60 };
  };

  it('a pit puts Tero back on safe ground and costs no life', () => {
    const c = ctx();
    const p = new Player(4, 8 * 32 - 28, 3);
    p.assist = true;
    for (let i = 0; i < 5; i++) p.update(c);           // stand on the ledge
    p.x = 3 * 32;                                       // over the pit
    for (let i = 0; i < 120 && !p.rescued; i++) p.update(c);
    expect(p.rescued).toBe(true);
    expect(p.lives).toBe(3);
    expect(p.x).toBeLessThan(2 * 32);
  });

  it('dying costs no life, and the meter fills twice as fast', () => {
    const p = new Player(0, 0, 3);
    p.assist = true;
    p.die(ctx(), 'pig');
    expect(p.lives).toBe(3);
    expect(p.lastCause).toBe('pig');
    const q = new Player(0, 0, 3);
    q.assist = true;
    q.addRage(10);
    expect(q.rage).toBe(20);
  });
});
