import { shareCardPng } from '@/scripts/shareCard';

// The share card links get on Discord, Bluesky, WhatsApp… Built at build
// time, all pixel art (scripts/shareCard.ts).
export const dynamic = 'force-static';
export const alt = 'Where Is Dada? — a baby in a dragon suit in an office tower';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new Response(new Uint8Array(await shareCardPng()), { headers: { 'content-type': contentType } });
}
