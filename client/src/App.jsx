import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SiteConfigProvider, useSiteConfig } from './context/SiteConfigContext';
import { SmoothScrollProvider, useSmoothScroll } from './context/SmoothScrollContext';
import { Navbar } from './components/Navbar';
import { HeroVideo } from './components/HeroVideo';
import { ModernServicesExperience } from './components/ModernServicesExperience';
import { LocationContact } from './components/LocationContact';
import { Footer } from './components/Footer';
import { Home, Scissors, Gift, Phone, User, ShieldCheck } from 'lucide-react';
import { LoadingScreen } from './components/LoadingScreen';

// Code-split interactive modals on-demand to reduce initial JS payload
const StampCard = React.lazy(() => import('./components/StampCard').then(m => ({ default: m.StampCard })));
const AuthModal = React.lazy(() => import('./components/AuthModal').then(m => ({ default: m.AuthModal })));
const AdminDashboard = React.lazy(() => import('./components/Admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const SetAdminPasswordModal = React.lazy(() => import('./components/SetAdminPasswordModal').then(m => ({ default: m.SetAdminPasswordModal })));

const MainContent = ({ isLoading }) => {
  const { user, isAdmin, isAuthenticated } = useAuth();
  const { config } = useSiteConfig();
  const { scrollTo, stopScroll, startScroll } = useSmoothScroll();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [stampCardOpen, setStampCardOpen] = useState(false);
  const [stampCardTab, setStampCardTab] = useState('profile');
  const [adminDashboardOpen, setAdminDashboardOpen] = useState(false);
  const [skipPasswordModal, setSkipPasswordModal] = useState(false);

  const handleOpenLoyalty = (tab = 'stamps') => {
    setStampCardTab(tab);
    setStampCardOpen(true);
  };

  const handleOpenProfile = (tab = 'profile') => {
    setStampCardTab(tab);
    setStampCardOpen(true);
  };

  // Lock smooth scroll when any modal dialog is active
  React.useEffect(() => {
    if (authModalOpen || stampCardOpen || adminDashboardOpen) {
      stopScroll();
    } else {
      startScroll();
    }
  }, [authModalOpen, stampCardOpen, adminDashboardOpen]);

  // Auto-dismiss auth modal when authenticated (guarantees modal cuts from screen after Google or OTP login)
  React.useEffect(() => {
    if (isAuthenticated) {
      setAuthModalOpen(false);
    }
  }, [isAuthenticated]);

  const scrollToServices = () => {
    scrollTo('#services', { offset: -65 });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 1. Glassmorphic Navigation Bar (320px responsive with gold Hamburger menu) */}
      <Navbar
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenAdmin={() => setAdminDashboardOpen(true)}
        onOpenLoyalty={() => handleOpenLoyalty('stamps')}
        onOpenProfile={(tab) => handleOpenProfile(tab || 'profile')}
      />

      {/* 2. Hero Section with Crystal Clear Video Directly Under Navbar */}
      <HeroVideo
        onOpenLoyalty={() => handleOpenLoyalty('stamps')}
        onOpenAdmin={() => setAdminDashboardOpen(true)}
        onScrollToExperience={scrollToServices}
        isReady={!isLoading}
      />

      {/* 3. Modern Services Experience (Scalloped canopy, Scissor ribbon headline, 8 Pop Shapes, 3 Vibrant Cards, and Extra Atelier Art) */}
      <ModernServicesExperience />

      {/* 4. Salon Location, Hours & WhatsApp Desk */}
      <LocationContact />

      {/* 5. Footer */}
      <Footer
        onOpenAdminLogin={() => {
          if (isAdmin) {
            setAdminDashboardOpen(true);
          } else {
            setAuthModalOpen(true);
          }
        }}
      />

      {/* Mobile-First Floating Bottom Navigation Bar */}
      <div className="mobile-bottom-nav">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="mobile-nav-item"
        >
          <Home size={18} />
          <span>Home</span>
        </button>

        <button onClick={scrollToServices} className="mobile-nav-item">
          <Scissors size={18} />
          <span>Services</span>
        </button>

        {isAdmin ? (
          <button
            onClick={() => setAdminDashboardOpen(true)}
            className="mobile-nav-item"
            style={{ color: '#ff8080' }}
          >
            <ShieldCheck size={20} />
            <span style={{ fontWeight: 700 }}>Admin CMS</span>
          </button>
        ) : (
          <button
            onClick={() => handleOpenLoyalty('stamps')}
            className="mobile-nav-item"
            style={{ color: 'var(--gold-primary)' }}
          >
            <Gift size={20} />
            <span style={{ fontWeight: 700 }}>5-Coupon</span>
          </button>
        )}

        <button
          onClick={() => {
            const el = document.getElementById('contact');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="mobile-nav-item"
        >
          <Phone size={18} />
          <span>Location</span>
        </button>

        <button
          onClick={() => {
            if (isAdmin) {
              setAdminDashboardOpen(true);
            } else if (isAuthenticated) {
              handleOpenProfile('profile');
            } else {
              setAuthModalOpen(true);
            }
          }}
          className="mobile-nav-item"
        >
          {isAdmin ? <ShieldCheck size={18} color="#ff6b6b" /> : <User size={18} />}
          <span>{isAdmin ? 'Admin' : isAuthenticated ? 'Profile' : 'Sign In'}</span>
        </button>
      </div>

      {/* Interactive Modals (Code-split on demand) */}
      <React.Suspense fallback={null}>
        {authModalOpen && (
          <AuthModal
            isOpen={authModalOpen}
            onClose={() => setAuthModalOpen(false)}
            onAuthSuccess={(authResultUser) => {
              setAuthModalOpen(false);
              const activeUser = authResultUser || user;
              if (activeUser?.role === 'admin' || activeUser?.role === 'superadmin') {
                setAdminDashboardOpen(true);
              }
            }}
          />
        )}

        {stampCardOpen && (
          <StampCard
            isOpen={stampCardOpen}
            initialTab={stampCardTab}
            onClose={() => setStampCardOpen(false)}
            onOpenAuth={() => setAuthModalOpen(true)}
            onOpenAdmin={() => {
              setStampCardOpen(false);
              setAdminDashboardOpen(true);
            }}
          />
        )}

        {adminDashboardOpen && (
          <AdminDashboard
            isOpen={adminDashboardOpen}
            onClose={() => setAdminDashboardOpen(false)}
          />
        )}

        {user && (user.needsPasswordSetup || user.needsAdminPassword) && !skipPasswordModal && (
          <SetAdminPasswordModal
            isOpen={true}
            onClose={() => setSkipPasswordModal(true)}
          />
        )}
      </React.Suspense>
    </div>
  );
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <AuthProvider>
      <SiteConfigProvider>
        <SmoothScrollProvider>
          {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}
          <MainContent isLoading={isLoading} />
        </SmoothScrollProvider>
      </SiteConfigProvider>
    </AuthProvider>
  );
}
