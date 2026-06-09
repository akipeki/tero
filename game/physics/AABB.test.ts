import { describe, it, expect } from 'vitest';
import { overlaps, stompOverlap, penetration } from './AABB';

describe('AABB.overlaps', () => {
  it('detects overlap', () => {
    expect(overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 })).toBe(true);
  });

  it('rejects rects that just touch on the edge', () => {
    // Strict inequality (a.x + a.w > b.x): touching != overlapping
    expect(overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 })).toBe(false);
  });

  it('detects vertical separation', () => {
    expect(overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 0, y: 20, w: 10, h: 10 })).toBe(false);
  });
});

describe('AABB.stompOverlap', () => {
  it('counts a fall onto enemy top as a stomp', () => {
    const player = { x: 0, y: 9, w: 8, h: 8 };
    const enemy  = { x: 0, y: 10, w: 8, h: 8 };
    expect(stompOverlap(player, /* prevBottom = */ 9, enemy)).toBe(true);
  });

  it('does not stomp from below or the side', () => {
    const player = { x: 0, y: 15, w: 8, h: 8 };
    const enemy  = { x: 0, y: 10, w: 8, h: 8 };
    expect(stompOverlap(player, /* prevBottom = */ 23, enemy)).toBe(false);
  });
});

describe('AABB.penetration', () => {
  it('returns positive overlap on both axes', () => {
    const { px, py } = penetration(
      { x: 0, y: 0, w: 10, h: 10 },
      { x: 5, y: 6, w: 10, h: 10 },
    );
    expect(px).toBe(5);
    expect(py).toBe(4);
  });
});
