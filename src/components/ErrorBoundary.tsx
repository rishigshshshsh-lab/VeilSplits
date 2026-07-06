import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--bg-cosmic)',
          color: 'var(--text-main)',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'var(--font-sans)'
        }}>
          <div className="card" style={{ maxWidth: '550px', width: '100%', padding: '3rem 2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <div style={{ background: 'var(--error-glow)', padding: '1rem', borderRadius: '50%', color: 'var(--error)' }}>
                <AlertOctagon size={48} />
              </div>
            </div>
            
            <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', marginBottom: '1rem' }}>
              Something Went Wrong
            </h1>
            
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.05rem', lineHeight: '1.6' }}>
              StellarSplit encountered an unexpected error. This could be due to a ledger synchronization latency or wallet provider issue.
            </p>

            {this.state.error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.05)',
                border: '1px solid rgba(239, 68, 68, 0.15)',
                borderRadius: '0.75rem',
                padding: '1rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                color: '#fca5a5',
                textAlign: 'left',
                overflowX: 'auto',
                marginBottom: '2rem',
                maxHeight: '150px'
              }}>
                <strong>Error:</strong> {this.state.error.message || this.state.error.toString()}
              </div>
            )}

            <button onClick={this.handleReset} className="btn btn-primary" style={{ width: '100%' }}>
              <RefreshCw size={18} />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
