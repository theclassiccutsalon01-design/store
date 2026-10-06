import express from 'express';
import {
  requestOtp,
  registerWithOtp,
  login,
  googleAuth,
  getProfile,
  updateProfile,
  setPassword,
  setAdminPassword,
  requestForgotPasswordOtp,
  resetPasswordWithOtp,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authLimiter, otpLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/request-otp', otpLimiter, requestOtp);
router.post('/register', authLimiter, registerWithOtp);
router.post('/login', authLimiter, login);
router.post('/google', authLimiter, googleAuth);
router.post('/forgot-password-otp', otpLimiter, requestForgotPasswordOtp);
router.post('/reset-password', authLimiter, resetPasswordWithOtp);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/set-password', protect, setPassword);
router.post('/set-admin-password', protect, setAdminPassword);

export default router;
