// file: scripts/build-sprites.ts
//
// Renders the rigged characters to PNG strips in public/.
//   npm run sprites               → public/images/dragon/<anim>.png
//   npm run sprites -- --preview DIR  → also writes an enlarged contact sheet

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DRAGON_ANIMS, renderDragonStrip, type DragonAnimName } from '../game/render/characters/dragon';
import { Raster } from '../game/render/pixel/Raster';
import { encodePng } from './png';

const outDir = join(process.cwd(), 'public/images/dragon');
mkdirSync(outDir, { recursive: true });

const names = Object.keys(DRAGON_ANIMS) as DragonAnimName[];
const strips = names.map((n) => renderDragonStrip(n));
names.forEach((n, i) => {
  writeFileSync(join(outDir, `${n}.png`), encodePng(strips[i]));
  console.log(`wrote public/images/dragon/${n}.png (${DRAGON_ANIMS[n].poses.length} frames)`);
});

const previewIdx = process.argv.indexOf('--preview');
if (previewIdx > 0) {
  const dir = process.argv[previewIdx + 1];
  const w = Math.max(...strips.map((s) => s.w));
  const sheet = new Raster(w, strips.length * strips[0].h);
  // light checker background so the outline reads
  for (let y = 0; y < sheet.h; y++) for (let x = 0; x < sheet.w; x++) {
    sheet.px(x, y, ((x >> 3) + (y >> 3)) % 2 ? '#e8e4d8' : '#d6d1c2');
  }
  strips.forEach((s, i) => sheet.draw(s, 0, i * s.h));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'dragon-preview.png'), encodePng(sheet, 4));
  console.log(`preview → ${join(dir, 'dragon-preview.png')}`);
}
