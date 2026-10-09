// file: game/render/office/ventArt.ts
//
// Art for the vents and the way in: Elvis, the duct opening Tero jumps
// into, the OUT OF ORDER elevator, the resistance's barrel fire and the
// grenade they give him.

import { t, t as tr, getLang } from '../../i18n';
import { blitArt } from '../customImages';
import { Raster } from '../pixel/Raster';
import { drawText, drawTextCentered, textWidth } from '../pixel/font';
import { drawElvis, ELVIS_W, ELVIS_H, type ElvisPose } from '../characters/creatures';
import { riggedFacings } from './OfficeSprites';

const INK = '#1b1620';
const cache = new Map<string, HTMLCanvasElement>();
function cached(key: string, make: () => Raster): HTMLCanvasElement {
  let c = cache.get(key);
  if (!c) { c = make().toCanvas(); cache.set(key, c); }
  return c;
}

/** Elvis with his paws at (footX, footY) in screen px. */
export function drawElvisAt(ctx: CanvasRenderingContext2D, footX: number, footY: number, pose: ElvisPose, facingRight: boolean): void {
  if (blitArt(ctx, 'elvis', pose, footX - ELVIS_W / 2, footY - ELVIS_H + 2, ELVIS_W, ELVIS_H, !facingRight)) return;
  const f = riggedFacings(`elvis:${pose}`, () => drawElvis(pose));
  ctx.drawImage(facingRight ? f.right : f.left, Math.round(footX - ELVIS_W / 2), Math.round(footY - ELVIS_H + 2));
}

/** A duct opening in the wall at floor level, bottom-centre at (cx, floorY). */
export function drawVentHole(ctx: CanvasRenderingContext2D, cx: number, floorY: number, label: string): void {
  label = t(label);
  const c = cached(`vent:${label}`, () => {
    const w = 56, h = 46;
    const r = new Raster(w, h + 14);
    r.rect(0, 14, w, h, '#5d6875');
    r.rect(2, 16, w - 4, h - 2, '#9aa6b3');
    r.rect(6, 20, w - 12, h - 6, '#14161c');                // the dark inside
    for (let y = 22; y < 14 + h; y += 6) r.rect(8, y, w - 16, 1, '#232733');   // ribs going in
    r.rect(w - 14, 16, 3, h - 2, '#4d5662');                 // the bent grate, hanging off
    const tw = textWidth(label) + 6;
    r.rect(Math.floor((w - tw) / 2), 0, tw, 10, '#ffd23f');
    drawTextCentered(r, label, 0, w, 2, INK);
    return r.outline(INK);
  });
  ctx.drawImage(c, Math.round(cx - c.width / 2), Math.round(floorY - c.height + 1));
}

/** Yellow-and-black tape across the elevator doors + the sign. */
export function drawOutOfOrder(ctx: CanvasRenderingContext2D, cx: number, top: number): void {
  const c = cached(`ooo:${getLang()}`, () => {
    const r = new Raster(70, 84);
    for (let i = 0; i < 70; i++) {
      const y1 = 10 + Math.round(i * 0.9), y2 = 73 - Math.round(i * 0.9);
      const col = Math.floor(i / 5) % 2 ? INK : '#ffd23f';
      r.rect(i, y1, 1, 5, col); r.rect(i, y2, 1, 5, col);
    }
    const t = tr('OUT OF ORDER');
    // the sign sits at the top of the doors, clear of the pipe below
    r.rect(Math.floor((70 - textWidth(t) - 6) / 2), 12, textWidth(t) + 6, 11, '#ffffff');
    drawTextCentered(r, t, 0, 70, 15, '#d83b3b');
    return r;
  });
  ctx.drawImage(c, Math.round(cx - 35), Math.round(top));
}

/** The resistance's oil-drum fire. */
export function drawBarrelFire(ctx: CanvasRenderingContext2D, cx: number, floorY: number, t: number): void {
  const x = Math.round(cx - 9), y = Math.round(floorY - 22);
  ctx.fillStyle = INK; ctx.fillRect(x - 1, y - 1, 20, 23);
  ctx.fillStyle = '#7a4a2a'; ctx.fillRect(x, y, 18, 21);
  ctx.fillStyle = '#9c6236'; ctx.fillRect(x, y + 5, 18, 2); ctx.fillRect(x, y + 14, 18, 2);
  const f = Math.floor(t / 6) % 3;
  ctx.fillStyle = '#ff8c3a'; ctx.fillRect(x + 3, y - 6 - f, 12, 7 + f);
  ctx.fillStyle = '#ffd23f'; ctx.fillRect(x + 6, y - 9 + f, 6, 8);
  ctx.fillStyle = '#fff6b0'; ctx.fillRect(x + 8, y - 4, 2, 3);
}

/** The grenade: olive, pin, and a label so nobody panics. */
export function drawGrenade(ctx: CanvasRenderingContext2D, cx: number, cy: number, spin: number): void {
  const c = cached(`grenade:${spin % 4}`, () => {
    const r = new Raster(14, 16);
    r.part(INK, (t) => t.ellipse(7, 9, 5, 6, '#5f7a3a'));
    r.rect(4, 7, 6, 1, '#4a5f2c'); r.rect(4, 11, 6, 1, '#4a5f2c');
    r.part(INK, (t) => t.rect(5, 1, 4, 3, '#8a8f96'));
    r.px(10 + (spin % 2), 2, '#ffd23f');                    // the pin
    r.rect(3, 8, 8, 3, '#f4f1e6');
    drawText(r, 'HR', 4, 8, '#d83b3b');
    return r;
  });
  ctx.drawImage(c, Math.round(cx - 7), Math.round(cy - 8));
}
