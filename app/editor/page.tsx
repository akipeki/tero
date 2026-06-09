import EditorShell from '@/components/editor/EditorShell';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function EditorPage() {
  return (
    <ErrorBoundary>
      <EditorShell />
    </ErrorBoundary>
  );
}
