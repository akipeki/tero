import { GRAVITY, MAX_FALL_SPD, TILE_SIZE } from '../constants';
import { TileType } from '../types';
import type { Tilemap } from '../level/Tilemap';

export interface PhysicsBody {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  onGround: boolean;
}

/** Apply gravity + integrate velocity, resolve tile collisions.
 *  Mutates body in place. Returns whether body hit a ceiling this frame.
 */
export function stepBody(body: PhysicsBody, map: Tilemap): { hitCeiling: boolean } {
  // Gravity
  body.vy = Math.min(body.vy + GRAVITY, MAX_FALL_SPD);

  // ── Horizontal movement ─────────────────────────────────────────────────
  body.x += body.vx;

  const colH = sweepHorizontal(body, map);
  if (colH) body.vx = 0;

  // ── Vertical movement ───────────────────────────────────────────────────
  const prevY = body.y;
  body.y += body.vy;
  body.onGround = false;

  const colV = sweepVertical(body, map, prevY);
  let hitCeiling = false;

  if (colV.ground) {
    body.onGround = true;
    body.vy = 0;
  }
  if (colV.ceiling) {
    body.vy = Math.max(body.vy, 0);
    hitCeiling = true;
  }

  return { hitCeiling };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sweepHorizontal(body: PhysicsBody, map: Tilemap): boolean {
  const left   = Math.floor(body.x / TILE_SIZE);
  const right  = Math.floor((body.x + body.w - 1) / TILE_SIZE);
  const top    = Math.floor(body.y / TILE_SIZE);
  const bottom = Math.floor((body.y + body.h - 1) / TILE_SIZE);

  let hit = false;

  for (let ty = top; ty <= bottom; ty++) {
    for (const tx of [left, right]) {
      const tile = map.tileAt(tx, ty);
      if (tile !== TileType.SOLID) continue;

      const tileLeft  = tx * TILE_SIZE;
      const tileRight = tileLeft + TILE_SIZE;

      if (body.vx > 0 && body.x + body.w > tileLeft) {
        body.x = tileLeft - body.w;
        hit = true;
      } else if (body.vx < 0 && body.x < tileRight) {
        body.x = tileRight;
        hit = true;
      }
    }
  }

  return hit;
}

function sweepVertical(
  body: PhysicsBody,
  map: Tilemap,
  prevY: number,
): { ground: boolean; ceiling: boolean } {
  const left  = Math.floor(body.x / TILE_SIZE);
  const right = Math.floor((body.x + body.w - 1) / TILE_SIZE);
  const top   = Math.floor(body.y / TILE_SIZE);
  const bot   = Math.floor((body.y + body.h - 1) / TILE_SIZE);

  let ground  = false;
  let ceiling = false;

  for (let tx = left; tx <= right; tx++) {
    // ── Check floor (solid + platform) ────────────────────────────────────
    for (const ty of [top, bot]) {
      const tile = map.tileAt(tx, ty);

      if (tile === TileType.SOLID) {
        const tileTop = ty * TILE_SIZE;
        const tileBotEdge = tileTop + TILE_SIZE;

        if (body.vy >= 0 && body.y + body.h > tileTop && prevY + body.h <= tileTop + 1) {
          body.y = tileTop - body.h;
          ground = true;
        } else if (body.vy < 0 && body.y < tileBotEdge && prevY >= tileBotEdge - 1) {
          body.y = tileBotEdge;
          ceiling = true;
        }
      }

      if (tile === TileType.PLATFORM && body.vy >= 0) {
        const tileTop = ty * TILE_SIZE;
        if (body.y + body.h > tileTop && prevY + body.h <= tileTop + 1) {
          body.y = tileTop - body.h;
          ground = true;
        }
      }
    }
  }

  return { ground, ceiling };
}
