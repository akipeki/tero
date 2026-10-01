// file: game/render/pixel/font.ts
//
// 3×5 pixel font for signs, banners and sticky notes drawn on a Raster.
// Each glyph is 5 rows of 3 bits; characters advance 4 px (×scale).

import type { Color, Raster } from './Raster';

const G: Record<string, string> = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110',
  E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101',
  I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111',
  M: '101111101101101', N: '110101101101101', O: '010101101101010', P: '110101110100100',
  Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
  U: '101101101101111', V: '101101101101010', W: '101101101111101', X: '101101010101101',
  Y: '101101010010010', Z: '111001010100111',
  0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110',
  4: '101101111001001', 5: '111100110001110', 6: '011100111101111', 7: '111001010010010',
  8: '111101111101111', 9: '111101111001110',
  ' ': '000000000000000', '!': '010010010000010', '?': '110001010000010', '.': '000000000000010',
  ',': '000000000010100', ':': '000010000010000', '-': '000000111000000', '=': '000111000111000',
  '%': '101001010100101', '$': '011110010011110', '#': '101111101111101', '&': '010101010101011',
  "'": '010010000000000', '/': '001001010100100', '+': '000010111010000', '(': '010100100100010',
  ')': '010001001001010', '♥': '101111111010000', '"': '101101000000000',
};

export function textWidth(text: string, scale = 1): number {
  return Math.max(0, text.length * 4 - 1) * scale;
}

/** Draws upper-cased `text` with its top-left at (x, y). */
export function drawText(r: Raster, text: string, x: number, y: number, color: Color, scale = 1): void {
  [...text.toUpperCase()].forEach((ch, i) => {
    const bits = G[ch] ?? G['?'];
    for (let k = 0; k < 15; k++) {
      if (bits[k] !== '1') continue;
      r.rect(x + (i * 4 + (k % 3)) * scale, y + Math.floor(k / 3) * scale, scale, scale, color);
    }
  });
}

/** Centres `text` horizontally inside [x, x + w). */
export function drawTextCentered(r: Raster, text: string, x: number, w: number, y: number, color: Color, scale = 1): void {
  drawText(r, text, x + Math.floor((w - textWidth(text, scale)) / 2), y, color, scale);
}
