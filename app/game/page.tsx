import GameContainer from '@/components/GameContainer';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function GamePage() {
  return (
    <main className="w-screen h-screen bg-black overflow-hidden">
      <ErrorBoundary>
        <GameContainer />
      </ErrorBoundary>
    </main>
  );
}
