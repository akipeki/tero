import { redirect } from 'next/navigation';

// The game's own title screen is the front door. The level/sprite studio
// still lives at /editor, it just isn't advertised to players.
export default function Home() {
  redirect('/game');
}
