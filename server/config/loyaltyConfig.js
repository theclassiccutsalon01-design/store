// Central validated configuration for Discount Spin Wheel and Service-Based Loyalty Stamp Expiry
// Follows strict business rules and authoritative server calculations

export const WHEEL_SEGMENTS = [25, 30, 35, 40, 45, 50];

// Probability weights for ordinary spins (spins 1-49, 51-99, 101-149, etc.)
// Selects randomly among 25%, 30%, and 35%
export const ORDINARY_SPIN_WEIGHTS = {
  25: 0.40, // 40% probability
  30: 0.35, // 35% probability
  35: 0.25, // 25% probability
};

// Probability weights for century milestone spins (100, 200, 300, etc.)
// Selects randomly between 45% and 50%
export const CENTURY_SPIN_WEIGHTS = {
  45: 0.50,
  50: 0.50,
};

/**
 * Authoritative backend discount calculator based on individual user's persistent spin count.
 * Rules:
 * - Spins 1–49: randomly award 25%, 30%, or 35%
 * - Spin 50: award exactly 40%
 * - Spins 51–99: randomly award 25%, 30%, or 35%
 * - Spin 100: randomly award either 45% or 50%
 * - Pattern repeats: spin 150 awards 40%, spin 200 awards 45% or 50%, etc.
 *
 * @param {number} spinNumber 1-based persistent spin count
 * @returns {number} discount percentage (25, 30, 35, 40, 45, or 50)
 */
export const calculateSpinDiscount = (spinNumber) => {
  const n = parseInt(spinNumber, 10);
  if (isNaN(n) || n < 1) {
    throw new Error('Spin number must be a positive integer greater than or equal to 1.');
  }

  // Century milestones: 100 or greater
  if (n % 100 === 0 || n >= 100) {
    return Math.random() < CENTURY_SPIN_WEIGHTS[45] ? 45 : 50;
  }

  // Half-century milestones: 50, 150, 250, etc.
  if (n % 50 === 0) {
    return 40;
  }

  // Ordinary spins: random among 25, 30, 35
  const rand = Math.random();
  if (rand < ORDINARY_SPIN_WEIGHTS[25]) {
    return 25;
  }
  if (rand < ORDINARY_SPIN_WEIGHTS[25] + ORDINARY_SPIN_WEIGHTS[30]) {
    return 30;
  }
  return 35;
};

// Service Types & Authoritative Expiry Configuration
export const SERVICE_EXPIRY_CONFIG = {
  'Beard': {
    days: 25,
    ms: 25 * 24 * 60 * 60 * 1000,
    label: 'Beard (Valid for 25 Days)',
  },
  'Haircut + Beard': {
    days: 25,
    ms: 25 * 24 * 60 * 60 * 1000,
    label: 'Haircut + Beard (Valid for 25 Days)',
  },
  'Haircut Only': {
    days: 45,
    ms: 45 * 24 * 60 * 60 * 1000,
    label: 'Haircut Only (Valid for 45 Days)',
  },
};

export const ALLOWED_SERVICE_TYPES = Object.keys(SERVICE_EXPIRY_CONFIG);

/**
 * Authoritatively calculates expiry date from server timestamp and service type.
 * Rejects arbitrary client expiry dates.
 *
 * @param {string} serviceType One of ALLOWED_SERVICE_TYPES
 * @param {Date} [baseDate] Authoritative base date (defaults to current time)
 * @returns {{ expiresAt: Date, days: number }}
 */
export const calculateStampExpiry = (serviceType, baseDate = new Date()) => {
  if (!serviceType || !SERVICE_EXPIRY_CONFIG[serviceType]) {
    throw new Error(`Invalid service type "${serviceType}". Must be one of: ${ALLOWED_SERVICE_TYPES.join(', ')}`);
  }
  const config = SERVICE_EXPIRY_CONFIG[serviceType];
  const expiresAt = new Date(baseDate.getTime() + config.ms);
  return {
    expiresAt,
    days: config.days,
  };
};
