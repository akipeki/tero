import { describe, it, expect, beforeEach } from 'vitest';
import { Stats } from './Stats';
import { COIN_VALUE, STOMP_VALUE, CHAIN_BONUS } from './constants';

describe('Stats', () => {
  let s: Stats;
  beforeEach(() => { s = new Stats(); s.reset(); });

  it('adds coin value', () => {
    s.addCoin();
    expect(s.coins).toBe(1);
    expect(s.score).toBe(COIN_VALUE);
  });

  it('first stomp gives no chain bonus', () => {
    s.addStomp(1);
    expect(s.score).toBe(STOMP_VALUE);
    expect(s.enemiesStomped).toBe(1);
  });

  it('subsequent chain stomps add CHAIN_BONUS per extra link', () => {
    s.addStomp(1);
    s.addStomp(2);
    s.addStomp(3);
    expect(s.score).toBe(STOMP_VALUE * 3 + CHAIN_BONUS * 1 + CHAIN_BONUS * 2);
    expect(s.enemiesStomped).toBe(3);
  });

  it('elapsedMs increases over time and pauses cleanly', () => {
    s.startTime = performance.now() - 1000;
    expect(s.elapsedMs()).toBeGreaterThanOrEqual(900);
    s.pause();
    const a = s.elapsedMs();
    // some real wall time may pass between pause and the next read
    const b = s.elapsedMs();
    expect(Math.abs(b - a)).toBeLessThan(50);
  });
});
