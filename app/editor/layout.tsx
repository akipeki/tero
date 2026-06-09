import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TERO Studio',
  description: 'Design levels, sprites, entities, and stories for TERO',
};

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return <div className="h-full w-full" style={{ background: '#0e0e16', color: '#fff1e8' }}>{children}</div>;
}
