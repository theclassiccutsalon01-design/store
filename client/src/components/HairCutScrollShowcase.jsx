import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { Scissors, Sparkles, MessageSquare, ArrowUpRight, ZoomIn, X, Eye, ChevronLeft, ChevronRight, ShieldCheck, Clock } from 'lucide-react';
import { useSiteConfig } from '../context/SiteConfigContext';
import { useAuth } from '../context/AuthContext';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// Haircut Photos List with Bespoke Animations
const HAIRCUTS = [
  {
    id: 1,
    title: 'Signature Precision Scissor Fade',
    category: 'Master Scissor Styling',
    description: 'Surgical sectioning with bespoke taper fade, scissor-textured crown, and clean beard blend.',
    image: '/hair-cut/imgi_214_1000_F_327372387_nDiUJ8UxnzYVwUsT3fHmUImZOL7jDZ9r.webp',
    badge: 'Trending Cut',
    duration: '35 mins',
    animClass: 'card-anim-style-1',
    animName: '3D Depth Zoom & Tilt',
    animBadge: 'Perspective Zoom',
    shortName: 'Scissor Fade',
  },
  {
    id: 2,
    title: 'Royal Parted Executive Pompadour',
    category: 'Gentleman Classic',
    description: 'Crisp side part with natural graduation, high-gloss artisan styling paste, and temple line taper.',
    image: '/hair-cut/imgi_218_1000_F_469681744_FZWt6LKXLoCU4XVv8Cjx6ZFmwNlNLm7x.webp',
    badge: 'Executive',
    duration: '40 mins',
    animClass: 'card-anim-style-2',
    animName: 'Blueprint Slide from Left',
    animBadge: 'Slide from Left',
    shortName: 'Executive Pomp',
  },
  {
    id: 3,
    title: 'Textured Crop & Low Skin Taper',
    category: 'Modern Urban',
    description: 'Choppy top texture designed for low maintenance, paired with velvety skin-tapered sideburns.',
    image: '/hair-cut/imgi_240_1000_F_288480491_sSOxyfSGfwPlMrHCvpNEQZHTbEiEgkIO.webp',
    badge: 'Low Maintenance',
    duration: '30 mins',
    animClass: 'card-anim-style-3',
    animName: 'Elastic Gravity Drop',
    animBadge: 'Drop Bounce',
    shortName: 'Crop Fade',
  },
  {
    id: 4,
    title: 'The Classic Gentleman Contour',
    category: 'Vintage Craft',
    description: 'Traditional shear work balanced to natural hair swirl, conditioned with cedarwood tonic.',
    image: '/hair-cut/imgi_252_1000_F_434370728_kHa2nwVqDX1oxH2hJfwYh3J323knuVWV.webp',
    badge: 'Timeless',
    duration: '35 mins',
    animClass: 'card-anim-style-4',
    animName: '3D Heritage Catalog Flip',
    animBadge: '3D Menu Unfold',
    shortName: 'Classic Contour',
  },
  {
    id: 5,
    title: 'Sculpted Quiff & Razor Perimeter',
    category: 'High Volume',
    description: 'Blowout volume with root-lifting texture, finished with high-precision straight razor edges.',
    image: '/hair-cut/imgi_272_1000_F_1136144072_OPmo46myEzyxZlp1IwUwwGQS2zkpy1Dk.webp',
    badge: 'Statement Look',
    duration: '45 mins',
    animClass: 'card-anim-style-5',
    animName: 'Sharp Razor Slice from Right',
    animBadge: 'Razor Sweep',
    shortName: 'Sculpted Quiff',
  },
  {
    id: 6,
    title: 'Textured Waves & Tapered Neckline',
    category: 'Natural Texture',
    description: 'Sculpted for natural wavy hair flow, weightless feathering, and razor-cleaned neck taper.',
    image: '/hair-cut/imgi_313_1000_F_292538620_17sS0WLcHCDk3ChhkoTyCh5HDm2zBV53.webp',
    badge: 'Popular',
    duration: '35 mins',
    animClass: 'card-anim-style-6',
    animName: 'Liquid Wave Arc Rise',
    animBadge: 'Wave Arc Rise',
    shortName: 'Textured Waves',
  },
  {
    id: 7,
    title: 'Imperial Beard & Haircut Ensemble',
    category: 'Royal Full Grooming',
    description: 'Complete head-to-beard transformation: precision fade, hot towel straight-razor shave, and finish.',
    image: '/hair-cut/imgi_414_1000_F_612963026_EgapnuI2p4b7ef9R7w8wRr5oHwEKU6Ts.webp',
    badge: 'Master Combo',
    duration: '60 mins',
    animClass: 'card-anim-style-7',
    animName: 'Imperial Royal Burst & Aura',
    animBadge: 'Royal Halo Burst',
    shortName: 'Imperial Royal',
  },
];

// Receding Salon Background Images (from public/backgrounds - only active & high-res)
const BACKGROUND_IMAGES = [
  { url: '/backgrounds/imgi_394_1000_F_675403262_HTWy014WRCcGlggsScfGJP0fYNZHbOYr.webp', title: 'Precision Matte Black Barber Suite' },
  { url: '/backgrounds/imgi_392_1000_F_297675193_tGrmFGFl6v8tnaGdn9EHYM56BYY4sQjc.webp', title: 'Classic Barber Mirrors & Stations' },
  { url: '/backgrounds/imgi_208_ff4f544d81725dd38d2d2bb5b295fa5b.webp', title: 'Artisan Wood Barber Tools Flatlay' },
  { url: '/backgrounds/imgi_356_1000_F_326566143_kFyzo5JoXJmUPDry91VXdezgCKj948mf.webp', title: 'Warm Ambient Salon Atmosphere' },
  { url: '/backgrounds/imgi_374_1000_F_128681251_GLw0Pn01yBNv2bWLpO9yKVSv23PUuLW1.webp', title: 'Gentleman Grooming Lounge & Mirrors' },
  { url: '/backgrounds/imgi_210_38241661916192b49e48f59bc83cd714.webp', title: 'Vintage Leather Barber Station' },
  { url: '/backgrounds/imgi_420_1000_F_524917351_fwbPdxikeeV0apegDZZvRCpn4Tk2e9wl.webp', title: 'Bespoke Wooden Salon Suite' },
  { url: '/backgrounds/imgi_444_1000_F_329640738_E1pDlWorkUJI2cKc4sAyVMAUcPfSHUtL.webp', title: 'Luxury Barber Chair Ensemble' },
];

