import React, { Component } from 'react';
import { AlertTriangle, RotateCcw, RefreshCw } from 'lucide-react';

/**
 * Production React Error Boundary
 *
 * Catches eligible descendant render and lifecycle errors and displays
 * a branded salon fallback UI with recovery actions ('Try Again' and 'Reload Page').
 *
 * Limitations:
 * - Does not catch event-handler errors, asynchronous errors (e.g. setTimeout, fetch/promises),
 *   server-side rendering errors, or context loss inside WebGL canvases.
 * - Does not expose internal stack traces or sensitive details to users.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    // Diagnostic logging without leaking stack traces or sensitive data to user UI
    if (typeof console !== 'undefined' && console.error) {
      console.error('[ErrorBoundary caught error]:', error?.message || 'Unknown render error', errorInfo?.componentStack);
    }
    if (typeof this.props.onError === 'function') {
      try {
        this.props.onError(error, errorInfo);
      } catch (err) {
        // Prevent secondary errors in user callback
      }
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (typeof this.props.onReset === 'function') {
      try {
        this.props.onReset();
      } catch (err) {
        // Prevent secondary errors in user callback
      }
    }
  };

  handleReload = () => {
    if (typeof window !== 'undefined' && window.location) {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback({
            error: this.state.error,
            resetErrorBoundary: this.handleReset,
          });
        }
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          style={{
            minHeight: '60vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem 1.5rem',
            background: 'var(--bg-main, #1A1A1A)',
            color: 'var(--text-primary, #F9F8F6)',
            fontFamily: 'var(--font-sans, "Outfit", sans-serif)',
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              background: 'var(--bg-card, #262626)',
              border: '1px solid var(--border-subtle, rgba(212, 175, 55, 0.2))',
              borderRadius: 'var(--radius-md, 14px)',
              padding: '2.5rem 2rem',
              textAlign: 'center',
              boxShadow: 'var(--shadow-md, 0 8px 24px rgba(0, 0, 0, 0.5))',
            }}
          >
            {/* Salon Icon Badge */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(212, 175, 55, 0.1)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem auto',
                color: 'var(--gold-primary, #d4af37)',
              }}
            >
              <AlertTriangle size={32} />
            </div>

            {/* Heading */}
            <h2
              style={{
                fontFamily: 'var(--font-serif, "Cinzel", Georgia, serif)',
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--text-primary, #F9F8F6)',
                marginBottom: '0.75rem',
                letterSpacing: '0.02em',
              }}
            >
              Something Went Wrong
            </h2>

            {/* User-facing message: safe, branded, no internal stacks or credentials */}
            <p
              style={{
                fontSize: '0.95rem',
                lineHeight: 1.6,
                color: 'var(--text-secondary, #D2CFC9)',
                marginBottom: '2rem',
              }}
            >
              An unexpected display issue occurred while loading this section of the salon experience. You can attempt to restore the view or reload the page.
            </p>

            {/* Recovery actions */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.75rem',
                justifyContent: 'center',
              }}
            >
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  background: 'var(--gold-gradient, linear-gradient(135deg, #f5d77f 0%, #d4af37 50%, #aa820a 100%))',
                  color: '#1A1A1A',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  border: 'none',
                  borderRadius: 'var(--radius-full, 9999px)',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-gold, 0 6px 20px rgba(212, 175, 55, 0.25))',
                  transition: 'opacity 0.2s ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = '0.92')}
                onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
              >
                <RotateCcw size={16} />
                Try Again
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  background: 'transparent',
                  color: 'var(--text-primary, #f8f6f0)',
                  fontWeight: 500,
                  fontSize: '0.9rem',
                  border: '1px solid var(--border-subtle, rgba(212, 175, 55, 0.2))',
                  borderRadius: 'var(--radius-full, 9999px)',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease, border-color 0.2s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'var(--gold-primary, #d4af37)';
                  e.currentTarget.style.background = 'rgba(212, 175, 55, 0.08)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle, rgba(212, 175, 55, 0.2))';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <RefreshCw size={16} />
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
