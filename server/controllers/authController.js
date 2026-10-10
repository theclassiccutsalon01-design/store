import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User.js';
import { Otp } from '../models/Otp.js';
import { sendOtpEmail } from '../config/email.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const hashOtp = (code) => {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
};

export const generateSecureOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is missing.');
  }
  return jwt.sign({ id }, secret, {
    expiresIn: '30d',
  });
};

// 1. Send OTP for Email Verification
export const requestOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ message: 'User already registered with this email. Please login.' });
    }

    // Generate cryptographically secure 6-digit OTP and SHA-256 hash
    const otpCode = generateSecureOtp();
    const hashedOtp = hashOtp(otpCode);

    // Delete existing OTPs for this email
    await Otp.deleteMany({ email: cleanEmail });

    // Save new hashed OTP
    await Otp.create({
      email: cleanEmail,
      otp: hashedOtp,
      attempts: 0,
    });

    console.log(`🔑 [OTP DISPATCH] Generated verification code for ${cleanEmail}`);

    // Send email with plaintext code (only to user inbox)
    const emailResult = await sendOtpEmail(cleanEmail, otpCode);
    if (!emailResult.success) {
      console.error(`❌ [OTP DISPATCH] Outbound email failed for ${cleanEmail}: ${emailResult.error}`);
      // Strictly delete OTP from MongoDB so unverified requests cannot bypass security
      await Otp.deleteMany({ email: cleanEmail });
      return res.status(500).json({
        success: false,
        message: 'Failed to deliver verification code: ' + (emailResult.error || 'Please check your email configuration or try again.'),
        error: emailResult.error,
      });
    }

    res.status(200).json({
      success: true,
      message: 'A 6-digit verification code has been sent to your email inbox.',
    });
  } catch (error) {
    console.error('Request OTP Error:', error);
    res.status(500).json({ message: 'Failed to send OTP: ' + error.message });
  }
};

// 2. Register User with OTP
export const registerWithOtp = async (req, res) => {
  try {
    const { name, email, phone, password, otp } = req.body;

    if (!name || !email || !password || !otp) {
      return res.status(400).json({ message: 'Name, email, password, and OTP are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = String(otp || '').trim().replace(/[^0-9]/g, '');

    if (cleanOtp.length !== 6) {
      return res.status(400).json({ message: 'Please enter a valid 6-digit OTP.' });
    }

    // Check if user already exists
    let user = await User.findOne({ email: cleanEmail });
    if (user && user.isVerified && !user.isDeleted) {
      return res.status(400).json({ message: 'User already exists with this email. Please login instead.' });
    }

    const hashedInputOtp = hashOtp(cleanOtp);

    // Verify OTP: Match against active, unexpired OTPs
    const matchingOtp = await Otp.findOne({
      email: cleanEmail,
      otp: hashedInputOtp,
      expiresAt: { $gt: new Date() },
    });

    if (!matchingOtp) {
      // Determine exact reason and enforce failure attempt limit
      const latestOtp = await Otp.findOne({ email: cleanEmail }).sort({ createdAt: -1 });
      if (!latestOtp) {
        return res.status(400).json({
          message: 'No active OTP found for this email. Please request a new verification code.',
        });
      }
      if (new Date() > new Date(latestOtp.expiresAt)) {
        return res.status(400).json({
          message: 'Your verification code has expired. Please click Resend OTP for a fresh code.',
        });
      }

      // Track failed attempt and prevent brute-force
      latestOtp.attempts = (latestOtp.attempts || 0) + 1;
      if (latestOtp.attempts >= 5) {
        await Otp.deleteMany({ email: cleanEmail });
        return res.status(400).json({
          message: 'Too many incorrect OTP attempts. For your security, this verification code has been cancelled. Please request a new code.',
        });
      }
      await latestOtp.save();

      const remaining = 5 - latestOtp.attempts;
      return res.status(400).json({
        message: `Incorrect OTP code. Please check the 6-digit code in your email and try again. (${remaining} attempt${remaining === 1 ? '' : 's'} remaining)`,
      });
    }

    // Validate and sanitize phone number if provided
    let cleanPhone = '';
    if (phone && phone.trim()) {
      if (/[a-zA-Z]/.test(phone)) {
        return res.status(400).json({ message: 'Mobile number cannot contain alphabets/letters. Please enter a valid 10-digit number.' });
      }
      const digits = String(phone).replace(/[^0-9]/g, '');
      const validDigits = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
      if (validDigits.length !== 10) {
        return res.status(400).json({ message: 'Mobile number must be a valid 10-digit number.' });
      }
      cleanPhone = '+91 ' + validDigits;
    }

    if (user) {
      // Update existing unverified user or reactivate soft-deleted account
      user.name = name;
      user.phone = cleanPhone;
      user.password = password;
      user.isVerified = true;
      if (user.isDeleted) {
        user.isDeleted = false;
        user.deletedAt = null;
        user.restoreExpiresAt = null;
        user.currentStamps = 0;
        user.archivedStamps = 0;
      }
      await user.save();
    } else {
      // Create new user
      user = await User.create({
        name,
        email: cleanEmail,
        phone: cleanPhone,
        password,
        isVerified: true,
      });
    }

    // Cleanup OTP
    await Otp.deleteMany({ email: cleanEmail });

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Registration successful! Welcome to The Classic Cut Salon.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        currentStamps: user.currentStamps,
        lifetimeVisits: user.lifetimeVisits,
      },
      token,
    });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ message: 'Registration failed. ' + error.message });
  }
};

