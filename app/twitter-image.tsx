import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { GAME_TITLE, GAME_SUBTITLE } from '@/game/title';

// The share card links get on Discord, Bluesky, WhatsApp… Built at build time.
export const dynamic = 'force-static';
export const alt = 'Where Is Dada? — a baby dragon in an office tower';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const tero = await readFile(join(process.cwd(), 'public/images/press_tero.png'));
  const src = `data:image/png;base64,${tero.toString('base64')}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', alignItems: 'center',
          background: '#1b1620', color: '#ffe066', padding: 60, fontFamily: 'monospace',
        }}
      >
        <img src={src} width={384} height={384} style={{ imageRendering: 'pixelated' }} alt="" />
        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 48, flex: 1 }}>
          <div style={{ fontSize: 80, fontWeight: 900, lineHeight: 1 }}>{GAME_TITLE}</div>
          <div style={{ fontSize: 40, color: '#ff7a3d', marginTop: 24 }}>{GAME_SUBTITLE}</div>
          <div style={{ fontSize: 30, color: '#c9ced6', marginTop: 40 }}>
            A two-year-old dragon vs. late capitalism.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
