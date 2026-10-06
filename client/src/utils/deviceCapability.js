/**
 * Multi-signal device capability detection.
 * Uses safe defaults that preserve existing visual quality unless there is
 * clear, positive evidence that the device is genuinely constrained.
 */
export function getDeviceCapabilities() {
  if (typeof window === 'undefined') {
    return { isConstrained: false, prefersReducedMotion: false };
  }

  // 1. Accessibility signal: user explicitly requested reduced motion
  const prefersReducedMotion = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  // 2. Hardware signals: logical CPU cores & device RAM (where supported)
  const cores = typeof navigator.hardwareConcurrency === 'number' ? navigator.hardwareConcurrency : null;
  const memory = typeof navigator.deviceMemory === 'number' ? navigator.deviceMemory : null;

  // 3. Evaluation: Strictly require multiple positive signals of constraint
  // or an explicit reduced-motion preference.
  let isConstrained = false;

  if (prefersReducedMotion) {
    isConstrained = true;
  } else if (cores !== null && memory !== null) {
    // Both signals exist and indicate low-end hardware (e.g. <= 4 cores AND <= 4 GB RAM)
    if (cores <= 4 && memory <= 4) {
      isConstrained = true;
    }
  } else if (memory !== null && memory <= 2) {
    // Very constrained RAM (2 GB or less)
    isConstrained = true;
  }
  // Safe default: if capability signals are unavailable (e.g. Safari / privacy masking),
  // isConstrained remains FALSE, ensuring standard full-quality experience is preserved.

  return {
    isConstrained,
    prefersReducedMotion,
    cores,
    memory,
  };
}
