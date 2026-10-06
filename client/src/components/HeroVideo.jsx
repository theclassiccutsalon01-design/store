import React, { useRef, useState, useEffect, Suspense } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSiteConfig } from '../context/SiteConfigContext';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Volume2, VolumeX, Sparkles, ChevronDown, Scissors, ShieldCheck } from 'lucide-react';

const lazyWithRetry = (componentImport) =>
  React.lazy(async () => {
    try {
      return await componentImport();
    } catch (err) {
      console.warn('Initial 3D canvas chunk load failed, retrying in 350ms...', err);
      await new Promise((resolve) => setTimeout(resolve, 350));
      return await componentImport();
    }
  });

const Hero3DCanvas = lazyWithRetry(() =>
  import('./Three/Hero3DCanvas').then((m) => ({ default: m.Hero3DCanvas }))
);

gsap.registerPlugin(ScrollTrigger);

export const HeroVideo = ({ onOpenLoyalty, onOpenAdmin, onScrollToExperience, isReady = true }) => {
  const { isAdmin } = useAuth();
  const { config } = useSiteConfig();
  const heroSectionRef = useRef(null);
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);

  // 1. Video Playback optimization
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    videoEl.defaultMuted = true;
    videoEl.muted = true;

    const startTimer = setTimeout(() => {
      videoEl.play().catch(() => {});
    }, 400);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          videoEl.pause();
        } else {
          videoEl.play().catch(() => {});
        }
      },
      { threshold: 0.1 }
    );

    if (heroSectionRef.current) {
      observer.observe(heroSectionRef.current);
    }

    return () => {
      clearTimeout(startTimer);
      observer.disconnect();
    };
  }, []);


  const toggleAudio = () => {
    if (!audioRef.current) return;

    if (isPlayingMusic) {
      audioRef.current.pause();
      setIsPlayingMusic(false);
      if (videoRef.current) videoRef.current.muted = true;
    } else {
      audioRef.current.volume = 0.55;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlayingMusic(true);
            if (videoRef.current) videoRef.current.muted = false;
          })
          .catch((err) => {
            console.warn('Audio autoplay blocked by browser:', err);
          });
      }
    }
  };


  return (
    <section
      id="hero-section"
      ref={heroSectionRef}
      style={{
        position: 'relative',
        minHeight: '94vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        paddingTop: 'calc(var(--nav-height) + 1.5rem)',
        paddingBottom: '3.5rem',
        backgroundColor: '#0b0c10',
        backgroundImage: 'url(/backgrounds/imgi_394_1000_F_675403262_HTWy014WRCcGlggsScfGJP0fYNZHbOYr.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* 1. Crystal Clear Background Video with Instant Luxury Poster */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="none"
        poster="/backgrounds/imgi_394_1000_F_675403262_HTWy014WRCcGlggsScfGJP0fYNZHbOYr.webp"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 0.95,
          filter: 'contrast(1.06) brightness(0.98)',
          zIndex: 1,
          transition: 'opacity 0.4s ease',
          pointerEvents: 'none',
        }}
        src={(!config.heroVideoUrl || config.heroVideoUrl === '/video1.mp4' || config.heroVideoUrl === '/backgroundvideo.mp4') ? '/video/backgroundvideo.mp4' : config.heroVideoUrl}
      />

      {/* 2. Matching Luxury Background Music (Optimized preload: none to save initial bandwidth) */}
      <audio
        ref={audioRef}
        src="/music/salon-music.mp3"
        loop
        preload="none"
      />

      {/* 3. Ultra-Lightweight Transparent Gradient (Guarantees Sharp Video Clarity) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            linear-gradient(90deg, 
              rgba(7, 9, 13, 0.62) 0%, 
              rgba(7, 9, 13, 0.32) 45%, 
              rgba(7, 9, 13, 0.08) 70%, 
              transparent 100%
            ),
            linear-gradient(180deg, 
              rgba(7, 9, 13, 0.65) 0%, 
              transparent 18%, 
              transparent 84%, 
              #0b0c10 100%
            )
          `,
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      {/* 4. Interactive Hero Layout: Dual Column (Typography + Three.js 3D Masterpiece) */}
      <div
        className="container"
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '1240px',
        }}
      >
        <div className="hero-grid-layout">
          {/* Column A: High-Contrast Luxury Typography & CTAs */}
          <div className="hero-text-col">
            {/* Luxury Tagline Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.55rem',
                background: 'rgba(14, 16, 23, 0.92)',
                border: '1px solid rgba(212, 175, 55, 0.5)',
                padding: '0.4rem 1.1rem',
                borderRadius: 'var(--radius-full)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                marginBottom: '1.2rem',
                boxShadow: '0 4px 18px rgba(0, 0, 0, 0.65), 0 0 10px rgba(212, 175, 55, 0.2)',
              }}
            >
              <Sparkles size={14} color="var(--gold-primary)" />
              <span
                style={{
                  fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--gold-primary)',
                }}
              >
                Artisan Gentleman Barbershop
              </span>
            </div>

            {/* Main Salon Headline */}
            <h1
              style={{
                fontSize: 'clamp(2.3rem, 5.5vw, 4.4rem)',
                fontWeight: 800,
                lineHeight: 1.08,
                marginBottom: '1rem',
                color: '#ffffff',
                textShadow: '0 4px 24px rgba(0, 0, 0, 0.98), 0 2px 6px rgba(0, 0, 0, 0.9)',
                fontFamily: 'var(--font-serif)',
              }}
            >
              {config.salonName || 'The Classic Cut Salon'}
            </h1>

            {/* Hero Tagline */}
            <p
              style={{
                fontSize: 'clamp(1.05rem, 2.3vw, 1.35rem)',
                color: '#f8fafc',
                lineHeight: 1.6,
                fontWeight: 400,
                marginBottom: '2rem',
                textShadow: '0 2px 14px rgba(0, 0, 0, 0.98)',
              }}
            >
              {config.tagline || 'Where Vintage Craftsmanship Meets Modern Luxury'}
            </p>

            {/* Action Buttons */}
            <div
              className="hero-action-buttons"
              style={{
                display: 'flex',
                flexWrap: 'nowrap',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.65rem',
              }}
            >
              {isAdmin ? (
                <button
                  onClick={onOpenAdmin || onOpenLoyalty}
                  className="btn btn-primary hero-btn"
                  style={{
                    fontSize: 'clamp(0.9rem, 2.5vw, 1.02rem)',
                    padding: '0.8rem 1.75rem',
                    boxShadow: '0 8px 24px rgba(212, 175, 55, 0.35)',
                    background: 'linear-gradient(135deg, #c52222 0%, #991b1b 100%)',
                    borderColor: '#ff4d4d',
                  }}
                >
                  <ShieldCheck size={17} />
                  <span>Admin Central Command</span>
                </button>
              ) : (
                <button
                  onClick={onOpenLoyalty}
                  className="btn btn-primary hero-btn"
                  style={{
                    fontSize: 'clamp(0.9rem, 2.5vw, 1.02rem)',
                    padding: '0.8rem 1.75rem',
                    boxShadow: '0 8px 24px rgba(212, 175, 55, 0.35)',
                  }}
                >
                  <Scissors size={17} />
                  <span>Check My 5-Coupon Card</span>
                </button>
              )}

              <button
                onClick={onScrollToExperience}
                className="btn btn-outline hero-btn"
                style={{
                  fontSize: 'clamp(0.88rem, 2.5vw, 1rem)',
                  padding: '0.8rem 1.6rem',
                  background: 'rgba(15, 17, 24, 0.75)',
                  backdropFilter: 'blur(10px)',
                  borderColor: 'rgba(212, 175, 55, 0.4)',
                }}
              >
                <span>Barber Journey</span>
                <ChevronDown size={17} />
              </button>
            </div>
          </div>

          {/* Column B: Interactive 3D Showcase */}
          <div className="hero-3d-col">
            <Suspense fallback={<div style={{ minHeight: '190px' }} />}>
              <Hero3DCanvas isReady={isReady} />
            </Suspense>
          </div>
        </div>

        {/* Highlight Stats Bar */}
        <div
          className="hero-highlight-stats-bar"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '1rem',
            marginTop: '3rem',
            background: 'rgba(15, 17, 24, 0.88)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '1.2rem',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.75)',
          }}
        >
          <div style={statItemStyle}>
            <span style={statNumberStyle}>5 Visits = 1 Offer</span>
            <span style={statLabelStyle}>Automatic Free Reward</span>
          </div>
          <div style={statItemStyle}>
            <span style={statNumberStyle}>Master Craftsmen</span>
            <span style={statLabelStyle}>Scissor & Razor Precision</span>
          </div>
          <div style={statItemStyle}>
            <span style={statNumberStyle}>100% Satisfaction</span>
            <span style={statLabelStyle}>Gentleman Luxury Standard</span>
          </div>
        </div>
      </div>

      {/* Floating Gold Ambience Music Toggle Button */}
      <button
        onClick={toggleAudio}
        aria-label="Toggle Salon Background Music"
        style={{
          position: 'absolute',
          bottom: '1.5rem',
          right: '1.25rem',
          zIndex: 25,
          background: isPlayingMusic
            ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(15, 17, 24, 0.95) 100%)'
            : 'rgba(15, 17, 24, 0.88)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: isPlayingMusic
            ? '1.5px solid var(--gold-primary)'
            : '1px solid rgba(212, 175, 55, 0.45)',
          color: 'var(--gold-primary)',
          borderRadius: '50px',
          padding: '0.5rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.55rem',
          cursor: 'pointer',
          boxShadow: isPlayingMusic
            ? '0 0 22px rgba(212, 175, 55, 0.5), 0 6px 20px rgba(0,0,0,0.7)'
            : '0 4px 18px rgba(0,0,0,0.65)',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        title={isPlayingMusic ? 'Mute Music' : 'Play Salon Ambience Music'}
      >
        {isPlayingMusic ? (
          <>
            <Volume2 size={17} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.02em', color: '#ffffff' }}>
              Music On
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'flex-end',
                gap: '2.5px',
                height: '13px',
                marginLeft: '2px',
              }}
            >
              <span
                style={{
                  width: '2.5px',
                  background: 'var(--gold-primary)',
                  borderRadius: '2px',
                  animation: 'soundBar 0.8s ease-in-out infinite alternate',
                  height: '100%',
                }}
              />
              <span
                style={{
                  width: '2.5px',
                  background: 'var(--gold-primary)',
                  borderRadius: '2px',
                  animation: 'soundBar 0.6s ease-in-out 0.2s infinite alternate',
                  height: '60%',
                }}
              />
              <span
                style={{
                  width: '2.5px',
                  background: 'var(--gold-primary)',
                  borderRadius: '2px',
                  animation: 'soundBar 1s ease-in-out 0.4s infinite alternate',
                  height: '80%',
                }}
              />
            </span>
          </>
        ) : (
          <>
            <VolumeX size={17} />
            <span style={{ fontSize: '0.8rem', fontWeight: 500, opacity: 0.9 }}>
              Play Music
            </span>
          </>
        )}
      </button>

      {/* Component Styles for Responsive Grid & Micro-Transitions */}
      <style>{`
        .hero-grid-layout {
          display: grid;
          grid-template-columns: minmax(320px, 1.2fr) minmax(280px, 1fr);
          align-items: center;
          gap: 2.5rem;
        }

        .hero-text-col {
          text-align: left;
        }

        .hero-3d-col {
          display: flex;
          align-items: center;
          justifyContent: center;
        }

        @media (max-width: 960px) {
          .hero-grid-layout {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 1.5rem;
          }

          .hero-text-col {
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .hero-btn {
            justify-content: center;
          }
        }

        @media (max-width: 768px) {
          .hero-scrub-word {
            opacity: 1 !important;
            filter: none !important;
            transform: none !important;
          }
        }

        /* Unified Responsive Compact Mobile Composition (<= 860px) */
        @media (max-width: 860px) {
          #hero-section {
            padding-top: calc(var(--nav-height, 68px) + clamp(1.2rem, 3.2vh, 1.85rem)) !important;
            padding-bottom: calc(64px + clamp(0.4rem, 1.2vh, 1rem)) !important;
            min-height: auto !important;
          }
          .hero-grid-layout {
            gap: clamp(0.35rem, 1vh, 0.85rem) !important;
          }
          .hero-text-col > div:first-child {
            margin-bottom: clamp(0.25rem, 0.8vh, 0.6rem) !important;
            padding: clamp(0.2rem, 0.5vh, 0.3rem) clamp(0.65rem, 1.8vw, 0.9rem) !important;
          }
          .hero-text-col h1 {
            font-size: clamp(1.5rem, 4.8vw, 2.2rem) !important;
            margin-bottom: clamp(0.18rem, 0.6vh, 0.45rem) !important;
            line-height: 1.1 !important;
          }
          .hero-text-col p {
            font-size: clamp(0.8rem, 2.2vw, 0.98rem) !important;
            margin-bottom: clamp(0.45rem, 1.2vh, 0.85rem) !important;
            line-height: 1.35 !important;
            max-width: 480px !important;
          }
          .hero-action-buttons {
            display: flex !important;
            flex-direction: row !important;
            flex-wrap: nowrap !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 0.5rem !important;
            width: 100% !important;
            max-width: 440px !important;
          }
          .hero-btn {
            white-space: nowrap !important;
            flex: 0 1 auto !important;
            padding: clamp(0.42rem, 1vh, 0.65rem) clamp(0.65rem, 2vw, 1.15rem) !important;
            font-size: clamp(0.74rem, 2vw, 0.88rem) !important;
          }
          .hero-3d-responsive-canvas {
            height: clamp(100px, 16vh, 185px) !important;
          }
          .hero-highlight-stats-bar {
            grid-template-columns: repeat(3, 1fr) !important;
            margin-top: clamp(0.45rem, 1.4vh, 1.15rem) !important;
            padding: clamp(0.38rem, 1vh, 0.75rem) clamp(0.45rem, 1.5vw, 0.85rem) !important;
            gap: clamp(0.25rem, 0.8vh, 0.6rem) !important;
          }
        }
        @media (max-width: 360px) {
          #hero-section {
            padding-top: calc(var(--nav-height, 68px) + 1.35rem) !important;
          }
          .hero-action-buttons {
            gap: 0.35rem !important;
          }
          .hero-btn {
            padding: 0.44rem 0.55rem !important;
            font-size: 0.72rem !important;
          }
          .hero-highlight-stats-bar {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 0.25rem !important;
            padding: 0.45rem 0.35rem !important;
          }
          .hero-text-col h1 {
            font-size: 1.5rem !important;
          }
        }
        @media (min-width: 2000px) {
          .hero-highlight-stats-bar {
            padding: 1.75rem 2.5rem !important;
            gap: 2.5rem !important;
          }
          .hero-text-col h1 {
            font-size: 5.2rem !important;
          }
          .hero-text-col p {
            font-size: 1.55rem !important;
            max-width: 780px !important;
          }
          .hero-btn {
            padding: 1rem 2.2rem !important;
            font-size: 1.15rem !important;
          }
        }
      `}</style>
    </section>
  );
};


const statItemStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
};

const statNumberStyle = {
  fontFamily: 'var(--font-serif)',
  fontSize: 'clamp(0.88rem, 2.5vw, 1.05rem)',
  fontWeight: 700,
  color: 'var(--gold-primary)',
};

const statLabelStyle = {
  fontSize: '0.7rem',
  color: '#cbd5e1',
  letterSpacing: '0.02em',
  marginTop: '0.15rem',
};
