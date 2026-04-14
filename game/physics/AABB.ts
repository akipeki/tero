/** Axis-Aligned Bounding Box helpers */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Returns true if two rects overlap */
export function overlaps(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

/** Returns true if `a` overlaps `b` on its top face (stomp detection).
 *  `a` must be moving downward (vy > 0) and its previous bottom was above b.top.
 */
export function stompOverlap(a: Rect, aPrevBottom: number, b: Rect): boolean {
  const horizontalOverlap =
    a.x + a.w > b.x + 2 && a.x < b.x + b.w - 2;
  const verticalCross =
    aPrevBottom <= b.y && a.y + a.h >= b.y;
  return horizontalOverlap && verticalCross;
}

/** Penetration depth on each axis (positive = overlap amount) */
export function penetration(a: Rect, b: Rect): { px: number; py: number } {
  const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return { px: overlapX, py: overlapY };
}
