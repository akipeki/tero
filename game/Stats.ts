// file: game/Stats.ts
//
// Lightweight aggregator for run stats — score, coins, enemies stomped,
// best time persisted per level.

import { COIN_VALUE, STOMP_VALUE, CHAIN_BONUS } from './constants';

const BEST_KEY = 'tero:best';

export class Stats {
  score = 0;
  coins = 0;
  enemiesStomped = 0;
  startTime = 0;
  pausedAt: number | null = null;
  pausedDelta = 0;

  reset(): void {
    this.score = 0;
    this.coins = 0;
    this.enemiesStomped = 0;
    this.startTime = performance.now();
    this.pausedAt = null;
    this.pausedDelta = 0;
  }

  addCoin(): void {
    this.coins++;
    this.score += COIN_VALUE;
  }

  addStomp(airChain: number): void {
    this.enemiesStomped++;
    const bonus = Math.max(0, airChain - 1) * CHAIN_BONUS;
    this.score += STOMP_VALUE + bonus;
  }

  pause(): void {
    if (this.pausedAt === null) this.pausedAt = performance.now();
  }

  resume(): void {
    if (this.pausedAt !== null) {
      this.pausedDelta += performance.now() - this.pausedAt;
      this.pausedAt = null;
    }
  }

  elapsedMs(): number {
    if (!this.startTime) return 0;
    const now = this.pausedAt ?? performance.now();
    return Math.max(0, now - this.startTime - this.pausedDelta);
  }

  /** Returns the previous best for `levelId`, or null. */
  getBest(levelId: string): { timeMs: number; score: number } | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(BEST_KEY);
      if (!raw) return null;
      const map = JSON.parse(raw) as Record<string, { timeMs: number; score: number }>;
      return map[levelId] ?? null;
    } catch {
      return null;
    }
  }

  /** Saves best for `levelId` if current run is better. Returns true if saved. */
  saveBestIfBetter(levelId: string): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const raw = window.localStorage.getItem(BEST_KEY);
      const map = raw ? (JSON.parse(raw) as Record<string, { timeMs: number; score: number }>) : {};
      const prev = map[levelId];
      const current = { timeMs: Math.floor(this.elapsedMs()), score: this.score };
      const improved =
        !prev ||
        current.score > prev.score ||
        (current.score === prev.score && current.timeMs < prev.timeMs);
      if (improved) {
        map[levelId] = current;
        window.localStorage.setItem(BEST_KEY, JSON.stringify(map));
      }
      return improved;
    } catch {
      return false;
    }
  }
}
