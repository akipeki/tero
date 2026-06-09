import Link from 'next/link';

export default function Home() {
  return (
    <main
      style={{
        height: '100vh',
        width: '100vw',
        background: '#1a1c2c',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        fontFamily: 'var(--font-pixel, monospace)',
        color: '#fff1e8',
        textAlign: 'center',
        padding: 24,
      }}
    >
      <p className="pixel-title" style={{ color: '#ef7d57' }}>TERO</p>
      <p className="pixel-sub" style={{ color: '#a7f070' }}>RETRO PIXEL PLATFORMER</p>
      <div style={{ display: 'flex', gap: 16, marginTop: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link className="pixel-btn" href="/game" style={{ textDecoration: 'none', display: 'inline-block' }}>
          ▶ PLAY
        </Link>
        <Link
          className="pixel-btn"
          href="/editor"
          style={{ textDecoration: 'none', display: 'inline-block', borderColor: '#29adff', color: '#29adff' }}
        >
          ✎ STUDIO
        </Link>
      </div>
      <p className="pixel-hint mt-8" style={{ color: '#c2c3c7' }}>
        STUDIO LETS YOU DESIGN LEVELS, SPRITES, ENEMIES &amp; STORIES
      </p>
    </main>
  );
}
