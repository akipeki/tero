// file: scripts/shareCard.ts — the link-preview card, drawn all in pixels.
//
// Same pixel font and Raster as the game; Tero is the first frame of his idle
// animation. Built at build time by app/opengraph-image.tsx and
// app/twitter-image.tsx (Node only).

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { Raster } from '../game/render/pixel/Raster';
import { drawText } from '../game/render/pixel/font';
import { GAME_TITLE_LINES, GAME_SUBTITLE } from '../game/title';
import { encodePng } from './png';

/** Card in "big pixels": 400×210, scaled ×3 to 1200×630. */
const W = 400, H = 210, SCALE = 3;

function hex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

function shadowText(r: Raster, text: string, x: number, y: number, color: string, scale: number): void {
  drawText(r, text, x + Math.max(1, scale / 2), y + Math.max(1, scale / 2), '#0b0910', scale);
  drawText(r, text, x, y, color, scale);
}

export async function shareCardPng(): Promise<Buffer> {
  const r = new Raster(W, H);
  r.rect(0, 0, W, H, '#1b1620');
  // a faint office window grid behind everything
  for (let x = 6; x < W; x += 34) for (let y = 8; y < H - 30; y += 28) r.rect(x, y, 26, 20, '#221c2a');
  // floor + yellow/black safety tape, like every ledge in the game
  r.rect(0, H - 22, W, 22, '#2c2433');
  for (let x = -8; x < W; x += 8) for (let j = 0; j < 4; j++) {
    r.rect(x + j, H - 26 + j, 4, 1, '#ffd23f');
    r.rect(x + 4 + j, H - 26 + j, 4, 1, '#14110f');
  }

  // Tero, 64×64 ×2
  const strip = await readFile(join(process.cwd(), 'public/images/dragon/idle.png'));
  const { data, info } = await sharp(strip).extract({ left: 0, top: 0, width: 64, height: 64 })
    .raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const ox = 22, oy = H - 26 - 128 + 4;
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
    const i = (y * info.width + x) * 4;
    if (data[i + 3] < 128) continue;
    r.rect(ox + x * 2, oy + y * 2, 2, 2, hex(data[i], data[i + 1], data[i + 2]));
  }

  // text block
  const tx = 172;
  GAME_TITLE_LINES.forEach((line, i) => shadowText(r, line, tx, 22 + i * 34, '#ffe066', 6));
  shadowText(r, GAME_SUBTITLE, tx, 96, '#ff7a3d', 2);
  shadowText(r, 'A TODDLER IN A DRAGON SUIT', tx, 124, '#c9ced6', 2);
  shadowText(r, 'VS. LATE CAPITALISM.', tx, 138, '#c9ced6', 2);

  return encodePng(r, SCALE);
}
