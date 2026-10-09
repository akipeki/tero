import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Playtest Report',
  description: 'Where players die, quit and get stuck in WHERE IS DADA?',
};

export default function PlaytestLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-full w-full" style={{ background: '#0e0e16', color: '#fff1e8' }}>{children}</div>;
}
