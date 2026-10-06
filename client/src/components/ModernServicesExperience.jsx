import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Scissors, Sparkles, MessageSquare, ArrowRight, CheckCircle2, Clock, X, ZoomIn, Eye, ShieldCheck, Flame, BookOpen } from 'lucide-react';
import { useSiteConfig } from '../context/SiteConfigContext';
import { useSmoothScroll } from '../context/SmoothScrollContext';

export const ModernServicesExperience = () => {
  const { config } = useSiteConfig();
  const { stopScroll, startScroll } = useSmoothScroll();
  const [activeServiceModal, setActiveServiceModal] = useState(null);
  const [selectedPoster, setSelectedPoster] = useState(null);
  const [seeAllServicesOpen, setSeeAllServicesOpen] = useState(false);

  // Lock background scroll completely on both desktop and mobile when any modal is open
  useEffect(() => {
    if (activeServiceModal || selectedPoster || seeAllServicesOpen) {
      stopScroll?.();
      return () => {
        startScroll?.();
      };
    }
  }, [activeServiceModal, selectedPoster, seeAllServicesOpen, stopScroll, startScroll]);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveServiceModal(null);
        setSelectedPoster(null);
        setSeeAllServicesOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 3 Vibrant Shaped Cards (directly from Screenshot 2026-09-07 232400.png)
  const FEATURED_SERVICES = [
    {
      id: 'classic-haircut',
      title: 'Classic Haircut',
      category: 'Master Precision Scissor Cut',
      color: '#1d4ed8', // Electric Blue
      textColor: '#ffffff',
      tagline: 'Signature Styling & Precision Fade',
      description:
        'Experience the pinnacle of grooming with our classic haircuts, where tradition meets contemporary style.',
      fullDescription:
        'Personalized consultation tailored to your head shape and hair growth pattern. Includes precision shear sectioning, clipper graduation taper fade, refreshing scalp wash, botanical conditioning, and artisan styling paste finish.',
      duration: '35 Mins',
      image: '/hair-cut/imgi_214_1000_F_327372387_nDiUJ8UxnzYVwUsT3fHmUImZOL7jDZ9r.webp',
      shapeType: 'double-circle', // Eyeglasses/double circle shape
      inclusions: [
        'One-on-one Face Profile Consultation',
        'Precision Scissor & Razor Detailing',
        'Scalp Detox Cleansing & Wash',
        'Matte Clay / Pomade Styling Finish',
      ],
    },
    {
      id: 'beard-trim-shape',
      title: 'Beard Trim Shape',
      category: 'Bespoke Beard Sculpting',
      color: '#047857', // Emerald Green
      textColor: '#ffffff',
      tagline: 'Razor Perimeter & Cedarwood Balm',
      description:
        'Experience the pinnacle of grooming with our classic haircuts, where tradition meets contemporary style.',
      fullDescription:
        'Master trimmer sculpt matching your jawline aesthetics. Cheek and neck line defined with feather razor precision, steam towel softening, and nourished with organic cedarwood beard oil.',
      duration: '25 Mins',
      image: '/hair-cut/imgi_414_1000_F_612963026_EgapnuI2p4b7ef9R7w8wRr5oHwEKU6Ts.webp',
      shapeType: 'bowtie', // Bowtie/butterfly shape
      inclusions: [
        'Jawline & Stubble Symmetry Alignment',
        'Straight-Razor Cheek & Neck Cleansing',
        'Eucalyptus Steam Towel Softening',
        'Cedarwood Beard Oil & Balm Massage',
      ],
    },
    {
      id: 'hot-towel-shave',
      title: 'Hot Towel Shave',
      category: 'Royal Feather Razor Shave',
      color: '#db2777', // Pop Vibrant Pink
      textColor: '#ffffff',
      tagline: 'Warm Botanical Lather & Steam',
      description:
        'Experience the pinnacle of grooming with our classic haircuts, where tradition meets contemporary style.',
      fullDescription:
        'Traditional imperial wet shave experience. Begins with pre-shave essential oils, warm herbal lather applied with badger-hair brush, precision feather razor stroke, and double hot eucalyptus towel wrap with cold balm finish.',
      duration: '30 Mins',
      image: '/figures/client_wash.webp',
      shapeType: 'triple-arch', // Triple arch/cloud shape
      inclusions: [
        'Essential Pre-Shave Oil Treatment',
        'Botanical Rich Warm Lather Application',
        'Traditional Feather Straight Razor Shave',
        'Double Hot Eucalyptus Towel + Cold Toner',
      ],
    },
  ];

  // 8 Pop-Geometric Haircut Shape Models (from Screenshot 2026-09-07 232335.png & 232315.png)
  const POP_SHAPE_HAIRCUTS = [
    {
      id: 1,
      name: 'Textured Crop Fade',
      bgColor: '#eab308', // Yellow
      shapeClass: 'shape-rounded-rect',
      image: '/hair-cut/imgi_240_1000_F_288480491_sSOxyfSGfwPlMrHCvpNEQZHTbEiEgkIO.webp',
      tag: 'Trending 2026',
    },
    {
      id: 2,
      name: 'Mid Taper Fade',
      bgColor: '#84cc16', // Lime
      shapeClass: 'shape-m-arch',
      image: '/hair-cut/imgi_214_1000_F_327372387_nDiUJ8UxnzYVwUsT3fHmUImZOL7jDZ9r.webp',
      tag: 'Clean Precision',
    },
    {
      id: 3,
      name: 'Modern Executive Quiff',
      bgColor: '#f472b6', // Pastel Pink
      shapeClass: 'shape-flower-four',
      image: '/hair-cut/imgi_218_1000_F_469681744_FZWt6LKXLoCU4XVv8Cjx6ZFmwNlNLm7x.webp',
      tag: 'Gentleman Classic',
    },
    {
      id: 4,
      name: 'Slick Back Fade',
      bgColor: '#fb923c', // Orange
      shapeClass: 'shape-u-cup',
      image: '/hair-cut/imgi_272_1000_F_1136144072_OPmo46myEzyxZlp1IwUwwGQS2zkpy1Dk.webp',
      tag: 'High Volume',
    },
    {
      id: 5,
      name: 'Beard Fade Blend',
      bgColor: '#22c55e', // Emerald
      shapeClass: 'shape-triple-bubble',
      image: '/hair-cut/imgi_414_1000_F_612963026_EgapnuI2p4b7ef9R7w8wRr5oHwEKU6Ts.webp',
      tag: 'Master Combo',
    },
    {
      id: 6,
      name: 'Natural Wavy Flow',
      bgColor: '#fda4af', // Rose Dome
      shapeClass: 'shape-dome-arch',
      image: '/hair-cut/imgi_313_1000_F_292538620_17sS0WLcHCDk3ChhkoTyCh5HDm2zBV53.webp',
      tag: 'Effortless Flow',
    },
    {
      id: 7,
      name: 'Gentleman Contour',
      bgColor: '#facc15', // Yellow Sun
      shapeClass: 'shape-circle-oval',
      image: '/hair-cut/imgi_252_1000_F_434370728_kHa2nwVqDX1oxH2hJfwYh3J323knuVWV.webp',
      tag: 'Timeless Cut',
    },
    {
      id: 8,
      name: 'French Crop Taper',
      bgColor: '#e7e5e4', // Almond Sand
      shapeClass: 'shape-soft-squarcle',
      image: '/figures/client_reveal.webp',
      tag: 'Sharp Edges',
    },
  ];

  return (
    <section
      id="services"
      style={{
        position: 'relative',
        background: '#07090e',
        padding: '0 0 5rem 0',
        overflow: 'hidden',
      }}
    >
      {/* ========================================================================= */}
      {/* 1. SCALLOPED CANOPY AWNING BORDER (Screenshot 2026-09-07 232420.png) */}
      {/* ========================================================================= */}
      <div style={{ width: '100%', overflow: 'hidden', lineHeight: 0, background: '#0b0c10' }}>
        <svg
          viewBox="0 0 1200 64"
          preserveAspectRatio="none"
          style={{ width: '100%', height: '48px', display: 'block' }}
        >
          <path
            d="M 0 0 
               Q 50 56, 100 0 
               Q 150 56, 200 0 
               Q 250 56, 300 0 
               Q 350 56, 400 0 
               Q 450 56, 500 0 
               Q 550 56, 600 0 
               Q 650 56, 700 0 
               Q 750 56, 800 0 
               Q 850 56, 900 0 
               Q 950 56, 1000 0 
               Q 1050 56, 1100 0 
               Q 1150 56, 1200 0 
               L 1200 64 L 0 64 Z"
            fill="#092118"
          />
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* 2. THE SCISSOR RIBBON BANNER: "CLASSIC CUTS, MODERN LOOKS THE BEST" */}
      {/* (Inspired directly by Screenshot 2026-09-07 232315.png & 232420.png) */}
      {/* ========================================================================= */}
      <div
        style={{
          background: 'linear-gradient(180deg, #092118 0%, #0d2e22 55%, #081711 100%)',
          padding: '4.5rem 1.5rem 5rem',
          position: 'relative',
          textAlign: 'center',
          overflow: 'hidden',
          borderBottom: '3px solid rgba(212, 175, 55, 0.4)',
        }}
      >
        {/* Curving Scissor Yellow Ribbon SVG */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            opacity: 0.85,
          }}
        >
          <svg
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
            style={{ width: '100%', height: '100%' }}
          >
            <path
              d="M -50 40 Q 360 260 720 160 T 1500 80"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <path
              d="M -50 40 Q 360 260 720 160 T 1500 80"
              fill="none"
              stroke="#d97706"
              strokeWidth="3"
              strokeDasharray="12 12"
            />
          </svg>
        </div>

        {/* Left and Right Scissor Icons cutting the ribbon */}
        <div
          className="scissor-float-left"
          style={{
            position: 'absolute',
            top: '22%',
            left: 'clamp(20px, 8vw, 120px)',
            color: '#f59e0b',
            transform: 'rotate(-25deg)',
            filter: 'drop-shadow(0 4px 14px rgba(245, 158, 11, 0.6))',
          }}
        >
          <Scissors size={44} strokeWidth={2.5} />
        </div>

        <div
          className="scissor-float-right"
          style={{
            position: 'absolute',
            bottom: '22%',
            right: 'clamp(20px, 8vw, 120px)',
            color: '#f59e0b',
            transform: 'rotate(45deg)',
            filter: 'drop-shadow(0 4px 14px rgba(245, 158, 11, 0.6))',
          }}
        >
          <Scissors size={44} strokeWidth={2.5} />
        </div>

        <div style={{ position: 'relative', zIndex: 5, maxWidth: '880px', margin: '0 auto' }}>
          {/* Top Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(0, 0, 0, 0.45)',
              border: '1.5px solid #fbbf24',
              borderRadius: 'var(--radius-full)',
              padding: '0.35rem 1.1rem',
              color: '#fbbf24',
              fontSize: '0.8rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '1.5rem',
              boxShadow: '0 4px 18px rgba(0,0,0,0.5)',
            }}
          >
            <Sparkles size={14} /> Master Barber Artistry
          </div>

          {/* Chunky Display Headline */}
          <h1
            className="retro-display-title"
            style={{
              fontFamily: '"Montserrat", "Arial Black", sans-serif',
              fontWeight: 900,
              fontSize: 'clamp(2rem, 5.2vw, 4.2rem)',
              lineHeight: 1.1,
              color: '#ffffff',
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              textShadow: '0 8px 24px rgba(0, 0, 0, 0.9), 0 0 40px rgba(245, 158, 11, 0.3)',
              marginBottom: '1.4rem',
            }}
          >
            CLASSIC CUTS, MODERN LOOKS THE BEST
          </h1>

          <p
            style={{
              fontSize: 'clamp(0.95rem, 1.8vw, 1.25rem)',
              color: '#d1fae5',
              maxWidth: '680px',
              margin: '0 auto 2.25rem',
              lineHeight: 1.6,
              fontWeight: 500,
            }}
          >
            we combine tradition with trend. From sharp fades to classic shaves — get a grooming experience built just for you.
          </p>

          {/* Bold Orange CTA Button (From Screenshot 2026-09-07 232315.png) */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <a
              href={`https://wa.me/${config.whatsapp?.replace(/[^0-9]/g, '')}?text=Hi!%20I%20would%20like%20to%20book%20an%20appointment%20for%20a%20modern%20haircut.`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-pop-orange"
              style={{
                background: '#ea580c',
                color: '#ffffff',
                border: '2px solid #fdba74',
                padding: '0.85rem 2.4rem',
                borderRadius: 'var(--radius-full)',
                fontWeight: 800,
                fontSize: '1rem',
                textTransform: 'capitalize',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                boxShadow: '0 10px 25px rgba(234, 88, 12, 0.55), 0 4px 10px rgba(0,0,0,0.4)',
                textDecoration: 'none',
                transition: 'all 0.25s ease',
              }}
            >
              <Scissors size={18} />
              <span>Book An Appointment</span>
            </a>

            <button
              onClick={() => setSelectedPoster({
                url: '/extra/imgi_224_b8810b36410cbeb7a0b42bdf227129dc.webp',
                title: '2026 Hair Styles Guide',
                subtitle: 'Explore 9 Signature Men Haircuts'
              })}
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                color: '#fbbf24',
                border: '2px solid rgba(251, 191, 36, 0.6)',
                padding: '0.85rem 1.8rem',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.25s ease',
              }}
            >
              <Eye size={16} />
              <span>Browse 2026 Trend Chart</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. POP-GEOMETRIC SHAPE GALLERY (Screenshot 2026-09-07 232335.png) */}
      {/* ========================================================================= */}
      <div
        style={{
          background: '#1e3a8a', // Electric navy blue background from screenshot 232335
          padding: '4.5rem 1rem',
          position: 'relative',
        }}
      >
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: '#facc15',
                fontSize: '0.78rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '0.5rem',
              }}
            >
              <Sparkles size={14} /> 2026 Visual Cut Directory
            </div>
            <h2
              style={{
                fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
                fontWeight: 900,
                color: '#ffffff',
                letterSpacing: '-0.01em',
                marginBottom: '0.6rem',
              }}
            >
              POP ICONIC <span style={{ color: '#facc15' }}>HAIR SHAPES</span>
            </h2>
            <p style={{ color: '#bfdbfe', maxWidth: '600px', margin: '0 auto', fontSize: '0.92rem' }}>
              Every facial profile deserves its matching architectural shape. Tap any portrait to book your signature transformation.
            </p>
          </div>

          {/* 8 Geometric Pop Shape Grid */}
          <div className="pop-shape-grid">
            {POP_SHAPE_HAIRCUTS.map((item) => (
              <div
                key={item.id}
                className="pop-shape-card"
                onClick={() => setSelectedPoster({
                  url: item.image,
                  title: item.name,
                  subtitle: `${item.tag} - Artisan Precision Hair Cut`,
                })}
                style={{
                  background: item.bgColor,
                  padding: '1.25rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                }}
              >
                {/* Cutout Container */}
                <div
                  className="pop-shape-mask-container"
                  style={{
                    width: '100%',
                    height: '210px',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    decoding="async"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      transition: 'transform 0.4s ease',
                    }}
                  />
                </div>

                {/* Bottom Style Tag */}
                <div
                  style={{
                    marginTop: '0.85rem',
                    textAlign: 'center',
                    width: '100%',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 900,
                      color: '#0f172a',
                      lineHeight: 1.2,
                    }}
                  >
                    {item.name}
                  </div>
                  <div
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: 'rgba(15, 23, 42, 0.75)',
                      textTransform: 'uppercase',
                      marginTop: '0.2rem',
                    }}
                  >
                    {item.tag}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. "OUR SERVICES" 3 VIBRANT SHAPED CARDS (Screenshot 2026-09-07 232400.png) */}
      {/* ========================================================================= */}
      <div
        id="services"
        style={{
          background: '#fef08a', // Creamy Butter-Yellow from Screenshot 2026-09-07 232400.png
          padding: '5rem 1.25rem',
          position: 'relative',
          color: '#0f172a',
        }}
      >
        <div className="container" style={{ maxWidth: '1280px', margin: '0 auto' }}>
          {/* Header Row: Title & Subtitle + Orange "See All Services" Button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1.5rem',
              marginBottom: '3.5rem',
            }}
          >
            <div style={{ maxWidth: '680px' }}>
              <h2
                style={{
                  fontFamily: '"Montserrat", "Arial Black", sans-serif',
                  fontWeight: 900,
                  fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
                  color: '#064e3b', // Deep forest green header
                  lineHeight: 1.1,
                  marginBottom: '1rem',
                  letterSpacing: '-0.02em',
                }}
              >
                Our Services
              </h2>
              <p
                style={{
                  fontSize: 'clamp(0.98rem, 1.8vw, 1.2rem)',
                  color: '#065f46',
                  lineHeight: 1.55,
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                It's not just a service; it's an experience rooted in artistry, precision, and personalized attention. Going beyond the standard cut and rinse.
              </p>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setSeeAllServicesOpen(true)}
                style={{
                  background: '#ea580c',
                  color: '#ffffff',
                  padding: '0.85rem 1.8rem',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 8px 20px rgba(234, 88, 12, 0.4)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                }}
              >
                <span>See All Services</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* The 3 Iconic Bold Shaped-Window Service Cards */}
          <div className="vibrant-services-grid">
            {FEATURED_SERVICES.map((srv) => (
              <div
                key={srv.id}
                className="vibrant-service-card"
                onClick={() => setActiveServiceModal(srv)}
                style={{
                  background: srv.color,
                  borderRadius: '32px',
                  padding: '1.75rem 1.5rem 2rem',
                  color: srv.textColor,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 18px 45px rgba(0, 0, 0, 0.25)',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                }}
              >
                <div>
                  {/* Shaped Photo Cutout Container */}
                  <div
                    style={{
                      width: '100%',
                      height: '220px',
                      marginBottom: '1.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {/* SVG ClipPath Applied Window */}
                    <div
                      className={`service-mask-${srv.shapeType}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      <img
                        src={srv.image}
                        alt={srv.title}
                        loading="lazy"
                        decoding="async"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                          transition: 'transform 0.5s ease',
                        }}
                      />
                    </div>
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      fontFamily: '"Montserrat", "Arial Black", sans-serif',
                      fontWeight: 900,
                      fontSize: '1.75rem',
                      lineHeight: 1.15,
                      marginBottom: '0.75rem',
                    }}
                  >
                    {srv.title}
                  </h3>

                  {/* Description */}
                  <p
                    style={{
                      fontSize: '0.92rem',
                      lineHeight: 1.55,
                      opacity: 0.95,
                      marginBottom: '1.75rem',
                      fontWeight: 500,
                    }}
                  >
                    {srv.description}
                  </p>
                </div>

                {/* Bottom Row: More Details Outlined Pill Button + Duration */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                  }}
                >
                  <button
                    onClick={() => setActiveServiceModal(srv)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      border: '2px solid rgba(255, 255, 255, 0.85)',
                      borderRadius: 'var(--radius-full)',
                      padding: '0.65rem 1.6rem',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                    }}
                  >
                    More Details
                  </button>

                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        background: 'rgba(255, 255, 255, 0.18)',
                        padding: '0.42rem 0.85rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                      }}
                    >
                      <Clock size={13} />
                      <span>{srv.duration}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. FLANKING SIDE DOSSIER PANELS (Images from `extra`) */}
      {/* Addresses: "extra ke images ko left aur right side me add karo taki khali na lage" */}
      {/* ========================================================================= */}
      <div
        style={{
          background: '#0b0e14',
          padding: '4.5rem 1.25rem',
          borderTop: '2px solid rgba(212, 175, 55, 0.3)',
          position: 'relative',
        }}
      >
        <div className="container" style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: 'var(--gold-primary)',
                fontSize: '0.78rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '0.5rem',
              }}
            >
              <Scissors size={14} /> Full Atelier Lookbook
            </div>
            <h2
              style={{
                fontSize: 'clamp(1.7rem, 3.8vw, 2.6rem)',
                color: '#ffffff',
                fontWeight: 800,
                marginBottom: '0.6rem',
              }}
            >
              The Master Barber <span className="gold-text">Dossier & Style Blueprints</span>
            </h2>
            <p style={{ color: '#94a3b8', maxWidth: '620px', margin: '0 auto', fontSize: '0.9rem' }}>
              From historical barber craftsmanship to 2026 trending fade blueprints. Tap any master chart to inspect full profiles and face-shape recommendations.
            </p>
          </div>

          {/* Grid of Extra Visual Masterpieces Filling Left to Right */}
          <div className="extra-art-grid">
            {/* 1. Vintage Barber Shop Art (imgi_115) */}
            <div
              className="extra-art-card"
              onClick={() => setSelectedPoster({
                url: '/extra/imgi_115_52a6a37771836805aa53b59bf731dda2.webp',
                title: 'Barber Shop: Try A Different Style',
                subtitle: 'Authentic vintage barbershop artistry with razor, clippers, and gentleman grooming aesthetics',
              })}
            >
              <img
                src="/extra/imgi_115_52a6a37771836805aa53b59bf731dda2.webp"
                alt="Vintage Barber Shop Art"
                className="extra-art-img"
                loading="lazy"
                decoding="async"
                width="260"
                height="280"
              />
              <div className="extra-art-caption">
                <h4>💈 Try A Different Style</h4>
                <p>Authentic Vintage Barber Art</p>
              </div>
            </div>

            {/* 2. Boys Hair Styles 2026 Poster (imgi_224) */}
            <div
              className="extra-art-card"
              onClick={() => setSelectedPoster({
                url: '/extra/imgi_224_b8810b36410cbeb7a0b42bdf227129dc.webp',
                title: 'Boys Hair Styles 2026 Trend Chart',
                subtitle: 'Messy, Curtain, Taper Fade, Quiff, Side Part, Pompadour, Buzz Cut, and Textured Crop',
              })}
            >
              <img
                src="/extra/imgi_224_b8810b36410cbeb7a0b42bdf227129dc.webp"
                alt="Boys Hair Styles 2026"
                className="extra-art-img"
                loading="lazy"
                decoding="async"
                width="260"
                height="280"
              />
              <div className="extra-art-caption">
                <h4>✂️ 9 Trending Haircuts</h4>
                <p>Boys Hair Styles 2026 Guide</p>
              </div>
            </div>

            {/* 3. Handsome Men Hairstyle Ideas (imgi_225) */}
            <div
              className="extra-art-card"
              onClick={() => setSelectedPoster({
                url: '/extra/imgi_225_0ef0297acf52413490517a5b4a3a2c99.webp',
                title: "Handsome Men's Hairstyle Ideas",
                subtitle: 'Low Taper Fade, Textured Crop, Classic Side Part, French Crop, and Skin Fade',
              })}
            >
              <img
                src="/extra/imgi_225_0ef0297acf52413490517a5b4a3a2c99.webp"
                alt="Handsome Men Hairstyle Ideas"
                className="extra-art-img"
                loading="lazy"
                decoding="async"
                width="260"
                height="280"
              />
              <div className="extra-art-caption">
                <h4>⭐ Men's Trend Lookbook</h4>
                <p>Modern, Stylish & Timeless</p>
              </div>
            </div>

            {/* 4. Textured Slick Back Fade 2026 Blueprint (imgi_226) */}
            <div
              className="extra-art-card"
              onClick={() => setSelectedPoster({
                url: '/extra/imgi_226_95737f71322201e513ecb65bedf6941a.webp',
                title: 'Textured Slick Back Fade 2026 Spec',
                subtitle: 'Side, back, and top profile fade guide with professional barber styling tips',
              })}
            >
              <img
                src="/extra/imgi_226_95737f71322201e513ecb65bedf6941a.webp"
                alt="Textured Slick Back Fade 2026"
                className="extra-art-img"
                loading="lazy"
                decoding="async"
                width="260"
                height="280"
              />
              <div className="extra-art-caption">
                <h4>📐 2026 Fade Blueprint</h4>
                <p>Textured Slick Back 3-Angle Guide</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. SERVICE DETAIL MODAL (Rendered into document.body via Portal) */}
      {/* ========================================================================= */}
      {activeServiceModal && typeof document !== 'undefined' && createPortal(
        <div
          className="modal-overlay"
          data-lenis-prevent="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(5, 7, 12, 0.88)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.75rem',
            overscrollBehavior: 'contain',
            touchAction: 'pan-y',
          }}
          onClick={() => setActiveServiceModal(null)}
        >
          <div
            data-lenis-prevent="true"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0d111a',
              border: `2px solid ${activeServiceModal.color}`,
              borderRadius: '22px',
              maxWidth: '520px',
              width: '100%',
              maxHeight: 'min(90vh, 90dvh)',
              overflow: 'hidden',
              boxShadow: `0 25px 60px rgba(0, 0, 0, 0.95), 0 0 35px ${activeServiceModal.color}44`,
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              transform: 'translateZ(0)',
              willChange: 'transform',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                flexShrink: 0,
                padding: '1.15rem 1.4rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: `linear-gradient(135deg, ${activeServiceModal.color}33 0%, #0d111a 100%)`,
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '0.68rem',
                    color: activeServiceModal.color,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {activeServiceModal.category}
                </span>
                <h3 style={{ fontSize: '1.3rem', color: '#ffffff', margin: '0.15rem 0 0', fontWeight: 800 }}>
                  {activeServiceModal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveServiceModal(null)}
                aria-label="Close modal"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.16)',
                  color: '#ffffff',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div
              data-lenis-prevent="true"
              style={{
                flex: 1,
                minHeight: 0,
                padding: '1.25rem 1.35rem',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
                touchAction: 'pan-y',
              }}
            >
              {/* Photo preview */}
              <div
                style={{
                  borderRadius: '16px',
                  overflow: 'hidden',
                  height: '190px',
                  marginBottom: '1.15rem',
                  border: '1.5px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <img
                  src={activeServiceModal.image}
                  alt={activeServiceModal.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>

              <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '1.15rem' }}>
                {activeServiceModal.fullDescription}
              </p>

              {/* Inclusions */}
              <div style={{ marginBottom: '1.15rem' }}>
                <h5 style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', textTransform: 'uppercase', fontWeight: 800, marginBottom: '0.6rem' }}>
                  What's Included:
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {activeServiceModal.inclusions.map((inc, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.82rem', color: '#e2e8f0' }}>
                      <CheckCircle2 size={15} color={activeServiceModal.color} style={{ flexShrink: 0 }} />
                      <span>{inc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Duration Info */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '0.8rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#e2e8f0', fontSize: '0.82rem' }}>
                  <Clock size={15} color="var(--gold-primary)" />
                  <span>Duration: <strong>{activeServiceModal.duration}</strong></span>
                </div>
                <div
                  style={{
                    color: 'var(--gold-primary)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    background: 'rgba(212, 175, 55, 0.12)',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '20px',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    letterSpacing: '0.02em',
                  }}
                >
                  Signature Craft
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                flexShrink: 0,
                padding: '0.9rem 1.35rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                gap: '0.75rem',
                background: '#090c13',
              }}
            >
              <a
                href={`https://wa.me/${config.whatsapp?.replace(/[^0-9]/g, '') || '919322188848'}?text=Hello!%20I%20want%20to%20book%20the%20"${encodeURIComponent(activeServiceModal.title)}"%20service.`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ flex: 1, padding: '0.75rem 1.25rem', fontSize: '0.88rem', justifyContent: 'center' }}
              >
                <MessageSquare size={16} />
                <span>Book on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* 2. POSTER / BLUEPRINT / HAIRCUT DETAIL LIGHTBOX (Rendered into document.body) */}
      {/* ========================================================================= */}
      {selectedPoster && typeof document !== 'undefined' && createPortal(
        <div
          className="modal-overlay"
          data-lenis-prevent="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(5, 7, 12, 0.92)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.75rem',
            overscrollBehavior: 'contain',
            touchAction: 'pan-y',
          }}
          onClick={() => setSelectedPoster(null)}
        >
          <div
            data-lenis-prevent="true"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0d111a',
              border: '2px solid var(--gold-primary)',
              borderRadius: '22px',
              maxWidth: '540px',
              width: '100%',
              maxHeight: 'min(92vh, 92dvh)',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 35px rgba(212, 175, 55, 0.3)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              transform: 'translateZ(0)',
              willChange: 'transform',
            }}
          >
            {/* Header */}
            <div
              style={{
                flexShrink: 0,
                padding: '0.9rem 1.25rem',
                borderBottom: '1px solid rgba(212, 175, 55, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(18, 22, 32, 0.98)',
              }}
            >
              <div>
                <h4 style={{ fontSize: '1.05rem', color: 'var(--gold-primary)', margin: 0, fontWeight: 700 }}>
                  {selectedPoster.title}
                </h4>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.15rem 0 0' }}>
                  {selectedPoster.subtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPoster(null)}
                aria-label="Close modal"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.16)',
                  color: '#ffffff',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Poster / Haircut Image Container */}
            <div
              data-lenis-prevent="true"
              style={{
                flex: 1,
                minHeight: 0,
                padding: '0.85rem',
                textAlign: 'center',
                background: '#07090e',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
                touchAction: 'pan-y',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={selectedPoster.url}
                alt={selectedPoster.title}
                style={{
                  maxWidth: '100%',
                  maxHeight: 'min(60vh, 480px)',
                  objectFit: 'contain',
                  borderRadius: '12px',
                  display: 'block',
                  margin: '0 auto',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.9)',
                }}
              />
            </div>

            {/* Footer with WhatsApp Booking */}
            <div
              style={{
                flexShrink: 0,
                padding: '0.85rem 1.25rem',
                borderTop: '1px solid rgba(212, 175, 55, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                background: 'rgba(18, 22, 32, 0.98)',
              }}
            >
              <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                Want this signature look?
              </span>
              <a
                href={`https://wa.me/${config.whatsapp?.replace(/[^0-9]/g, '') || '919322188848'}?text=Hi!%20I%20am%20interested%20in%20the%20"${encodeURIComponent(selectedPoster.title)}"%20style.%20Please%20let%20me%20know%20availability.`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-sm"
                style={{ padding: '0.45rem 1.15rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <MessageSquare size={14} />
                <span>Book This Look</span>
              </a>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* 3. "SEE ALL SERVICES" COMPLETE CATALOG MODAL (Rendered into document.body) */}
      {/* ========================================================================= */}
      {seeAllServicesOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="modal-overlay"
          data-lenis-prevent="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(5, 7, 12, 0.9)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.75rem',
            overscrollBehavior: 'contain',
            touchAction: 'pan-y',
          }}
          onClick={() => setSeeAllServicesOpen(false)}
        >
          <div
            data-lenis-prevent="true"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0d111a',
              border: '2px solid var(--gold-primary)',
              borderRadius: '22px',
              maxWidth: '640px',
              width: '100%',
              maxHeight: 'min(90vh, 90dvh)',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 35px rgba(212, 175, 55, 0.3)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              transform: 'translateZ(0)',
              willChange: 'transform',
            }}
          >
            {/* Header */}
            <div
              style={{
                flexShrink: 0,
                padding: '1.15rem 1.4rem',
                borderBottom: '1px solid rgba(212, 175, 55, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, #0d111a 100%)',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--gold-primary)',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <Scissors size={13} /> The Classic Cut Salon Menu
                </span>
                <h3 style={{ fontSize: '1.3rem', color: '#ffffff', margin: '0.2rem 0 0', fontWeight: 800 }}>
                  Complete Signature Service Menu
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSeeAllServicesOpen(false)}
                aria-label="Close modal"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.16)',
                  color: '#ffffff',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Services Menu Body */}
            <div
              data-lenis-prevent="true"
              style={{
                flex: 1,
                minHeight: 0,
                padding: '1.25rem 1.4rem',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
                touchAction: 'pan-y',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
              }}
            >
              {[
                {
                  category: '💈 Master Haircuts & Precision Fades',
                  items: [
                    { name: 'Classic Gentleman Haircut', duration: '35 Mins', desc: 'Face profile consultation, shear sectioning, taper fade & botanical finish.' },
                    { name: 'Textured Crop Fade & Low Taper', duration: '40 Mins', desc: 'Modern jagged scissor texturizing with zero skin taper fade.' },
                    { name: 'Executive Quiff & Pompadour Cut', duration: '40 Mins', desc: 'Voluminous directional quiff blow-dry sculpt with premium matte clay.' },
                    { name: 'Skin Fade / Drop Fade Special', duration: '40 Mins', desc: 'Zero shaver blend with surgical foil detailing and crisp edge-up.' },
                    { name: 'Junior Grooming (Kids under 12)', duration: '25 Mins', desc: 'Patient scissor & clipper styling designed for young gentlemen.' },
                  ],
                },
                {
                  category: '✂️ Beard Sculpting & Royal Shaves',
                  items: [
                    { name: 'Royal Hot Towel Shave', duration: '30 Mins', desc: 'Pre-shave essential oils, warm herbal badger lather, straight razor & double hot eucalyptus towels.' },
                    { name: 'Beard Trim & Razor Line Sculpt', duration: '25 Mins', desc: 'Symmetry alignment, cheek and neck straight-razor cleaning & cedarwood balm massage.' },
                    { name: 'Moustache & Goatee Detailing', duration: '15 Mins', desc: 'Precision contour shaping with organic styling wax.' },
                    { name: 'Express Beard Shape & Conditioning', duration: '20 Mins', desc: 'Clipper beard graduation with argan oil steam treatment.' },
                  ],
                },
                {
                  category: '💆 Scalp Therapies & Hair Spa',
                  items: [
                    { name: 'Scalp Detox & Deep Conditioning', duration: '25 Mins', desc: 'Charcoal follicle purification, invigorating scalp massage & nutrient mask.' },
                    { name: 'Ayurvedic Hot Oil Scalp Massage', duration: '25 Mins', desc: 'Herbal root stimulation, acupressure temple relief & warm towel wrap.' },
                    { name: 'Keratin Nourish Hair Spa', duration: '40 Mins', desc: 'Intensive restorative protein infusion for dry or frizzy hair.' },
                  ],
                },
                {
                  category: '👑 Complete VIP Makeover Packages',
                  items: [
                    { name: 'The Classic Gentleman Trio (Haircut + Beard + Shave)', duration: '60 Mins', desc: 'Complete signature transformation package with steam towels and styling finish.' },
                    { name: 'Royal Groom Transformation (Haircut + Shave + Scalp Detox)', duration: '75 Mins', desc: 'The ultimate royal indulgence. Full haircut, hot towel straight razor shave, and luxury detox spa.' },
                  ],
                },
              ].map((section, idx) => (
                <div key={idx}>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      color: 'var(--gold-primary)',
                      marginBottom: '0.75rem',
                      paddingBottom: '0.35rem',
                      borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {section.category}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {section.items.map((item, itemIdx) => (
                      <div
                        key={itemIdx}
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.07)',
                          borderRadius: '12px',
                          padding: '0.75rem 0.95rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '0.75rem',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#ffffff' }}>
                              {item.name}
                            </span>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                color: 'var(--gold-light)',
                                background: 'rgba(212, 175, 55, 0.15)',
                                padding: '0.1rem 0.45rem',
                                borderRadius: '10px',
                                fontWeight: 600,
                              }}
                            >
                              {item.duration}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.74rem', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                            {item.desc}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <a
                            href={`https://wa.me/${config.whatsapp?.replace(/[^0-9]/g, '') || '919322188848'}?text=Hello!%20I%20would%20like%20to%20book%20the%20"${encodeURIComponent(item.name)}"%20service.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary btn-sm"
                            style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem' }}
                          >
                            Book
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div
              style={{
                flexShrink: 0,
                padding: '0.9rem 1.4rem',
                borderTop: '1px solid rgba(212, 175, 55, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(18, 22, 32, 0.98)',
              }}
            >
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Need custom consultation or group bookings?
              </span>
              <a
                href={`https://wa.me/${config.whatsapp?.replace(/[^0-9]/g, '') || '919322188848'}?text=Hello!%20I%20have%20a%20question%20about%20your%20services.`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline btn-sm"
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}
              >
                <MessageSquare size={13} />
                <span>WhatsApp Desk</span>
              </a>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Embedded CSS for Shapes & Responsive Grids */}
      <style>{`
        /* Scissors animation */
        @keyframes scissorCutLeft {
          0%, 100% { transform: rotate(-25deg) scale(1); }
          50% { transform: rotate(-32deg) scale(1.08); }
        }
        @keyframes scissorCutRight {
          0%, 100% { transform: rotate(45deg) scale(1); }
          50% { transform: rotate(38deg) scale(1.08); }
        }
        .scissor-float-left {
          animation: scissorCutLeft 3s ease-in-out infinite;
        }
        .scissor-float-right {
          animation: scissorCutRight 3.2s ease-in-out infinite 0.4s;
        }

        /* 8 Pop Shapes Grid */
        .pop-shape-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
        }
        @media (min-width: 640px) {
          .pop-shape-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 1.5rem;
          }
        }
        @media (min-width: 1024px) {
          .pop-shape-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 1.75rem;
          }
        }

        .pop-shape-card {
          border-radius: 28px;
        }
        .pop-shape-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.5) !important;
        }
        .pop-shape-card:hover img {
          transform: scale(1.08);
        }

        /* Distinct Geometric Cutouts (from Screenshot 2026-09-07 232335.png) */
        .pop-shape-card:nth-child(1) .pop-shape-mask-container {
          border-radius: 36px;
        }
        .pop-shape-card:nth-child(2) .pop-shape-mask-container {
          border-radius: 50% 50% 12px 12px / 60% 60% 12px 12px;
        }
        .pop-shape-card:nth-child(3) .pop-shape-mask-container {
          border-radius: 60px 20px 60px 20px;
        }
        .pop-shape-card:nth-child(4) .pop-shape-mask-container {
          border-radius: 20px 20px 80px 80px;
        }
        .pop-shape-card:nth-child(5) .pop-shape-mask-container {
          border-radius: 50px 15px 50px 15px;
        }
        .pop-shape-card:nth-child(6) .pop-shape-mask-container {
          border-radius: 120px 120px 15px 15px;
        }
        .pop-shape-card:nth-child(7) .pop-shape-mask-container {
          border-radius: 50%;
        }
        .pop-shape-card:nth-child(8) .pop-shape-mask-container {
          border-radius: 40px;
        }

        /* 3 Vibrant Services Grid */
        .vibrant-services-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.75rem;
        }
        @media (min-width: 860px) {
          .vibrant-services-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 1.75rem;
          }
        }

        .vibrant-service-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 25px 55px rgba(0, 0, 0, 0.35) !important;
        }
        .vibrant-service-card:hover img {
          transform: scale(1.06);
        }

        /* Service Masks (from Screenshot 2026-09-07 232400.png) */
        .service-mask-double-circle {
          border-radius: 80px 20px 80px 20px;
        }
        .service-mask-bowtie {
          border-radius: 30px 80px 30px 80px;
        }
        .service-mask-triple-arch {
          border-radius: 100px 100px 24px 24px;
        }

        /* Extra Art Grid (Fills Left and Right) */
        .extra-art-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }
        @media (min-width: 600px) {
          .extra-art-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1024px) {
          .extra-art-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .extra-art-card {
          background: rgba(18, 22, 32, 0.95);
          border: 1.5px solid rgba(212, 175, 55, 0.35);
          border-radius: 18px;
          overflow: hidden;
          cursor: pointer;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.7);
          transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .extra-art-card:hover {
          transform: translateY(-6px) scale(1.02);
          border-color: var(--gold-primary);
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.9), 0 0 25px rgba(212, 175, 55, 0.25);
        }
        .extra-art-img {
          width: 100%;
          height: 250px;
          object-fit: cover;
          object-position: top;
          display: block;
          transition: transform 0.4s ease;
        }
        .extra-art-card:hover .extra-art-img {
          transform: scale(1.05);
        }
        .extra-art-caption {
          padding: 0.85rem 1rem 1rem;
          background: #0d111a;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        .extra-art-caption h4 {
          font-size: 0.88rem;
          color: #ffffff;
          margin: 0 0 0.2rem;
          font-weight: 700;
        }
        .extra-art-caption p {
          font-size: 0.72rem;
          color: #94a3b8;
          margin: 0;
        }

        @media (max-width: 360px) {
          .scissor-float-left,
          .scissor-float-right {
            display: none !important;
          }
          .retro-display-title {
            font-size: 1.55rem !important;
          }
          .btn-pop-orange {
            padding: 0.65rem 1.15rem !important;
            font-size: 0.84rem !important;
            width: 100% !important;
            justify-content: center !important;
          }
          .pop-shape-grid {
            gap: 0.5rem !important;
          }
          .pop-shape-card {
            padding: 0.65rem 0.35rem !important;
            border-radius: 16px !important;
          }
          .pop-shape-mask-container {
            height: 140px !important;
          }
          .vibrant-services-grid {
            gap: 1.15rem !important;
          }
          .vibrant-service-card {
            padding: 1.15rem 0.85rem !important;
            border-radius: 20px !important;
          }
        }

        @media (min-width: 2000px) {
          .vibrant-services-grid {
            gap: 2.75rem !important;
          }
          .vibrant-service-card {
            padding: 2.5rem 2rem 2.8rem !important;
            border-radius: 40px !important;
          }
          .pop-shape-grid {
            gap: 2.25rem !important;
          }
          .pop-shape-mask-container {
            height: 290px !important;
          }
          .extra-art-img {
            height: 330px !important;
          }
        }
      `}</style>
    </section>
  );
};
