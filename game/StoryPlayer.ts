// file: game/StoryPlayer.ts
//
// Plays a queue of story cards with a typewriter reveal. Pure logic — Game
// feeds it input and forwards what changed to the React overlay.

import { STORY_CHARS_PER_TICK } from './constants';
import type { StoryCard } from './content/types';

export class StoryPlayer {
  private cards: StoryCard[] = [];
  private idx = 0;
  private reveal = 0;
  private onDone: (() => void) | null = null;

  get active(): boolean { return this.onDone !== null; }
  get index(): number   { return this.idx; }
  get total(): number   { return this.cards.length; }
  get card(): StoryCard | null { return this.active ? this.cards[this.idx] : null; }
  /** Whole characters of the current card shown so far. */
  get revealed(): number { return Math.floor(this.reveal); }
  get cardComplete(): boolean {
    const c = this.card;
    return !c || this.reveal >= c.text.length;
  }

  /** Begins a sequence. With no cards, calls `onDone` right away. */
  start(cards: StoryCard[], onDone: () => void): void {
    if (cards.length === 0) { onDone(); return; }
    this.cards = cards;
    this.idx = 0;
    this.reveal = 0;
    this.onDone = onDone;
  }

  tick(): void {
    const c = this.card;
    if (c) this.reveal = Math.min(c.text.length, this.reveal + STORY_CHARS_PER_TICK);
  }

  /** First press finishes the typewriter; the next moves to the next card. */
  advance(): void {
    const c = this.card;
    if (!c) return;
    if (!this.cardComplete) { this.reveal = c.text.length; return; }
    if (this.idx < this.cards.length - 1) {
      this.idx++;
      this.reveal = 0;
    } else {
      this.finish();
    }
  }

  /** Ends the whole sequence immediately. */
  skip(): void {
    if (this.active) this.finish();
  }

  /** Drops the sequence without calling its completion callback. */
  cancel(): void {
    this.cards = [];
    this.idx = 0;
    this.reveal = 0;
    this.onDone = null;
  }

  private finish(): void {
    const done = this.onDone;
    this.cancel();
    done?.();
  }
}
