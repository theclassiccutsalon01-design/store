import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, UserCheck, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Sparkles, X } from 'lucide-react';

export const SetAdminPasswordModal = ({ isOpen, onClose }) => {
  const { user, setPassword } = useAuth();
  const [password, setPasswordInput] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen || !user) return null;

  const isAdmin = user.role === 'admin' || user.role === 'superadmin';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match! Please check and confirm your password.');
      return;
    }

    setLoading(true);
    try {
      const res = await setPassword(password);
      setSuccess(res.message || 'Password saved successfully!');
      setTimeout(() => {
        onClose?.();
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      data-lenis-prevent="true"
      style={{
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="modal-content"
        data-lenis-prevent="true"
        style={{
          background: 'linear-gradient(145deg, #242424 0%, #1A1A1A 100%)',
          border: '1px solid rgba(212, 175, 55, 0.45)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(212, 175, 55, 0.25)',
          borderRadius: '16px',
          maxWidth: '440px',
          width: '100%',
          padding: 'clamp(1.2rem, 3.5vw, 1.85rem)',
          color: 'var(--color-cream, #F9F8F6)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button for non-admin users */}
        {!isAdmin && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              position: 'absolute',
              top: '1.25rem',
              right: '1.25rem',
              width: '32px',
              height: '32px',
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
            }}
          >
            <X size={16} />
          </button>
        )}

        {/* Header Icon */}
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(212, 175, 55, 0.15)',
              border: '2px solid var(--gold-primary)',
              color: 'var(--gold-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.75rem',
              boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)',
            }}
          >
            {isAdmin ? <ShieldCheck size={32} /> : <UserCheck size={32} />}
          </div>
          <h3 style={{ fontSize: '1.4rem', color: '#ffffff', margin: '0 0 0.4rem 0' }}>
            {isAdmin ? 'Set Your Admin Password' : 'Set Your User Password'}
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            Hello <strong style={{ color: 'var(--gold-primary)' }}>{user.name}</strong>! You have logged in. Since you signed in via Google, please choose a password to protect your{' '}
            <strong style={{ color: '#ffffff' }}>{isAdmin ? 'Admin account' : 'account'}</strong>.
          </p>
        </div>

        {/* Info Banner */}
        <div
          style={{
            background: 'rgba(212, 175, 55, 0.08)',
            border: '1px solid rgba(212, 175, 55, 0.25)',
            padding: '0.65rem 0.85rem',
            borderRadius: '8px',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.75rem',
            color: '#cbd5e1',
          }}
        >
          <Sparkles size={16} color="var(--gold-primary)" style={{ flexShrink: 0 }} />
          <span>
            {isAdmin
              ? 'You decide your own password. Once set, you can sign in directly to Admin CMS anytime.'
              : 'You decide your own password. Once set, you can log in using email & password anytime.'}
          </span>
        </div>

        {/* Error / Success Alerts */}
        {error && (
          <div
            style={{
              background: 'rgba(197, 34, 34, 0.15)',
              border: '1px solid rgba(197, 34, 34, 0.4)',
              color: '#ff8080',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            style={{
              background: 'rgba(46, 204, 113, 0.15)',
              border: '1px solid rgba(46, 204, 113, 0.4)',
              color: '#2ecc71',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <CheckCircle size={16} style={{ flexShrink: 0 }} />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label" style={{ marginBottom: '0.45rem', display: 'block', fontWeight: 600, fontSize: '0.84rem', color: '#e2e8f0' }}>
              {isAdmin ? 'Choose Admin Password *' : 'Choose Your Password *'}
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '0.95rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--gold-primary)',
                  zIndex: 2,
                }}
              >
                <Lock size={17} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="input-field input-with-icons"
                placeholder="Minimum 6 characters"
                style={{
                  paddingLeft: '2.85rem',
                  paddingRight: '2.85rem',
                  width: '100%',
                  height: '46px',
                  borderRadius: '10px',
                  background: 'rgba(10, 13, 20, 0.95)',
                  border: '1.5px solid rgba(212, 175, 55, 0.35)',
                  color: '#ffffff',
                  fontSize: '0.92rem',
                  outline: 'none',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--gold-primary)';
                  e.target.style.boxShadow = '0 0 14px rgba(212, 175, 55, 0.25)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(212, 175, 55, 0.35)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: showPassword ? 'var(--gold-primary)' : '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.35rem',
                  borderRadius: '6px',
                  zIndex: 2,
                  transition: 'color 0.2s ease',
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label" style={{ marginBottom: '0.45rem', display: 'block', fontWeight: 600, fontSize: '0.84rem', color: '#e2e8f0' }}>
              {isAdmin ? 'Confirm Admin Password *' : 'Confirm Your Password *'}
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '0.95rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--gold-primary)',
                  zIndex: 2,
                }}
              >
                <Lock size={17} />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field input-with-icons"
                placeholder="Re-enter your chosen password"
                style={{
                  paddingLeft: '2.85rem',
                  paddingRight: '2.85rem',
                  width: '100%',
                  height: '46px',
                  borderRadius: '10px',
                  background: 'rgba(10, 13, 20, 0.95)',
                  border: '1.5px solid rgba(212, 175, 55, 0.35)',
                  color: '#ffffff',
                  fontSize: '0.92rem',
                  outline: 'none',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--gold-primary)';
                  e.target.style.boxShadow = '0 0 14px rgba(212, 175, 55, 0.25)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(212, 175, 55, 0.35)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: showConfirmPassword ? 'var(--gold-primary)' : '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.35rem',
                  borderRadius: '6px',
                  zIndex: 2,
                  transition: 'color 0.2s ease',
                }}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '0.85rem',
              fontWeight: 700,
              fontSize: '0.95rem',
              marginTop: '0.5rem',
            }}
          >
            {loading ? 'Saving Password...' : isAdmin ? 'Save Password & Access Admin' : 'Save Password & Continue'}
          </button>

          {!isAdmin && (
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{
                width: '100%',
                padding: '0.65rem',
                fontSize: '0.82rem',
                marginTop: '0.25rem',
              }}
            >
              Skip for now
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
