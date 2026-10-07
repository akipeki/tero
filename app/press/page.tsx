import type { Metadata } from 'next';
import Link from 'next/link';
import { GAME_FULL_TITLE } from '@/game/title';

export const metadata: Metadata = {
  title: `Press kit — ${GAME_FULL_TITLE}`,
  description: 'Facts, description, features and art for press and streamers.',
};

const FACTS: [string, string][] = [
  ['Title', GAME_FULL_TITLE],
  ['Genre', 'Retro pixel platformer, office satire'],
  ['Platform', 'Web browser (desktop, mobile, gamepad)'],
  ['Languages', 'English, Suomi'],
  ['Length', '10 floors, about 45–75 minutes; speedrun timer included'],
  ['Price', 'Free'],
  ['Made in', 'Finland'],
];

const FEATURES = [
  'Play Tero, a two-year-old dragon. Your only weapon is a tantrum.',
  'Climb an office tower floor by floor. Every floor has its own rule and its own boss: the Board, Halvorsen, and Chad from Recruitment.',
  'Free the overworked staff. They cheer, quit, and sometimes give you a hand grenade.',
  'The Vents: a secret, happy stage where you ride Elvis, the office dog the company stopped feeding.',
  'Hide in a cardboard box from security cameras, and find Dada\'s lost things on every floor.',
  'Original synth soundtrack. Every floor arranges the lullaby differently.',
  'Assist mode, Casual Friday, a screen-shake toggle and full gamepad support.',
];

export default function Press() {
  return (
    <div className="h-full overflow-y-auto" style={{ background: '#0e0e16', color: '#fff1e8' }}>
      <main className="mx-auto max-w-3xl px-4 py-10 leading-relaxed">
        <h1 className="mb-2 font-[family-name:var(--font-press-start)] text-xl text-[#ffe066]">WHERE IS DADA?</h1>
        <p className="mb-8 font-[family-name:var(--font-press-start)] text-xs text-[#ff7a3d]">BABY DRAGON STRIKES BACK · PRESS KIT</p>

        <section className="mb-8 flex flex-wrap items-center gap-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/press_tero.png" alt="Tero, the baby dragon" width={160} height={160} style={{ imageRendering: 'pixelated' }} />
          <p className="flex-1 min-w-[240px]">
            Dada has been at work since March. Tero is two. Tero is a dragon. Tero is going up there.
            <br /><br />
            <em>Where Is Dada?</em> is a short, weird, openly anti-capitalist platformer about a toddler who
            storms an office tower to bring his overworked dad home, one tantrum at a time.
          </p>
        </section>

        <h2 className="mb-3 font-[family-name:var(--font-press-start)] text-sm text-[#ffe066]">FACTS</h2>
        <dl className="mb-8 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-1">
          {FACTS.map(([k, v]) => (
            <div key={k} className="contents"><dt className="text-[#c9ced6]">{k}</dt><dd>{v}</dd></div>
          ))}
        </dl>

        <h2 className="mb-3 font-[family-name:var(--font-press-start)] text-sm text-[#ffe066]">FEATURES</h2>
        <ul className="mb-8 list-disc pl-6">
          {FEATURES.map((f) => <li key={f}>{f}</li>)}
        </ul>

        <h2 className="mb-3 font-[family-name:var(--font-press-start)] text-sm text-[#ffe066]">ART &amp; LOGO</h2>
        <p className="mb-8">
          The share card is at <a className="underline" href="/opengraph-image">/opengraph-image</a>. Every
          sprite, with sizes, is on the <Link className="underline" href="/art">art page</Link>. You may use
          screenshots and footage freely in coverage and streams. Monetised videos are fine.
        </p>

        <h2 className="mb-3 font-[family-name:var(--font-press-start)] text-sm text-[#ffe066]">PLAY</h2>
        <p className="mb-8"><Link className="underline" href="/game">Play in the browser →</Link></p>
      </main>
    </div>
  );
}
