// file: scripts/build-sprites.ts
//
// Renders the rigged characters to PNG strips in public/.
//   npm run sprites               → public/images/dragon/<anim>.png
//   npm run sprites -- --preview DIR  → also writes an enlarged contact sheet

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DRAGON_ANIMS, renderDragonStrip, type DragonAnimName } from '../game/render/characters/dragon';
import { Raster } from '../game/render/pixel/Raster';
import { GAGS, GAG_IDS } from '../game/render/office/gags';
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

  // gag contact sheet, packed into rows
  const gags = GAG_IDS.map((id) => GAGS[id].draw());
  const rowW = 400;
  let x = 0, y = 0, rowH = 0;
  const pos = gags.map((g) => {
    if (x + g.w > rowW) { x = 0; y += rowH + 6; rowH = 0; }
    const p = [x, y]; x += g.w + 6; rowH = Math.max(rowH, g.h); return p;
  });
  const gsheet = new Raster(rowW, y + rowH);
  for (let yy = 0; yy < gsheet.h; yy++) for (let xx = 0; xx < gsheet.w; xx++) gsheet.px(xx, yy, '#d6caae');
  gags.forEach((g, i) => gsheet.draw(g, pos[i][0], pos[i][1]));
  writeFileSync(join(dir, 'gags-preview.png'), encodePng(gsheet, 3));
  console.log(`preview → ${join(dir, 'gags-preview.png')}`);
}