// 3. User & Admin Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Ensure owner has superadmin role if matches configured admin email
    const configuredAdminEmail = (process.env.ADMIN_EMAIL || 'theclassiccutsalon01@gmail.com').toLowerCase().trim();
    if (cleanEmail === configuredAdminEmail && user.role !== 'superadmin') {
      user.role = 'superadmin';
    }

    // If customer account was in deleted state, allow login but restart Coupon Stamps from 0
    if (user.isDeleted) {
      user.isDeleted = false;
      user.deletedAt = null;
      user.restoreExpiresAt = null;
      user.currentStamps = 0;
      user.archivedStamps = 0;
    }
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      message: 'Logged in successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        currentStamps: user.currentStamps,
        lifetimeVisits: user.lifetimeVisits,
        hasPassword: true,
        needsAdminPassword: false,
      },
      token,
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Login failed. ' + error.message });
  }
};

// 4. Google OAuth Login / Register
export const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'Google credential token is required' });
    }

    // Strictly verify token against Google OAuth servers
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return res.status(401).json({ message: 'Invalid or expired Google authentication token' });
    }

    const { email, name, sub: googleId } = payload;
    const cleanEmail = email.toLowerCase().trim();

    // Check if user is configured as Salon Owner via environment variable
    const configuredAdminEmail = (process.env.ADMIN_EMAIL || 'theclassiccutsalon01@gmail.com').toLowerCase().trim();
    const isOwner = Boolean(cleanEmail === configuredAdminEmail);

    let user = await User.findOne({ email: cleanEmail });
    const isNewUser = !user;

    if (!user) {
      // Create new Google verified user with real name and email from Google (NO avatar stored)
      user = await User.create({
        name: name || 'Valued Guest',
        email: cleanEmail,
        googleId,
        role: isOwner ? 'superadmin' : 'user',
        isVerified: true,
      });
    } else {
      // Ensure superadmin privileges if email matches owner
      if (isOwner && user.role !== 'superadmin') {
        user.role = 'superadmin';
      }
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (name) {
        user.name = name;
      }
      // If customer account was in deleted state, allow login but restart Coupon Stamps from 0
      if (user.isDeleted) {
        user.isDeleted = false;
        user.deletedAt = null;
        user.restoreExpiresAt = null;
        user.currentStamps = 0;
        user.archivedStamps = 0;
      }
      await user.save();
    }

    const token = generateToken(user._id);

    const hasPassword = Boolean(user.password);
    const needsPasswordSetup = !hasPassword;
    const needsAdminPassword = (user.role === 'admin' || user.role === 'superadmin') && !hasPassword;

    res.status(200).json({
      message: isNewUser ? 'Account registered with Google' : 'Welcome back! Signed in with Google',
      isNewUser,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        currentStamps: user.currentStamps,
        lifetimeVisits: user.lifetimeVisits,
        isNewUser,
        needsPhone: isNewUser && !user.phone, // ONLY true for brand-new users without a phone
        hasPassword,
        needsPasswordSetup,
        needsAdminPassword,
      },
      token,
    });
  } catch (error) {
    console.error('Google Auth Verification Error:', error.message);
    res.status(401).json({ message: 'Google Authentication failed: ' + error.message });
  }
};

// 5. Get Current Authenticated User Profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const userObj = user.toObject();
    const hasPassword = Boolean(userObj.password);
    delete userObj.password;

    res.status(200).json({
      ...userObj,
      hasPassword,
      needsPasswordSetup: !hasPassword,
      needsAdminPassword: (user.role === 'admin' || user.role === 'superadmin') && !hasPassword,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user profile' });
  }
};

