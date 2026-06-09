'use client';

import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }): void {
    // Surface in the dev console — production would forward to a logger.
    console.error('[Tero] runtime error:', error, info);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: '#1a1c2c', color: '#fff1e8',
            fontFamily: 'var(--font-pixel, monospace)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '2rem', textAlign: 'center',
          }}
        >
          <p className="pixel-title" style={{ color: '#ff004d' }}>OOPS</p>
          <p className="pixel-sub mt-6">SOMETHING BROKE</p>
          <p className="pixel-hint mt-4" style={{ maxWidth: 600 }}>
            {this.state.error.message}
          </p>
          <button
            className="pixel-btn mt-8"
            onClick={() => { this.setState({ error: null }); window.location.reload(); }}
          >
            ↺ RELOAD
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
