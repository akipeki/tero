import { describe, it, expect, vi } from 'vitest';
import { StoryPlayer } from './StoryPlayer';
import type { StoryCard } from './content/types';

const card = (id: string, text: string): StoryCard => ({ id, text });

describe('StoryPlayer', () => {
  it('calls onDone immediately for an empty sequence', () => {
    const p = new StoryPlayer();
    const done = vi.fn();
    p.start([], done);
    expect(done).toHaveBeenCalledOnce();
    expect(p.active).toBe(false);
  });

  it('reveals text over ticks', () => {
    const p = new StoryPlayer();
    p.start([card('a', 'hello')], () => {});
    expect(p.revealed).toBe(0);
    for (let i = 0; i < 100; i++) p.tick();
    expect(p.revealed).toBe(5);
    expect(p.cardComplete).toBe(true);
  });

  it('first advance completes the card, second moves on, last finishes', () => {
    const p = new StoryPlayer();
    const done = vi.fn();
    p.start([card('a', 'one'), card('b', 'two')], done);

    p.advance();                       // finish typing
    expect(p.index).toBe(0);
    expect(p.cardComplete).toBe(true);

    p.advance();                       // next card, typing restarts
    expect(p.index).toBe(1);
    expect(p.revealed).toBe(0);

    p.advance(); p.advance();          // complete + finish
    expect(done).toHaveBeenCalledOnce();
    expect(p.active).toBe(false);
  });

  it('skip finishes the whole sequence; cancel does not call onDone', () => {
    const skipped = new StoryPlayer();
    const done = vi.fn();
    skipped.start([card('a', 'x'), card('b', 'y')], done);
    skipped.skip();
    expect(done).toHaveBeenCalledOnce();

    const cancelled = new StoryPlayer();
    const never = vi.fn();
    cancelled.start([card('a', 'x')], never);
    cancelled.cancel();
    expect(never).not.toHaveBeenCalled();
    expect(cancelled.active).toBe(false);
  });
});
