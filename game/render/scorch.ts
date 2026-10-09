// file: game/render/scorch.ts
//
// "That fire hit him": a sprite flashed hot orange for a few frames.
// tinted() caches a solid-colour silhouette of a sprite canvas; drawScorch()
// lays it over the sprite you just drew.

const cache = new WeakMap<HTMLCanvasElement, Map<string, HTMLCanvasElement>>();

export function tinted(src: HTMLCanvasElement, color: string): HTMLCanvasElement {
  let byColor = cache.get(src);
  if (!byColor) { byColor = new Map(); cache.set(src, byColor); }
  let c = byColor.get(color);
  if (!c) {
    c = document.createElement('canvas');
    c.width = src.width; c.height = src.height;
    const g = c.getContext('2d')!;
    g.drawImage(src, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = color;
    g.fillRect(0, 0, c.width, c.height);
    byColor.set(color, c);
  }
  return c;
}

/** Overlays a hot flash on a sprite drawn at (x, y). `k` 0..1 fades it. */
export function drawScorch(ctx: CanvasRenderingContext2D, src: HTMLCanvasElement, x: number, y: number, k: number): void {
  if (k <= 0 || typeof document === 'undefined') return;
  const a = ctx.globalAlpha;
  ctx.globalAlpha = a * Math.min(1, k) * 0.7;
  ctx.drawImage(tinted(src, k > 0.6 ? '#fff6b0' : '#ff9a52'), Math.round(x), Math.round(y));
  ctx.globalAlpha = a;
}
