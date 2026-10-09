import Link from 'next/link';

// `/` sends players straight to the game. A meta refresh (not a server
// redirect) so it also works in the static build, on any host.
export default function Home() {
  return (
    <>
      <meta httpEquiv="refresh" content="0; url=game/" />
      <main className="flex h-full items-center justify-center bg-black text-white">
        <Link href="/game" className="font-[family-name:var(--font-press-start)] text-sm">
          PRESS START ▶
        </Link>
      </main>
    </>
  );
}
