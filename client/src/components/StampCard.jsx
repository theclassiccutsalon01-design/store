import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSiteConfig } from '../context/SiteConfigContext';
import API from '../services/api';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import {
  Scissors,
  Gift,
  Clock,
  Sparkles,
  X,
  User,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle,
  Edit3,
  Save,
  LogOut,
  Calendar,
  AlertCircle,
  ExternalLink,
  QrCode,
  Copy,
  Check,
  Bell,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const StampCard = ({
  isOpen,
  onClose,
  onOpenAuth,
  initialTab = 'profile',
  onOpenAdmin,
}) => {
  const { user, isAuthenticated, refreshUser, updateProfile, logout, isAdmin } = useAuth();
  const { config } = useSiteConfig();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [loyaltyData, setLoyaltyData] = useState(() => {
    try {
      const cached = localStorage.getItem('classic_cut_loyalty');
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  // Profile Edit State
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editMsg, setEditMsg] = useState('');
  const [editError, setEditError] = useState('');

  // Coupon Presentation & QR State
  const [selectedCouponQr, setSelectedCouponQr] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copiedCouponCode, setCopiedCouponCode] = useState(null);
  const [showExpiredCoupons, setShowExpiredCoupons] = useState(false);

  const showQrCode = async (coupon) => {
    try {
      const url = await QRCode.toDataURL(coupon.code, {
        width: 240,
        margin: 2,
        color: {
          dark: '#07090e',
          light: '#ffffff',
        },
      });
      setQrDataUrl(url);
      setSelectedCouponQr(coupon);
    } catch (err) {
      console.error('QR Gen Error:', err);
    }
  };

  const handleCopyCode = (code) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code);
    }
    setCopiedCouponCode(code);
    setTimeout(() => setCopiedCouponCode(null), 2500);
  };

  // Sync tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(isAdmin ? 'profile' : initialTab);
      setIsEditingPhone(false);
      setIsEditingName(false);
      setEditMsg('');
      setEditError('');
    }
  }, [isOpen, initialTab, isAdmin]);

  const fetchLoyalty = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await API.get('/loyalty/my-stamps');
      setLoyaltyData(res.data);
      try {
        localStorage.setItem('classic_cut_loyalty', JSON.stringify(res.data));
      } catch (e) {}
      if (refreshUser) refreshUser();

      if (res.data.coupons && res.data.coupons.length > 0 && !res.data.coupons[0].isRedeemed) {
        confetti({
          particleCount: 45,
          spread: 55,
          origin: { y: 0.6 },
        });
      }
    } catch (err) {
      console.error('Failed to load loyalty:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchLoyalty();
    }
  }, [isOpen, isAuthenticated]);

  // Real-time live updates without reload for stamps, coupons, and redemptions
  useEffect(() => {
    const handleRealtime = (e) => {
      const data = e.detail;
      if (!data) return;

      if (data.type === 'STAMP_AWARDED') {
        if (user && data.userId === user._id) {
          setLoyaltyData((prev) => {
            if (!prev) return prev;
            const updatedCoupons = data.coupon
              ? [data.coupon, ...(prev.coupons || [])]
              : prev.coupons || [];
            const nextLoyalty = {
              ...prev,
              currentStamps: data.currentStamps,
              lifetimeVisits: data.lifetimeVisits,
              lastStampDate: data.lastStampDate,
              daysUntilStampDecay: data.daysUntilStampDecay || 45,
              stampsNeeded: 5 - data.currentStamps,
              coupons: updatedCoupons,
            };
            try {
              localStorage.setItem('classic_cut_loyalty', JSON.stringify(nextLoyalty));
            } catch (e) {}
            return nextLoyalty;
          });

          // Celebration confetti
          confetti({
            particleCount: 60,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
      } else if (data.type === 'COUPON_REDEEMED') {
        if (user && (data.userId === user._id || data.targetUserId === user._id)) {
          setLoyaltyData((prev) => {
            if (!prev) return prev;
            const nextLoyalty = {
              ...prev,
              coupons: (prev.coupons || []).filter((c) => c.code !== data.code),
            };
            try {
              localStorage.setItem('classic_cut_loyalty', JSON.stringify(nextLoyalty));
            } catch (e) {}
            return nextLoyalty;
          });
        }
      }
    };

    window.addEventListener('classic_cut_realtime', handleRealtime);
    return () => window.removeEventListener('classic_cut_realtime', handleRealtime);
  }, [user?._id]);


  // Handle Save Mobile Phone
  const handleSavePhone = async (e) => {
    e.preventDefault();
    const cleanPhone = phoneInput.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setEditError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setEditError('');
    setEditLoading(true);
    try {
      await updateProfile({ phone: '+91 ' + cleanPhone });
      setEditMsg('Mobile number updated successfully!');
      setIsEditingPhone(false);
      setTimeout(() => setEditMsg(''), 3000);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update phone number.');
    } finally {
      setEditLoading(false);
    }
  };

  // Handle Save Name
  const handleSaveName = async (e) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      setEditError('Name cannot be empty.');
      return;
    }
    setEditError('');
    setEditLoading(true);
    try {
      await updateProfile({ name: nameInput.trim() });
      setEditMsg('Name updated successfully!');
      setIsEditingName(false);
      setTimeout(() => setEditMsg(''), 3000);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update name.');
    } finally {
      setEditLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentStamps = loyaltyData?.currentStamps ?? user?.currentStamps ?? 0;
  const stampsNeeded = 5 - currentStamps;
  const activeCoupons = loyaltyData?.coupons?.filter((c) => !c.isRedeemed && c.status !== 'expired') || [];
  const expiredCoupons = loyaltyData?.expiredCoupons || [];
  const redeemedCoupons = loyaltyData?.redeemedCoupons || [];
  const hasExpiringSoonCoupon = activeCoupons.some((c) => c.isExpiringSoon || (c.daysRemaining !== undefined && c.daysRemaining <= 5));

  return (
    <div
      className="modal-overlay"
      data-lenis-prevent="true"
      onClick={onClose}
      style={{ padding: '0.75rem' }}
    >
      <div
        className="modal-content"
        data-lenis-prevent="true"
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        style={{
          maxWidth: '540px',
          padding: '1.4rem 1.25rem 2rem 1.25rem',
          border: '1px solid var(--border-glow)',
          background: '#12141c',
          maxHeight: 'min(90vh, 90dvh)',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          touchAction: 'pan-y',
          transform: 'translateZ(0)',
          willChange: 'scroll-position',
        }}
      >
        {!isAuthenticated ? (
          /* ========================================================================= */
          /* GUEST STATE */
          /* ========================================================================= */
          <div>
            {/* Header with Luxury Close Button */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
              }}
            >
              <span
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--gold-primary)',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                VIP Grooming Club
              </span>
              <button
                onClick={onClose}
                aria-label="Close modal"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.16)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: '6px',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ textAlign: 'center', padding: '1rem 0.5rem' }}>
              <div
                style={{
                  display: 'inline-flex',
                  padding: '0.75rem',
                  borderRadius: '50%',
                  background: 'rgba(212, 175, 55, 0.15)',
                  color: 'var(--gold-primary)',
                  marginBottom: '0.75rem',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                }}
              >
                <User size={28} />
              </div>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '0.35rem' }}>
                Gentleman's <span className="gold-text">VIP Lounge</span>
              </h3>
              <p style={{ color: '#cbd5e1', marginBottom: '1.5rem', fontSize: '0.88rem', maxWidth: '380px', margin: '0 auto 1.5rem' }}>
                Sign in with Google or Email to view your personal profile, track your 5-Coupon visit stamps, and redeem 30% to 40% OFF grooming rewards!
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="btn btn-primary"
                style={{ width: '100%', fontSize: '0.92rem', padding: '0.75rem' }}
              >
                Sign In / Continue With Google
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* AUTHENTICATED USER STATE */
          /* ========================================================================= */
          <div>
            {/* Top Row: Tab Switcher & Generously Spaced Close Button */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                marginBottom: '1.25rem',
              }}
            >
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '14px',
                  padding: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <button
                  onClick={() => setActiveTab('profile')}
                  style={{
                    flex: 1,
                    padding: '0.6rem 0.8rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: activeTab === 'profile' ? 'var(--gold-gradient)' : 'transparent',
                    color: activeTab === 'profile' ? '#0b0c10' : '#cbd5e1',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <User size={15} />
                  <span>{isAdmin ? 'Administrator Profile' : 'My Profile'}</span>
                </button>

                {!isAdmin && (
                  <button
                    onClick={() => setActiveTab('stamps')}
                    style={{
                      flex: 1,
                      padding: '0.6rem 0.8rem',
                      borderRadius: '10px',
                      border: 'none',
                      background: activeTab === 'stamps' ? 'var(--gold-gradient)' : 'transparent',
                      color: activeTab === 'stamps' ? '#0b0c10' : '#cbd5e1',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Gift size={15} />
                    <span>5-Coupon Card ({currentStamps}/5)</span>
                  </button>
                )}
              </div>

              {/* Circular Close Button with generous touch target & padding */}
              <button
                onClick={onClose}
                aria-label="Close modal"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.16)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  padding: '6px',
                  transition: 'all 0.2s ease',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Notification messages */}
            {editMsg && (
              <div
                style={{
                  background: 'rgba(46, 204, 113, 0.15)',
                  border: '1px solid rgba(46, 204, 113, 0.4)',
                  color: '#2ecc71',
                  padding: '0.6rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                <CheckCircle size={15} />
                <span>{editMsg}</span>
              </div>
            )}

            {editError && (
              <div
                style={{
                  background: 'rgba(197, 34, 34, 0.15)',
                  border: '1px solid rgba(197, 34, 34, 0.4)',
                  color: '#ff8080',
                  padding: '0.6rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                <AlertCircle size={15} />
                <span>{editError}</span>
              </div>
            )}

            {/* ===================================================================== */}
            {/* TAB 1: USER PROFILE VIEW */}
            {/* ===================================================================== */}
            {activeTab === 'profile' && (
              <div>
                {/* Profile Hero Card */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, #1a1d27 0%, #0f1118 100%)',
                    border: '1.5px solid rgba(212, 175, 55, 0.45)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem 1rem',
                    textAlign: 'center',
                    marginBottom: '1.25rem',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '-20px',
                      right: '-20px',
                      width: '80px',
                      height: '80px',
                      background: 'radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, transparent 70%)',
                    }}
                  />

                  {/* Luxury Monogram Emblem (No external profile picture stored) */}
                  <div style={{ margin: '0 auto 0.75rem', position: 'relative', display: 'inline-block' }}>
                    <div
                      style={{
                        width: '74px',
                        height: '74px',
                        borderRadius: '50%',
                        background: 'var(--gold-gradient)',
                        color: '#0b0c10',
                        fontSize: '1.9rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2.5px solid #ffffff',
                        boxShadow: '0 0 20px rgba(212, 175, 55, 0.4)',
                        fontFamily: 'var(--font-serif)',
                      }}
                    >
                      {(user?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  </div>

                  {/* Name with inline edit */}
                  {isEditingName ? (
                    <form
                      onSubmit={handleSaveName}
                      style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', marginBottom: '0.5rem' }}
                    >
                      <input
                        type="text"
                        required
                        className="input-field"
                        style={{ maxWidth: '200px', padding: '0.35rem 0.6rem', fontSize: '0.88rem' }}
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                      />
                      <button
                        type="submit"
                        disabled={editLoading}
                        className="btn btn-primary btn-sm"
                        style={{ padding: '0.35rem 0.65rem' }}
                      >
                        <Save size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingName(false)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.35rem 0.65rem' }}
                      >
                        <X size={13} />
                      </button>
                    </form>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', letterSpacing: '0.02em' }}>
                        {user?.name || 'Valued Guest'}
                      </h3>
                      <button
                        onClick={() => {
                          setNameInput(user?.name || '');
                          setIsEditingName(true);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '2px',
                        }}
                        title="Edit Name"
                      >
                        <Edit3 size={13} />
                      </button>
                    </div>
                  )}

                  {/* Role Badge */}
                  <div style={{ marginBottom: '1rem' }}>
                    {isAdmin ? (
                      <span
                        className="badge"
                        style={{
                          background: 'rgba(229, 62, 62, 0.2)',
                          border: '1px solid #ff6b6b',
                          color: '#ff8080',
                          fontSize: '0.74rem',
                          padding: '0.25rem 0.65rem',
                        }}
                      >
                        👑 Salon Administrator
                      </span>
                    ) : (
                      <span className="badge badge-gold" style={{ fontSize: '0.74rem', padding: '0.25rem 0.65rem' }}>
                        ⭐ VIP Grooming Club Member
                      </span>
                    )}
                  </div>

                  {/* Quick Stat Cards for Customers */}
                  {!isAdmin ? (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '0.5rem',
                        background: 'rgba(11, 12, 16, 0.65)',
                        padding: '0.75rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Stamps</div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--gold-primary)' }}>
                          {currentStamps}/5
                        </div>
                      </div>
                      <div style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Total Visits</div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
                          {loyaltyData?.lifetimeVisits ?? user?.lifetimeVisits ?? 0}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Coupons</div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: activeCoupons.length > 0 ? '#2ecc71' : 'var(--text-muted)' }}>
                          {activeCoupons.length} Active
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        background: 'rgba(197, 34, 34, 0.12)',
                        border: '1px solid rgba(197, 34, 34, 0.3)',
                        padding: '0.7rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.82rem',
                        color: '#ff8080',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <ShieldCheck size={16} />
                      <span>Salon Central Administration Account</span>
                    </div>
                  )}
                </div>

                {/* Profile Information List */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.9rem',
                  }}
                >
                  {/* Email */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                      <Mail size={16} color="var(--gold-primary)" />
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Email Address</div>
                        <div style={{ fontSize: '0.86rem', color: '#ffffff', fontWeight: 500 }}>
                          {user?.email}
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        color: '#2ecc71',
                        background: 'rgba(46, 204, 113, 0.12)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <CheckCircle size={12} /> Verified
                    </span>
                  </div>

                  <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)' }} />

                  {/* Mobile Phone */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isEditingPhone ? '0.5rem' : 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                        <Phone size={16} color="var(--gold-primary)" />
                        <div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Mobile Number</div>
                          {!isEditingPhone && (
                            <div style={{ fontSize: '0.86rem', color: user?.phone ? '#ffffff' : '#f59e0b', fontWeight: 500 }}>
                              {user?.phone || '⚠️ No number linked yet'}
                            </div>
                          )}
                        </div>
                      </div>

                      {!isEditingPhone && (
                        <button
                          onClick={() => {
                            setPhoneInput(user?.phone?.replace('+91', '').trim() || '');
                            setIsEditingPhone(true);
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.3rem 0.65rem', fontSize: '0.74rem' }}
                        >
                          <Edit3 size={12} />
                          <span>{user?.phone ? 'Edit' : 'Add'}</span>
                        </button>
                      )}
                    </div>

                    {/* Phone Edit Form */}
                    {isEditingPhone && (
                      <form onSubmit={handleSavePhone} style={{ marginTop: '0.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <div
                            style={{
                              padding: '0.4rem 0.6rem',
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: 'var(--radius-sm)',
                              color: 'var(--gold-primary)',
                              fontWeight: 600,
                              fontSize: '0.82rem',
                            }}
                          >
                            +91
                          </div>
                          <input
                            type="tel"
                            maxLength={10}
                            required
                            placeholder="9876543210"
                            className="input-field"
                            style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.86rem' }}
                            value={phoneInput}
                            onChange={(e) => setPhoneInput(e.target.value.replace(/[^0-9]/g, ''))}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            type="submit"
                            disabled={editLoading}
                            className="btn btn-primary btn-sm"
                            style={{ flex: 1, padding: '0.4rem' }}
                          >
                            {editLoading ? 'Saving...' : 'Save Mobile Number'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsEditingPhone(false)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.4rem 0.75rem' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                  <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)' }} />

                  {/* Membership & Joined Date */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                      <Calendar size={16} color="var(--gold-primary)" />
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>VIP Membership</div>
                        <div style={{ fontSize: '0.82rem', color: '#ffffff' }}>
                          Member Since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '2026'}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--gold-primary)', fontWeight: 600 }}>
                      Active
                    </span>
                  </div>
                </div>

                {/* Admin Special Launch Bar */}
                {isAdmin && (
                  <div
                    style={{
                      background: 'rgba(229, 62, 62, 0.12)',
                      border: '1px solid rgba(229, 62, 62, 0.4)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.85rem',
                      marginBottom: '1.25rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ff8080', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <ShieldCheck size={15} />
                        <span>Administrator Privileges</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                        Manage appointments, scan customer stamps & edit CMS.
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onClose();
                        onOpenAdmin?.();
                      }}
                      className="btn btn-crimson btn-sm"
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                    >
                      <span>Open CMS</span>
                      <ExternalLink size={12} />
                    </button>
                  </div>
                )}

                {/* Profile Tab Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', width: '100%', marginTop: '0.5rem' }}>
                  {isAdmin ? (
                    <button
                      onClick={() => {
                        onClose();
                        if (onOpenAdmin) onOpenAdmin();
                      }}
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '0.75rem', fontSize: '0.85rem', justifyContent: 'center' }}
                    >
                      <ShieldCheck size={16} />
                      <span>Open Admin Central Command</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setActiveTab('stamps')}
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '0.75rem', fontSize: '0.85rem', justifyContent: 'center' }}
                    >
                      <Gift size={16} />
                      <span>View 5-Coupon Card & Rewards</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      logout();
                      onClose();
                    }}
                    className="btn btn-secondary"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      fontSize: '0.85rem',
                      color: '#ff8080',
                      borderColor: 'rgba(229, 62, 62, 0.35)',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      touchAction: 'manipulation',
                    }}
                    aria-label="Logout"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}

            {/* ===================================================================== */}
            {/* TAB 2: 5-COUPON STAMP CARD & REWARDS (Customers Only) */}
            {/* ===================================================================== */}
            {!isAdmin && activeTab === 'stamps' && (
              <div>
                {/* 5-Day Advance Expiry Reminder Notification Banner */}
                {hasExpiringSoonCoupon && (
                  <div
                    style={{
                      marginBottom: '1rem',
                      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.16) 0%, rgba(212, 175, 55, 0.08) 100%)',
                      border: '1.5px solid rgba(245, 158, 11, 0.6)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.8rem 1rem',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      color: '#fef08a',
                      boxShadow: '0 4px 18px rgba(245, 158, 11, 0.2)',
                    }}
                  >
                    <Bell size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ lineHeight: 1.45 }}>
                      <div style={{ fontWeight: 800, color: '#fbbf24', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                        <span>🔔 Expiry Reminder (5 Days or Less Remaining)!</span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: '#fef3c7' }}>
                        You have an active 30% to 40% OFF reward coupon expiring very soon! Visit the salon before the deadline and present your coupon at the counter to redeem.
                      </span>
                    </div>
                  </div>
                )}

                {/* 45-Day Stamp Inactivity Policy Banner (Only visible when user has stamps) */}
                {currentStamps > 0 && (
                  <div
                    style={{
                      marginBottom: '1rem',
                      background: loyaltyData?.isStampDecayWarning
                        ? 'rgba(239, 68, 68, 0.12)'
                        : 'rgba(212, 175, 55, 0.08)',
                      border: loyaltyData?.isStampDecayWarning
                        ? '1.5px solid rgba(239, 68, 68, 0.5)'
                        : '1px solid rgba(212, 175, 55, 0.38)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.65rem 0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      fontSize: '0.78rem',
                      color: loyaltyData?.isStampDecayWarning ? '#fca5a5' : '#fef08a',
                    }}
                  >
                    {loyaltyData?.isStampDecayWarning ? (
                      <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
                    ) : (
                      <Clock size={16} color="var(--gold-primary)" style={{ flexShrink: 0 }} />
                    )}
                    <div style={{ lineHeight: 1.45 }}>
                      <span style={{ fontWeight: 700, color: loyaltyData?.isStampDecayWarning ? '#f87171' : 'var(--gold-primary)' }}>
                        {loyaltyData?.isStampDecayWarning ? '⚠️ URGENT — Inactivity Warning:' : '⏳ 45-Day Visit Policy:'}
                      </span>{' '}
                      {loyaltyData?.daysUntilStampDecay !== undefined ? (
                        <span>
                          Next visit due within{' '}
                          <strong style={{ color: '#ffffff', textDecoration: 'underline' }}>
                            {loyaltyData.daysUntilStampDecay} day{loyaltyData.daysUntilStampDecay !== 1 ? 's' : ''}
                          </strong>{' '}
                          to keep current stamps and earn your next one! If 45 days pass without a visit, 1 stamp will expire.
                        </span>
                      ) : (
                        <span>
                          Collect your next stamp within 45 days of your previous visit to preserve your stamp progress.
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Stamp Card Presentation */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, #1a1d27 0%, #0f1118 100%)',
                    border: '1.5px solid rgba(212, 175, 55, 0.45)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem 0.85rem',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
                    marginBottom: '1.25rem',
                  }}
                >
                  {/* Card Header */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1rem',
                      borderBottom: '1px dashed rgba(212, 175, 55, 0.25)',
                      paddingBottom: '0.6rem',
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '0.92rem', color: '#ffffff', letterSpacing: '0.04em' }}>
                        {user?.name || 'Valued Guest'}
                      </h4>
                      <span style={{ fontSize: '0.7rem', color: 'var(--gold-primary)' }}>
                        Total Visits: {loyaltyData?.lifetimeVisits ?? user?.lifetimeVisits ?? 0}
                      </span>
                    </div>
                    <span className="badge badge-gold" style={{ fontSize: '0.72rem' }}>
                      {currentStamps}/5 Stamps
                    </span>
                  </div>

                  {/* 5 Fluid Stamp Circles */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.35rem',
                      marginBottom: '1rem',
                    }}
                  >
                    {[1, 2, 3, 4, 5].map((slotNumber) => {
                      const isStamped = slotNumber <= currentStamps;
                      const isFifthSlot = slotNumber === 5;

                      return (
                        <div
                          key={slotNumber}
                          style={{
                            flex: 1,
                            maxWidth: '52px',
                            minWidth: '38px',
                            aspectRatio: '1/1',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            background: isStamped
                              ? 'var(--gold-gradient)'
                              : isFifthSlot
                              ? 'rgba(197, 34, 34, 0.15)'
                              : 'rgba(255, 255, 255, 0.05)',
                            border: isStamped
                              ? '1.5px solid #ffffff'
                              : isFifthSlot
                              ? '1.5px dashed var(--crimson-light)'
                              : '1.5px dashed rgba(255, 255, 255, 0.2)',
                            color: isStamped ? '#0b0c10' : isFifthSlot ? 'var(--crimson-light)' : 'var(--text-muted)',
                            boxShadow: isStamped ? '0 0 12px rgba(212, 175, 55, 0.6)' : 'none',
                            transition: 'all 0.25s ease',
                          }}
                        >
                          {isStamped ? (
                            <Scissors size={16} strokeWidth={2.5} />
                          ) : isFifthSlot ? (
                            <Gift size={16} />
                          ) : (
                            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>#{slotNumber}</span>
                          )}
                          <span style={{ fontSize: '0.55rem', fontWeight: 700, marginTop: '0.1rem' }}>
                            {isStamped ? 'DONE' : isFifthSlot ? '30-40%' : `#${slotNumber}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Progress Notice */}
                  <div
                    style={{
                      background: 'rgba(11, 12, 16, 0.75)',
                      padding: '0.6rem 0.8rem',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.78rem',
                    }}
                  >
                    <Sparkles size={14} color="var(--gold-primary)" style={{ flexShrink: 0 }} />
                    <span style={{ color: '#e2e8f0' }}>
                      {stampsNeeded > 0 ? (
                        <>
                          Just <strong style={{ color: 'var(--gold-primary)' }}>{stampsNeeded} visit{stampsNeeded > 1 ? 's' : ''}</strong> to unlock your 30% to 40% OFF reward coupon!
                        </>
                      ) : (
                        <strong style={{ color: '#2ecc71' }}>
                          🎉 5 Stamps Achieved! 30% to 40% OFF Offer Coupon generated & stamps reset!
                        </strong>
                      )}
                    </span>
                  </div>
                </div>

                {/* Unlocked Offer Coupons */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.95rem', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Gift size={16} color="var(--gold-primary)" />
                    <span>Unlocked Offer Coupons ({activeCoupons.length})</span>
                  </h4>

                  {activeCoupons.length === 0 ? (
                    <div
                      style={{
                        padding: '1.2rem',
                        textAlign: 'center',
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px dashed rgba(255, 255, 255, 0.1)',
                        color: 'var(--text-muted)',
                        fontSize: '0.82rem',
                      }}
                    >
                      No active offers yet. Reach 5 salon visits to earn your 30% to 40% OFF grooming reward!
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.6rem',
                      }}
                    >
                      {activeCoupons.map((coupon) => (
                        <div
                          key={coupon._id}
                          style={{
                            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(18, 22, 32, 0.75) 100%)',
                            border: '1px solid rgba(212, 175, 55, 0.4)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.85rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.65rem',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span
                                style={{
                                  background: 'rgba(0, 0, 0, 0.6)',
                                  border: '1px solid rgba(212, 175, 55, 0.6)',
                                  borderRadius: '6px',
                                  padding: '0.22rem 0.65rem',
                                  fontFamily: 'monospace',
                                  fontWeight: 800,
                                  fontSize: '0.96rem',
                                  letterSpacing: '0.08em',
                                  color: 'var(--gold-primary)',
                                  boxShadow: '0 0 10px rgba(212, 175, 55, 0.25)',
                                }}
                              >
                                {coupon.code}
                              </span>
                              <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>
                                ACTIVE
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <button
                                onClick={() => handleCopyCode(coupon.code)}
                                className="btn btn-secondary btn-sm"
                                style={{
                                  padding: '0.28rem 0.6rem',
                                  fontSize: '0.72rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                }}
                                title="Copy coupon code"
                              >
                                {copiedCouponCode === coupon.code ? (
                                  <>
                                    <Check size={12} color="#2ecc71" />
                                    <span style={{ color: '#2ecc71', fontWeight: 700 }}>Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={12} />
                                    <span>Copy Code</span>
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() => showQrCode(coupon)}
                                className="btn btn-primary btn-sm"
                                style={{
                                  padding: '0.28rem 0.65rem',
                                  fontSize: '0.72rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                }}
                                title="Show QR Code for Salon Counter"
                              >
                                <QrCode size={13} />
                                <span>Show QR</span>
                              </button>
                            </div>
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                              <p style={{ fontSize: '0.84rem', color: '#f1f5f9', fontWeight: 600, margin: 0 }}>
                                {(() => {
                                  const rawTitle = coupon.title || config.defaultOfferTitle || 'Luxury Grooming Offer Coupon';
                                  const cleaned = rawTitle.replace(/Complimentary\s*/gi, '').trim();
                                  return cleaned && !cleaned.toLowerCase().includes('royal haircut') ? cleaned : 'Luxury Grooming Offer Coupon';
                                })()}
                              </p>
                              <span
                                style={{
                                  background: 'linear-gradient(135deg, #d4af37 0%, #b8860b 100%)',
                                  color: '#07090e',
                                  fontWeight: 800,
                                  fontSize: '0.68rem',
                                  padding: '0.12rem 0.45rem',
                                  borderRadius: '4px',
                                  letterSpacing: '0.02em',
                                }}
                              >
                                {(() => {
                                  const rawDiscount = coupon.discountType || config.defaultOfferDiscount || '30% to 40% OFF';
                                  return rawDiscount.includes('100%') || rawDiscount.toLowerCase().includes('free') ? '30% to 40% OFF' : rawDiscount;
                                })()}
                              </span>
                            </div>
                            {coupon.isExpiringSoon || (coupon.daysRemaining !== undefined && coupon.daysRemaining <= 5) ? (
                              <div
                                style={{
                                  marginTop: '0.45rem',
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  border: '1px solid rgba(239, 68, 68, 0.4)',
                                  borderRadius: '4px',
                                  padding: '0.35rem 0.6rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.4rem',
                                  color: '#fca5a5',
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                }}
                              >
                                <AlertTriangle size={13} color="#ef4444" style={{ flexShrink: 0 }} />
                                <span>
                                  ⚠️ Expiring in {coupon.daysRemaining ?? 'few'} day{(coupon.daysRemaining ?? 2) === 1 ? '' : 's'} (on {new Date(coupon.expiresAt).toLocaleDateString()})!
                                </span>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                ⏱️ 35 Days Validity (Expires {new Date(coupon.expiresAt).toLocaleDateString()}{coupon.daysRemaining !== undefined ? ` • ${coupon.daysRemaining} days left` : ''})
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Expired / Removed Coupons Section with Clear Reason */}
                {expiredCoupons.length > 0 && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <button
                      type="button"
                      onClick={() => setShowExpiredCoupons(!showExpiredCoupons)}
                      style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.65rem 0.85rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        color: '#94a3b8',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <Clock size={15} color="#ef4444" />
                        <span>Expired / Removed Coupons ({expiredCoupons.length})</span>
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--gold-primary)' }}>
                        {showExpiredCoupons ? (
                          <>
                            <span>Hide</span>
                            <ChevronUp size={14} />
                          </>
                        ) : (
                          <>
                            <span>View Details & Reasons</span>
                            <ChevronDown size={14} />
                          </>
                        )}
                      </span>
                    </button>

                    {showExpiredCoupons && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.65rem' }}>
                        {expiredCoupons.map((coupon) => (
                          <div
                            key={coupon._id}
                            style={{
                              background: 'rgba(239, 68, 68, 0.05)',
                              border: '1px dashed rgba(239, 68, 68, 0.35)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '0.85rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.45rem',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span
                                style={{
                                  fontFamily: 'monospace',
                                  fontWeight: 800,
                                  fontSize: '0.92rem',
                                  color: '#f87171',
                                  letterSpacing: '0.06em',
                                }}
                              >
                                {coupon.code}
                              </span>
                              <span
                                style={{
                                  background: 'rgba(239, 68, 68, 0.2)',
                                  color: '#fca5a5',
                                  border: '1px solid rgba(239, 68, 68, 0.4)',
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '4px',
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                }}
                              >
                                EXPIRED
                              </span>
                            </div>

                            <div style={{ fontSize: '0.8rem', color: '#e2e8f0', fontWeight: 500 }}>
                              {coupon.title} • {coupon.discountType}
                            </div>

                            <div
                              style={{
                                background: 'rgba(0, 0, 0, 0.35)',
                                padding: '0.45rem 0.65rem',
                                borderRadius: '4px',
                                borderLeft: '3px solid #ef4444',
                              }}
                            >
                              <div style={{ fontSize: '0.72rem', color: '#fca5a5', lineHeight: 1.45 }}>
                                <strong>Reason for Expiry:</strong>{' '}
                                {coupon.expiredReason || 'Validity duration of 35 days expired without salon counter redemption.'}
                              </div>
                              <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                                Expired on: {new Date(coupon.expiresAt).toLocaleDateString()}
                                {coupon.extendedCount > 0 ? ` • Was previously extended ${coupon.extendedCount} time(s)` : ''}
                              </div>
                            </div>

                            <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontStyle: 'italic' }}>
                              💡 Want to use this offer? Request salon admin or reception counter to increase/extend the validity.
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Visit History Log */}
                {loyaltyData?.recentVisits && loyaltyData.recentVisits.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '0.88rem', marginBottom: '0.45rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Clock size={14} />
                      <span>Recent Salon Visits</span>
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {loyaltyData.recentVisits.map((visit) => (
                        <div
                          key={visit._id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.75rem',
                            padding: '0.35rem 0.65rem',
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: '4px',
                          }}
                        >
                          <span style={{ color: '#e2e8f0' }}>{visit.serviceName}</span>
                          <span style={{ color: 'var(--gold-primary)' }}>
                            {new Date(visit.visitedAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* QR Code Presentation Modal */}
        {selectedCouponQr && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(11, 12, 16, 0.98)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
              zIndex: 150,
            }}
          >
            <h4 style={{ fontSize: '1.15rem', marginBottom: '0.35rem', color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <QrCode size={20} />
              <span>Counter Redemption QR</span>
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1.15rem', textAlign: 'center', maxWidth: '300px' }}>
              Present this QR to salon admin to scan with camera, or give them your coupon code!
            </p>

            {qrDataUrl && (
              <img
                src={qrDataUrl}
                alt="Coupon QR"
                style={{
                  width: '190px',
                  height: '190px',
                  borderRadius: '12px',
                  border: '2px solid var(--gold-primary)',
                  boxShadow: '0 0 24px rgba(212, 175, 55, 0.4)',
                  marginBottom: '1rem',
                  background: '#ffffff',
                  padding: '6px',
                }}
              />
            )}

            <div
              style={{
                background: 'rgba(212, 175, 55, 0.15)',
                border: '1px solid rgba(212, 175, 55, 0.5)',
                borderRadius: '8px',
                padding: '0.45rem 1rem',
                fontFamily: 'monospace',
                fontSize: '1.25rem',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '0.12em',
                marginBottom: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <span>{selectedCouponQr.code}</span>
              <button
                onClick={() => handleCopyCode(selectedCouponQr.code)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.2rem 0.55rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                title="Copy coupon code"
              >
                {copiedCouponCode === selectedCouponQr.code ? (
                  <>
                    <Check size={12} color="#2ecc71" />
                    <span style={{ color: '#2ecc71' }}>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <button
              onClick={() => setSelectedCouponQr(null)}
              className="btn btn-secondary"
              style={{ padding: '0.55rem 1.4rem', fontSize: '0.85rem' }}
            >
              Close & Return
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