// Grooming Journey Stages (Animated figures + 2026 Blueprints & Extra art on Left & Right)
const JOURNEY_STAGES = [
  {
    cardId: 1,
    leftFigure: '/figures/client_reveal.webp',
    leftTitle: 'Step 1: Consultation',
    leftText: 'Welcome! Ready for your signature royal fade?',
    rightFigure: '/figures/barber_welcome.webp',
    rightTitle: 'Master Barber Welcome',
    rightText: 'Take a seat in the luxury throne! ✂️',
    emoji: '👋',
    blueprintImg: '/extra/imgi_226_95737f71322201e513ecb65bedf6941a.webp',
    blueprintTitle: '2026 Trend: Textured Slick Back Fade',
    blueprintSubtitle: 'Side · Back · Top Profiles',
    rightExtraArt: '/extra/imgi_52_d6ddac91d026c61c2305c0b775385c7d.webp',
  },
  {
    cardId: 2,
    leftFigure: '/figures/client_wash.webp',
    leftTitle: 'Step 2: Herbal Hair Wash',
    leftText: 'Soothing scalp massage & eucalyptus lather! 🫧',
    rightFigure: '/figures/barber_welcome.webp',
    rightTitle: 'Deep Scalp Therapy',
    rightText: 'Relaxing hot water wash & hair prep! 💆‍♂️',
    emoji: '🫧',
    blueprintImg: '/extra/imgi_227_ce2377fe792f2f57106aafdd105a5091.webp',
    blueprintTitle: '2026 Trend: Medium Bro Flow Fade',
    blueprintSubtitle: 'Natural Flow & Clean Fade',
    rightExtraArt: '/extra/imgi_115_52a6a37771836805aa53b59bf731dda2.webp',
  },
  {
    cardId: 3,
    leftFigure: '/figures/client_wash.webp',
    leftTitle: 'Step 3: Texture Prep',
    leftText: 'Nourishing botanical mask for silky hair swirl.',
    rightFigure: '/figures/client_beard.webp',
    rightTitle: 'Artisan Shears',
    rightText: 'Sectioning every angle with surgical precision.',
    emoji: '✂️',
    blueprintImg: '/extra/imgi_225_0ef0297acf52413490517a5b4a3a2c99.webp',
    blueprintTitle: "Trending: Handsome Men's Hairstyle Ideas",
    blueprintSubtitle: 'French Crop, Taper Fade & Skin Fade',
    rightExtraArt: '/extra/imgi_52_d6ddac91d026c61c2305c0b775385c7d.webp',
  },
  {
    cardId: 4,
    leftFigure: '/figures/client_beard.webp',
    leftTitle: 'Step 4: Beard Sculpt & Shave',
    leftText: 'Crisp beard alignment & cedarwood balm massage! 🪒',
    rightFigure: '/figures/barber_welcome.webp',
    rightTitle: 'Hot Towel Wrap',
    rightText: 'Traditional straight-razor cheek perimeter shave.',
    emoji: '🪒',
    blueprintImg: '/extra/imgi_228_f8ea540a0037934a6f1067810f762791.webp',
    blueprintTitle: '2026 Trend: Wavy Flow Fade',
    blueprintSubtitle: 'Multi-Profile Fade Spec & Wave Styling',
    rightExtraArt: '/extra/imgi_115_52a6a37771836805aa53b59bf731dda2.webp',
  },
  {
    cardId: 5,
    leftFigure: '/figures/client_beard.webp',
    leftTitle: 'Step 5: High Volume Quiff',
    leftText: 'Root-lifting blowout with artisan styling clay.',
    rightFigure: '/figures/client_reveal.webp',
    rightTitle: 'Crown Volume & Flow',
    rightText: 'Sculpting high volume with razor perimeter.',
    emoji: '💈',
    blueprintImg: '/extra/imgi_229_3c134ab9e2e433f4775fcc3525c85efe.webp',
    blueprintTitle: '2026 Trend: Medium Wavy Fade',
    blueprintSubtitle: 'Natural Waves & Clean Tapered Neck',
    rightExtraArt: '/extra/imgi_52_d6ddac91d026c61c2305c0b775385c7d.webp',
  },
  {
    cardId: 6,
    leftFigure: '/figures/client_reveal.webp',
    leftTitle: 'Step 6: Symmetry Check',
    leftText: 'Every taper line clean, sharp, and balanced! 🪞',
    rightFigure: '/figures/barber_welcome.webp',
    rightTitle: 'Master Barber Polish',
    rightText: 'Conditioned with botanical beard tonic.',
    emoji: '✨',
    blueprintImg: '/extra/imgi_224_b8810b36410cbeb7a0b42bdf227129dc.webp',
    blueprintTitle: 'Find Your Look: 9 Trending Hair Styles',
    blueprintSubtitle: 'Quiff, Pompadour, Buzz Cut & Taper',
    rightExtraArt: '/extra/imgi_115_52a6a37771836805aa53b59bf731dda2.webp',
  },
  {
    cardId: 7,
    leftFigure: '/figures/client_reveal.webp',
    leftTitle: 'Step 7: Royal Reveal',
    leftText: '100% transformed! Looking handsome & royal. ⭐⭐⭐⭐⭐',
    rightFigure: '/figures/barber_welcome.webp',
    rightTitle: 'Stamp Added to Card',
    rightText: 'Collect 5 stamps for a 100% Free Cut! 🎁',
    emoji: '👑',
    blueprintImg: '/extra/imgi_115_52a6a37771836805aa53b59bf731dda2.webp',
    blueprintTitle: 'Barber Shop: Try A Different Style',
    blueprintSubtitle: 'Master Haircut & Shave Experience',
    rightExtraArt: '/extra/imgi_52_d6ddac91d026c61c2305c0b775385c7d.webp',
  },
];

const SUBTITLE_WORDS = 'Stage pinned in perspective. Each signature cut transitions into this spotlight with its own unique motion signature.'.split(' ');

const ShowcaseHeader = React.memo(() => (
  <div className="section-header section-header-reveal" style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
    <div className="master-cut-title-badge">
      <Scissors size={14} className="scissor-snip-icon" />
      <span
        style={{
          fontSize: '0.74rem',
          color: 'var(--gold-primary)',
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}
      >
        Artisan Master Series · 7 Bespoke Cuts
      </span>
      <Sparkles size={13} color="var(--gold-primary)" />
    </div>

    <h2
      className="section-title"
      style={{
        fontSize: 'clamp(2rem, 4.5vw, 3.2rem)',
        fontWeight: 800,
        letterSpacing: '0.03em',
        marginBottom: '0.45rem',
        textShadow: '0 4px 24px rgba(0, 0, 0, 0.95)',
      }}
    >
      <span className="master-title-word" style={{ display: 'inline-block', marginRight: '0.28em', willChange: 'transform, filter, opacity' }}>
        The
      </span>
      <span className="master-title-word" style={{ display: 'inline-block', marginRight: '0.28em', willChange: 'transform, filter, opacity' }}>
        Master
      </span>
      <span className="master-title-word" style={{ display: 'inline-block', marginRight: '0.28em', willChange: 'transform, filter, opacity' }}>
        Cut
      </span>
      <span
        className="master-title-word gold-shimmer-text"
        style={{ display: 'inline-block', willChange: 'transform, filter, opacity' }}
      >
        Collection
      </span>
    </h2>

    <p
      className="section-subtitle"
      style={{
        fontSize: 'clamp(0.85rem, 2vw, 0.98rem)',
        color: '#cbd5e1',
        maxWidth: '680px',
        margin: '0 auto 0.75rem',
        lineHeight: 1.55,
        textShadow: '0 2px 14px rgba(0, 0, 0, 0.98)',
      }}
    >
      {SUBTITLE_WORDS.map((word, i) => (
        <span
          key={i}
          className="master-sub-word"
          style={{
            display: 'inline-block',
            marginRight: '0.28em',
            willChange: 'transform, filter, opacity',
          }}
        >
          {word}
        </span>
      ))}
    </p>
  </div>
));

const CouponBanner = React.memo(({ onOpenLoyalty, onOpenAdmin }) => {
  const { isAdmin } = useAuth();
  if (isAdmin) return null;
  return (
    <div
      id="coupon-banner-card"
      style={{
        marginTop: '4.5rem',
        background: '#07090e',
        backgroundImage: 'linear-gradient(145deg, #0f131c 0%, #05070a 100%)',
        border: '2px solid var(--gold-primary)',
        borderRadius: 'var(--radius-lg)',
        padding: '2.75rem 1.5rem',
        textAlign: 'center',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.98), 0 0 35px rgba(212, 175, 55, 0.22)',
        position: 'relative',
        zIndex: 15,
      }}
    >
      <Sparkles size={26} color="var(--gold-primary)" style={{ margin: '0 auto 0.6rem', display: 'block' }} />
      <h3 style={{ fontSize: 'clamp(1.3rem, 3.8vw, 2rem)', marginBottom: '0.4rem' }}>
        Unlock Exclusive <span className="gold-text">30% to 40% OFF</span>
      </h3>
      <p style={{ color: '#cbd5e1', maxWidth: '580px', margin: '0 auto 1.25rem', fontSize: '0.88rem' }}>
        Collect 1 Coupon Stamp every time you visit. After 5 visits, you unlock a 30% to 40% OFF Luxury Grooming Offer!
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
        {isAdmin ? (
          <button
            onClick={onOpenAdmin || onOpenLoyalty}
            className="btn btn-primary btn-sm"
            style={{
              padding: '0.6rem 1.4rem',
              background: 'linear-gradient(135deg, #c52222 0%, #991b1b 100%)',
              borderColor: '#ff4d4d',
            }}
          >
            <ShieldCheck size={15} />
            <span>Admin Central Command</span>
          </button>
        ) : (
          <button onClick={onOpenLoyalty} className="btn btn-primary btn-sm" style={{ padding: '0.6rem 1.4rem' }}>
            <Scissors size={15} />
            <span>Open My 5-Coupon Card</span>
          </button>
        )}
        <a href="#contact" className="btn btn-outline btn-sm" style={{ padding: '0.6rem 1.2rem' }}>
          <span>Salon Location & Map</span>
          <ArrowUpRight size={15} />
        </a>
      </div>
    </div>
  );
});

