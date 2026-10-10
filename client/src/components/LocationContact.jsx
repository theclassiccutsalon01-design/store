import React from 'react';
import { useSiteConfig } from '../context/SiteConfigContext';
import { MapPin, Phone, MessageSquare, Clock, ExternalLink, Mail, Navigation } from 'lucide-react';

export const LocationContact = () => {
  const { config } = useSiteConfig();

  const phoneDisplay = config.phone || '+91 93221 88848';
  const phoneTel = config.phone?.replace(/[^0-9+]/g, '') || '9322188848';
  const whatsappNum = config.whatsapp?.replace(/[^0-9]/g, '') || '919322188848';
  const emailVal = config.email || 'theclassiccutsalon01@gmail.com';
  const addressVal = config.address || 'At Gevrai jategaon road Rohithal, Tq gevrai dist beed 431127 Maharashtra';
  const rawDirectionsUrl = config.mapDirectionsUrl || 'https://www.google.com/maps/dir/?api=1&destination=19.2528181,75.8555902';
  const mapDirectionsUrl = rawDirectionsUrl.startsWith('https://') ? rawDirectionsUrl : 'https://www.google.com/maps/dir/?api=1&destination=19.2528181,75.8555902';

  const rawEmbedUrl = config.mapEmbedUrl || 'https://maps.google.com/maps?q=19.2528181,75.8555902&hl=en&z=15&output=embed';
  const mapEmbedUrl = rawEmbedUrl.startsWith('https://') ? rawEmbedUrl : 'https://maps.google.com/maps?q=19.2528181,75.8555902&hl=en&z=15&output=embed';

  return (
    <section
      id="contact"
      style={{
        padding: '5rem 0',
        background: 'var(--color-charcoal, #1A1A1A)',
        position: 'relative',
        zIndex: 40,
      }}
    >
      <div className="container">
        {/* Section Header */}
        <div className="section-header" style={{ marginBottom: '2rem' }}>
          <div className="section-tagline">
            <MapPin size={13} />
            <span>Visit The Salon</span>
          </div>
          <h2 className="section-title">
            Prime Location & <span className="gold-text">Timings</span>
          </h2>
          <p className="section-subtitle">
            Walk into luxury or schedule your private grooming consultation directly.
          </p>
        </div>

        <div className="contact-grid">
          {/* Contact & Hours Card */}
          <div
            className="glass-card contact-card"
            style={{
              padding: '2rem 1.4rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', color: 'var(--color-cream, #F9F8F6)' }}>
                Salon Address & Reservations
              </h3>

              {/* Physical Address */}
              <div style={infoItemStyle}>
                <div style={iconBoxStyle}>
                  <MapPin size={18} color="var(--gold-primary)" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <span style={infoLabelStyle}>Physical Address</span>
                  <p style={{ color: 'var(--color-cream, #F9F8F6)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                    {addressVal}
                  </p>
                  <a
                    href={mapDirectionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      marginTop: '0.45rem',
                      color: 'var(--gold-primary)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    <Navigation size={13} />
                    <span>Get Directions from Your Location</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              {/* Phone Calling */}
              <div style={infoItemStyle}>
                <div style={iconBoxStyle}>
                  <Phone size={18} color="var(--gold-primary)" />
                </div>
                <div>
                  <span style={infoLabelStyle}>Telephone / Reservations</span>
                  <a
                    href={`tel:${phoneTel}`}
                    style={{ color: 'var(--gold-primary)', fontSize: '0.98rem', fontWeight: 600, textDecoration: 'none' }}
                  >
                    {phoneDisplay}
                  </a>
                </div>
              </div>

              {/* Direct WhatsApp */}
              <div style={infoItemStyle}>
                <div style={iconBoxStyle}>
                  <MessageSquare size={18} color="#2ecc71" />
                </div>
                <div>
                  <span style={infoLabelStyle}>Direct WhatsApp Desk</span>
                  <a
                    href={`https://wa.me/${whatsappNum}?text=Hello%20The%20Classic%20Cut%20Salon!`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#2ecc71', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <span>Chat on WhatsApp ({phoneDisplay})</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              {/* Official Email */}
              <div style={infoItemStyle}>
                <div style={iconBoxStyle}>
                  <Mail size={18} color="var(--gold-primary)" />
                </div>
                <div>
                  <span style={infoLabelStyle}>Official Email</span>
                  <a
                    href={`mailto:${emailVal}`}
                    style={{ color: 'var(--text-secondary, #D2CFC9)', fontSize: '0.9rem', textDecoration: 'none' }}
                  >
                    {emailVal}
                  </a>
                </div>
              </div>

              {/* Hours */}
              <div style={infoItemStyle}>
                <div style={iconBoxStyle}>
                  <Clock size={18} color="var(--gold-primary)" />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={infoLabelStyle}>Working Hours & Schedule</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.2rem' }}>
                    <p style={{ color: 'var(--color-cream, #F9F8F6)', fontSize: '0.84rem', margin: 0, fontWeight: 500 }}>
                      <strong style={{ color: 'var(--gold-primary)' }}>Tue – Fri:</strong> 9:30 AM – 9:00 PM
                    </p>
                    <p style={{ color: 'var(--color-cream, #F9F8F6)', fontSize: '0.84rem', margin: 0, fontWeight: 500 }}>
                      <strong style={{ color: 'var(--gold-primary)' }}>Sat – Sun:</strong> 8:30 AM – 10:00 PM
                    </p>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        marginTop: '0.35rem',
                        background: 'rgba(239, 68, 68, 0.14)',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        padding: '0.3rem 0.65rem',
                        borderRadius: '6px',
                        color: '#fca5a5',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        letterSpacing: '0.02em',
                        width: 'fit-content',
                      }}
                    >
                      <span>🔴</span>
                      <span>Shop is closed on every Monday</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Action Buttons: Call, WhatsApp, Directions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.6rem', marginTop: '1.25rem' }}>
              <a
                href={`tel:${phoneTel}`}
                className="btn btn-primary"
                style={{ padding: '0.65rem 0.8rem', fontSize: '0.82rem', justifyContent: 'center' }}
              >
                <Phone size={15} />
                <span>Call Salon</span>
              </a>
              <a
                href={`https://wa.me/${whatsappNum}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
                style={{ padding: '0.65rem 0.8rem', fontSize: '0.82rem', justifyContent: 'center' }}
              >
                <MessageSquare size={15} />
                <span>WhatsApp</span>
              </a>
              <a
                href={mapDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
                style={{
                  padding: '0.65rem 0.8rem',
                  fontSize: '0.82rem',
                  justifyContent: 'center',
                  borderColor: 'rgba(212, 175, 55, 0.45)',
                  color: 'var(--gold-primary)',
                }}
              >
                <Navigation size={15} />
                <span>Directions</span>
              </a>
            </div>
          </div>

          {/* Interactive Google Map with Click-To-Navigate Route */}
          <div
            className="glass-card map-container-card"
            style={{
              overflow: 'hidden',
              padding: 0,
              minHeight: '340px',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 'var(--radius-md)',
              position: 'relative',
              border: '1px solid rgba(212, 175, 55, 0.25)',
            }}
          >
            {/* Top Navigation Bar Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.8rem 1.1rem',
                background: 'rgba(15, 17, 23, 0.95)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                zIndex: 2,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#2ecc71',
                    boxShadow: '0 0 8px #2ecc71',
                    display: 'inline-block',
                  }}
                />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                  The Classic Cut Salon • Rohithal
                </span>
              </div>
              <a
                href={mapDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.78rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  boxShadow: '0 2px 10px rgba(212, 175, 55, 0.25)',
                }}
              >
                <Navigation size={13} />
                <span>Start Navigation</span>
                <ExternalLink size={11} />
              </a>
            </div>

            {/* Clickable Map Wrapper */}
            <a
              href={mapDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Click anywhere on the map to open Google Maps directions from your current location"
              className="map-click-target"
              style={{
                display: 'block',
                position: 'relative',
                flex: 1,
                minHeight: '280px',
                width: '100%',
                textDecoration: 'none',
                cursor: 'pointer',
                overflow: 'hidden',
              }}
            >
              <iframe
                title="Salon Google Maps Location"
                src={mapEmbedUrl}
                width="100%"
                height="100%"
                style={{
                  border: 0,
                  width: '100%',
                  height: '100%',
                  minHeight: '280px',
                  pointerEvents: 'none',
                  transition: 'transform 0.4s ease',
                }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />

              {/* Floating Bottom Navigation Badge */}
              <div
                className="map-directions-badge"
                style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(9, 10, 14, 0.92)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(212, 175, 55, 0.45)',
                  borderRadius: '9999px',
                  padding: '0.65rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6), 0 0 15px rgba(212, 175, 55, 0.2)',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  zIndex: 3,
                  transition: 'all 0.3s ease',
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'var(--gold-gradient)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#000',
                  }}
                >
                  <Navigation size={13} />
                </div>
                <span>Click Map for Directions (From Your Location)</span>
                <ExternalLink size={13} color="var(--gold-primary)" />
              </div>

              {/* Subtle hover overlay */}
              <div className="map-hover-scrim" />
            </a>
          </div>
        </div>
      </div>

      <style>{`
        .contact-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.75rem;
        }
        @media (min-width: 769px) {
          .contact-grid {
            grid-template-columns: 1fr 1fr;
            gap: 2.5rem;
          }
        }
        @media (max-width: 480px) {
          .contact-card {
            padding: 1.4rem 0.9rem !important;
          }
          .map-directions-badge {
            font-size: 0.76rem !important;
            padding: 0.5rem 0.9rem !important;
            bottom: 10px !important;
            width: 90% !important;
            justify-content: center !important;
          }
        }
        .map-container-card:hover iframe {
          transform: scale(1.03);
        }
        .map-click-target:hover .map-directions-badge {
          background: rgba(212, 175, 55, 0.96) !important;
          color: #1A1A1A !important;
          border-color: #ffd700 !important;
          transform: translateX(-50%) translateY(-2px) scale(1.02) !important;
          box-shadow: 0 12px 35px rgba(212, 175, 55, 0.5) !important;
        }
        .map-click-target:hover .map-directions-badge svg {
          color: #1A1A1A !important;
        }
        .map-hover-scrim {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0);
          transition: background 0.3s ease;
          pointer-events: none;
        }
        .map-click-target:hover .map-hover-scrim {
          background: rgba(212, 175, 55, 0.06);
        }
      `}</style>
    </section>
  );
};

const infoItemStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '0.85rem',
  marginBottom: '1.1rem',
};

const iconBoxStyle = {
  width: '38px',
  height: '38px',
  borderRadius: 'var(--radius-sm)',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(212, 175, 55, 0.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const infoLabelStyle = {
  display: 'block',
  fontSize: '0.68rem',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  letterSpacing: '0.08em',
  fontWeight: 600,
  marginBottom: '0.15rem',
};
