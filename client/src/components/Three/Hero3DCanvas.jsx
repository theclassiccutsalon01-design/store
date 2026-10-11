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
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const getResponsiveScale = () => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
    if (w < 480) return 1.68;  // Mobile: Adjusted cleanly inside box with headroom and chin clearance
    if (w < 768) return 1.72;  // Tablet
    if (w < 1024) return 1.76; // Small laptops
    return 1.75;               // Desktop: Scaled down to fit box gracefully with elegant margins
  };

  useEffect(() => {
    // Avoid running concurrent WebGL context during LoadingScreen
    if (!isReady) return;

    const container = mountRef.current;
    if (!container) return;

    const capabilities = getDeviceCapabilities();
    const isMobile = window.innerWidth < 768;
    const isSmallMobile = window.innerWidth < 480;
    const width = container.clientWidth || (isSmallMobile ? 320 : isMobile ? 360 : 460);
    const height = container.clientHeight || (isSmallMobile ? 340 : isMobile ? 360 : 400);

    // 1. Scene & Camera - Perfectly framed to fit inside container box without clipping
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, isMobile ? 0.0 : 0.02, isSmallMobile ? 3.35 : isMobile ? 3.45 : 3.55);

    // 2. WebGL Renderer with High-Efficiency Settings and Fallback Protection
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: isMobile ? false : (capabilities.isConstrained ? false : true),
        powerPreference: 'high-performance',
        precision: isMobile ? 'mediump' : 'highp',
      });
    } catch (e) {
      console.error('Failed to create WebGLRenderer:', e);
      setLoadFailed(true);
      return;
    }

    renderer.setSize(width, height);
    // Safe DPR defaults: preserved exact quality for standard devices, capped at 1.0 on mobile to avoid 9x retina over-rendering
    const targetDpr = isMobile
      ? 1.0
      : (capabilities.isConstrained ? 1.0 : Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setPixelRatio(targetDpr);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // Context loss & restoration protection
    const handleContextLost = (e) => {
      e.preventDefault();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
    const handleContextRestored = () => {
      setReloadKey((k) => k + 1);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

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

    // 4. Load Downloaded 3D GLB Model with Resilient Fetch + Parse + Automatic Retries
    const modelWrapper = new THREE.Group();
    masterGroup.add(modelWrapper);

    const loader = new GLTFLoader();
    const canonicalModelPath = '/3d-model/my_face__quiff_hairstyle.glb';
    let isDisposed = false;
    let retryAttempt = 0;
    const MAX_RETRIES = 3;

    const executeLoad = async () => {
      while (retryAttempt <= MAX_RETRIES && !isDisposed) {
        try {
          if (THREE.Cache.enabled) {
            THREE.Cache.remove(canonicalModelPath);
          }
          const cacheBuster = retryAttempt > 0 ? `?t=${Date.now()}` : '';
          const url = `${canonicalModelPath}${cacheBuster}`;

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 12000);

          const response = await fetch(url, {
            signal: controller.signal,
            cache: retryAttempt > 0 ? 'no-cache' : 'default',
          });
          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status} fetching 3D model`);
          }

          const arrayBuffer = await response.arrayBuffer();
          if (isDisposed) return;

          await new Promise((resolve, reject) => {
            loader.parse(
              arrayBuffer,
              '',
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
                    node.material.envMapIntensity = 1.6;
                    if (node.material.map) node.material.map.colorSpace = THREE.SRGBColorSpace;
                  }
                });

                // Clear previous instances if any before adding
                while (modelWrapper.children.length > 0) {
                  modelWrapper.remove(modelWrapper.children[0]);
                }

                modelWrapper.add(loadedModel);
                setIsLoaded(true);
                setLoadFailed(false);

                // Render initial visual frame immediately so model is painted
                renderScene();

                if (!animationFrameId) {
                  animate();
                }
                resolve();
              },
              (parseErr) => {
                reject(parseErr);
              }
            );
          });

          return; // Successfully parsed and attached!
        } catch (err) {
          console.warn(`Attempt ${retryAttempt + 1} to load 3D model failed:`, err);
          retryAttempt++;
          if (retryAttempt <= MAX_RETRIES && !isDisposed) {
            await new Promise((r) => setTimeout(r, 1000 * retryAttempt));
          } else if (!isDisposed) {
            setLoadFailed(true);
          }
        }
      }
    };

    executeLoad();

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

    // 6. Interactive Pointer/Touch Drag to Spin along Y-Axis with Touch-Scroll Protection
    let isDragging = false;
    let startPointerX = 0;
    let startPointerY = 0;
    let prevPointerX = 0;
    let dragVelocity = 0;
    let hasDeterminedDirection = false;
    let isHorizontalDrag = false;

    const onPointerDown = (e) => {
      startPointerX = e.clientX;
      startPointerY = e.clientY;
      prevPointerX = e.clientX;
      dragVelocity = 0;
      hasDeterminedDirection = false;
      isHorizontalDrag = false;
      isDragging = true;
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      const dx = Math.abs(e.clientX - startPointerX);
      const dy = Math.abs(e.clientY - startPointerY);

      if (!hasDeterminedDirection) {
        if (dx < 6 && dy < 6) return; // small jitter threshold
        hasDeterminedDirection = true;
        if (dy > dx) {
          // User is scrolling the page vertically on mobile/laptop; let browser scroll smoothly!
          isDragging = false;
          return;
        }
        isHorizontalDrag = true;
        if (typeof startAnimationLoop === 'function') startAnimationLoop();
        if (container) container.style.cursor = 'grabbing';
      }

      if (isHorizontalDrag) {
        const deltaX = e.clientX - prevPointerX;
        prevPointerX = e.clientX;
        dragVelocity = deltaX * 0.007;
        if (modelWrapper) {
          modelWrapper.rotation.y += dragVelocity;
        }
      }
    };

    const onPointerUp = () => {
      isDragging = false;
      hasDeterminedDirection = false;
      isHorizontalDrag = false;
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

    // 8. High-Performance Render Loop with Viewport Visibility
    let isVisible = true;
    let animationFrameId = null;
    let lastRenderTime = 0;
    const targetFps = isMobile ? 30 : 45;
    const frameInterval = 1000 / targetFps;

    const renderScene = () => {
      if (!isDragging) {
        if (Math.abs(dragVelocity) > 0.0005) {
          dragVelocity *= 0.92;
          if (modelWrapper) modelWrapper.rotation.y += dragVelocity;
        } else {
          dragVelocity = 0;
          if (modelWrapper) {
            modelWrapper.rotation.y += 0.012;
          }
        }
      }

      if (modelWrapper) {
        modelWrapper.rotation.x = 0;
        modelWrapper.rotation.z = 0;
      }
      masterGroup.rotation.set(0, 0, 0);
      masterGroup.position.set(0, 0, 0);

      if (particles) {
        particles.rotation.y = performance.now() * 0.0003;
      }

      renderer.render(scene, camera);
    };

    const animate = (now = performance.now()) => {
      if (!isVisible) {
        animationFrameId = null;
        return;
      }

      animationFrameId = requestAnimationFrame(animate);

      if (isDragging) {
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
      if (!animationFrameId && isVisible) {
        animate();
      }
    };

    // Immediately kick off the animation loop
    startAnimationLoop();

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          isVisible = entry.isIntersecting;
          if (isVisible) {
            renderScene();
            startAnimationLoop();
          } else if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
          }
        }
      },
      { threshold: 0.02, rootMargin: '100px' }
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
        renderScene();
        startAnimationLoop();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handleResize = () => {
      if (!container || !renderer) return;
      const isMob = window.innerWidth < 768;
      const isSmallMob = window.innerWidth < 480;
      const newWidth = container.clientWidth || (isSmallMob ? 320 : isMob ? 360 : 460);
      const newHeight = container.clientHeight || (isSmallMob ? 340 : isMob ? 360 : 400);

      camera.aspect = newWidth / newHeight;
      camera.fov = 38;
      camera.position.z = isSmallMob ? 3.35 : isMob ? 3.45 : 3.55;
      camera.position.y = isMob ? 0.0 : 0.02;
      camera.updateProjectionMatrix();

      const newDpr = isMob ? 1.0 : (capabilities.isConstrained ? 1.0 : Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(newWidth, newHeight);
      renderer.setPixelRatio(newDpr);

      if (modelWrapper && maxDimRef.current) {
        modelWrapper.scale.setScalar(getResponsiveScale() / maxDimRef.current);
      }
      renderScene();
    };

    window.addEventListener('resize', handleResize);

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
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      observer.disconnect();
      if (scrollTrigger) scrollTrigger.kill();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);

      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);

      renderer.dispose();
      particleGeo.dispose();
      particleMat.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isReady, reloadKey]);

  return (
    <div
      ref={mountRef}
      className="canvas-3d-container hero-3d-responsive-canvas"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '340px',
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
          width: '85%',
          height: '85%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.22) 0%, rgba(26, 26, 26, 0) 72%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Subtle luxury loader while 3D GLB model loads */}
      {!isLoaded && !loadFailed && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '2px solid rgba(212, 175, 55, 0.25)',
              borderTopColor: 'var(--gold-primary, #D4AF37)',
              animation: 'spin 0.9s linear infinite',
            }}
          />
          <span
            style={{
              marginTop: '0.65rem',
              fontFamily: 'var(--font-serif)',
              fontSize: '0.72rem',
              color: 'var(--gold-primary, #D4AF37)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            Loading 3D Style Preview...
          </span>
        </div>
      )}

      {/* Interactive reload button if model loading ever fails */}
      {loadFailed && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            padding: '1rem',
            zIndex: 10,
            background: 'rgba(26, 26, 26, 0.9)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #D2CFC9)' }}>
            Could not load 3D preview
          </span>
          <button
            onClick={() => {
              setLoadFailed(false);
              setIsLoaded(false);
              setReloadKey((k) => k + 1);
            }}
            className="btn btn-outline"
            style={{
              padding: '0.45rem 1.1rem',
              fontSize: '0.8rem',
              borderColor: 'var(--gold-primary, #D4AF37)',
              color: 'var(--gold-primary, #D4AF37)',
              borderRadius: 'var(--radius-full, 9999px)',
            }}
          >
            Tap to Reload Model
          </button>
        </div>
      )}
    </div>
  );
};
