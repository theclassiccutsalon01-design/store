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
        padding: '0.75rem',
        boxSizing: 'border-box',
      }}
      onClick={!spinning ? onClose : undefined}
    >
      <div
        className="modal-content"
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'linear-gradient(145deg, #222222 0%, #1A1A1A 100%)',
          border: '1.5px solid rgba(212, 175, 55, 0.6)',
          borderRadius: '20px',
          padding: '1.5rem 1.25rem',
          boxShadow: '0 25px 65px rgba(0, 0, 0, 0.95), 0 0 35px rgba(212, 175, 55, 0.25)',
          color: 'var(--color-cream, #F9F8F6)',
          position: 'relative',
          textAlign: 'center',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={{ textAlign: 'left' }}>
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--gold-primary)',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <Sparkles size={13} />
              <span>VIP Discount Spin Wheel</span>
            </span>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0.15rem 0 0 0', color: '#ffffff' }}>
              Spin For Your <span className="gold-text">Grooming Discount</span>
            </h3>
          </div>

          <button
            type="button"
            disabled={spinning}
            onClick={onClose}
            aria-label="Close"
            style={{
              width: '34px',
              height: '34px',
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
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fca5a5',
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              fontSize: '0.78rem',
              marginBottom: '0.75rem',
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
            gap: '0.5rem',
            background: 'rgba(212, 175, 55, 0.12)',
            border: '1px solid rgba(212, 175, 55, 0.35)',
            borderRadius: '20px',
            padding: '0.25rem 0.85rem',
            marginBottom: '1rem',
            fontSize: '0.78rem',
          }}
        >
          <Gift size={13} color="var(--gold-primary)" />
          <span style={{ color: '#cbd5e1' }}>Eligible Coupon:</span>
          <strong style={{ fontFamily: 'monospace', color: 'var(--gold-primary)', letterSpacing: '0.06em' }}>
            {coupon.code}
          </strong>
        </div>

        {/* ========================================================================= */}
        {/* THE WHEEL CONTAINER */}
        {/* ========================================================================= */}
        <div
          style={{
            position: 'relative',
            width: '280px',
            height: '280px',
            margin: '0 auto 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Top Golden Pointer */}
          <div
            style={{
              position: 'absolute',
              top: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 30,
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.8))',
            }}
          >
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: '14px solid transparent',
                borderRight: '14px solid transparent',
                borderTop: '26px solid #d4af37',
              }}
            />
          </div>

          {/* Outer Glowing Metallic Rim */}
          <div
            style={{
              position: 'absolute',
              inset: '-8px',
              borderRadius: '50%',
              border: '3px solid rgba(212, 175, 55, 0.5)',
              boxShadow: '0 0 25px rgba(212, 175, 55, 0.35), inset 0 0 15px rgba(212, 175, 55, 0.25)',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          />

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
              filter: 'drop-shadow(0 8px 18px rgba(0, 0, 0, 0.7))',
            }}
          >
            <defs>
              <radialGradient id="hubGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#d4af37" />
                <stop offset="60%" stopColor="#b8860b" />
                <stop offset="100%" stopColor="#1A1A1A" />
              </radialGradient>
              <linearGradient id="goldBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#d4af37" />
                <stop offset="100%" stopColor="#996515" />
              </linearGradient>
            </defs>

            {/* Render 6 Segments */}
            {SEGMENTS.map((seg, i) => {
              const startAngle = i * segmentAngle - 90; // Align so segment 0 starts at top
              const endAngle = startAngle + segmentAngle;
              const r = 150;
              const cx = 150;
              const cy = 150;

              const x1 = cx + r * Math.cos((Math.PI * startAngle) / 180);
              const y1 = cy + r * Math.sin((Math.PI * startAngle) / 180);
              const x2 = cx + r * Math.cos((Math.PI * endAngle) / 180);
              const y2 = cy + r * Math.sin((Math.PI * endAngle) / 180);

              const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;

              // Text Angle (Midpoint of slice)
              const midAngle = startAngle + segmentAngle / 2;
              const textR = 100;
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
                  <text
                    x={tx}
                    y={ty}
                    fill={seg.textColor}
                    fontSize="17"
                    fontWeight="800"
                    fontFamily="'Montserrat', 'Cinzel', serif"
                    textAnchor="middle"
                    dominantBaseline="central"
                    transform={`rotate(${midAngle + 90}, ${tx}, ${ty})`}
                  >
                    {seg.percent}%
                  </text>
                </g>
              );
            })}

            {/* Central Scissors Emblem & Golden Hub */}
            <circle cx="150" cy="150" r="32" fill="url(#hubGradient)" stroke="#ffffff" strokeWidth="2.5" />
            <circle cx="150" cy="150" r="24" fill="#1A1A1A" stroke="url(#goldBorderGrad)" strokeWidth="1.5" />
          </svg>

          {/* Center Hub Overlay Scissors Icon */}
          <div
            style={{
              position: 'absolute',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              pointerEvents: 'none',
              color: 'var(--gold-primary)',
            }}
          >
            <Scissors size={18} strokeWidth={2.5} />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RESULT PRESENTATION OR SPIN TRIGGER */}
        {/* ========================================================================= */}
        {result ? (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.18) 0%, rgba(26, 26, 26, 0.95) 100%)',
              border: '2px solid var(--gold-primary)',
              borderRadius: '14px',
              padding: '1rem',
              boxShadow: '0 8px 30px rgba(212, 175, 55, 0.4)',
              animation: 'fadeIn 0.3s ease',
            }}
          >
            <div style={{ display: 'inline-flex', padding: '0.45rem', borderRadius: '50%', background: 'rgba(212, 175, 55, 0.2)', marginBottom: '0.45rem' }}>
              <Trophy size={26} color="var(--gold-primary)" />
            </div>
            <h4 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: '#ffffff' }}>
              🎉 You Won <span className="gold-text">{result.percent}% OFF</span>!
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#cbd5e1', margin: '0 0 0.85rem 0' }}>
              Your coupon code <strong>{result.coupon?.code || coupon.code}</strong> is now loaded with a guaranteed {result.percent}% discount!
              {result.spinNumber ? ` (Spin #${result.spinNumber})` : ''}
            </p>

            <button
              type="button"
              onClick={onClose}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', fontWeight: 800, fontSize: '0.9rem', justifyContent: 'center' }}
            >
              <Check size={16} />
              <span>Claim & View Coupon</span>
            </button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Spins 1–49 award 25%–35%. Spin 50 guarantees 40% OFF! Spin 100 awards up to 50% OFF!
            </p>
            <button
              type="button"
              disabled={spinning}
              onClick={handleSpin}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                fontSize: '1rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                justifyContent: 'center',
                boxShadow: spinning ? 'none' : '0 0 20px rgba(212, 175, 55, 0.45)',
                cursor: spinning ? 'not-allowed' : 'pointer',
                opacity: spinning ? 0.7 : 1,
              }}
            >
              <Sparkles size={18} />
              <span>{spinning ? 'Spinning The Wheel...' : 'SPIN THE WHEEL NOW'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};
