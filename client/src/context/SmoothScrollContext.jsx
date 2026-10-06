import React, { createContext, useContext, useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const SmoothScrollContext = createContext({
  lenis: null,
  scrollTo: () => {},
  stopScroll: () => {},
  startScroll: () => {},
  forceUnlock: () => {},
});

export const useSmoothScroll = () => useContext(SmoothScrollContext);

export const SmoothScrollProvider = ({ children }) => {
  const lenisRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isTouch =
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 860);

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: isTouch ? 0 : 1.0,
      syncTouch: false,
      infinite: false,
      prevent: (node) => {
        if (!node) return false;
        return (
          node.hasAttribute?.('data-lenis-prevent') ||
          node.closest?.('[data-lenis-prevent="true"]') ||
          node.closest?.('.modal-overlay') ||
          node.closest?.('.modal-content') ||
          node.closest?.('.admin-modal-content') ||
          node.closest?.('.mobile-drawer-overlay')
        );
      },
    });

    lenisRef.current = lenis;

    // 2. Synchronize Lenis scroll positions directly into GSAP ScrollTrigger
    lenis.on('scroll', () => {
      ScrollTrigger.update();
    });

    // 3. Delegate RAF loop to GSAP ticker with stable lag smoothing
    const updateGsapTicker = (time) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateGsapTicker);
    // lagSmoothing(500, 33) prevents frame jerk during momentary GC or render pauses
    gsap.ticker.lagSmoothing(500, 33);

    // Initial update
    ScrollTrigger.refresh();

    return () => {
      gsap.ticker.remove(updateGsapTicker);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  const scrollTo = (target, options = {}) => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, {
        offset: options.offset || 0,
        duration: options.duration || 1.0,
        easing: options.easing,
      });
    } else {
      const el = typeof target === 'string' ? document.querySelector(target) : target;
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const lockCountRef = useRef(0);

  // Force clean all scroll lock styles from body and html
  const resetScrollStyles = () => {
    lockCountRef.current = 0;
    document.body.classList.remove('lenis-stopped');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    lenisRef.current?.start();
  };

  const stopScroll = () => {
    lockCountRef.current = Math.max(0, lockCountRef.current) + 1;
    lenisRef.current?.stop();
    document.body.classList.add('lenis-stopped');
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  };

  const startScroll = () => {
    lockCountRef.current = Math.max(0, lockCountRef.current - 1);
    const hasActiveModal = Boolean(
      document.querySelector(
        '[role="dialog"], .modal-overlay, .mobile-drawer-overlay, .service-modal-backdrop'
      )
    );
    if (!hasActiveModal || lockCountRef.current <= 0) {
      resetScrollStyles();
    }
  };

  // Failsafe auto-recovery: guarantees website NEVER stays stuck/frozen on mobile or desktop
  useEffect(() => {
    const handleSafetyUnlock = () => {
      const hasActiveModal = Boolean(
        document.querySelector(
          '[role="dialog"], .modal-overlay, .mobile-drawer-overlay, .service-modal-backdrop'
        )
      );
      if (!hasActiveModal && (document.body.style.overflow === 'hidden' || document.documentElement.style.overflow === 'hidden')) {
        resetScrollStyles();
      }
    };

    window.addEventListener('touchstart', handleSafetyUnlock, { passive: true });
    window.addEventListener('popstate', handleSafetyUnlock);
    window.addEventListener('hashchange', handleSafetyUnlock);
    return () => {
      window.removeEventListener('touchstart', handleSafetyUnlock);
      window.removeEventListener('popstate', handleSafetyUnlock);
      window.removeEventListener('hashchange', handleSafetyUnlock);
    };
  }, []);

  return (
    <SmoothScrollContext.Provider
      value={{
        lenis: lenisRef.current,
        scrollTo,
        stopScroll,
        startScroll,
        forceUnlock: resetScrollStyles,
      }}
    >
      {children}
    </SmoothScrollContext.Provider>
  );
};
