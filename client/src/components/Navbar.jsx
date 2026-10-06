import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSiteConfig } from '../context/SiteConfigContext';
import { useSmoothScroll } from '../context/SmoothScrollContext';
import { Scissors, User as UserIcon, Menu, X, Phone, MessageSquare, ShieldCheck, MapPin, Clock, LogOut } from 'lucide-react';

export const Navbar = ({ onOpenAuth, onOpenAdmin, onOpenLoyalty, onOpenProfile }) => {
  const { user, isAdmin, isAuthenticated, logout } = useAuth();
  const { config } = useSiteConfig();
  const { stopScroll, startScroll } = useSmoothScroll();
  const [scrolled, setScrolled] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(() => {
          const isPast = window.scrollY > 25;
          setScrolled((prev) => (prev !== isPast ? isPast : prev));
          ticking = false;
        });
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent background scroll cleanly when mobile drawer is open
  useEffect(() => {
    if (mobileDrawerOpen) {
      stopScroll?.();
    } else {
      startScroll?.();
    }
    return () => {
      startScroll?.();
    };
  }, [mobileDrawerOpen, stopScroll, startScroll]);

  const scrollToSection = (id) => {
    setMobileDrawerOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const navOffset = 65;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <>
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: scrolled ? '62px' : '68px',
          zIndex: 1000,
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          backgroundColor: scrolled ? 'rgba(9, 10, 14, 0.95)' : 'rgba(9, 10, 14, 0.82)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: scrolled ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid rgba(255, 255, 255, 0.07)',
          boxShadow: scrolled ? '0 8px 30px rgba(0, 0, 0, 0.7)' : 'none',
        }}
      >
        <div
          className="container navbar-container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '100%',
            gap: '0.4rem',
            paddingLeft: 'clamp(0.45rem, 2vw, 1.25rem)',
            paddingRight: 'clamp(0.45rem, 2vw, 1.25rem)',
          }}
        >
          {/* Brand Logo & Name */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(0.35rem, 1.5vw, 0.6rem)',
              cursor: 'pointer',
              textDecoration: 'none',
              minWidth: 0,
              flexShrink: 1,
            }}
          >
            <img
              src="/logo/logo.webp"
              alt="Logo"
              width="38"
              height="38"
              decoding="async"
              style={{
                width: 'clamp(30px, 8vw, 38px)',
                height: 'clamp(30px, 8vw, 38px)',
                borderRadius: '50%',
                border: '2px solid var(--gold-primary)',
                objectFit: 'cover',
                boxShadow: '0 0 10px rgba(212, 175, 55, 0.35)',
                flexShrink: 0,
              }}
            />
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <span
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(0.78rem, 3.4vw, 1.15rem)',
                  fontWeight: 700,
                  letterSpacing: '0.01em',
                  color: '#ffffff',
                  display: 'block',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.1,
                }}
              >
                {config.salonName || 'The Classic Cut Salon'}
              </span>
              <span
                style={{
                  fontSize: '0.58rem',
                  color: 'var(--gold-primary)',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  display: 'block',
                }}
              >
                Luxury Barber
              </span>
            </div>
          </div>

          {/* Desktop Navigation Menu (hidden on screens <= 860px) */}
          <nav className="desktop-nav-menu" style={{ display: 'none', alignItems: 'center', gap: '1.75rem' }}>
            <button onClick={() => scrollToSection('services')} style={desktopLinkStyle}>
              Services & Styling
            </button>
            {!isAdmin && (
              <button onClick={onOpenLoyalty} style={desktopLinkStyle}>
                5-Coupon Card
              </button>
            )}
            <button onClick={() => scrollToSection('contact')} style={desktopLinkStyle}>
              Location & Hours
            </button>
          </nav>

          {/* Desktop Right Action Pill Group */}
          <div className="desktop-actions" style={{ display: 'none', alignItems: 'center', gap: '0.6rem' }}>
            <a
              href={`https://wa.me/${config.whatsapp?.replace(/[^0-9]/g, '') || '919322188848'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-sm"
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
            >
              <MessageSquare size={14} />
              <span>WhatsApp</span>
            </a>

            {isAdmin && (
              <button
                onClick={onOpenAdmin}
                className="btn btn-crimson btn-sm"
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
              >
                <ShieldCheck size={15} />
                <span>Admin CMS</span>
              </button>
            )}

            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <button
                  onClick={() => (onOpenProfile ? onOpenProfile('profile') : onOpenLoyalty())}
                  className="btn btn-outline btn-sm"
                  style={{
                    padding: '0.35rem 0.85rem 0.35rem 0.45rem',
                    fontSize: '0.82rem',
                    borderRadius: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    border: '1px solid rgba(212, 175, 55, 0.45)',
                    background: 'rgba(212, 175, 55, 0.08)',
                    boxShadow: '0 0 14px rgba(212, 175, 55, 0.15)',
                    cursor: 'pointer',
                  }}
                  title="Click to view your Profile & 5-Coupon Card"
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'var(--gold-gradient)',
                      color: '#0b0c10',
                      fontWeight: 800,
                      fontSize: '0.72rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {(user?.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontWeight: 600, color: '#ffffff', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.name?.split(' ')[0] || 'Profile'}
                  </span>
                  {!isAdmin && (
                    <span
                      style={{
                        background: 'rgba(212, 175, 55, 0.25)',
                        color: 'var(--gold-primary)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.12rem 0.4rem',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                      }}
                    >
                      <Scissors size={11} />
                      {user?.currentStamps || 0}/5
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    logout();
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{
                    padding: '0.42rem 0.65rem',
                    fontSize: '0.78rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                  }}
                  aria-label="Logout"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="btn btn-primary btn-sm"
                style={{ padding: '0.42rem 1.05rem', fontSize: '0.82rem', borderRadius: '20px' }}
              >
                <UserIcon size={14} />
                <span>Login</span>
              </button>
            )}
          </div>

          {/* Mobile Right: Stamp Count Badge (when logged in) / Login + Sleek Hamburger Menu Button */}
          <div className="mobile-only-header">
            {isAuthenticated ? (
              <button
                onClick={() => (onOpenProfile ? onOpenProfile('profile') : onOpenLoyalty())}
                className="mobile-stamp-badge"
                title="View Profile & 5-Coupon Card"
                style={{
                  background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.22) 0%, rgba(18, 21, 30, 0.95) 100%)',
                  border: '1.5px solid var(--gold-primary)',
                  borderRadius: '20px',
                  color: 'var(--gold-primary)',
                  padding: '0.25rem 0.6rem 0.25rem 0.35rem',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.32rem',
                  cursor: 'pointer',
                  boxShadow: '0 0 12px rgba(212, 175, 55, 0.25)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'var(--gold-gradient)',
                    color: '#0b0c10',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {(user?.name || 'U').charAt(0).toUpperCase()}
                </div>
                <span>{user?.name?.split(' ')[0] || 'Profile'}</span>
                {!isAdmin && <span style={{ opacity: 0.85, fontSize: '0.7rem' }}>({user?.currentStamps || 0}/5)</span>}
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="mobile-login-badge"
                title="Login / Register"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(212, 175, 55, 0.35)',
                  borderRadius: '16px',
                  color: '#ffffff',
                  padding: '0.34rem 0.62rem',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                <UserIcon size={12} />
                <span>Login</span>
              </button>
            )}

            <button
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open Navigation Menu"
              style={{
                background: 'rgba(212, 175, 55, 0.12)',
                border: '1px solid rgba(212, 175, 55, 0.4)',
                borderRadius: '8px',
                color: 'var(--gold-primary)',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }}
            >
              <Menu size={20} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MOBILE SLIDE-OUT DRAWER (Optimized down to 320px) */}
      {/* ========================================================================= */}
      {mobileDrawerOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            justifyContent: 'flex-end',
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={() => setMobileDrawerOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '88%',
              maxWidth: '340px',
              height: '100%',
              backgroundColor: '#11131a',
              borderLeft: '1px solid rgba(212, 175, 55, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.9)',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {/* Drawer Header */}
            <div
              style={{
                padding: '1.25rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(20, 23, 32, 0.8)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <img
                  src="/logo/logo.webp"
                  alt="Logo"
                  width="34"
                  height="34"
                  loading="lazy"
                  decoding="async"
                  style={{ width: '34px', height: '34px', borderRadius: '50%', border: '1.5px solid var(--gold-primary)' }}
                />
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>
                  The Classic Cut
                </span>
              </div>

              <button
                onClick={() => setMobileDrawerOpen(false)}
                aria-label="Close menu"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '34px',
                  height: '34px',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* VIP Status / Account Card inside Drawer */}
            <div style={{ padding: '1rem' }}>
              {isAuthenticated ? (
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.14) 0%, rgba(20, 23, 32, 0.95) 100%)',
                    border: '1px solid rgba(212, 175, 55, 0.35)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.9rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.65rem' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        background: 'var(--gold-gradient)',
                        color: '#0b0c10',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1.1rem',
                        border: '1.5px solid #ffffff',
                        flexShrink: 0,
                      }}
                    >
                      {(user?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user?.name}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user?.email}
                      </div>
                    </div>
                    <span className="badge badge-gold" style={{ fontSize: '0.68rem', flexShrink: 0 }}>
                      {user?.currentStamps || 0}/5 Stamps
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.45rem', marginTop: '0.5rem', marginBottom: '0.45rem' }}>
                    <button
                      onClick={() => {
                        setMobileDrawerOpen(false);
                        onOpenProfile ? onOpenProfile('profile') : onOpenLoyalty();
                      }}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, padding: '0.45rem', fontSize: '0.78rem' }}
                    >
                      <UserIcon size={14} />
                      <span>My Profile</span>
                    </button>
                    {!isAdmin && (
                      <button
                        onClick={() => {
                          setMobileDrawerOpen(false);
                          onOpenProfile ? onOpenProfile('stamps') : onOpenLoyalty();
                        }}
                        className="btn btn-outline btn-sm"
                        style={{ flex: 1, padding: '0.45rem', fontSize: '0.78rem' }}
                      >
                        <Scissors size={14} />
                        <span>5-Coupon Card</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      logout();
                      setMobileDrawerOpen(false);
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{
                      width: '100%',
                      padding: '0.45rem',
                      fontSize: '0.8rem',
                      color: '#ff8080',
                      cursor: 'pointer',
                      touchAction: 'manipulation',
                    }}
                    aria-label="Logout"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(212, 175, 55, 0.25)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.85rem',
                    marginBottom: '1rem',
                    textAlign: 'center',
                  }}
                >
                  <p style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.65rem' }}>
                    Log in to track your 5 visits and claim free grooming offers!
                  </p>
                  <button
                    onClick={() => {
                      setMobileDrawerOpen(false);
                      onOpenAuth();
                    }}
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%', padding: '0.55rem', fontSize: '0.82rem' }}
                  >
                    <UserIcon size={14} />
                    <span>Login / Register (Email OTP)</span>
                  </button>
                </div>
              )}

              {/* Navigation Menu Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <button onClick={() => scrollToSection('services')} style={mobileMenuItemStyle}>
                  <span>✂️</span> Services & Grooming
                </button>
                {!isAdmin && (
                  <button
                    onClick={() => {
                      setMobileDrawerOpen(false);
                      onOpenLoyalty();
                    }}
                    style={{
                      ...mobileMenuItemStyle,
                      borderColor: 'rgba(212, 175, 55, 0.3)',
                      color: 'var(--gold-primary)',
                    }}
                  >
                    <span>🎟️</span> 5-Coupon Stamp Card
                  </button>
                )}
                <button onClick={() => scrollToSection('contact')} style={mobileMenuItemStyle}>
                  <span>📍</span> Location & Timings
                </button>

                {isAdmin && (
                  <button
                    onClick={() => {
                      setMobileDrawerOpen(false);
                      onOpenAdmin();
                    }}
                    style={{
                      ...mobileMenuItemStyle,
                      color: '#ff8080',
                      borderColor: 'rgba(229, 62, 62, 0.4)',
                      background: 'rgba(229, 62, 62, 0.1)',
                      marginTop: '0.5rem',
                    }}
                  >
                    <ShieldCheck size={16} />
                    <span>Admin CMS & Stamp Manager</span>
                  </button>
                )}
              </div>

              {/* Fast Contact Actions */}
              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.8rem' }}>
                  <a
                    href={`tel:${config.phone?.replace(/[^0-9+]/g, '') || '9322188848'}`}
                    className="btn btn-outline btn-sm"
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.78rem' }}
                  >
                    <Phone size={14} />
                    <span>Call</span>
                  </a>
                  <a
                    href={`https://wa.me/${config.whatsapp?.replace(/[^0-9]/g, '') || '919322188848'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.78rem' }}
                  >
                    <MessageSquare size={14} />
                    <span>WhatsApp</span>
                  </a>
                </div>

                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                    <Clock size={12} color="var(--gold-primary)" />
                    <span>{config.openingHours?.weekday || '9:00 AM - 9:30 PM'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <MapPin size={12} color="var(--gold-primary)" />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {config.address || 'At Gevrai jategaon road Rohithal, Tq gevrai dist beed 431127 Maharashtra'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Responsive Breakpoint CSS Injection */}
      <style>{`
        @media (min-width: 861px) {
          .desktop-nav-menu {
            display: flex !important;
          }
          .desktop-actions {
            display: flex !important;
          }
          .mobile-only-header {
            display: none !important;
          }
        }
        @media (max-width: 860px) {
          .desktop-nav-menu {
            display: none !important;
          }
          .desktop-actions {
            display: none !important;
          }
          .mobile-only-header {
            display: flex !important;
            align-items: center !important;
            gap: 0.45rem !important;
          }
        }
        @media (max-width: 380px) {
          .stamp-badge-count-long {
            display: none !important;
          }
          .stamp-badge-count-short {
            display: inline !important;
          }
        }
        @media (min-width: 381px) {
          .stamp-badge-count-long {
            display: inline !important;
          }
          .stamp-badge-count-short {
            display: none !important;
          }
        }
        @media (max-width: 360px) {
          .mobile-only-header {
            gap: 0.3rem !important;
          }
          .mobile-stamp-badge {
            padding: 0.2rem 0.45rem !important;
            font-size: 0.68rem !important;
            max-width: 105px !important;
          }
          .mobile-login-badge {
            padding: 0.25rem 0.48rem !important;
            font-size: 0.68rem !important;
          }
        }
        @media (min-width: 2000px) {
          .desktop-nav-menu {
            gap: 2.5rem !important;
          }
          .desktop-nav-menu button {
            font-size: 1.12rem !important;
          }
          .desktop-actions {
            gap: 1rem !important;
          }
          .desktop-actions .btn {
            padding: 0.55rem 1.25rem !important;
            font-size: 0.95rem !important;
          }
        }
      `}</style>
    </>
  );
};

const desktopLinkStyle = {
  background: 'none',
  border: 'none',
  color: '#e2e8f0',
  fontSize: '0.92rem',
  fontWeight: 500,
  cursor: 'pointer',
  padding: '0.3rem 0',
  transition: 'color 0.2s ease',
  fontFamily: 'var(--font-sans)',
};

const mobileMenuItemStyle = {
  width: '100%',
  padding: '0.8rem 0.9rem',
  background: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 'var(--radius-sm)',
  color: '#ffffff',
  fontSize: '0.88rem',
  fontWeight: 500,
  textAlign: 'left',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
  fontFamily: 'var(--font-sans)',
  transition: 'background 0.2s ease, border-color 0.2s ease',
};
