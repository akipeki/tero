import type { MetadataRoute } from 'next';
import { GAME_FULL_TITLE, GAME_TITLE } from '@/game/title';

// Static so `npm run build:web` can export it.
export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: GAME_FULL_TITLE,
    short_name: GAME_TITLE,
    description: 'A baby in a dragon suit storms his dad\'s office tower to bring him home.',
    start_url: '/game/',
    display: 'fullscreen',
    orientation: 'landscape',
    background_color: '#000000',
    theme_color: '#1b1620',
    icons: [{ src: '/icon.png', sizes: '192x192', type: 'image/png' }],
  };
}
