// file: game/render/office/mute.ts
//
// Readability rule for the office: scenery is muted, gameplay is bright.
// Background layers and background gags run through mute() once when they
// are cached, so platforms, boxes, pickups, hazards and enemies — drawn at
// full colour — pop out against them.

/** Desaturate toward grey and pull toward a tint. Mutates `c` in place. */
export function mute(c: HTMLCanvasElement, desaturate = 0.55, tint = '#b8b2a4', tintAmount = 0.12): HTMLCanvasElement {
  const ctx = c.getContext('2d');
  if (!ctx || c.width === 0 || c.height === 0) return c;
  const img = ctx.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  const n = parseInt(tint.slice(1), 16);
  const tr = (n >> 16) & 255, tg = (n >> 8) & 255, tb = n & 255;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const lum = 0.3 * r + 0.59 * g + 0.11 * b;
    let nr = r + (lum - r) * desaturate;
    let ng = g + (lum - g) * desaturate;
    let nb = b + (lum - b) * desaturate;
    nr += (tr - nr) * tintAmount;
    ng += (tg - ng) * tintAmount;
    nb += (tb - nb) * tintAmount;
    d[i] = nr; d[i + 1] = ng; d[i + 2] = nb;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}
