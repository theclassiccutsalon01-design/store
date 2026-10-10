import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import API from '../services/api';
import confetti from 'canvas-confetti';
import { X, Sparkles, Trophy, Gift, ArrowDown, Check, Scissors } from 'lucide-react';

// Exactly six discount segments harmonized with the Classic Luxury palette
const SEGMENTS = [
  { percent: 25, label: '25% OFF', color: '#1A1A1A', textColor: '#D4AF37', border: '#D4AF37' },
  { percent: 30, label: '30% OFF', color: '#262626', textColor: '#F9F8F6', border: '#B87333' },
  { percent: 35, label: '35% OFF', color: '#1E1E1E', textColor: '#D4AF37', border: '#D4AF37' },
  { percent: 40, label: '40% OFF', color: '#262626', textColor: '#F9F8F6', border: '#B87333' },
  { percent: 45, label: '45% OFF', color: '#1A1A1A', textColor: '#D4AF37', border: '#D4AF37' },
  { percent: 50, label: '50% OFF', color: '#2C2214', textColor: '#D4AF37', border: '#B87333' },
];

export const SpinWheelModal = ({ isOpen, onClose, coupon, onSpinSuccess }) => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [spinCountDisplay, setSpinCountDisplay] = useState(null);
  const wheelRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setResult(null);
      setErrorMsg('');
      setSpinning(false);
      setRotation(0);
    }
  }, [isOpen, coupon?._id]);

  if (!isOpen || !coupon) return null;

  const segmentAngle = 360 / SEGMENTS.length; // 60 degrees each

  const handleSpin = async () => {
    if (spinning || result) return;
    setSpinning(true);
    setErrorMsg('');

    try {
      // 1. Authoritative backend spin execution
      const res = await API.post('/loyalty/spin-wheel', {
        couponId: coupon._id,
      });

      const awardedPercent = res.data.discountPercent;
      const spinNumber = res.data.spinNumber;
      const updatedCoupon = res.data.coupon;
      setSpinCountDisplay(spinNumber);

      // 2. Identify the segment index for this exact backend award
      const targetIndex = SEGMENTS.findIndex((s) => s.percent === awardedPercent);
      const safeIndex = targetIndex >= 0 ? targetIndex : 0;

      // 3. Compute precise landing rotation (pointer points at top center / 0 degrees)
      const centerAngle = safeIndex * segmentAngle + segmentAngle / 2;
      const stopTarget = (360 - centerAngle) % 360;
      const fullRotations = 5; // 5 full smooth spins
      const finalAngle = 360 * fullRotations + stopTarget;

      // 4. Animate the wheel
      setRotation(finalAngle);

      // 5. Complete animation after 4.5 seconds (matching CSS transition)
      setTimeout(() => {
        setSpinning(false);
        setResult({
          percent: awardedPercent,
          spinNumber,
          coupon: updatedCoupon,
        });

        // Festive confetti burst
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#d4af37', '#b8860b', '#f59e0b', '#ffffff'],
        });

        if (onSpinSuccess) {
          onSpinSuccess(updatedCoupon);
        }
      }, 4500);
    } catch (err) {
      setSpinning(false);
      const msg = err.response?.data?.message || 'Unable to spin at this moment. Please try again.';
      setErrorMsg(msg);
      // If already spun, pass back existing discount
      if (err.response?.data?.discountPercent && err.response?.data?.coupon) {
        setResult({
          percent: err.response.data.discountPercent,
          coupon: err.response.data.coupon,
        });
        if (onSpinSuccess) onSpinSuccess(err.response.data.coupon);
      }
    }
  };

  const modalContent = (
    <div
      className="modal-overlay"
      data-lenis-prevent="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'rgba(5, 7, 12, 0.92)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.75rem 0.5rem',
        boxSizing: 'border-box',
        overflowY: 'auto',
      }}
      onClick={!spinning ? onClose : undefined}
    >
      <div
        className="modal-content"
        data-lenis-prevent="true"
        style={{
          width: '100%',
          maxWidth: '440px',
          maxHeight: 'min(92vh, 92dvh)',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          touchAction: 'pan-y',
          background: 'linear-gradient(155deg, #222222 0%, #1A1A1A 60%, #141414 100%)',
          border: '1.5px solid rgba(212, 175, 55, 0.65)',
          borderRadius: '20px',
          padding: '1.15rem 1rem 1.4rem',
          boxShadow: '0 25px 65px rgba(0, 0, 0, 0.95), 0 0 35px rgba(212, 175, 55, 0.25)',
          color: 'var(--color-cream, #F9F8F6)',
          position: 'relative',
          textAlign: 'center',
          boxSizing: 'border-box',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(212, 175, 55, 0.4) transparent',
        }}
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div style={{ textAlign: 'left' }}>
            <span
              style={{
                fontSize: '0.68rem',
                color: 'var(--gold-primary, #D4AF37)',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <Sparkles size={12} />
              <span>VIP Discount Spin Wheel</span>
            </span>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0.1rem 0 0 0', color: '#ffffff' }}>
              Spin For Your <span className="gold-text">Grooming Discount</span>
            </h3>
          </div>

          <button
            type="button"
            disabled={spinning}
            onClick={onClose}
            aria-label="Close"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: spinning ? 'not-allowed' : 'pointer',
              opacity: spinning ? 0.4 : 1,
              transition: 'all 0.2s ease',
              flexShrink: 0,
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fca5a5',
              padding: '0.45rem 0.65rem',
              borderRadius: '8px',
              fontSize: '0.75rem',
              marginBottom: '0.5rem',
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Coupon code pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: 'rgba(212, 175, 55, 0.12)',
            border: '1px solid rgba(212, 175, 55, 0.35)',
            borderRadius: '20px',
            padding: '0.2rem 0.75rem',
            marginBottom: '0.75rem',
            fontSize: '0.75rem',
          }}
        >
          <Gift size={13} color="var(--gold-primary, #D4AF37)" />
          <span style={{ color: '#cbd5e1' }}>Eligible Coupon:</span>
          <strong style={{ fontFamily: 'monospace', color: 'var(--gold-primary, #D4AF37)', letterSpacing: '0.06em' }}>
            {coupon.code}
          </strong>
        </div>

        {/* ========================================================================= */}
        {/* THE WHEEL CONTAINER */}
        {/* ========================================================================= */}
        <div
          style={{
            position: 'relative',
            width: 'min(240px, 62vw)',
            height: 'min(240px, 62vw)',
            margin: '0 auto 0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Top Golden Luxury Pointer */}
          <div
            style={{
              position: 'absolute',
              top: '-14px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 30,
              filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.85)) drop-shadow(0 0 8px rgba(212,175,55,0.6))',
            }}
          >
            <svg width="28" height="34" viewBox="0 0 28 34" fill="none">
              <defs>
                <linearGradient id="pointerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFF2B2" />
                  <stop offset="45%" stopColor="#D4AF37" />
                  <stop offset="100%" stopColor="#8A6714" />
                </linearGradient>
              </defs>
              {/* Outer Golden Arrow */}
              <path
                d="M14 34L2 6C2 3.79 3.79 2 6 2H22C24.21 2 26 3.79 26 6L14 34Z"
                fill="url(#pointerGrad)"
                stroke="#1A1A1A"
                strokeWidth="1.5"
              />
              {/* Inner Accent Jewel */}
              <circle cx="14" cy="7" r="3" fill="#1A1A1A" stroke="#FFF2B2" strokeWidth="1" />
            </svg>
          </div>

          {/* Rotating SVG Wheel */}
          <svg
            ref={wheelRef}
            viewBox="0 0 300 300"
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? 'transform 4.5s cubic-bezier(0.12, 0.85, 0.2, 1)' : 'none',
              transformOrigin: 'center center',
              overflow: 'hidden',
              filter: 'drop-shadow(0 8px 20px rgba(0, 0, 0, 0.85))',
            }}
          >
            <defs>
              <radialGradient id="hubGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFF2B2" />
                <stop offset="40%" stopColor="#D4AF37" />
                <stop offset="85%" stopColor="#8A6714" />
                <stop offset="100%" stopColor="#1A1A1A" />
              </radialGradient>
              <linearGradient id="goldBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#d4af37" />
                <stop offset="100%" stopColor="#996515" />
              </linearGradient>
              <radialGradient id="rimGlow" cx="50%" cy="50%" r="50%">
                <stop offset="92%" stopColor="#1A1A1A" />
                <stop offset="96%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#AA820A" />
              </radialGradient>
            </defs>

            {/* Render 6 Segments */}
            {SEGMENTS.map((seg, i) => {
              const startAngle = i * segmentAngle - 90; // Align so segment 0 starts at top
              const endAngle = startAngle + segmentAngle;
              const r = 146;
              const cx = 150;
              const cy = 150;

              const x1 = cx + r * Math.cos((Math.PI * startAngle) / 180);
              const y1 = cy + r * Math.sin((Math.PI * startAngle) / 180);
              const x2 = cx + r * Math.cos((Math.PI * endAngle) / 180);
              const y2 = cy + r * Math.sin((Math.PI * endAngle) / 180);

              const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;

              // Text Angle (Midpoint of slice)
              const midAngle = startAngle + segmentAngle / 2;
              const textR = 98;
              const tx = cx + textR * Math.cos((Math.PI * midAngle) / 180);
              const ty = cy + textR * Math.sin((Math.PI * midAngle) / 180);

              return (
                <g key={seg.percent}>
                  <path
                    d={pathData}
                    fill={seg.color}
                    stroke="url(#goldBorderGrad)"
                    strokeWidth="2"
                  />
                  {/* Outer edge arc rim accent */}
                  <path
                    d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
                    fill="none"
                    stroke="url(#goldBorderGrad)"
                    strokeWidth="4"
                  />
                  <g transform={`translate(${tx}, ${ty}) rotate(${midAngle + 90})`}>
                    <text
                      x="0"
                      y="-4"
                      fill={seg.textColor}
                      fontSize="18"
                      fontWeight="900"
                      fontFamily="-apple-system, BlinkMacSystemFont, 'Montserrat', sans-serif"
                      textAnchor="middle"
                      dominantBaseline="central"
                      style={{ textShadow: '0 2px 6px rgba(0,0,0,0.95)' }}
                    >
                      {seg.percent}%
                    </text>
                    <text
                      x="0"
                      y="11"
                      fill="#D4AF37"
                      fontSize="9"
                      fontWeight="800"
                      fontFamily="-apple-system, BlinkMacSystemFont, 'Montserrat', sans-serif"
                      letterSpacing="2px"
                      textAnchor="middle"
                      dominantBaseline="central"
                      style={{ textShadow: '0 1px 4px rgba(0,0,0,0.95)' }}
                    >
                      OFF
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Perimeter Golden Studs / Jewels (12 Rivets at 30-degree increments) */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
              const studR = 143;
              const sx = 150 + studR * Math.cos((Math.PI * (deg - 90)) / 180);
              const sy = 150 + studR * Math.sin((Math.PI * (deg - 90)) / 180);
              return (
                <circle
                  key={deg}
                  cx={sx}
                  cy={sy}
                  r="2.8"
                  fill="#FFF2B2"
                  stroke="#8A6714"
                  strokeWidth="0.8"
                />
              );
            })}

            {/* Central Multi-tier Luxury Hub */}
            <circle cx="150" cy="150" r="32" fill="url(#hubGradient)" stroke="#1A1A1A" strokeWidth="2" />
            <circle cx="150" cy="150" r="23" fill="#1A1A1A" stroke="url(#goldBorderGrad)" strokeWidth="1.5" />
          </svg>

          {/* Center Hub Overlay Scissors Icon */}
          <div
            style={{
              position: 'absolute',
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              pointerEvents: 'none',
              color: 'var(--gold-primary, #D4AF37)',
            }}
          >
            <Scissors size={17} strokeWidth={2.4} />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RESULT PRESENTATION OR SPIN TRIGGER */}
        {/* ========================================================================= */}
        {result ? (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.16) 0%, rgba(26, 26, 26, 0.96) 100%)',
              border: '1.5px solid var(--gold-primary, #D4AF37)',
              borderRadius: '14px',
              padding: '0.85rem 0.95rem',
              boxShadow: '0 8px 25px rgba(212, 175, 55, 0.35)',
              animation: 'fadeIn 0.3s ease',
            }}
          >
            <div style={{ display: 'inline-flex', padding: '0.35rem', borderRadius: '50%', background: 'rgba(212, 175, 55, 0.2)', marginBottom: '0.35rem' }}>
              <Trophy size={22} color="var(--gold-primary, #D4AF37)" />
            </div>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.2rem 0', color: '#ffffff' }}>
              🎉 You Won <span className="gold-text">{result.percent}% OFF</span>!
            </h4>
            <p style={{ fontSize: '0.78rem', color: '#cbd5e1', margin: '0 0 0.75rem 0', lineHeight: 1.4 }}>
              Your coupon code <strong>{result.coupon?.code || coupon.code}</strong> is now loaded with a guaranteed {result.percent}% discount!
              {result.spinNumber ? ` (Spin #${result.spinNumber})` : ''}
            </p>

            <button
              type="button"
              onClick={onClose}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.65rem 1rem',
                fontWeight: 800,
                fontSize: '0.88rem',
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(212, 175, 55, 0.4)',
              }}
            >
              <Check size={16} />
              <span>Claim & View Coupon</span>
            </button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted, #9E9A92)', marginBottom: '0.75rem', lineHeight: 1.35 }}>
              Spins 1–49 award 25%–35%. Spin 50 guarantees 40% OFF! Spin 100 awards up to 50% OFF!
            </p>
            <button
              type="button"
              disabled={spinning}
              onClick={handleSpin}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                fontSize: '0.92rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                justifyContent: 'center',
                boxShadow: spinning ? 'none' : '0 0 20px rgba(212, 175, 55, 0.45)',
                cursor: spinning ? 'not-allowed' : 'pointer',
                opacity: spinning ? 0.7 : 1,
              }}
            >
              <Sparkles size={16} />
              <span>{spinning ? 'Spinning The Wheel...' : 'SPIN THE WHEEL NOW'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};
