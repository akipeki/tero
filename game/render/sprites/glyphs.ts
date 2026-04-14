// file: game/render/sprites/glyphs.ts

export const QUESTION_MARK_GLYPH = [
  '01110',
  '10001',
  '00001',
  '00110',
  '00100',
  '00000',
  '00100',
] as const;

export function drawGlyph(
  ctx: CanvasRenderingContext2D,
  glyph: readonly string[],
  x: number,
  y: number,
  pixelSize: number,
  color: string,
): void {
  ctx.fillStyle = color;

  for (let row = 0; row < glyph.length; row++) {
    for (let col = 0; col < glyph[row].length; col++) {
      if (glyph[row][col] !== '1') continue;

      ctx.fillRect(
        x + col * pixelSize,
        y + row * pixelSize,
        pixelSize,
        pixelSize,
      );
    }
  }
}