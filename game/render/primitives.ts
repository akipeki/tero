// file: game/render/primitives.ts

export function fillPixelRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
}

export function withSave(
  ctx: CanvasRenderingContext2D,
  draw: () => void,
): void {
  ctx.save();
  draw();
  ctx.restore();
}

export function drawBattlements(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  merlonWidth: number,
  merlonHeight: number,
  gapWidth: number,
) {
  const step = merlonWidth + gapWidth;
  for (let dx = 0; dx < width; dx += step) {
    ctx.fillRect(x + dx, y, merlonWidth, merlonHeight);
  }
}