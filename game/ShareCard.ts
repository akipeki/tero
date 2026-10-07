// file: game/ShareCard.ts
//
// The card at the end of the game: a 960×540 PNG that's made to be posted.
// Pixel font, Tero and Dad, and the numbers that make it a joke and a
// brag at the same time ("Dad was at the office for 4,380 hours").

import { t, tf, getLang } from './i18n';
import { Raster } from './render/pixel/Raster';
import { drawText, drawTextCentered, textWidth } from './render/pixel/font';
import { GAME_TITLE } from './title';
import type { FinalRun } from './Game';
import { formatMs } from './Run';

const W = 480, H = 270, SCALE = 2;
/** Six months of Dad never leaving the building. */
export const DAD_HOURS = '4,380';

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function n(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/** The words, in one place, for the PNG and the copy-paste text. */
export function shareLines(run: FinalRun): string[] {
  if (getLang() === 'fi') {
    return [
      tf('DAD WAS AT THE OFFICE FOR {h} HOURS.', { h: DAD_HOURS.replace(',', ' ') }),
      tf('TERO GOT HIM BACK IN {t}.', { t: formatMs(run.totalMs) }),
      tf('{n} SENT HOME TO THEIR KIDS.', { n: run.sentHome }),
      `RAIVAREITA ${run.tantrums}. KUOLEMIA ${run.deaths}. SYNKKOJA ${run.syncs}.`,
      tf('DAD\'S THINGS FOUND: {n}/{m}', { n: run.things.length, m: run.thingsTotal }),
      ...(run.assist ? [t('(BRING YOUR KID TO WORK DAY)')] : []),
    ];
  }
  return [
    `DAD WAS AT THE OFFICE FOR ${DAD_HOURS} HOURS.`,
    `TERO GOT HIM BACK IN ${formatMs(run.totalMs)}.`,
    `${n(run.sentHome, 'WORKER', 'WORKERS')} SENT HOME TO THEIR KIDS.`,
    `${n(run.tantrums, 'TANTRUM', 'TANTRUMS')}. ${n(run.deaths, 'DEATH', 'DEATHS')}. ${n(run.syncs, 'QUICK SYNC', 'QUICK SYNCS')}.`,
    `DAD'S THINGS FOUND: ${run.things.length}/${run.thingsTotal}`,
    ...(run.assist ? ['(BRING YOUR KID TO WORK DAY)'] : []),
  ];
}

export function shareText(run: FinalRun): string {
  return [`${GAME_TITLE}`, ...shareLines(run), '#WhereIsDada'].join('\n');
}

/** Draws the card. Resolves even if the sprites fail to load. */
export async function renderShareCard(run: FinalRun): Promise<HTMLCanvasElement> {
  const [tero, dad] = await Promise.all([
    loadImage('/images/dragon/win.png'),
    loadImage('/images/dragon/dad.png'),
  ]);

  // Text and frames on a Raster at native size, then scaled up crisp.
  const r = new Raster(W, H);
  r.rect(0, 0, W, H, '#1a1c2c');
  for (let y = 0; y < H; y += 4) r.rect(0, y, W, 1, '#1e2133');      // scanlines
  r.rect(8, 8, W - 16, H - 16, '#2a2f4a');
  r.rect(10, 10, W - 20, H - 20, '#1a1c2c');
  drawTextCentered(r, GAME_TITLE, 0, W, 22, '#6cc24a', 4);
  drawTextCentered(r, t('BABY DRAGON STRIKES BACK'), 0, W, 46, '#ffd23f', 1);
  const lines = shareLines(run);
  const colors = ['#fff1e8', '#ffd23f', '#a7f070', '#ff77a8', '#29adff', '#c2c3c7'];
  lines.forEach((l, i) => {
    const x = Math.round((W - textWidth(l, 2)) / 2);
    drawText(r, l, Math.max(14, x), 96 + i * 20, colors[i], textWidth(l, 2) > W - 28 ? 1 : 2);
  });
  if (run.newRecord) drawTextCentered(r, t('* NEW RECORD *'), 0, W, 220, '#ff3b1f', 2);
  drawTextCentered(r, '#WHEREISDADA', 0, W, 246, '#83769c', 1);

  const c = document.createElement('canvas');
  c.width = W * SCALE;
  c.height = H * SCALE;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(r.toCanvas(), 0, 0, W * SCALE, H * SCALE);
  // Tero (first frame of his win strip) and Dad, side by side at the bottom corners
  if (tero) ctx.drawImage(tero, 0, 0, tero.height, tero.height, 24 * SCALE, 196 * SCALE, 64 * SCALE, 64 * SCALE);
  if (dad) ctx.drawImage(dad, (W - 88) * SCALE, 196 * SCALE, 64 * SCALE, 64 * SCALE);
  return c;
}