export const HairCutScrollShowcase = ({ onOpenLoyalty, onOpenAdmin }) => {
  const { config } = useSiteConfig();
  const sectionRef = useRef(null);
  const bgContainerRef = useRef(null);
  const pinnedTrackRef = useRef(null);
  const pinnedStageRef = useRef(null);
  const scrollTriggerRef = useRef(null);

  const [{ activeCardIndex, activeBgIndex, currentStageIdx }, setShowcaseState] = useState({
    activeCardIndex: 0,
    activeBgIndex: 0,
    currentStageIdx: 0,
  });
  const [lightboxImage, setLightboxImage] = useState(null);

  const activeIndexRef = useRef(0);
  const activeBgRef = useRef(0);
  const isProgrammaticScrollRef = useRef(false);
  const targetIndexRef = useRef(0);
  const targetScrollYRef = useRef(0);
  const stableCardIndexRef = useRef(0);
  const gestureStartCardRef = useRef(0);
  const isTouchingRef = useRef(false);
  const isUserGestureActiveRef = useRef(false);
  const gestureResetTimeoutRef = useRef(null);
  const scrollEndTimeoutRef = useRef(null);
  const handleSelectCutRef = useRef(null);
  const currentStage = JOURNEY_STAGES[currentStageIdx] || JOURNEY_STAGES[0];
  const activeCut = HAIRCUTS[activeCardIndex] || HAIRCUTS[0];

  // Pre-decode all 7 haircut images so GPU texture memory is 100% warm
  useEffect(() => {
    HAIRCUTS.forEach((cut) => {
      const img = new Image();
      img.src = cut.image;
      if (img.decode) img.decode().catch(() => { });
    });
  }, []);

  useEffect(() => {
    ScrollTrigger.config({ ignoreMobileResize: true });

    const ctx = gsap.context(() => {
      // 1. SALON BACKGROUND PARALLAX (Gentle scale as user scrolls through showcase)
      gsap.fromTo(
        bgContainerRef.current || '.salon-bg-slide',
        { scale: 1.05 },
        {
          scale: 1.0,
          ease: 'none',
          scrollTrigger: {
            trigger: pinnedTrackRef.current,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1.0,
          },
        }
      );

      // 2. LEFT & RIGHT SIDE FIGURES & MOBILE DOCK (Visible during the showcase pinned duration)
      ScrollTrigger.create({
        trigger: pinnedTrackRef.current,
        start: 'top 35%',
        end: 'bottom 10%',
        onEnter: () => gsap.to(['.animated-side-figure', '.mobile-figure-dock'], { autoAlpha: 1, duration: 0.35 }),
        onLeave: () => gsap.to(['.animated-side-figure', '.mobile-figure-dock'], { autoAlpha: 0, duration: 0.35 }),
        onEnterBack: () => gsap.to(['.animated-side-figure', '.mobile-figure-dock'], { autoAlpha: 1, duration: 0.35 }),
        onLeaveBack: () => gsap.to(['.animated-side-figure', '.mobile-figure-dock'], { autoAlpha: 0, duration: 0.35 }),
      });

      const bgSlides = gsap.utils.toArray('.salon-bg-slide');

      const transitionBackgroundSlides = (targetBgIdx, targetOpacity = 0.92, duration = 0.45) => {
        const prevBgIdx = activeBgRef.current;
        activeBgRef.current = targetBgIdx;

        if (prevBgIdx === targetBgIdx) {
          if (bgSlides[targetBgIdx]) {
            gsap.to(bgSlides[targetBgIdx], {
              opacity: targetOpacity,
              duration,
              ease: 'power2.out',
              overwrite: 'auto',
            });
          }
          return;
        }

        // 1. Tween incoming slide
        if (bgSlides[targetBgIdx]) {
          gsap.to(bgSlides[targetBgIdx], {
            opacity: targetOpacity,
            duration,
            ease: 'power2.out',
            overwrite: 'auto',
          });
        }

        // 2. Tween outgoing slide
        if (bgSlides[prevBgIdx]) {
          gsap.to(bgSlides[prevBgIdx], {
            opacity: 0,
            duration,
            ease: 'power2.out',
            overwrite: 'auto',
          });
        }

        // 3. Safe cleanup for fast/rapid scroll: fade any lingering slide to 0
        bgSlides.forEach((slide, sIdx) => {
          if (sIdx !== targetBgIdx && sIdx !== prevBgIdx) {
            const currentOp = gsap.getProperty(slide, 'opacity');
            if (currentOp > 0.01) {
              gsap.to(slide, {
                opacity: 0,
                duration,
                ease: 'power2.out',
                overwrite: 'auto',
              });
            }
          }
        });
      };

      const switchCardAndBg = (idx) => {
        const safeIdx = Math.max(0, Math.min(HAIRCUTS.length - 1, idx));
        const targetBgIdx = safeIdx % BACKGROUND_IMAGES.length;

        // Single atomic state update to prevent multi-pass re-renders
        setShowcaseState({
          activeCardIndex: safeIdx,
          activeBgIndex: targetBgIdx,
          currentStageIdx: targetBgIdx,
        });

        // Tween only the required background slides
        transitionBackgroundSlides(targetBgIdx, 0.92, 0.45);
      };

      // 3. PINNED STAGE: Screen locks in place with generous mobile travel & snap
      const isMobile = window.innerWidth <= 860;

      const st = ScrollTrigger.create({
        trigger: pinnedTrackRef.current,
        start: 'top top',
        end: () => `+=${window.innerHeight * (isMobile ? 5.5 : 4.0)}px`,
        pin: pinnedStageRef.current,
        pinSpacing: true,
        scrub: isMobile ? true : 0.5,
        anticipatePin: 1,
        snap: isMobile ? false : {
          snapTo: (progress) => {
            return Math.round(progress * (HAIRCUTS.length - 1)) / (HAIRCUTS.length - 1);
          },
          inertia: false,
          duration: { min: 0.15, max: 0.35 },
          delay: 0.08,
          ease: 'power1.out',
          onComplete: () => {
            if (scrollTriggerRef.current) {
              const settledIdx = Math.max(
                0,
                Math.min(
                  HAIRCUTS.length - 1,
                  Math.round(scrollTriggerRef.current.progress * (HAIRCUTS.length - 1))
                )
              );
              gestureStartCardRef.current = settledIdx;
              stableCardIndexRef.current = settledIdx;
              targetIndexRef.current = settledIdx;
              activeIndexRef.current = settledIdx;
              isUserGestureActiveRef.current = false;
            }
          },
        },
        onEnter: () => {
          gestureStartCardRef.current = 0;
          stableCardIndexRef.current = 0;
          isUserGestureActiveRef.current = false;
        },
        onEnterBack: () => {
          gestureStartCardRef.current = HAIRCUTS.length - 1;
          stableCardIndexRef.current = HAIRCUTS.length - 1;
          isUserGestureActiveRef.current = false;
        },
        onLeave: () => {
          gestureStartCardRef.current = HAIRCUTS.length - 1;
          stableCardIndexRef.current = HAIRCUTS.length - 1;
          isUserGestureActiveRef.current = false;
        },
        onLeaveBack: () => {
          gestureStartCardRef.current = 0;
          stableCardIndexRef.current = 0;
          isUserGestureActiveRef.current = false;
        },
        onUpdate: (self) => {
          if (isProgrammaticScrollRef.current) {
            return;
          }

          const rawIdx = self.progress * (HAIRCUTS.length - 1);
          const idx = Math.max(0, Math.min(HAIRCUTS.length - 1, Math.round(rawIdx)));
          if (idx !== activeIndexRef.current) {
            activeIndexRef.current = idx;
            targetIndexRef.current = idx;
            switchCardAndBg(idx);
          }
        },
      });
      scrollTriggerRef.current = st;
      if (typeof window !== 'undefined') {
        window.__HAIRCUT_DEBUG__ = {
          getScrollTrigger: () => scrollTriggerRef.current,
          getGestureStartCard: () => gestureStartCardRef.current,
          getStableCardIndex: () => stableCardIndexRef.current,
          getActiveIndex: () => activeIndexRef.current,
          getIsUserGestureActive: () => isUserGestureActiveRef.current,
          selectCut: (idx) => handleSelectCut(idx),
        };
      }

      // 4. GSAP ScrollTrigger Title Sequence - 100% GPU Accelerated (NO CPU Blur Filter)
      // Step A: Header physically glides UP into viewport
      gsap.fromTo(
        '.section-header-reveal',
        { y: 50, opacity: 0.2 },
        {
          y: 0,
          opacity: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: pinnedTrackRef.current,
            start: 'top 80%',
            end: 'top 35%',
            scrub: 0.6,
          },
        }
      );

      // Step B: Hardware-accelerated title stagger (NO filter: blur on scroll!)
      gsap.fromTo(
        '.master-title-word',
        { opacity: 0.2, scale: 0.95, y: 22 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          stagger: 0.05,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: pinnedTrackRef.current,
            start: 'top 60%',
            end: 'top 20%',
            scrub: 0.6,
          },
        }
      );

      // Step C: Subtitle words smooth rise (NO filter: blur!)
      gsap.fromTo(
        '.master-sub-word',
        { opacity: 0.25, y: 12 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.015,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: pinnedTrackRef.current,
            start: 'top 50%',
            end: 'top 15%',
            scrub: 0.6,
          },
        }
      );
    }, sectionRef);

    return () => {
      if (scrollEndTimeoutRef.current) {
        clearTimeout(scrollEndTimeoutRef.current);
      }
      if (gestureResetTimeoutRef.current) {
        clearTimeout(gestureResetTimeoutRef.current);
      }
      if (typeof window !== 'undefined') {
        delete window.__HAIRCUT_DEBUG__;
      }
      ctx.revert();
    };
  }, []);

  const handleSelectCut = (idx) => {
    const safeIdx = Math.max(0, Math.min(HAIRCUTS.length - 1, idx));
    targetIndexRef.current = safeIdx;
    activeIndexRef.current = safeIdx;
    stableCardIndexRef.current = safeIdx;
    gestureStartCardRef.current = safeIdx;
    isUserGestureActiveRef.current = false;
    isProgrammaticScrollRef.current = true;
    const targetBgIdx = safeIdx % BACKGROUND_IMAGES.length;

    // Single atomic state update to prevent multi-pass re-renders
    setShowcaseState({
      activeCardIndex: safeIdx,
      activeBgIndex: targetBgIdx,
      currentStageIdx: targetBgIdx,
    });

    const bgSlides = gsap.utils.toArray('.salon-bg-slide');
    const prevBgIdx = activeBgRef.current;
    activeBgRef.current = targetBgIdx;

    if (bgSlides[targetBgIdx]) {
      gsap.to(bgSlides[targetBgIdx], {
        opacity: 1,
        duration: 0.45,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    }
    if (prevBgIdx !== targetBgIdx && bgSlides[prevBgIdx]) {
      gsap.to(bgSlides[prevBgIdx], {
        opacity: 0,
        duration: 0.45,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    }
    bgSlides.forEach((slide, sIdx) => {
      if (sIdx !== targetBgIdx && sIdx !== prevBgIdx) {
        const currentOp = gsap.getProperty(slide, 'opacity');
        if (currentOp > 0.01) {
          gsap.to(slide, {
            opacity: 0,
            duration: 0.45,
            ease: 'power2.out',
            overwrite: 'auto',
          });
        }
      }
    });

    gsap.fromTo(
      ['.figure-card-bounce', '.mobile-figure-bounce'],
      { scale: 0.88, y: 10 },
      { scale: 1, y: 0, duration: 0.4, ease: 'back.out(2)' }
    );

    if (scrollTriggerRef.current) {
      const st = scrollTriggerRef.current;
      const progress = safeIdx / (HAIRCUTS.length - 1);
      const targetScrollY = Math.round(st.start + progress * (st.end - st.start));
      targetScrollYRef.current = targetScrollY;

      st.scroll(targetScrollY);
      window.scrollTo(0, targetScrollY);

      if (scrollEndTimeoutRef.current) {
        clearTimeout(scrollEndTimeoutRef.current);
      }

      scrollEndTimeoutRef.current = setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 100);
    } else {
      isProgrammaticScrollRef.current = false;
    }
  };

  handleSelectCutRef.current = handleSelectCut;

  const handlePrev = () => {
    const prevIdx = (targetIndexRef.current - 1 + HAIRCUTS.length) % HAIRCUTS.length;
    handleSelectCut(prevIdx);
  };

  const handleNext = () => {
    const nextIdx = (targetIndexRef.current + 1) % HAIRCUTS.length;
    handleSelectCut(nextIdx);
  };

  return (
    <section
      id="haircuts"
      ref={sectionRef}
      style={{
        position: 'relative',
        padding: '5rem 0 6rem',
        minHeight: '100vh',
        backgroundColor: '#07080b',
        overflow: 'hidden',
      }}
    >

      {/* ========================================================================= */}
      {/* LEFT ANIMATED FIGURE & 2026 BLUEPRINT PANEL (Fills Left Webpage Side) */}
      {/* ========================================================================= */}
      <div
        className="animated-side-figure left-side-figure"
        style={{
          position: 'fixed',
          left: 'clamp(8px, 1.8vw, 32px)',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 35,
          width: 'clamp(210px, 17vw, 255px)',
          pointerEvents: 'auto',
          opacity: 0,
          visibility: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem',
        }}
      >
        {/* Royal Crest Badge from extra/imgi_147 */}
        <div
          className="figure-card-bounce"
          style={{
            background: 'rgba(12, 15, 22, 0.94)',
            border: '1.5px solid var(--gold-primary)',
            borderRadius: '12px',
            padding: '0.45rem 0.65rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.9), 0 0 15px rgba(212, 175, 55, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            backdropFilter: 'blur(12px)',
          }}
        >
          <img
            src="/extra/imgi_147_12dbea6ae79b491f523d75fb82e11c0a.webp"
            alt="Gold Barber Crest"
            width="38"
            height="38"
            loading="lazy"
            decoding="async"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '1.5px solid var(--gold-primary)',
              flexShrink: 0,
            }}
          />
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.62rem', color: 'var(--gold-primary)', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Royal Atelier Spec
            </div>
            <div style={{ fontSize: '0.7rem', color: '#ffffff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentStage.blueprintTitle ? currentStage.blueprintTitle.replace('2026 Trend: ', '') : '2026 Fade Spec'}
            </div>
          </div>
        </div>

        {/* 2026 Haircut Blueprint Card (Click to Zoom Lightbox) */}
        {currentStage.blueprintImg && (
          <div
            onClick={() => setLightboxImage({
              url: currentStage.blueprintImg,
              title: currentStage.blueprintTitle,
              subtitle: currentStage.blueprintSubtitle,
            })}
            className="figure-card-bounce blueprint-card-hover"
            style={{
              background: 'rgba(14, 18, 26, 0.95)',
              border: '1.5px solid rgba(212, 175, 55, 0.45)',
              borderRadius: '14px',
              overflow: 'hidden',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.9)',
              cursor: 'pointer',
              position: 'relative',
              transition: 'transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
            }}
            title="Click to view full 2026 Blueprint"
          >
            <div style={{ position: 'relative', height: '140px', overflow: 'hidden' }}>
              <img
                src={currentStage.blueprintImg}
                alt={currentStage.blueprintTitle}
                loading="lazy"
                decoding="async"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'top',
                  display: 'block',
                  transition: 'transform 0.4s ease',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to bottom, transparent 40%, rgba(14, 18, 26, 0.95) 100%)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  background: 'rgba(0, 0, 0, 0.75)',
                  border: '1px solid var(--gold-primary)',
                  color: 'var(--gold-primary)',
                  borderRadius: 'var(--radius-full)',
                  padding: '0.15rem 0.45rem',
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                }}
              >
                <ZoomIn size={10} /> 2026 Spec
              </div>
            </div>
            <div style={{ padding: '0.45rem 0.6rem 0.55rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#f8fafc', lineHeight: 1.25, marginBottom: '0.15rem' }}>
                {currentStage.blueprintTitle}
              </div>
              <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>
                {currentStage.blueprintSubtitle}
              </div>
            </div>
          </div>
        )}

        {/* Guest Speech Bubble & Avatar */}
        <div
          className="figure-card-bounce"
          style={{
            background: 'rgba(12, 15, 22, 0.92)',
            border: '1px solid rgba(212, 175, 55, 0.35)',
            borderRadius: '12px',
            padding: '0.5rem 0.65rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.55rem',
            backdropFilter: 'blur(10px)',
          }}
        >
          <img
            src={currentStage.leftFigure}
            alt={currentStage.leftTitle}
            width="38"
            height="38"
            loading="lazy"
            decoding="async"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '1.5px solid var(--gold-primary)',
              flexShrink: 0,
            }}
          />
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.62rem', color: 'var(--gold-primary)', fontWeight: 700 }}>
              {currentStage.leftTitle}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#cbd5e1', lineHeight: 1.25 }}>
              {currentStage.leftText}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT ANIMATED FIGURE & ARTISAN LOOKBOOK (Fills Right Webpage Side) */}
      {/* ========================================================================= */}
      <div
        className="animated-side-figure right-side-figure"
        style={{
          position: 'fixed',
          right: 'clamp(8px, 1.8vw, 32px)',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 35,
          width: 'clamp(210px, 17vw, 255px)',
          pointerEvents: 'auto',
          opacity: 0,
          visibility: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem',
        }}
      >
        {/* Artisan Barber Art Banner (imgi_115 or watercolor) */}
        <div
          onClick={() => setLightboxImage({
            url: '/extra/imgi_115_52a6a37771836805aa53b59bf731dda2.webp',
            title: 'Barber Shop: Try A Different Style',
            subtitle: 'Artisan shears, vintage clippers, and gentleman grooming aesthetics',
          })}
          className="figure-card-bounce blueprint-card-hover"
          style={{
            background: 'rgba(12, 15, 22, 0.94)',
            border: '1.5px solid var(--gold-primary)',
            borderRadius: '12px',
            padding: '0.45rem 0.65rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.9), 0 0 15px rgba(212, 175, 55, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            backdropFilter: 'blur(12px)',
            cursor: 'pointer',
          }}
          title="Click to view vintage barber art"
        >
          <img
            src="/extra/imgi_115_52a6a37771836805aa53b59bf731dda2.webp"
            alt="Barber Shop Art"
            width="38"
            height="38"
            loading="lazy"
            decoding="async"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              objectFit: 'cover',
              border: '1.5px solid var(--gold-primary)',
              flexShrink: 0,
            }}
          />
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.62rem', color: 'var(--gold-primary)', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Artisan Studio
            </div>
            <div style={{ fontSize: '0.7rem', color: '#ffffff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Try A Different Style 💈
            </div>
          </div>
        </div>

        {/* Master Barber Craft Advice & Portrait */}
        <div
          className="figure-card-bounce"
          style={{
            background: 'rgba(14, 18, 26, 0.95)',
            border: '1.5px solid rgba(212, 175, 55, 0.45)',
            borderRadius: '14px',
            padding: '0.65rem',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem' }}>
            <img
              src={currentStage.rightFigure}
              alt={currentStage.rightTitle}
              width="42"
              height="42"
              loading="lazy"
              decoding="async"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1.5px solid var(--gold-primary)',
                flexShrink: 0,
              }}
            />
            <div>
              <div style={{ fontSize: '0.64rem', color: 'var(--gold-primary)', fontWeight: 800, textTransform: 'uppercase' }}>
                {currentStage.rightTitle}
              </div>
              <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>
                Senior Stylist Craft
              </div>
            </div>
          </div>
          <p style={{ fontSize: '0.72rem', color: '#e2e8f0', margin: 0, lineHeight: 1.35, background: 'rgba(7, 8, 11, 0.65)', padding: '0.45rem 0.55rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            "{currentStage.rightText}"
          </p>
        </div>

        {/* 2026 Trend Spotlight Button (Opens full 9-cut boys & men poster) */}
        <div
          onClick={() => setLightboxImage({
            url: '/extra/imgi_224_b8810b36410cbeb7a0b42bdf227129dc.webp',
            title: 'Find Your Look: 2026 Hair Styles Guide',
            subtitle: 'Explore 9 trending styles: Quiff, Fade, Pompadour, Buzz, Crop & Waves',
          })}
          className="figure-card-bounce blueprint-card-hover"
          style={{
            background: 'rgba(12, 15, 22, 0.92)',
            border: '1px solid rgba(212, 175, 55, 0.35)',
            borderRadius: '12px',
            padding: '0.5rem 0.65rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            backdropFilter: 'blur(10px)',
            cursor: 'pointer',
          }}
          title="Click to view 2026 Haircut Lookbook"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <img
              src="/extra/imgi_224_b8810b36410cbeb7a0b42bdf227129dc.webp"
              alt="2026 Lookbook"
              width="32"
              height="32"
              loading="lazy"
              decoding="async"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                objectFit: 'cover',
                flexShrink: 0,
              }}
            />
            <div>
              <div style={{ fontSize: '0.62rem', color: 'var(--gold-primary)', fontWeight: 700 }}>
                2026 Trend Lookbook
              </div>
              <div style={{ fontSize: '0.66rem', color: '#ffffff', fontWeight: 600 }}>
                9 Signature Styles
              </div>
            </div>
          </div>
          <ZoomIn size={14} color="var(--gold-primary)" />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE INTERACTIVE STORY DOCK (Active on screens <= 860px) */}
      {/* ========================================================================= */}
      <div
        className="mobile-figure-dock"
        style={{
          position: 'fixed',
          bottom: '75px',
          right: '12px',
          zIndex: 45,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          pointerEvents: 'none',
          opacity: 0,
          visibility: 'hidden',
          transition: 'all 0.3s ease',
        }}
      >
        <div
          className="mobile-figure-bounce"
          style={{
            background: 'rgba(11, 14, 20, 0.94)',
            border: '1px solid var(--gold-primary)',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.9)',
            maxWidth: '190px',
          }}
        >
          <div style={{ fontSize: '0.62rem', color: 'var(--gold-primary)', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {currentStage.leftTitle}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {currentStage.leftText}
          </div>
        </div>

        <div
          className="mobile-figure-bounce"
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '2px solid var(--gold-primary)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.85)',
            background: '#07080b',
            flexShrink: 0,
          }}
        >
          <img
            src={currentStage.leftFigure}
            alt="Salon Companion"
            width="52"
            height="52"
            loading="lazy"
            decoding="async"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PINNED STAGE VIEWPORT: "Ek Jaga Hai Screen" */}
      {/* Locks in screen center while scroll scrubber & pills advance through all 7 cuts */}
      {/* ========================================================================= */}
      <div
        ref={pinnedTrackRef}
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
        }}
      >
        <div
          ref={pinnedStageRef}
          className="pinned-stage-wrapper"
          style={{
            width: '100%',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '1.5rem 1rem',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* ========================================================================= */}
          {/* IMMERSIVE SALON BACKGROUND WALLPAPER (Inside Pinned Stage) */}
          {/* Always stays active & visible during all 7 cuts! Never blacks out! */}
          {/* ========================================================================= */}
          <div
            ref={bgContainerRef}
            className="pinned-salon-bg-backdrop"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              zIndex: 0,
              pointerEvents: 'none',
              overflow: 'hidden',
            }}
          >
            {BACKGROUND_IMAGES.map((bg, idx) => {
              if (Math.abs(idx - activeBgIndex) > 1) return null;
              return (
                <img
                  key={idx}
                  src={bg.url}
                  alt={bg.title}
                  loading="lazy"
                  decoding="async"
                  className="salon-bg-slide"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: idx === activeBgIndex ? 0.92 : 0,
                    filter: 'contrast(1.08) brightness(0.92) saturate(1.15)',
                    transition: 'opacity 0.6s ease-in-out',
                    zIndex: idx === activeBgIndex ? 2 : 1,
                  }}
                />
              );
            })}

            {/* Vignette Gradient for Luxury Depth and Visual Focus */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 5,
                background: `
                  radial-gradient(circle at center, rgba(7, 8, 11, 0.1) 0%, rgba(7, 8, 11, 0.45) 70%, #07080b 100%),
                  linear-gradient(180deg, #07080b 0%, transparent 10%, transparent 90%, #07080b 100%)
                `,
              }}
            />

            {/* Background Info Badge */}
            <div
              className="salon-atmosphere-badge"
              style={{
                position: 'absolute',
                bottom: '1.25rem',
                left: '1.5rem',
                zIndex: 6,
                fontSize: '0.72rem',
                color: 'var(--gold-primary)',
                background: 'rgba(10, 12, 18, 0.88)',
                padding: '0.25rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                letterSpacing: '0.06em',
                border: '1px solid rgba(212, 175, 55, 0.35)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.8)',
              }}
            >
              📷 Salon Atmosphere: {BACKGROUND_IMAGES[activeBgIndex]?.title}
            </div>
          </div>

          <div
            className="container cards-main-container"
            style={{
              maxWidth: '920px',
              margin: '0 auto',
              width: '100%',
              position: 'relative',
              zIndex: 10,
            }}
          >
            {/* Section Header with 3D Shimmer Title & Animated Scissor */}
            <ShowcaseHeader />

            {/* Style Selector Pills: 7 Interactive Cuts */}
            <div className="style-pills-container">
              {HAIRCUTS.map((cut, idx) => {
                const isPillActive = activeCardIndex === idx;
                return (
                  <button
                    key={cut.id}
                    onClick={() => handleSelectCut(idx)}
                    className={`style-pill-btn ${isPillActive ? 'active-pill' : ''}`}
                    title={`Switch to Cut 0${cut.id}: ${cut.title}`}
                  >
                    <span className="pill-num">0{cut.id}</span>
                    <span>{cut.shortName || cut.title.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>

            {/* The Central Spotlight Card */}
            <div className="haircut-stage-card-box">
              <div
                className="haircut-reveal-card active-cut-card"
                style={{
                  padding: 'clamp(1rem, 2.8vw, 1.6rem)',
                  borderRadius: 'var(--radius-lg)',
                  border: '2px solid var(--gold-primary)',
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.92), 0 0 30px rgba(212, 175, 55, 0.18)',
                  background: 'linear-gradient(145deg, #111522 0%, #080b11 100%)',
                  position: 'relative',
                  overflow: 'hidden',
                  zIndex: 10,
                  isolation: 'isolate',
                }}
              >
                {/* Ambient Salon Wallpaper Backdrop inside Card */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url(${BACKGROUND_IMAGES[(activeCut.id - 1) % BACKGROUND_IMAGES.length]?.url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: 0.14,
                    pointerEvents: 'none',
                    zIndex: 0,
                  }}
                />

                {/* Card Top Information Strip */}
                <div
                  className="card-top-info-strip"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.85rem',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    position: 'relative',
                    zIndex: 2,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span
                      className="card-suite-badge"
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--gold-primary)',
                        background: 'rgba(7, 8, 11, 0.88)',
                        padding: '0.22rem 0.65rem',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid rgba(212, 175, 55, 0.4)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      🏛️ Salon Suite: {BACKGROUND_IMAGES[(activeCut.id - 1) % BACKGROUND_IMAGES.length]?.title}
                    </span>
                    <span
                      className="card-motion-chip"
                      style={{
                        fontSize: '0.7rem',
                        color: '#f8fafc',
                        background: 'rgba(212, 175, 55, 0.15)',
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid rgba(212, 175, 55, 0.35)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontWeight: 600,
                      }}
                    >
                      ✨ Motion: {activeCut.animName}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--gold-primary)', fontWeight: 700 }}>
                    Cut 0{activeCut.id} of 0{HAIRCUTS.length}
                  </span>
                </div>

                {/* Grid Layout: High-Res Photo + Artisan Details */}
                <div className="haircut-card-grid" style={{ position: 'relative', zIndex: 2 }}>
                  {/* Left Photo Container with Salon Wallpaper Backdrop */}
                  <div
                    className="haircut-photo-frame"
                    style={{
                      position: 'relative',
                      display: 'grid',
                      gridTemplateColumns: '1fr',
                      gridTemplateRows: '1fr',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      border: '1.5px solid rgba(212, 175, 55, 0.55)',
                      boxShadow: '0 16px 36px rgba(0, 0, 0, 0.95), 0 0 20px rgba(212, 175, 55, 0.15)',
                      width: '100%',
                      backgroundColor: '#0c0f17',
                    }}
                  >
                    {/* Salon Suite Wallpaper Backdrop Layer behind the haircut image */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `url(${BACKGROUND_IMAGES[(activeCut.id - 1) % BACKGROUND_IMAGES.length]?.url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'blur(3px) brightness(0.75) contrast(1.15)',
                        transform: 'scale(1.08)',
                        zIndex: 1,
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'radial-gradient(circle at center, rgba(7, 8, 11, 0.1) 0%, rgba(7, 8, 11, 0.55) 100%)',
                        zIndex: 2,
                      }}
                    />
                    {/* Only mount active and adjacent haircut photos to save mobile network and RAM */}
                    {HAIRCUTS.map((cut, cIdx) => {
                      if (Math.abs(cIdx - activeCardIndex) > 1) return null;
                      return (
                        <img
                          key={cut.id}
                          src={cut.image}
                          alt={cut.title}
                          loading="lazy"
                          decoding="async"
                          className="haircut-img"
                          style={{
                            gridArea: '1 / 1',
                            zIndex: cIdx === activeCardIndex ? 3 : 2,
                            width: '100%',
                            height: '290px',
                            objectFit: 'cover',
                            display: 'block',
                            opacity: cIdx === activeCardIndex ? 1 : 0,
                            transition: 'opacity 0.28s ease, transform 0.28s ease',
                            transform: cIdx === activeCardIndex ? 'scale(1)' : 'scale(0.97)',
                            pointerEvents: cIdx === activeCardIndex ? 'auto' : 'none',
                          }}
                        />
                      );
                    })}

                    {/* Badge */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '0.65rem',
                        right: '0.65rem',
                        background: 'rgba(11, 14, 22, 0.92)',
                        border: '1px solid var(--gold-primary)',
                        color: 'var(--gold-primary)',
                        padding: '0.18rem 0.6rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.8)',
                        zIndex: 4,
                      }}
                    >
                      {activeCut.badge}
                    </div>

                    {/* Duration badge (Pricing removed as requested) */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '0.65rem',
                        left: '0.65rem',
                        background: 'rgba(7, 9, 14, 0.88)',
                        border: '1px solid rgba(212, 175, 55, 0.6)',
                        backdropFilter: 'blur(8px)',
                        color: 'var(--gold-primary)',
                        padding: '0.22rem 0.65rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.8)',
                        zIndex: 4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <Clock size={12} color="var(--gold-primary)" />
                      <span>{activeCut.duration}</span>
                    </div>
                  </div>

                  {/* Right Details Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.75rem' }}>
                    <div>
                      <div
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--gold-primary)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.12em',
                          marginBottom: '0.35rem',
                        }}
                      >
                        {activeCut.category}
                      </div>

                      <h3
                        className="haircut-card-title"
                        style={{
                          fontSize: 'clamp(1.25rem, 3vw, 1.85rem)',
                          lineHeight: 1.2,
                          marginBottom: '0.6rem',
                          color: '#ffffff',
                        }}
                      >
                        {activeCut.title}
                      </h3>

                      <p
                        className="haircut-desc-text"
                        style={{
                          fontSize: '0.88rem',
                          color: '#cbd5e1',
                          lineHeight: 1.6,
                          marginBottom: '0.85rem',
                        }}
                      >
                        {activeCut.description}
                      </p>

                      {/* Bespoke Motion Signature Note */}
                      <div
                        className="card-motion-badge-box"
                        style={{
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(212, 175, 55, 0.2)',
                          borderRadius: '8px',
                          padding: '0.45rem 0.75rem',
                          fontSize: '0.74rem',
                          color: '#e2e8f0',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                        }}
                      >
                        <Sparkles size={13} color="var(--gold-primary)" />
                        <span><strong>Card Motion Signature:</strong> {activeCut.animBadge} ({activeCut.animName})</span>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div
                      className="card-action-bar"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                        paddingTop: '0.85rem',
                        flexWrap: 'wrap',
                        gap: '0.6rem',
                      }}
                    >
                      <div className="card-artisan-label" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--gold-primary)', fontSize: '0.82rem', fontWeight: 600 }}>
                        <Sparkles size={15} />
                        <span>Artisan Gentleman Craft</span>
                      </div>

                      <div className="card-action-buttons" style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                        <a
                          href={`https://wa.me/${config.whatsapp?.replace(/[^0-9]/g, '')}?text=Hello!%20I%20would%20like%20to%20book%20the%20"${encodeURIComponent(activeCut.title)}"%20haircut.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary btn-sm"
                          style={{ padding: '0.48rem 1.1rem', fontSize: '0.82rem' }}
                        >
                          <MessageSquare size={14} />
                          <span>Book Cut</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stage Navigation: Luxury Capsule Control Bar */}
            <div className="stage-nav-control-bar">
              <button
                onClick={handlePrev}
                className="stage-nav-btn prev-btn"
                aria-label="Previous Haircut Style"
                title="Previous Style"
              >
                <ChevronLeft size={16} />
                <span>Prev Style</span>
              </button>

              {/* Center Counter Pill & Micro Progress */}
              <div className="stage-nav-counter">
                <div className="counter-numbers">
                  <span className="current-idx">0{activeCardIndex + 1}</span>
                  <span className="counter-sep">/</span>
                  <span className="total-count">0{HAIRCUTS.length}</span>
                </div>
                <div className="stage-mini-progress">
                  <div
                    className="stage-mini-progress-fill"
                    style={{
                      width: `${((activeCardIndex + 1) / HAIRCUTS.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <button
                onClick={handleNext}
                className="stage-nav-btn next-btn"
                aria-label="Next Haircut Style"
                title="Next Style"
              >
                <span>Next Style</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Banner: 5-Coupon Card & Location (Solid Deep Luxury Dark) */}
      <CouponBanner onOpenLoyalty={onOpenLoyalty} onOpenAdmin={onOpenAdmin} />

      {/* Responsive Styles Injection */}
      <style>{`
        /* Floating breathing animation for left & right figures */
        @keyframes floatLeftFig {
          0%, 100% { transform: translateY(-50%) translateY(0px); }
          50% { transform: translateY(-50%) translateY(-10px); }
        }
        @keyframes floatRightFig {
          0%, 100% { transform: translateY(-50%) translateY(0px); }
          50% { transform: translateY(-50%) translateY(10px); }
        }
        .left-side-figure {
          animation: floatLeftFig 4s ease-in-out infinite;
        }
        .right-side-figure {
          animation: floatRightFig 4.5s ease-in-out infinite 0.5s;
        }

        /* Universal Stage Wrapper - Height Aware & Centered */
        .pinned-stage-wrapper {
          box-sizing: border-box !important;
          min-height: 100vh !important;
          padding-top: 75px !important;
          padding-bottom: 25px !important;
          justify-content: center !important;
        }

        /* Desktop Layout (> 1100px): Animated Side Figures + Centered Cards */
        @media (min-width: 1101px) {
          .animated-side-figure {
            display: block !important;
          }
          .mobile-figure-dock {
            display: none !important;
          }
          .cards-main-container {
            max-width: 680px !important;
            margin: 0 auto !important;
          }
          .haircut-card-grid {
            display: grid;
            grid-template-columns: 240px 1fr !important;
            gap: 1.5rem !important;
            align-items: center;
          }
          .haircut-img {
            height: 220px !important;
          }
        }

        /* Mid screens / Laptops (861px - 1100px) */
        @media (min-width: 861px) and (max-width: 1100px) {
          .animated-side-figure {
            display: none !important;
          }
          .mobile-figure-dock {
            display: none !important;
          }
          .cards-main-container {
            max-width: 740px !important;
            margin: 0 auto !important;
          }
          .haircut-card-grid {
            display: grid;
            grid-template-columns: 220px 1fr !important;
            gap: 1.25rem !important;
            align-items: center;
          }
          .haircut-img {
            height: 195px !important;
          }
        }

        /* Laptop Viewport Height Optimization (<= 900px height on desktop/laptops) */
        @media (max-height: 900px) and (min-width: 861px) {
          .pinned-stage-wrapper {
            padding-top: 68px !important;
            padding-bottom: 18px !important;
            justify-content: center !important;
          }
          .section-header {
            margin-bottom: 0.5rem !important;
          }
          .master-cut-title-badge {
            padding: 0.15rem 0.55rem !important;
            font-size: 0.65rem !important;
            margin-bottom: 0.22rem !important;
          }
          .section-title {
            font-size: 1.65rem !important;
            margin-bottom: 0.2rem !important;
          }
          .section-subtitle {
            font-size: 0.8rem !important;
            margin-bottom: 0.35rem !important;
            max-width: 560px !important;
            line-height: 1.35 !important;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .style-pills-container {
            margin-bottom: 0.5rem !important;
            padding: 0.2rem 0.4rem !important;
            gap: 0.35rem !important;
            justify-content: center !important;
            flex-wrap: wrap !important;
          }
          .style-pill-btn {
            padding: 0.22rem 0.6rem !important;
            font-size: 0.72rem !important;
          }
          .cards-main-container {
            max-width: 740px !important;
          }
          .active-cut-card {
            padding: 0.75rem 1.1rem !important;
            border-radius: 16px !important;
          }
          .card-top-info-strip {
            margin-bottom: 0.4rem !important;
          }
          .haircut-card-grid {
            grid-template-columns: 210px 1fr !important;
            gap: 1.25rem !important;
          }
          .haircut-img {
            height: 180px !important;
          }
          .haircut-card-title {
            font-size: 1.25rem !important;
            line-height: 1.2 !important;
            margin-bottom: 0.22rem !important;
          }
          .haircut-desc-text {
            font-size: 0.8rem !important;
            line-height: 1.4 !important;
            margin-bottom: 0.35rem !important;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .card-motion-badge-box {
            padding: 0.22rem 0.55rem !important;
            font-size: 0.68rem !important;
            margin-bottom: 0.35rem !important;
          }
          .card-action-bar {
            padding-top: 0.45rem !important;
          }
          .card-action-bar .btn {
            padding: 0.32rem 0.85rem !important;
            font-size: 0.76rem !important;
          }
          .stage-nav-control-bar {
            margin-top: 0.55rem !important;
            padding: 0.35rem 0.85rem !important;
            max-width: 440px !important;
          }
          .stage-nav-btn {
            padding: 0.35rem 0.9rem !important;
            font-size: 0.76rem !important;
          }
          .stage-mini-progress {
            width: 45px !important;
          }
        }

        /* Compact Laptops (<= 740px height, e.g. 1366x768 or 1080p scaled at 150%) */
        @media (max-height: 740px) and (min-width: 861px) {
          .pinned-stage-wrapper {
            padding-top: 60px !important;
            padding-bottom: 12px !important;
          }
          .section-header {
            margin-bottom: 0.3rem !important;
          }
          .section-title {
            font-size: 1.45rem !important;
            margin-bottom: 0.12rem !important;
          }
          .section-subtitle {
            display: none !important;
          }
          .style-pills-container {
            margin-bottom: 0.35rem !important;
          }
          .haircut-card-grid {
            grid-template-columns: 190px 1fr !important;
            gap: 1rem !important;
          }
          .haircut-img {
            height: 160px !important;
          }
          .haircut-card-title {
            font-size: 1.15rem !important;
            margin-bottom: 0.18rem !important;
          }
          .haircut-desc-text {
            font-size: 0.76rem !important;
            line-height: 1.35 !important;
            margin-bottom: 0.25rem !important;
          }
          .stage-nav-control-bar {
            margin-top: 0.45rem !important;
          }
        }

        /* Luxury Stage Navigation Capsule Bar */
        .stage-nav-control-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.85rem;
          width: 100%;
          max-width: 480px;
          margin: 1.15rem auto 0;
          padding: 0.45rem 0.85rem;
          background: rgba(10, 13, 20, 0.95);
          border: 1.5px solid rgba(212, 175, 55, 0.4);
          border-radius: var(--radius-full);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.92), 0 0 20px rgba(212, 175, 55, 0.15);
          position: relative;
          z-index: 25;
        }
        .stage-nav-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.45rem 1.1rem;
          border-radius: var(--radius-full);
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          border: none;
          letter-spacing: 0.03em;
        }
        .stage-nav-btn.prev-btn {
          background: rgba(255, 255, 255, 0.07);
          color: #e2e8f0;
          border: 1px solid rgba(212, 175, 55, 0.35);
        }
        .stage-nav-btn.prev-btn:hover {
          background: rgba(212, 175, 55, 0.18);
          color: var(--gold-primary);
          border-color: var(--gold-primary);
          transform: translateX(-2px);
        }
        .stage-nav-btn.next-btn {
          background: var(--gold-gradient);
          color: #07090e;
          font-weight: 700;
          box-shadow: 0 4px 15px rgba(212, 175, 55, 0.35);
        }
        .stage-nav-btn.next-btn:hover {
          box-shadow: 0 6px 22px rgba(212, 175, 55, 0.55);
          transform: translateX(2px);
        }
        .stage-nav-counter {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
          min-width: 75px;
        }
        .counter-numbers {
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        .counter-numbers .current-idx {
          color: var(--gold-primary);
        }
        .counter-numbers .counter-sep {
          color: rgba(255, 255, 255, 0.35);
        }
        .counter-numbers .total-count {
          color: #94a3b8;
        }
        .stage-mini-progress {
          width: 50px;
          height: 3px;
          background: rgba(255, 255, 255, 0.12);
          border-radius: 2px;
          overflow: hidden;
        }
        .stage-mini-progress-fill {
          height: 100%;
          background: var(--gold-gradient);
          border-radius: 2px;
          transition: width 0.3s ease-out;
        }

        /* Unified Responsive Compact Mobile Composition (<= 860px) */
        @media (max-width: 860px) {
          div.pinned-stage-wrapper {
            min-height: 100dvh !important;
            padding-top: clamp(68px, 9vh, 76px) !important; /* Always clears 62px top navbar with 6-14px clearance */
            padding-bottom: calc(64px + clamp(8px, 1.5vh, 16px)) !important; /* Always clears 64px bottom nav with 8-16px clearance */
            padding-left: clamp(0.5rem, 2vw, 0.85rem) !important;
            padding-right: clamp(0.5rem, 2vw, 0.85rem) !important;
            justify-content: flex-start !important;
          }
          .salon-atmosphere-badge,
          .animated-side-figure,
          .mobile-figure-dock,
          .section-subtitle,
          .card-suite-badge,
          .card-artisan-label,
          .card-motion-badge-box {
            display: none !important;
          }
          div.pinned-stage-wrapper .section-header {
            margin-bottom: clamp(0.2rem, 0.8vh, 0.35rem) !important;
          }
          div.pinned-stage-wrapper .master-cut-title-badge {
            margin-bottom: clamp(0.12rem, 0.4vh, 0.22rem) !important;
            padding: clamp(0.14rem, 0.4vh, 0.2rem) clamp(0.45rem, 1.5vw, 0.65rem) !important;
            white-space: nowrap !important;
            max-width: 95% !important;
          }
          div.pinned-stage-wrapper .master-cut-title-badge span {
            font-size: clamp(0.55rem, 1.8vw, 0.68rem) !important;
            letter-spacing: 0.05em !important;
          }
          div.pinned-stage-wrapper .section-title {
            font-size: clamp(1.15rem, 3.8vw, 1.45rem) !important;
            margin-bottom: clamp(0.08rem, 0.3vh, 0.15rem) !important;
            line-height: 1.15 !important;
          }
          div.pinned-stage-wrapper .style-pills-container {
            margin-bottom: clamp(0.35rem, 1vh, 0.55rem) !important;
            padding: 0.16rem 0.4rem !important;
            gap: clamp(0.25rem, 0.8vw, 0.35rem) !important;
          }
          div.pinned-stage-wrapper .style-pill-btn {
            padding: clamp(0.16rem, 0.4vh, 0.22rem) clamp(0.45rem, 1.2vw, 0.55rem) !important;
            font-size: clamp(0.62rem, 1.8vw, 0.68rem) !important;
          }
          div.pinned-stage-wrapper .active-cut-card {
            padding: clamp(0.55rem, 1.5vh, 0.95rem) clamp(0.7rem, 2.2vw, 1.1rem) !important; /* Luxury card padding - spacious breathing room */
            border-radius: clamp(14px, 2vw, 18px) !important;
          }
          div.pinned-stage-wrapper .card-top-info-strip {
            margin-bottom: clamp(0.35rem, 1vh, 0.65rem) !important; /* Generous breathing room above photo - NOT chipka hua */
          }
          div.pinned-stage-wrapper .card-motion-chip {
            font-size: clamp(0.65rem, 1.9vw, 0.72rem) !important;
            padding: 0.18rem 0.55rem !important;
          }
          div.pinned-stage-wrapper .haircut-card-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: clamp(0.3rem, 0.8vh, 0.55rem) !important;
          }
          div.pinned-stage-wrapper .haircut-card-grid > div:last-child {
            gap: clamp(0.25rem, 0.8vh, 0.65rem) !important;
          }
          div.pinned-stage-wrapper .haircut-img {
            height: clamp(82px, 14.5vh, 155px) !important;
          }
          div.pinned-stage-wrapper .haircut-card-title {
            font-size: clamp(0.95rem, 2.8vw, 1.18rem) !important;
            line-height: 1.18 !important;
            margin-bottom: clamp(0.08rem, 0.3vh, 0.16rem) !important;
          }
          div.pinned-stage-wrapper .haircut-desc-text {
            font-size: clamp(0.68rem, 1.9vw, 0.78rem) !important;
            line-height: 1.3 !important;
            margin-bottom: clamp(0.2rem, 0.6vh, 0.35rem) !important;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          div.pinned-stage-wrapper .card-action-bar {
            padding-top: clamp(0.25rem, 0.6vh, 0.38rem) !important;
            justify-content: center !important;
          }
          div.pinned-stage-wrapper .card-action-buttons {
            width: 100%;
            display: flex;
            justify-content: stretch;
            gap: 0.45rem;
          }
          div.pinned-stage-wrapper .card-action-buttons .btn {
            flex: 1;
            text-align: center;
            justify-content: center;
            padding: clamp(0.28rem, 0.7vh, 0.38rem) clamp(0.55rem, 1.4vw, 0.8rem) !important;
            font-size: clamp(0.7rem, 1.9vw, 0.76rem) !important;
          }
          div.pinned-stage-wrapper .stage-nav-control-bar {
            margin-top: clamp(0.25rem, 0.8vh, 0.65rem) !important;
            padding: clamp(0.22rem, 0.6vh, 0.42rem) clamp(0.65rem, 2vw, 1rem) !important;
            max-width: clamp(290px, 85vw, 360px) !important;
          }
          div.pinned-stage-wrapper .stage-nav-btn {
            padding: clamp(0.26rem, 0.7vh, 0.38rem) clamp(0.65rem, 2vw, 0.85rem) !important;
            font-size: clamp(0.7rem, 1.9vw, 0.76rem) !important;
          }
          div.pinned-stage-wrapper .counter-numbers {
            font-size: clamp(0.68rem, 1.8vw, 0.76rem) !important;
          }
          div.pinned-stage-wrapper .stage-mini-progress {
            width: 36px !important;
          }
        }

        @media (max-width: 360px) {
          div.pinned-stage-wrapper .cards-main-container {
            padding: 0 0.25rem !important;
            max-width: 100% !important;
          }
          div.pinned-stage-wrapper .stage-nav-control-bar {
            max-width: 100% !important;
            padding: 0.22rem 0.45rem !important;
          }
          div.pinned-stage-wrapper .stage-nav-btn {
            padding: 0.22rem 0.45rem !important;
            font-size: 0.65rem !important;
            gap: 0.2rem !important;
          }
          div.pinned-stage-wrapper .style-pills-container {
            padding: 0.15rem 0.25rem !important;
          }
          div.pinned-stage-wrapper .style-pill-btn {
            padding: 0.16rem 0.38rem !important;
            font-size: 0.62rem !important;
          }
        }

        @media (min-width: 2000px) {
          .cards-main-container {
            max-width: 1050px !important;
          }
          .haircut-card-grid {
            grid-template-columns: 360px 1fr !important;
            gap: 2.5rem !important;
          }
          .haircut-img {
            height: 320px !important;
          }
          .active-cut-card {
            padding: 2rem 2.25rem !important;
            border-radius: 26px !important;
          }
          .haircut-card-title {
            font-size: 2.1rem !important;
          }
          .haircut-desc-text {
            font-size: 1.12rem !important;
          }
          .style-pill-btn {
            padding: 0.5rem 1.15rem !important;
            font-size: 0.92rem !important;
          }
          .stage-nav-control-bar {
            max-width: 580px !important;
            padding: 0.6rem 1.1rem !important;
          }
          .stage-nav-btn {
            font-size: 0.92rem !important;
            padding: 0.5rem 1.25rem !important;
          }
        }
      `}</style>

      {/* Fullscreen Lightbox Modal for 2026 Blueprints & Extra Art */}
      {lightboxImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(4, 6, 10, 0.9)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setLightboxImage(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0c0f16',
              border: '2px solid var(--gold-primary)',
              borderRadius: '20px',
              maxWidth: '480px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 40px rgba(212, 175, 55, 0.25)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '0.9rem 1.2rem',
                borderBottom: '1px solid rgba(212, 175, 55, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(18, 22, 32, 0.95)',
              }}
            >
              <div>
                <h3 style={{ fontSize: '0.98rem', color: 'var(--gold-primary)', margin: 0, fontWeight: 700 }}>
                  {lightboxImage.title}
                </h3>
                <p style={{ fontSize: '0.74rem', color: '#94a3b8', margin: '0.2rem 0 0' }}>
                  {lightboxImage.subtitle}
                </p>
              </div>
              <button
                onClick={() => setLightboxImage(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Image */}
            <div style={{ padding: '0.75rem', textAlign: 'center', background: '#05070a', overflow: 'auto', maxHeight: '62vh' }}>
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title}
                style={{
                  maxWidth: '100%',
                  maxHeight: '58vh',
                  objectFit: 'contain',
                  borderRadius: '12px',
                  display: 'block',
                  margin: '0 auto',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.9)',
                }}
              />
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '0.85rem 1.25rem',
                borderTop: '1px solid rgba(212, 175, 55, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                background: 'rgba(18, 22, 32, 0.95)',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
                Want this exact fade & cut?
              </span>
              <a
                href={`https://wa.me/${config.whatsapp?.replace(/[^0-9]/g, '')}?text=Hi,%20I%20saw%20the%20"${encodeURIComponent(lightboxImage.title)}"%20blueprint%20and%20want%20to%20book%20this%20cut.`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-sm"
                style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <MessageSquare size={14} /> Book This Style
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
