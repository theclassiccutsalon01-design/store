import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getDeviceCapabilities } from '../../utils/deviceCapability';

gsap.registerPlugin(ScrollTrigger);

// Global caching for 0ms Three.js asset instantiation
THREE.Cache.enabled = true;

export const Hero3DCanvas = ({ isReady = true }) => {
  const mountRef = useRef(null);
  const maxDimRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const getResponsiveScale = () => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
    if (w < 480) return 2.3;  // Compact on mobile phones
    if (w < 768) return 2.6;  // Tablets / Large phones
    if (w < 1024) return 2.9; // Small laptops
    return 3.2;               // Desktops
  };

  useEffect(() => {
    // Avoid running concurrent WebGL context during LoadingScreen
    if (!isReady) return;

    const container = mountRef.current;
    if (!container) return;

    const capabilities = getDeviceCapabilities();
    const isMobile = window.innerWidth < 768;
    const width = container.clientWidth || (window.innerWidth < 480 ? 210 : isMobile ? 260 : 460);
    const height = container.clientHeight || (window.innerWidth < 480 ? 190 : isMobile ? 240 : 400);

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(isMobile ? 45 : 42, width / height, 0.1, 100);
    camera.position.set(0, isMobile ? 0.2 : 0.4, isMobile ? 4.5 : 4.2);

    // 2. WebGL Renderer with High-Efficiency Settings
    // Adaptive quality: low-end constrained devices use antialias: false, standard/high-end keep antialias: true
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: isMobile ? false : (capabilities.isConstrained ? false : true),
      powerPreference: 'high-performance',
      precision: isMobile ? 'mediump' : 'highp',
    });

    renderer.setSize(width, height);
    // Safe DPR defaults: preserved exact quality for standard devices, capped at 1.0 on mobile to avoid 9x retina over-rendering
    const targetDpr = isMobile
      ? 1.0
      : (capabilities.isConstrained ? 1.0 : Math.min(window.devicePixelRatio, 1.5));
    renderer.setPixelRatio(targetDpr);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // 3. Studio Lighting System
    const ambientLight = new THREE.AmbientLight(0xfff6ea, 1.8);
    scene.add(ambientLight);

    const frontSpot = new THREE.DirectionalLight(0xfff1bf, 3.6);
    frontSpot.position.set(3, 4, 3.5);
    scene.add(frontSpot);

    const rimLight = new THREE.DirectionalLight(0xa5f3fc, 2.2);
    rimLight.position.set(-3.5, 2.5, -2);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xd4af37, 1.2);
    fillLight.position.set(0, -3, 2);
    scene.add(fillLight);

    // Master Group for Mouse Tilt & Scroll Sync
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // 4. Load Downloaded 3D GLB Model with Multi-URL Fallback & Auto-Retry
    const modelWrapper = new THREE.Group();
    masterGroup.add(modelWrapper);

    const loader = new GLTFLoader();
    const modelCandidates = [
      '/3d-model/my_face__quiff_hairstyle.glb',
      '/models/my_face__quiff_hairstyle.glb',
      '/3d model/my_face__quiff_hairstyle.glb',
      encodeURI('/3d model/my_face__quiff_hairstyle.glb'),
    ];

    let candidateIdx = 0;
    let isDisposed = false;

    const tryLoadModel = () => {
      if (isDisposed) return;
      const currentPath = modelCandidates[candidateIdx];

      loader.load(
        currentPath,
        (gltf) => {
          if (isDisposed) return;
          const loadedModel = gltf.scene;

          // Auto-center the model using its Bounding Box
          const box = new THREE.Box3().setFromObject(loadedModel);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());

          loadedModel.position.set(-center.x, -center.y, -center.z);

          // Normalize scale to fit viewport responsively
          const maxDim = Math.max(size.x, size.y, size.z);
          maxDimRef.current = maxDim;
          const targetScale = getResponsiveScale() / (maxDim || 1);
          modelWrapper.scale.setScalar(targetScale);

          // Enhance materials
          loadedModel.traverse((node) => {
            if (node.isMesh && node.material) {
              node.material.envMapIntensity = 1.5;
            }
          });

          modelWrapper.add(loadedModel);
          setIsLoaded(true);

          // Render initial visual frame immediately so model is painted
          renderScene();

          if (isLoopActive && !animationFrameId) {
            animate();
          }
        },
        undefined,
        (err) => {
          console.warn(`Could not load 3D model from ${currentPath}:`, err);
          if (candidateIdx < modelCandidates.length - 1 && !isDisposed) {
            candidateIdx++;
            setTimeout(tryLoadModel, 150);
          }
        }
      );
    };

    tryLoadModel();

    // 5. Ambient Champagne Gold Floating Particles
    const particleCount = window.innerWidth < 640 ? 30 : 60;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      const radius = 1.1 + Math.random() * 2.0;
      const theta = Math.random() * Math.PI * 2;
      particlePos[i] = Math.cos(theta) * radius;
      particlePos[i + 1] = (Math.random() - 0.5) * 3.4;
      particlePos[i + 2] = Math.sin(theta) * radius;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0xffdf88,
      size: window.innerWidth < 640 ? 0.04 : 0.05,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 6. Interactive Pointer/Touch Drag to Spin along Y-Axis
    let isDragging = false;
    let prevPointerX = 0;
    let dragVelocity = 0;

    const onPointerDown = (e) => {
      if (typeof startAnimationLoop === 'function') startAnimationLoop();
      isDragging = true;
      prevPointerX = e.clientX;
      dragVelocity = 0;
      if (container) container.style.cursor = 'grabbing';
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevPointerX;
      prevPointerX = e.clientX;
      dragVelocity = deltaX * 0.007;
      if (modelWrapper) {
        modelWrapper.rotation.y += dragVelocity;
      }
    };

    const onPointerUp = () => {
      isDragging = false;
      if (container) container.style.cursor = 'grab';
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    // 7. Hero Scroll Integration: Model position remains strictly locked at (0,0,0) - NO vertical head displacement or tilt
    masterGroup.position.set(0, 0, 0);
    masterGroup.rotation.set(0, 0, 0);

    const scrollTrigger = ScrollTrigger.create({
      trigger: '#hero-section',
      start: 'top top',
      end: 'bottom top',
      scrub: 1.2,
      onUpdate: (self) => {
        // Position remains strictly (0, 0, 0) - Zero vertical shift or tilt during scroll
        masterGroup.position.set(0, 0, 0);
        masterGroup.rotation.set(0, 0, 0);
        if (particleMat) {
          particleMat.opacity = Math.max(0.2, 0.85 * (1 - self.progress));
        }
      },
    });

    // Expose model ref for verified runtime inspection
    if (typeof window !== 'undefined') {
      window.__HERO_3D_MODEL__ = {
        getModelWrapper: () => modelWrapper,
        getMasterGroup: () => masterGroup,
        getCamera: () => camera,
        getScene: () => scene,
      };
    }

    // 8. High-Performance Render Loop with Offscreen Pause & Initial Idle Deferral
    const checkVisibility = () => {
      if (!container) return false;
      const rect = container.getBoundingClientRect();
      return rect.bottom > -100 && rect.top < window.innerHeight + 100;
    };

    let isVisible = true;
    let animationFrameId = null;
    let isLoopActive = false;
    let lastRenderTime = 0;
    const targetFps = isMobile ? 30 : 45; // 30fps mobile, 45fps desktop auto-rotate saves 50%+ CPU load!
    const frameInterval = 1000 / targetFps;

    const renderScene = () => {
      // Continuous automatic rotation strictly along Y-AXIS only
      if (!isDragging) {
        if (Math.abs(dragVelocity) > 0.0005) {
          dragVelocity *= 0.92;
          if (modelWrapper) modelWrapper.rotation.y += dragVelocity;
        } else {
          dragVelocity = 0;
          if (modelWrapper) {
            modelWrapper.rotation.y += 0.015;
          }
        }
      }

      if (modelWrapper) {
        modelWrapper.rotation.x = 0;
        modelWrapper.rotation.z = 0;
      }
      masterGroup.rotation.set(0, 0, 0);
      masterGroup.position.set(0, 0, 0);

      // Swirling particles
      if (particles) {
        particles.rotation.y = performance.now() * 0.0003;
      }

      renderer.render(scene, camera);
    };

    const animate = (now = performance.now()) => {
      if (!isVisible || !checkVisibility()) {
        animationFrameId = null;
        isLoopActive = false;
        return;
      }

      animationFrameId = requestAnimationFrame(animate);

      if (isDragging) {
        // Full unthrottled 60fps during active user drag/touch
        renderScene();
      } else {
        const delta = now - lastRenderTime;
        if (delta >= frameInterval) {
          lastRenderTime = now - (delta % frameInterval);
          renderScene();
        }
      }
    };

    const startAnimationLoop = () => {
      if (isLoopActive) return;
      isLoopActive = true;
      detachActivationListeners();
      if (!animationFrameId && isVisible) {
        animate();
      }
    };

    const activationEvents = ['pointermove', 'pointerdown', 'touchstart', 'scroll', 'wheel', 'keydown'];
    const onActivate = () => {
      startAnimationLoop();
    };

    const detachActivationListeners = () => {
      activationEvents.forEach((evt) => {
        window.removeEventListener(evt, onActivate);
      });
      clearTimeout(autoStartTimer);
    };

    activationEvents.forEach((evt) => {
      window.addEventListener(evt, onActivate, { passive: true, once: true });
    });

    // Fallback: auto-start continuous rotation after 2200ms settling time if no user interaction
    const autoStartTimer = setTimeout(startAnimationLoop, 2200);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          isVisible = entry.isIntersecting;
          if (isVisible && isLoopActive && !animationFrameId) {
            animate();
          }
        }
      },
      { threshold: 0.01, rootMargin: '120px' }
    );
    observer.observe(container);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isVisible = false;
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
      } else {
        isVisible = true;
        if (isLoopActive && !animationFrameId) {
          animate();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth || 210;
      const newHeight = container.clientHeight || 190;
      const isMob = window.innerWidth < 768;
      camera.aspect = newWidth / newHeight;
      camera.fov = isMob ? 45 : 42;
      camera.position.z = isMob ? 4.5 : 4.2;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
      renderer.setPixelRatio(targetDpr);

      if (modelWrapper && maxDimRef.current) {
        modelWrapper.scale.setScalar(getResponsiveScale() / maxDimRef.current);
      }
    };

    window.addEventListener('resize', handleResize);

    // Watch container size changes via ResizeObserver to fix unmeasured 0px layout issues
    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined' && container) {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(container);
    }

    return () => {
      isDisposed = true;
      if (typeof window !== 'undefined') {
        delete window.__HERO_3D_MODEL__;
      }
      if (resizeObserver) resizeObserver.disconnect();
      detachActivationListeners();
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      observer.disconnect();
      scrollTrigger.kill();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);

      renderer.dispose();
      particleGeo.dispose();
      particleMat.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isReady]);

  return (
    <div
      ref={mountRef}
      className="canvas-3d-container hero-3d-responsive-canvas"
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 'clamp(200px, 45vw, 460px)',
        height: 'clamp(185px, 40vw, 400px)',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
        touchAction: 'pan-y',
        cursor: 'grab',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
      title="360° Artisan Cut Avatar — Drag to spin"
    >
      {/* Ambient luxury halo backing behind 3D quiff avatar */}
      <div
        style={{
          position: 'absolute',
          width: '78%',
          height: '78%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.18) 0%, rgba(11, 12, 16, 0) 72%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Subtle luxury loader while 3D GLB model loads */}
      {!isLoaded && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '2px solid rgba(212, 175, 55, 0.25)',
              borderTopColor: 'var(--gold-primary)',
              animation: 'spin 0.9s linear infinite',
            }}
          />
          <span
            style={{
              marginTop: '0.55rem',
              fontFamily: 'var(--font-serif)',
              fontSize: '0.62rem',
              color: 'var(--gold-primary)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            Loading 3D Avatar...
          </span>
        </div>
      )}
    </div>
  );
};
