import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Art Slots',
  description: 'Every sprite in WHERE IS DADA?, with sizes and templates to paint over in Aseprite',
};

export default function ArtLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-full w-full" style={{ background: '#0e0e16', color: '#fff1e8' }}>{children}</div>;
}