// 6. Update User Profile (e.g., Mobile Number, Name)
export const updateProfile = async (req, res) => {
  try {
    const { phone, name } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (phone !== undefined) {
      if (phone.trim()) {
        if (/[a-zA-Z]/.test(phone)) {
          return res.status(400).json({ message: 'Mobile number cannot contain alphabets/letters. Please enter a valid 10-digit number.' });
        }
        const digits = String(phone).replace(/[^0-9]/g, '');
        const validDigits = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
        if (validDigits.length !== 10) {
          return res.status(400).json({ message: 'Mobile number must be a valid 10-digit number.' });
        }
        user.phone = '+91 ' + validDigits;
      } else {
        user.phone = '';
      }
    }
    if (name !== undefined && name.trim()) {
      user.name = name.trim();
    }

    await user.save();

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        currentStamps: user.currentStamps,
        lifetimeVisits: user.lifetimeVisits,
      },
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

// 7. Set / Decide User or Admin Password (For any Google OAuth login user)
export const setPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Assign password (pre-save hook in User model will automatically bcrypt hash it)
    user.password = password;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password set successfully! You can now log in anytime using your email and this password.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        currentStamps: user.currentStamps,
        lifetimeVisits: user.lifetimeVisits,
        hasPassword: true,
        needsPasswordSetup: false,
        needsAdminPassword: false,
      },
    });
  } catch (error) {
    console.error('Set Password Error:', error);
    res.status(500).json({ message: 'Failed to set password: ' + error.message });
  }
};

export const setAdminPassword = setPassword;

// 8. Request Password Reset OTP
export const requestForgotPasswordOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Verify user exists in database without leaking existence to client
    const user = await User.findOne({ email: cleanEmail, isDeleted: { $ne: true } });
    if (!user) {
      // Return identical generic success response to prevent account enumeration
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email address, a 6-digit password reset code has been sent to your inbox.',
      });
    }

    // Generate cryptographically secure 6-digit OTP and SHA-256 hash
    const otpCode = generateSecureOtp();
    const hashedOtp = hashOtp(otpCode);

    // Invalidate existing OTPs for this email
    await Otp.deleteMany({ email: cleanEmail });

    // Store new hashed OTP with 10-minute expiry
    await Otp.create({
      email: cleanEmail,
      otp: hashedOtp,
      attempts: 0,
    });

    console.log(`🔑 [PASSWORD RESET OTP] Generated for ${cleanEmail}`);

    // Send email with custom title (only to recipient email)
    const emailResult = await sendOtpEmail(cleanEmail, otpCode, 'Password Reset Code');
    if (!emailResult.success) {
      console.error(`❌ [PASSWORD RESET OTP] Outbound email failed for ${cleanEmail}: ${emailResult.error}`);
      await Otp.deleteMany({ email: cleanEmail });
      return res.status(500).json({
        message: 'Failed to deliver password reset code to your email. Please try again later.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'If an account exists with this email address, a 6-digit password reset code has been sent to your inbox.',
    });
  } catch (error) {
    console.error('Request Forgot Password OTP Error:', error);
    res.status(500).json({ message: 'Failed to process request: ' + error.message });
  }
};

// 9. Reset Password using Email OTP
export const resetPasswordWithOtp = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = String(otp || '').trim().replace(/[^0-9]/g, '');

    if (cleanOtp.length !== 6) {
      return res.status(400).json({ message: 'Please enter a valid 6-digit OTP code' });
    }

    const hashedInputOtp = hashOtp(cleanOtp);

    // Verify OTP against active unexpired OTP records
    const matchingOtp = await Otp.findOne({
      email: cleanEmail,
      otp: hashedInputOtp,
      expiresAt: { $gt: new Date() },
    });

    if (!matchingOtp) {
      const latestOtp = await Otp.findOne({ email: cleanEmail }).sort({ createdAt: -1 });
      if (!latestOtp) {
        return res.status(400).json({
          message: 'No reset request found for this email. Please request a new code.',
        });
      }
      if (new Date() > new Date(latestOtp.expiresAt)) {
        return res.status(400).json({
          message: 'Your reset code has expired. Please request a fresh code.',
        });
      }

      // Track failed attempts and limit brute-force
      latestOtp.attempts = (latestOtp.attempts || 0) + 1;
      if (latestOtp.attempts >= 5) {
        await Otp.deleteMany({ email: cleanEmail });
        return res.status(400).json({
          message: 'Too many incorrect attempts. For your security, this reset code has been cancelled. Please request a new code.',
        });
      }
      await latestOtp.save();

      const remaining = 5 - latestOtp.attempts;
      return res.status(400).json({
        message: `Incorrect verification code. Please check your email and try again. (${remaining} attempt${remaining === 1 ? '' : 's'} remaining)`,
      });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    // Set new password (pre-save hook will hash it with bcrypt)
    user.password = newPassword;
    user.isVerified = true;
    if (user.isDeleted) {
      user.isDeleted = false;
      user.deletedAt = null;
      user.restoreExpiresAt = null;
      user.currentStamps = 0;
      user.archivedStamps = 0;
    }
    await user.save();

    // Clean up OTP
    await Otp.deleteMany({ email: cleanEmail });

    // Automatically issue fresh JWT login token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully! You are now logged in.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        currentStamps: user.currentStamps,
        lifetimeVisits: user.lifetimeVisits,
        hasPassword: true,
        needsPasswordSetup: false,
        needsAdminPassword: false,
      },
      token,
    });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ message: 'Password reset failed: ' + error.message });
  }
};

