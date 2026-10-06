import React, { useEffect, useState } from 'react';
import { Scissors, Sparkles } from 'lucide-react';

export const LoadingScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Preparing Gentleman Grooming Suite...');
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Proactively wake up backend server at the exact instant loading screen appears
    try {
      const rawUrl = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL).trim().replace(/\/+$/, '') : '';
      const healthUrl = rawUrl
        ? (rawUrl.endsWith('/api') ? `${rawUrl}/health` : `${rawUrl}/api/health`)
        : '/api/health';
      fetch(healthUrl, { mode: 'cors' }).catch(() => {});
    } catch (e) {}

    // Ultra-smooth, high-efficiency progress simulation that completes in ~850ms
    const stages = [
      { p: 25, text: 'Initializing Artisan Suite...', delay: 100 },
      { p: 55, text: 'Waking up Server & Assets...', delay: 300 },
      { p: 85, text: 'Calibrating Precision Styling...', delay: 550 },
      { p: 100, text: 'Artisan Suite Ready', delay: 800 },
    ];

    const timeouts = stages.map(({ p, text, delay }) =>
      setTimeout(() => {
        setProgress(p);
        setStatusText(text);
        if (p === 100) {
          setTimeout(() => {
            setIsFadingOut(true);
            setTimeout(() => {
              if (onComplete) onComplete();
            }, 450);
          }, 150);
        }
      }, delay)
    );

    return () => timeouts.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div
      className="loading-screen-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#07090e',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: isFadingOut ? 0 : 1,
        visibility: isFadingOut ? 'hidden' : 'visible',
        transition: 'opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.45s ease',
        overflow: 'hidden',
        touchAction: 'none',
        pointerEvents: isFadingOut ? 'none' : 'auto',
      }}
    >
      {/* Luxury Golden Ambient Backing */}
      <div
        style={{
          position: 'absolute',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, rgba(7, 9, 14, 0) 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top Luxury Branding */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '1.25rem',
          zIndex: 2,
        }}
      >
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 800,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--gold-primary, #d4af37)',
            display: 'block',
            marginBottom: '0.4rem',
          }}
        >
          ✦ Artisan Gentleman Barbershop ✦
        </span>
        <h2
          style={{
            fontFamily: 'var(--font-serif, "Cinzel", serif)',
            fontSize: 'clamp(1.4rem, 4.5vw, 2.2rem)',
            color: '#ffffff',
            margin: 0,
            fontWeight: 700,
            letterSpacing: '0.04em',
            textShadow: '0 2px 18px rgba(0, 0, 0, 0.9)',
          }}
        >
          THE CLASSIC CUT SALON
        </h2>
      </div>

      {/* Center Luxury Emblem: Golden Ring & Pulsing Shears */}
      <div
        style={{
          position: 'relative',
          width: '150px',
          height: '150px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem',
          zIndex: 2,
        }}
      >
        {/* Outer Rotating Dash Ring */}
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            animation: 'spin 12s linear infinite',
          }}
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="rgba(212, 175, 55, 0.3)"
            strokeWidth="1.5"
            strokeDasharray="4 6"
          />
        </svg>

        {/* Inner Glowing Ring */}
        <div
          style={{
            position: 'absolute',
            width: '110px',
            height: '110px',
            borderRadius: '50%',
            border: '2px solid rgba(212, 175, 55, 0.7)',
            boxShadow: '0 0 25px rgba(212, 175, 55, 0.35), inset 0 0 15px rgba(212, 175, 55, 0.2)',
            background: 'rgba(18, 22, 32, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ position: 'relative' }}>
            <Scissors
              size={46}
              color="var(--gold-primary, #d4af37)"
              style={{
                filter: 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.6))',
                transform: 'rotate(-45deg)',
              }}
            />
            <Sparkles
              size={18}
              color="#ffffff"
              style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                filter: 'drop-shadow(0 0 6px #ffd700)',
                animation: 'pulse 2s ease-in-out infinite',
              }}
            />
          </div>
        </div>
      </div>

      {/* Luxury Gold Loading Progress Bar */}
      <div
        style={{
          width: 'clamp(240px, 65vw, 340px)',
          zIndex: 2,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.45rem',
            fontSize: '0.78rem',
          }}
        >
          <span style={{ color: '#94a3b8', letterSpacing: '0.04em', fontWeight: 500 }}>
            {statusText}
          </span>
          <span
            style={{
              color: 'var(--gold-primary, #d4af37)',
              fontWeight: 800,
              fontFamily: 'monospace',
              fontSize: '0.88rem',
            }}
          >
            {progress}%
          </span>
        </div>

        {/* Progress Track */}
        <div
          style={{
            width: '100%',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            overflow: 'hidden',
            border: '1px solid rgba(212, 175, 55, 0.25)',
            boxShadow: '0 0 12px rgba(212, 175, 55, 0.15)',
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #b8860b 0%, #ffd700 50%, #ffffff 100%)',
              borderRadius: '10px',
              transition: 'width 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 0 10px rgba(255, 215, 0, 0.8)',
            }}
          />
        </div>
      </div>

      {/* Bottom Subtle Note */}
      <div
        style={{
          marginTop: '1.25rem',
          fontSize: '0.68rem',
          color: '#64748b',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          zIndex: 2,
        }}
      >
        Where Vintage Craftsmanship Meets Modern Luxury
      </div>
    </div>
  );
};
