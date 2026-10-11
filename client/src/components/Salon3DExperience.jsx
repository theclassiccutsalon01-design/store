import React from 'react';
import { Sparkles, Scissors, Compass, ShieldCheck, ChevronDown, Award, Zap } from 'lucide-react';
import { Hero3DCanvas } from './Three/Hero3DCanvas';

export const Salon3DExperience = ({ onScrollToServices, onOpenLoyalty }) => {
  return (
    <section
      id="atelier-3d"
      style={{
        position: 'relative',
        background: 'linear-gradient(180deg, #1A1A1A 0%, #151515 50%, #1A1A1A 100%)',
        color: 'var(--color-cream, #F9F8F6)',
        padding: '5rem 1.5rem',
        overflow: 'hidden',
        borderTop: '1px solid rgba(212, 175, 55, 0.25)',
        borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
      }}
    >
      {/* Ambient Golden Radial Glow in Background */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '30%',
          left: '15%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.08) 0%, rgba(26, 26, 26, 0) 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '20%',
          right: '10%',
          width: '450px',
          height: '450px',
          background: 'radial-gradient(circle, rgba(184, 115, 51, 0.06) 0%, rgba(26, 26, 26, 0) 70%)',
          filter: 'blur(70px)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      <div
        className="container"
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '1240px',
          margin: '0 auto',
        }}
      >
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 3.5rem auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(26, 26, 26, 0.95)',
              border: '1px solid rgba(212, 175, 55, 0.45)',
              padding: '0.4rem 1.1rem',
              borderRadius: 'var(--radius-full)',
              marginBottom: '1rem',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.6)',
            }}
          >
            <Sparkles size={14} color="var(--gold-primary, #D4AF37)" />
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--gold-primary, #D4AF37)',
              }}
            >
              Signature Salon Experience
            </span>
          </div>

          <h2
            style={{
              fontSize: 'clamp(2rem, 4.5vw, 3.2rem)',
              fontWeight: 800,
              fontFamily: 'var(--font-serif)',
              lineHeight: 1.15,
              marginBottom: '1rem',
              color: 'var(--color-cream, #F9F8F6)',
            }}
          >
            Look Just as Stylish as{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #F9F8F6 0%, #D4AF37 50%, #B87333 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              This 3D Model
            </span>
          </h2>

          <p
            style={{
              fontSize: 'clamp(0.95rem, 1.8vw, 1.15rem)',
              color: 'var(--text-secondary, #D2CFC9)',
              lineHeight: 1.6,
              margin: '0 auto',
              maxWidth: '740px',
            }}
          >
            At The Classic Cut Salon, we make sure you look your absolute best.
            Our expert barbers give you sharp haircuts, clean beard styling, and relaxing
            grooming care tailored to your personality so you always walk out full of confidence and charm.
          </p>
        </div>

        {/* 2-Column Luxury Grid */}
        <div className="atelier-3d-grid">
          {/* Left Column: Interactive 3D Model Viewport */}
          <div className="atelier-3d-stage-wrapper">
            <div
              style={{
                position: 'relative',
                background: 'radial-gradient(circle at center, #242424 0%, #1A1A1A 85%)',
                border: '1px solid rgba(212, 175, 55, 0.35)',
                borderRadius: 'var(--radius-lg, 16px)',
                padding: '1rem',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), inset 0 0 40px rgba(212, 175, 55, 0.05)',
                overflow: 'hidden',
                minHeight: '380px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {/* Top Floating Badge */}
              <div
                style={{
                  position: 'absolute',
                  top: '0.85rem',
                  left: '0.85rem',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  background: 'rgba(26, 26, 26, 0.92)',
                  border: '1px solid rgba(212, 175, 55, 0.35)',
                  borderRadius: 'var(--radius-full)',
                  padding: '0.3rem 0.75rem',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: 'var(--gold-primary, #D4AF37)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.6)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Compass size={13} className="spin-slow" />
                <span>360° Style Preview</span>
              </div>

              {/* Three.js 3D Canvas */}
              <div
                style={{
                  width: '100%',
                  height: '380px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Hero3DCanvas isReady={true} />
              </div>

              {/* Bottom Instruction Bar */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '0.85rem',
                  left: '0.85rem',
                  right: '0.85rem',
                  zIndex: 10,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'rgba(26, 26, 26, 0.88)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 'var(--radius-md, 8px)',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.7rem',
                  color: 'var(--text-secondary, #D2CFC9)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <span style={{ whiteSpace: 'nowrap' }}>🖐️ Drag to rotate 360°</span>
                <span style={{ color: 'var(--gold-primary, #D4AF37)', whiteSpace: 'nowrap' }}>🔍 Interactive 3D</span>
              </div>
            </div>
          </div>

          {/* Right Column: Master Barber Studio Highlights */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '1.25rem',
            }}
          >
            {/* Feature 1 */}
            <div
              className="atelier-feature-card"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1.1rem',
                background: 'rgba(34, 34, 34, 0.85)',
                border: '1px solid rgba(212, 175, 55, 0.25)',
                borderRadius: 'var(--radius-md, 12px)',
                padding: '1.25rem 1.4rem',
                backdropFilter: 'blur(10px)',
                transition: 'transform 0.25s ease, border-color 0.25s ease',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(184, 115, 51, 0.1) 100%)',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--gold-primary, #D4AF37)',
                  flexShrink: 0,
                }}
              >
                <Scissors size={22} />
              </div>
              <div>
                <h4
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    margin: '0 0 0.35rem 0',
                    color: 'var(--color-cream, #F9F8F6)',
                    fontFamily: 'var(--font-serif)',
                  }}
                >
                  Master Barbers & Clean Fades
                </h4>
                <p
                  style={{
                    fontSize: '0.84rem',
                    color: 'var(--text-secondary, #D2CFC9)',
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  Our skilled barbers craft every haircut with precision shears and clean fades, making sure your hair looks sharp and stylish from every angle.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div
              className="atelier-feature-card"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1.1rem',
                background: 'rgba(34, 34, 34, 0.85)',
                border: '1px solid rgba(184, 115, 51, 0.25)',
                borderRadius: 'var(--radius-md, 12px)',
                padding: '1.25rem 1.4rem',
                backdropFilter: 'blur(10px)',
                transition: 'transform 0.25s ease, border-color 0.25s ease',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(184, 115, 51, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%)',
                  border: '1px solid rgba(184, 115, 51, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-copper, #B87333)',
                  flexShrink: 0,
                }}
              >
                <Award size={22} />
              </div>
              <div>
                <h4
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    margin: '0 0 0.35rem 0',
                    color: 'var(--color-cream, #F9F8F6)',
                    fontFamily: 'var(--font-serif)',
                  }}
                >
                  Relaxing VIP Chairs & Luxury Comfort
                </h4>
                <p
                  style={{
                    fontSize: '0.84rem',
                    color: 'var(--text-secondary, #D2CFC9)',
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  Sit back and enjoy a luxury salon experience. From refreshing hairwashes to soothing scalp therapy, we make sure you feel completely relaxed.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div
              className="atelier-feature-card"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1.1rem',
                background: 'rgba(34, 34, 34, 0.85)',
                border: '1px solid rgba(212, 175, 55, 0.25)',
                borderRadius: 'var(--radius-md, 12px)',
                padding: '1.25rem 1.4rem',
                backdropFilter: 'blur(10px)',
                transition: 'transform 0.25s ease, border-color 0.25s ease',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(184, 115, 51, 0.1) 100%)',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--gold-primary, #D4AF37)',
                  flexShrink: 0,
                }}
              >
                <Zap size={22} />
              </div>
              <div>
                <h4
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    margin: '0 0 0.35rem 0',
                    color: 'var(--color-cream, #F9F8F6)',
                    fontFamily: 'var(--font-serif)',
                  }}
                >
                  Premium Hair Care & Natural Tonics
                </h4>
                <p
                  style={{
                    fontSize: '0.84rem',
                    color: 'var(--text-secondary, #D2CFC9)',
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  We use high-grade shampoos, soothing scalp tonics, and natural scrubs that keep your hair healthy, smooth, and smelling fantastic.
                </p>
              </div>
            </div>

            {/* CTA Action Row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                marginTop: '0.75rem',
                flexWrap: 'wrap',
              }}
            >
              <button
                onClick={onScrollToServices}
                className="btn btn-primary"
                style={{
                  fontSize: '0.92rem',
                  padding: '0.75rem 1.6rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 8px 24px rgba(212, 175, 55, 0.35)',
                }}
              >
                <Scissors size={16} />
                <span>Explore Signature Services</span>
              </button>

              {onOpenLoyalty && (
                <button
                  onClick={onOpenLoyalty}
                  className="btn btn-outline"
                  style={{
                    fontSize: '0.92rem',
                    padding: '0.75rem 1.4rem',
                    borderColor: 'rgba(212, 175, 55, 0.4)',
                    background: 'rgba(26, 26, 26, 0.8)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Award size={16} color="var(--gold-primary)" />
                  <span>5-Visit Loyalty Reward</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .atelier-3d-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2.5rem;
          align-items: center;
        }

        .atelier-feature-card:hover {
          transform: translateY(-3px);
          border-color: rgba(212, 175, 55, 0.6) !important;
        }

        .spin-slow {
          animation: spin360 12s linear infinite;
        }

        @keyframes spin360 {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 900px) {
          .atelier-3d-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
        }
      `}</style>
    </section>
  );
};
