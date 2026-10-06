import rateLimit from 'express-rate-limit';

// Rate limiter for general auth routes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 auth requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many authentication attempts from this IP, please try again in 15 minutes',
  },
});

// Stricter rate limiter for OTP requests
export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // Max 10 OTP requests per 10 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many OTP requests from this IP, please try again in 10 minutes',
  },
});
