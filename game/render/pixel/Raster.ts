// file: game/render/pixel/Raster.ts
//
// Tiny pixel-art canvas that works without the DOM, so the same drawing code
// runs in the browser (→ canvas) and in Node (→ PNG, see scripts/).
// Coordinates are pixel indices; shapes test pixel centres, alpha is 0 or 255.

export type Color = string; // '#rrggbb'

const rgbCache = new Map<string, [number, number, number]>();
function rgb(c: Color): [number, number, number] {
  let v = rgbCache.get(c);
  if (!v) {
    const n = parseInt(c.slice(1, 7), 16);
    v = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    rgbCache.set(c, v);
  }
  return v;
}

export class Raster {
  readonly data: Uint8ClampedArray;

  constructor(readonly w: number, readonly h: number) {
    this.data = new Uint8ClampedArray(w * h * 4);
  }

  opaque(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return false;
    return this.data[(y * this.w + x) * 4 + 3] !== 0;
  }

  px(x: number, y: number, c: Color): void {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const [r, g, b] = rgb(c);
    const i = (y * this.w + x) * 4;
    this.data[i] = r; this.data[i + 1] = g; this.data[i + 2] = b; this.data[i + 3] = 255;
  }

  rect(x: number, y: number, w: number, h: number, c: Color): void {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c);
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, c: Color): void {
    this.shadedEllipse(cx, cy, rx, ry, c);
  }

  /** Ellipse with a 3-tone ball shading — light from the top-left. */
  shadedEllipse(
    cx: number, cy: number, rx: number, ry: number,
    base: Color, light?: Color, dark?: Color,
  ): void {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const nx = (x - cx) / rx, ny = (y - cy) / ry;
        if (nx * nx + ny * ny > 1.02) continue;
        let c = base;
        if (dark  && nx * 0.45 + ny * 0.9 >  0.55) c = dark;
        else if (light && -nx * 0.5 - ny * 0.85 > 0.5) c = light;
        this.px(x, y, c);
      }
    }
  }

  /** Thick line made of discs — limbs, tails, ties. */
  capsule(x0: number, y0: number, x1: number, y1: number, r: number, c: Color): void {
    const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      this.ellipse(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r, r, c);
    }
  }

  line(x0: number, y0: number, x1: number, y1: number, c: Color): void {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      this.px(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, c);
    }
  }

  tri(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, c: Color): void {
    const minX = Math.floor(Math.min(ax, bx, cx)), maxX = Math.ceil(Math.max(ax, bx, cx));
    const minY = Math.floor(Math.min(ay, by, cy)), maxY = Math.ceil(Math.max(ay, by, cy));
    const area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    if (area === 0) return;
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const w0 = ((bx - x) * (cy - y) - (by - y) * (cx - x)) / area;
        const w1 = ((cx - x) * (ay - y) - (cy - y) * (ax - x)) / area;
        const w2 = 1 - w0 - w1;
        if (w0 >= -0.02 && w1 >= -0.02 && w2 >= -0.02) this.px(x, y, c);
      }
    }
  }

  /** Adds a 1px outline around everything opaque (4-neighbour). */
  outline(c: Color): this {
    const edge: number[] = [];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.opaque(x, y)) continue;
        if (this.opaque(x - 1, y) || this.opaque(x + 1, y) ||
            this.opaque(x, y - 1) || this.opaque(x, y + 1)) edge.push(x, y);
      }
    }
    for (let i = 0; i < edge.length; i += 2) this.px(edge[i], edge[i + 1], c);
    return this;
  }

  /** Copies opaque pixels of `src` on top of this raster. */
  draw(src: Raster, dx = 0, dy = 0): this {
    for (let y = 0; y < src.h; y++) {
      for (let x = 0; x < src.w; x++) {
        const si = (y * src.w + x) * 4;
        if (src.data[si + 3] === 0) continue;
        const tx = x + dx, ty = y + dy;
        if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) continue;
        const ti = (ty * this.w + tx) * 4;
        this.data[ti] = src.data[si]; this.data[ti + 1] = src.data[si + 1];
        this.data[ti + 2] = src.data[si + 2]; this.data[ti + 3] = 255;
      }
    }
    return this;
  }

  /** Draws `fn` on a scratch layer, outlines it, and stamps it on top —
   *  so each body part gets its own cartoon outline. */
  part(outlineColor: Color | null, fn: (r: Raster) => void): this {
    const layer = new Raster(this.w, this.h);
    fn(layer);
    if (outlineColor) layer.outline(outlineColor);
    return this.draw(layer);
  }

  flipX(): Raster {
    const out = new Raster(this.w, this.h);
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const si = (y * this.w + x) * 4, ti = (y * this.w + (this.w - 1 - x)) * 4;
        for (let k = 0; k < 4; k++) out.data[ti + k] = this.data[si + k];
      }
    }
    return out;
  }

  /** Browser only. */
  toCanvas(): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = this.w; c.height = this.h;
    c.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(this.data), this.w, this.h), 0, 0);
    return c;
  }
}

/** Lays frames side by side into one horizontal strip. */
export function strip(frames: Raster[]): Raster {
  const fw = frames[0].w, fh = frames[0].h;
  const out = new Raster(fw * frames.length, fh);
  frames.forEach((f, i) => out.draw(f, i * fw, 0));
  return out;
}
