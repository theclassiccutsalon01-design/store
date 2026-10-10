import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { VisitLog } from '../models/VisitLog.js';
import { OfferCoupon } from '../models/OfferCoupon.js';
import { SiteConfig } from '../models/SiteConfig.js';
import { broadcastRealtimeEvent } from '../services/realtimeService.js';
import {
  calculateSpinDiscount,
  calculateStampExpiry,
  ALLOWED_SERVICE_TYPES,
  SERVICE_EXPIRY_CONFIG,
} from '../config/loyaltyConfig.js';

// Safely drop old TTL index so expired coupons are soft-preserved with reason rather than wiped out
OfferCoupon.collection?.dropIndex('expiresAt_1').catch(() => {});

// Helper: Soft-expire coupons that have passed their 35-day validity period without deleting them
export const markExpiredCoupons = async () => {
  try {
    const result = await OfferCoupon.updateMany(
      {
        status: 'active',
        isRedeemed: false,
        expiresAt: { $lt: new Date() },
      },
      {
        $set: {
          status: 'expired',
          expiredReason: 'Validity duration of 35 days expired without salon counter redemption.',
        },
      }
    );
    return result;
  } catch (err) {
    console.error('Mark Expired Coupons Error:', err.message);
  }
};

// Helper: Generate unique coupon code
const generateCouponCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'CUT-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Helper: Synchronize user's active stamps against per-stamp service expiries and legacy 45-day rules
export const syncUserActiveStamps = async (user) => {
  if (!user) return { decayed: false, stampsDecayed: 0, daysUntilDecay: 0, activeStamps: [] };

  const now = new Date();

  // 1. Soft-expire any active stamps past their authoritative expiry date
  await VisitLog.updateMany(
    {
      user: user._id,
      status: 'active',
      expiresAt: { $lte: now, $ne: null },
    },
    { $set: { status: 'expired' } }
  );

  // 2. Safely handle legacy visit logs where expiresAt is null (45-day inactivity rule)
  await VisitLog.updateMany(
    {
      user: user._id,
      status: 'active',
      expiresAt: null,
      visitedAt: { $lte: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000) },
    },
    { $set: { status: 'expired' } }
  );

  // 3. Fetch all remaining active unexpired stamps sorted oldest-first
  const activeStamps = await VisitLog.find({
    user: user._id,
    status: 'active',
    $or: [
      { expiresAt: { $gt: now } },
      { expiresAt: null, visitedAt: { $gt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000) } },
    ],
  }).sort({ visitedAt: 1 });

  const prevStamps = user.currentStamps || 0;
  const newStampsCount = activeStamps.length > 0 ? Math.min(5, activeStamps.length) : 0;

  if (prevStamps !== newStampsCount) {
    user.currentStamps = newStampsCount;
    if (newStampsCount === 0) {
      user.lastStampDate = null;
    } else {
      user.lastStampDate = activeStamps[activeStamps.length - 1].visitedAt;
    }
    await user.save();
  }

  // 4. Calculate days until the soonest expiring active stamp and determine its policy duration
  let daysUntilDecay = 0;
  let policyDays = 45;
  if (activeStamps.length > 0) {
    let minExpiryMs = Infinity;
    let nextExpiringStamp = null;
    for (const s of activeStamps) {
      const expMs = s.expiresAt
        ? new Date(s.expiresAt).getTime()
        : new Date(s.visitedAt).getTime() + 45 * 24 * 60 * 60 * 1000;
      if (expMs < minExpiryMs) {
        minExpiryMs = expMs;
        nextExpiringStamp = s;
      }
    }
    const msLeft = minExpiryMs - now.getTime();
    daysUntilDecay = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
    if (nextExpiringStamp) {
      if (nextExpiringStamp.expiresAt && nextExpiringStamp.visitedAt) {
        policyDays = Math.round(
          (new Date(nextExpiringStamp.expiresAt).getTime() - new Date(nextExpiringStamp.visitedAt).getTime()) /
            (1000 * 60 * 60 * 24)
        );
      } else if (nextExpiringStamp.serviceType === 'Beard' || nextExpiringStamp.serviceType === 'Haircut + Beard') {
        policyDays = 25;
      } else {
        policyDays = 45;
      }
    }
  }

  const stampsDecayed = Math.max(0, prevStamps - newStampsCount);

  return {
    decayed: stampsDecayed > 0,
    stampsDecayed,
    daysUntilDecay,
    policyDays,
    activeStamps,
  };
};

// Backward-compatible wrapper for existing call sites
export const applyStampInactivityCheck = async (user) => {
  return await syncUserActiveStamps(user);
};

// 1. Admin Awards +1 Visit Stamp to Customer with Required Service Type & Authoritative Expiry
export const addVisitStamp = async (req, res) => {
  try {
    const { userId, serviceType, serviceName, notes } = req.body;

    // SEC-006: Validate userId presence and valid ObjectId format
    if (!userId || typeof userId !== 'string' || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid or missing customer ID format.' });
    }

    // FEATURE 2: Strict Service Type Validation (Beard, Haircut + Beard, Haircut Only)
    if (!serviceType || !ALLOWED_SERVICE_TYPES.includes(serviceType)) {
      return res.status(400).json({
        message: `Service type is required and must be one of: ${ALLOWED_SERVICE_TYPES.join(', ')}.`,
      });
    }

    // SEC-006: Validate input types and bound string lengths
    if (serviceName !== undefined && typeof serviceName !== 'string') {
      return res.status(400).json({ message: 'Service name must be a valid text string.' });
    }
    if (notes !== undefined && typeof notes !== 'string') {
      return res.status(400).json({ message: 'Notes must be a valid text string.' });
    }

    const cleanServiceName = (serviceName ? String(serviceName).trim() : serviceType).slice(0, 100);
    const cleanNotes = (notes ? String(notes).trim() : '').slice(0, 500);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // SEC-006: Enforce role boundaries and eligibility rules
    if (user.role !== 'user') {
      return res.status(400).json({ message: 'Visit stamps can only be awarded to registered customer accounts.' });
    }
    if (user.isDeleted) {
      return res.status(400).json({ message: 'Cannot award visit stamps to an account in the recovery bin.' });
    }

    // Synchronize stamps and expire any past-due ones BEFORE adding new stamp
    await syncUserActiveStamps(user);

    // FEATURE 2: Authoritative backend calculation of expiry timestamp
    // Beard: 25 days | Haircut + Beard: 25 days | Haircut Only: 45 days
    // Client-supplied expiry date (if any) is strictly rejected/ignored.
    const now = new Date();
    const { expiresAt, days } = calculateStampExpiry(serviceType, now);

    // Record visit log with serviceType, authoritative expiresAt, and active status
    const visit = await VisitLog.create({
      user: user._id,
      admin: req.user._id,
      serviceType,
      serviceName: cleanServiceName,
      notes: cleanNotes,
      stampAwarded: 1,
      visitedAt: now,
      expiresAt,
      status: 'active',
    });

    // Query all active unexpired stamps including this new one
    const activeStamps = await VisitLog.find({
      user: user._id,
      status: 'active',
      $or: [
        { expiresAt: { $gt: now } },
        { expiresAt: null, visitedAt: { $gt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000) } },
      ],
    }).sort({ visitedAt: 1 });

    user.lifetimeVisits = (user.lifetimeVisits || 0) + 1;
    user.lastStampDate = now;

    let offerUnlocked = false;
    let newCoupon = null;

    // Check if 5 active stamps milestone reached
    if (activeStamps.length >= 5) {
      offerUnlocked = true;

      // Select the oldest 5 active stamps to mark as redeemed
      const stampsToRedeem = activeStamps.slice(0, 5);

      const siteConfig = await SiteConfig.findOne();
      const offerTitle = siteConfig?.defaultOfferTitle || 'Luxury Grooming Offer Coupon';

      // Generate unique coupon code
      let uniqueCode = generateCouponCode();
      while (await OfferCoupon.findOne({ code: uniqueCode })) {
        uniqueCode = generateCouponCode();
      }

      // Create new eligible coupon with spin wheel unlocked (isSpun: false)
      newCoupon = await OfferCoupon.create({
        code: uniqueCode,
        user: user._id,
        title: offerTitle,
        discountType: 'Spin to Reveal (25%-50% OFF)',
        isSpun: false,
        discountPercent: null,
        expiresAt: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), // 35 days validity
      });

      // Mark the 5 active stamps as redeemed and link to the new coupon
      await VisitLog.updateMany(
        { _id: { $in: stampsToRedeem.map((s) => s._id) } },
        {
          $set: {
            status: 'redeemed',
            redeemedAt: now,
            redeemedCoupon: newCoupon._id,
          },
        }
      );

      // Remaining active stamps for next cycle
      user.currentStamps = Math.max(0, activeStamps.length - 5);
      if (user.currentStamps === 0) {
        user.lastStampDate = null;
      }
    } else {
      user.currentStamps = activeStamps.length;
    }

    await user.save();

    // Query exact verified active coupons count directly from database
    const activeCouponsCount = await OfferCoupon.countDocuments({
      user: user._id,
      status: 'active',
      expiresAt: { $gt: now },
    });

    // Broadcast live event to customer's phone/desktop and all admins in real-time
    broadcastRealtimeEvent({
      type: 'STAMP_AWARDED',
      targetUserId: user._id,
      userId: user._id,
      customerName: user.name,
      currentStamps: user.currentStamps,
      lifetimeVisits: user.lifetimeVisits,
      lastStampDate: user.lastStampDate,
      daysUntilStampDecay: days,
      serviceType,
      expiresAt,
      activeCouponsCount,
      offerUnlocked,
      coupon: newCoupon,
      serviceName: cleanServiceName,
      timestamp: now,
    });

    res.status(200).json({
      message: offerUnlocked
        ? '🎉 Congratulations! 5th Stamp reached! Special Offer Coupon awarded (valid for 35 days) with Spin the Wheel unlocked!'
        : `Stamp awarded successfully for ${serviceType}! Customer now has ${user.currentStamps}/5 active stamps (valid for ${days} days).`,
      currentStamps: user.currentStamps,
      lifetimeVisits: user.lifetimeVisits,
      lastStampDate: user.lastStampDate,
      serviceType,
      expiresAt,
      daysUntilStampDecay: days,
      activeCouponsCount,
      offerUnlocked,
      coupon: newCoupon,
      visit,
    });
  } catch (error) {
    console.error('Add Stamp Error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid customer identifier format.' });
    }
    res.status(500).json({ message: 'Failed to add visit stamp.' });
  }
};

// 2. Admin: Get All Customers with Stamp Counts, 45-Day Expiry & Filters
// SEC-005: Strict pagination controls, max page limits, headers, and out-of-range protection
export const getAllCustomers = async (req, res) => {
  try {
    const { search = '', page, limit } = req.query;

    // Clean up any accounts past their 24h restore window
    await purgeExpiredDeletedUsers();

    // Soft-expire any coupons that exceeded 35 days (preserve status and reason)
    await markExpiredCoupons();

    const query = { role: 'user', isDeleted: { $ne: true } };
    if (search && typeof search === 'string') {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim();
      if (escapedSearch) {
        query.$or = [
          { name: { $regex: escapedSearch, $options: 'i' } },
          { phone: { $regex: escapedSearch, $options: 'i' } },
          { email: { $regex: escapedSearch, $options: 'i' } },
        ];
      }
    }

    const total = await User.countDocuments(query);
    const isExplicitPagination = page !== undefined || limit !== undefined;

    let parsedPage = 1;
    let parsedLimit = 50;
    const MAX_LIMIT = 100;

    if (page !== undefined) {
      const p = parseInt(page, 10);
      if (isNaN(p) || p < 1) {
        return res.status(400).json({ message: 'Page parameter must be a positive integer greater than or equal to 1.' });
      }
      parsedPage = p;
    }

    if (limit !== undefined) {
      const l = parseInt(limit, 10);
      if (isNaN(l) || l < 1) {
        return res.status(400).json({ message: 'Limit parameter must be a positive integer greater than or equal to 1.' });
      }
      if (l > MAX_LIMIT) {
        return res.status(400).json({ message: `Limit parameter cannot exceed maximum permitted limit of ${MAX_LIMIT}.` });
      }
      parsedLimit = l;
    }

    const totalPages = Math.ceil(total / parsedLimit) || 1;
    const skip = (parsedPage - 1) * parsedLimit;

    // Always attach pagination metadata headers
    res.set('X-Total-Count', String(total));
    res.set('X-Page', String(parsedPage));
    res.set('X-Total-Pages', String(totalPages));
    res.set('X-Limit', String(parsedLimit));

    let users = [];
    if (skip < total) {
      users = await User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit);
    }

    const fiveDaysLater = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const now = new Date();

    // Attach latest visit, stamp decay countdown, and coupons to each customer
    const customerData = await Promise.all(
      users.map(async (u) => {
        const decayInfo = await applyStampInactivityCheck(u);
        const lastVisit = await VisitLog.findOne({ user: u._id }).sort({ visitedAt: -1 });
        
        const [activeCoupons, expiredCouponsCount] = await Promise.all([
          OfferCoupon.find({
            user: u._id,
            status: 'active',
            expiresAt: { $gt: now },
          }).lean(),
          OfferCoupon.countDocuments({
            user: u._id,
            status: 'expired',
          }),
        ]);

        const hasExpiringSoonCoupon = activeCoupons.some(
          (c) => new Date(c.expiresAt) <= fiveDaysLater
        );

        return {
          ...u.toObject(),
          currentStamps: u.currentStamps,
          lastStampDate: u.lastStampDate,
          daysUntilStampDecay: decayInfo.daysUntilDecay,
          isStampDecayWarning: decayInfo.daysUntilDecay > 0 && decayInfo.daysUntilDecay <= 5,
          lastVisitDate: lastVisit?.visitedAt || null,
          lastServiceName: lastVisit?.serviceName || 'N/A',
          activeCouponsCount: activeCoupons.length,
          expiredCouponsCount,
          hasExpiringSoonCoupon,
        };
      })
    );

    if (isExplicitPagination) {
      return res.status(200).json({
        customers: customerData,
        total,
        page: parsedPage,
        totalPages,
        limit: parsedLimit,
      });
    }

    // Backward-compatible array response when no pagination parameters are sent
    return res.status(200).json(customerData);
  } catch (error) {
    console.error('Get Customers Error:', error);
    res.status(500).json({ message: 'Failed to fetch customers' });
  }
};

// 3. User & Admin: Get Visit History for a User
export const getVisitHistory = async (req, res) => {
  try {
    const targetUserId = req.params.userId || req.user._id;

    // Security: Only staff (admin/superadmin) or the user themselves can view this
    const isStaff = req.user.role === 'admin' || req.user.role === 'superadmin';
    if (!isStaff && req.user._id.toString() !== targetUserId.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this history' });
    }

    const visits = await VisitLog.find({ user: targetUserId })
      .populate('admin', 'name email role')
      .populate('redeemedCoupon', 'code title discountType discountPercent status')
      .sort({ visitedAt: -1 });

    res.status(200).json(visits);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch visit history' });
  }
};

// 4. User: Get Current User's Loyalty Profile, 45-Day Stamp Inactivity Check & Coupons
export const getMyLoyalty = async (req, res) => {
  try {
    // Soft-expire any coupons that exceeded 35 days (preserve status and reason)
    await markExpiredCoupons();

    const user = await User.findById(req.user._id).select('name email phone currentStamps lifetimeVisits lastStampDate spinCount');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const decayInfo = await applyStampInactivityCheck(user);

    const now = Date.now();

    const [activeRawCoupons, expiredCoupons, redeemedCoupons, recentVisits] = await Promise.all([
      OfferCoupon.find({
        user: req.user._id,
        status: 'active',
        isRedeemed: false,
        expiresAt: { $gt: new Date() },
      })
        .sort({ createdAt: -1 })
        .lean(),
      OfferCoupon.find({
        user: req.user._id,
        status: 'expired',
      })
        .sort({ expiresAt: -1 })
        .limit(10)
        .lean(),
      OfferCoupon.find({
        user: req.user._id,
        status: 'redeemed',
      })
        .sort({ redeemedAt: -1 })
        .limit(10)
        .lean(),
      VisitLog.find({ user: req.user._id })
        .sort({ visitedAt: -1 })
        .limit(5)
        .lean(),
    ]);

    // Enhance active coupons with expiry countdown and 5-day advance reminder warning
    const coupons = activeRawCoupons.map((c) => {
      const msLeft = new Date(c.expiresAt).getTime() - now;
      const daysRemaining = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
      const isExpiringSoon = daysRemaining <= 5;
      return {
        ...c,
        daysRemaining,
        isExpiringSoon,
        reminderMessage: isExpiringSoon
          ? `⚠️ Expiry Reminder: This coupon will expire in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} on ${new Date(c.expiresAt).toLocaleDateString()}! Please visit the salon to claim your discount.`
          : null,
      };
    });

    const hasCouponExpiringSoon = coupons.some((c) => c.isExpiringSoon);

    res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        currentStamps: user.currentStamps,
        lifetimeVisits: user.lifetimeVisits,
        lastStampDate: user.lastStampDate,
        spinCount: user.spinCount || 0,
      },
      currentStamps: user.currentStamps,
      lifetimeVisits: user.lifetimeVisits,
      lastStampDate: user.lastStampDate,
      spinCount: user.spinCount || 0,
      daysUntilStampDecay: decayInfo.daysUntilDecay,
      policyDays: decayInfo.policyDays,
      isStampDecayWarning: decayInfo.daysUntilDecay > 0 && decayInfo.daysUntilDecay <= 5,
      stampDecayWarningMessage:
        decayInfo.daysUntilDecay > 0 && decayInfo.daysUntilDecay <= 5
          ? `⚠️ Inactivity Alert: 1 stamp will expire in ${decayInfo.daysUntilDecay} day${decayInfo.daysUntilDecay === 1 ? '' : 's'} unless you visit the salon!`
          : null,
      stampsNeeded: Math.max(0, 5 - user.currentStamps),
      coupons,
      expiredCoupons,
      redeemedCoupons,
      hasCouponExpiringSoon,
      recentVisits,
    });
  } catch (error) {
    console.error('Get Loyalty Error:', error);
    res.status(500).json({ message: 'Failed to fetch loyalty status' });
  }
};

// 5. Admin: Redeem a Coupon Code
export const redeemCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ message: 'Coupon code is required' });
    }

    const coupon = await OfferCoupon.findOne({ code: code.toUpperCase().trim() }).populate('user', 'name phone email');

    if (!coupon) {
      return res.status(404).json({ message: 'Invalid coupon code. Coupon not found in database.' });
    }

    if (coupon.isRedeemed || coupon.status === 'redeemed') {
      return res.status(400).json({
        message: `This coupon was already redeemed on ${coupon.redeemedAt ? new Date(coupon.redeemedAt).toLocaleDateString() : 'a previous date'}.`,
        coupon,
      });
    }

    // Check if expired (exceeded 35 days)
    if (new Date() > coupon.expiresAt || coupon.status === 'expired') {
      coupon.status = 'expired';
      if (!coupon.expiredReason) {
        coupon.expiredReason = 'Validity duration of 35 days expired without salon counter redemption.';
      }
      await coupon.save();

      return res.status(400).json({
        message: `⚠️ Coupon ${coupon.code} has EXPIRED. Reason: ${coupon.expiredReason}. Admin can extend its expiry date in the Admin Dashboard to reactivate it.`,
        isExpired: true,
        coupon,
      });
    }

    const customerName = coupon.user?.name || 'Customer';
    const couponCode = coupon.code;

    // Mark as redeemed with timestamps and audit trail
    coupon.isRedeemed = true;
    coupon.status = 'redeemed';
    coupon.redeemedAt = new Date();
    coupon.redeemedBy = req.user._id;
    await coupon.save();

    // Query remaining active coupons count directly from database
    const activeCouponsCount = await OfferCoupon.countDocuments({
      user: coupon.user?._id || coupon.user,
      status: 'active',
      expiresAt: { $gt: new Date() },
    });

    // Broadcast live event so customer's active coupons remove this coupon instantly without reload
    broadcastRealtimeEvent({
      type: 'COUPON_REDEEMED',
      targetUserId: coupon.user?._id || coupon.user,
      userId: coupon.user?._id || coupon.user,
      code: coupon.code,
      customerName,
      activeCouponsCount,
      timestamp: new Date(),
    });

    res.status(200).json({
      message: `✅ Coupon ${couponCode} redeemed successfully for ${customerName}!`,
      coupon,
      activeCouponsCount,
    });
  } catch (error) {
    console.error('Redeem Coupon Error:', error);
    res.status(500).json({ message: 'Failed to redeem coupon' });
  }
};

// 6. Helper: Automatically Purge Users Whose 24-Hour Restore Window Expired
export const purgeExpiredDeletedUsers = async () => {
  try {
    const expiredUsers = await User.find({
      isDeleted: true,
      restoreExpiresAt: { $lte: new Date() },
    });

    for (const u of expiredUsers) {
      // Cascade delete all associated data
      await VisitLog.deleteMany({ user: u._id });
      await OfferCoupon.deleteMany({ user: u._id });
      await User.findByIdAndDelete(u._id);
      console.log(`🗑️ Permanently purged expired user: ${u.email} (24-hour recovery window ended)`);
    }
  } catch (err) {
    console.error('Purge Expired Users Error:', err.message);
  }
};

// 7. Admin: Soft Delete Customer with 24-Hour Recovery Window
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Protect Admin and Super Admin accounts from deletion
    if (user.role === 'admin' || user.role === 'superadmin') {
      return res.status(403).json({ message: 'Admin and Super Admin accounts cannot be deleted' });
    }

    user.isDeleted = true;
    user.deletedAt = new Date();
    // 24 hours recovery window
    user.restoreExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    // Archive current stamps and visits so they can be restored within 24 hours
    user.archivedStamps = user.currentStamps || 0;
    user.archivedVisits = user.lifetimeVisits || 0;
    // Reset active stamps so if customer accesses while deleted, stamps restart from 0
    user.currentStamps = 0;
    await user.save();

    res.status(200).json({
      message: `Customer ${user.name} moved to 24-Hour Recovery. You can restore this account anytime within 24 hours.`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        deletedAt: user.deletedAt,
        restoreExpiresAt: user.restoreExpiresAt,
      },
    });
  } catch (error) {
    console.error('Delete Customer Error:', error);
    res.status(500).json({ message: 'Failed to delete customer.' });
  }
};

// 8. Admin: Get List of Deleted Customers in 24-Hour Recovery
export const getDeletedCustomers = async (req, res) => {
  try {
    // Purge any accounts that exceeded 24 hours
    await purgeExpiredDeletedUsers();

    const deletedUsers = await User.find({ isDeleted: true })
      .select('-password')
      .sort({ deletedAt: -1 });

    const recoveryList = deletedUsers.map((u) => {
      const remainingMs = Math.max(0, new Date(u.restoreExpiresAt) - new Date());
      const hoursLeft = Math.floor(remainingMs / (1000 * 60 * 60));
      const minsLeft = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

      return {
        ...u.toObject(),
        remainingHours: hoursLeft,
        remainingMinutes: minsLeft,
        timeLeftFormatted: `${hoursLeft}h ${minsLeft}m remaining`,
      };
    });

    res.status(200).json(recoveryList);
  } catch (error) {
    console.error('Get Deleted Customers Error:', error);
    res.status(500).json({ message: 'Failed to fetch recovery accounts' });
  }
};

// 9. Admin: Restore Soft-Deleted Customer Within 24 Hours
export const restoreCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'Customer record not found or already permanently purged' });
    }

    user.isDeleted = false;
    user.deletedAt = null;
    user.restoreExpiresAt = null;
    // Restore previous stamps and visits
    user.currentStamps = Math.max(user.currentStamps || 0, user.archivedStamps || 0);
    user.lifetimeVisits = Math.max(user.lifetimeVisits || 0, user.archivedVisits || 0);
    await user.save();

    res.status(200).json({
      message: `Account for ${user.name} (${user.email}) has been fully restored with ${user.currentStamps}/5 Coupon Stamps!`,
      user,
    });
  } catch (error) {
    console.error('Restore Customer Error:', error);
    res.status(500).json({ message: 'Failed to restore customer' });
  }
};

// 10. Admin: Permanent Delete Customer (Manual Immediate Purge)
export const permanentDeleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    if (user.role === 'admin' || user.role === 'superadmin') {
      return res.status(403).json({ message: 'Admin and Super Admin accounts cannot be deleted' });
    }

    // Cascade delete all associated data
    await VisitLog.deleteMany({ user: user._id });
    await OfferCoupon.deleteMany({ user: user._id });
    await User.findByIdAndDelete(user._id);

    res.status(200).json({
      message: `Customer ${user.name} and all associated records permanently purged from database.`,
    });
  } catch (error) {
    console.error('Permanent Delete Customer Error:', error);
    res.status(500).json({ message: 'Failed to permanently delete customer' });
  }
};

// 11. Admin: Update Customer Details (Name & Mobile Number Only - Email is protected)
export const updateCustomerByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Name update
    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ message: 'Customer name cannot be empty' });
      }
      user.name = name.trim();
    }

    // Phone update with validation
    if (phone !== undefined) {
      if (phone.trim()) {
        if (/[a-zA-Z]/.test(phone)) {
          return res.status(400).json({ message: 'Mobile number cannot contain letters.' });
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

    // Email is strictly non-editable as required by owner

    await user.save();

    // Broadcast customer update so customer profile updates without reload
    broadcastRealtimeEvent({
      type: 'CUSTOMER_UPDATED',
      targetUserId: user._id,
      userId: user._id,
      name: user.name,
      phone: user.phone,
      timestamp: new Date(),
    });

    res.status(200).json({
      message: `Customer ${user.name} updated successfully!`,
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
    console.error('Update Customer Error:', error);
    res.status(500).json({ message: 'Failed to update customer.' });
  }
};

// 12. Admin: Get All Offer Coupons (Active, Expiring in 5 days, Expired, Redeemed) with filter & search
export const getAllCouponsAdmin = async (req, res) => {
  try {
    await markExpiredCoupons();

    const { status = 'all', search = '' } = req.query;

    let query = {};
    const now = new Date();

    if (status === 'active') {
      query = { status: 'active', expiresAt: { $gt: now } };
    } else if (status === 'expiring_soon') {
      const fiveDaysLater = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      query = {
        status: 'active',
        expiresAt: { $gt: now, $lte: fiveDaysLater },
      };
    } else if (status === 'expired') {
      query = { status: 'expired' };
    } else if (status === 'redeemed') {
      query = { status: 'redeemed' };
    }

    let coupons = await OfferCoupon.find(query)
      .populate('user', 'name email phone currentStamps lifetimeVisits')
      .populate('extendedBy', 'name email')
      .populate('redeemedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    // Filter by search term if provided (code, customer name, email, phone)
    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      coupons = coupons.filter(
        (c) =>
          c.code.toLowerCase().includes(s) ||
          c.user?.name?.toLowerCase().includes(s) ||
          c.user?.email?.toLowerCase().includes(s) ||
          c.user?.phone?.toLowerCase().includes(s)
      );
    }

    // Enhance with remaining days and 5-day warning
    const enhancedCoupons = coupons.map((c) => {
      const msLeft = new Date(c.expiresAt).getTime() - Date.now();
      const daysRemaining = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
      const isExpiringSoon = c.status === 'active' && daysRemaining >= 0 && daysRemaining <= 5;
      return {
        ...c,
        daysRemaining: Math.max(0, daysRemaining),
        isExpiringSoon,
      };
    });

    // Compute summary stats
    const [totalCount, activeCount, expiredCount, redeemedCount] = await Promise.all([
      OfferCoupon.countDocuments(),
      OfferCoupon.countDocuments({ status: 'active', expiresAt: { $gt: now } }),
      OfferCoupon.countDocuments({ status: 'expired' }),
      OfferCoupon.countDocuments({ status: 'redeemed' }),
    ]);

    const fiveDaysLater = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const expiringSoonCount = await OfferCoupon.countDocuments({
      status: 'active',
      expiresAt: { $gt: now, $lte: fiveDaysLater },
    });

    res.status(200).json({
      coupons: enhancedCoupons,
      stats: {
        total: totalCount,
        active: activeCount,
        expiringSoon: expiringSoonCount,
        expired: expiredCount,
        redeemed: redeemedCount,
      },
    });
  } catch (error) {
    console.error('Get All Coupons Admin Error:', error);
    res.status(500).json({ message: 'Failed to fetch coupons: ' + error.message });
  }
};

// 13. Admin: Extend or Increase Coupon Expiry Date (Restores expired coupons or extends active ones)
export const extendCouponExpiryAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { daysToAdd, customDate, reason } = req.body;

    const coupon = await OfferCoupon.findById(id).populate('user', 'name email phone');
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    const prevExpiry = coupon.expiresAt;
    const now = Date.now();

    let newExpiry;
    if (customDate) {
      newExpiry = new Date(customDate);
      if (isNaN(newExpiry.getTime())) {
        return res.status(400).json({ message: 'Invalid custom date provided' });
      }
    } else {
      const days = parseInt(daysToAdd, 10) || 7;
      // If coupon is already expired, extend from now + days; if active, extend from current expiry + days
      const baseTime = coupon.expiresAt && new Date(coupon.expiresAt).getTime() > now
        ? new Date(coupon.expiresAt).getTime()
        : now;
      newExpiry = new Date(baseTime + days * 24 * 60 * 60 * 1000);
    }

    coupon.expiresAt = newExpiry;
    coupon.status = 'active';
    coupon.isRedeemed = false;
    coupon.expiredReason = null;
    coupon.extendedCount = (coupon.extendedCount || 0) + 1;
    coupon.lastExtendedAt = new Date();
    coupon.extendedBy = req.user._id;
    coupon.reminded5DaysSent = false;

    await coupon.save();

    // Broadcast live event so customer's device instantly updates without reload!
    broadcastRealtimeEvent({
      type: 'COUPON_EXTENDED',
      targetUserId: coupon.user?._id || coupon.user,
      userId: coupon.user?._id || coupon.user,
      coupon,
      newExpiresAt: coupon.expiresAt,
      timestamp: new Date(),
    });

    res.status(200).json({
      message: `✅ Coupon ${coupon.code} validity extended successfully until ${new Date(newExpiry).toLocaleDateString()}! Status set to ACTIVE.`,
      coupon,
      prevExpiry,
      newExpiry,
    });
  } catch (error) {
    console.error('Extend Coupon Error:', error);
    res.status(500).json({ message: 'Failed to extend coupon validity: ' + error.message });
  }
};

// 14. User: Spin Discount Wheel to Unlock Guaranteed Milestone or Random Discount
// Validates ownership, checks coupon eligibility, updates spin counter atomically, and calculates discount.
export const spinDiscountWheel = async (req, res) => {
  try {
    const { couponId } = req.body;

    if (!couponId || typeof couponId !== 'string' || !mongoose.Types.ObjectId.isValid(couponId)) {
      return res.status(400).json({ message: 'Valid coupon identifier format is required.' });
    }

    // 1. Fetch coupon belonging to authenticated user
    const coupon = await OfferCoupon.findOne({ _id: couponId, user: req.user._id });
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found or does not belong to your account.' });
    }

    // 2. Validate coupon eligibility
    if (coupon.status !== 'active' || coupon.isRedeemed) {
      return res.status(400).json({
        message: 'This coupon is not active or has already been redeemed.',
        status: coupon.status,
      });
    }

    if (new Date() > new Date(coupon.expiresAt)) {
      coupon.status = 'expired';
      await coupon.save();
      return res.status(400).json({
        message: 'This coupon has expired and is no longer eligible for a spin.',
        isExpired: true,
      });
    }

    if (coupon.isSpun) {
      return res.status(400).json({
        message: 'This coupon has already been spun. Multiple spins per coupon are not permitted.',
        isAlreadySpun: true,
        discountPercent: coupon.discountPercent,
        coupon,
      });
    }

    // 3. Concurrency-safe atomic check-and-set:
    // Only ONE simultaneous request can flip isSpun from false to true
    const lockedCoupon = await OfferCoupon.findOneAndUpdate(
      {
        _id: coupon._id,
        user: req.user._id,
        isSpun: { $ne: true },
        status: 'active',
        isRedeemed: false,
        expiresAt: { $gt: new Date() },
      },
      {
        $set: {
          isSpun: true,
          spunAt: new Date(),
        },
      },
      { new: false }
    );

    if (!lockedCoupon) {
      return res.status(400).json({
        message: 'This coupon has already been spun or is currently being processed.',
      });
    }

    // 4. Concurrency-safe atomic increment of user's persistent spin count
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.user._id },
      { $inc: { spinCount: 1 } },
      { new: true }
    );

    const spinNumber = updatedUser.spinCount;

    // 5. Authoritative backend discount milestone calculation
    // Enforces: 1-49 (25/30/35), 50 (40), 51-99 (25/30/35), 100 (45/50), 150 (40), 200 (45/50)...
    const discountPercent = calculateSpinDiscount(spinNumber);

    // 6. Persist final award details to OfferCoupon
    const finalCoupon = await OfferCoupon.findByIdAndUpdate(
      lockedCoupon._id,
      {
        $set: {
          discountPercent,
          discountType: `${discountPercent}% OFF`,
          spinNumber,
          spunAt: new Date(),
        },
      },
      { new: true }
    );

    // 7. Broadcast realtime update so customer views reflect the unlocked discount immediately
    broadcastRealtimeEvent({
      type: 'COUPON_SPUN',
      targetUserId: req.user._id,
      userId: req.user._id,
      couponId: finalCoupon._id,
      code: finalCoupon.code,
      discountPercent,
      spinNumber,
      timestamp: new Date(),
    });

    return res.status(200).json({
      message: `🎉 Congratulations! You unlocked ${discountPercent}% OFF!`,
      discountPercent,
      spinNumber,
      coupon: finalCoupon,
    });
  } catch (error) {
    console.error('Spin Discount Wheel Error:', error);
    return res.status(500).json({ message: 'Failed to process spin. Please try again.' });
  }
};

// 15. Admin: Get Customer Service & Stamp History (Feature 3)
// Protected by admin authorization, returns full audit trail with service types, issuing admin, expiries, statuses, and redemptions.
export const getCustomerServiceAndStampHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || typeof userId !== 'string' || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Valid customer identifier format is required.' });
    }

    const customer = await User.findById(userId)
      .select('name email phone currentStamps lifetimeVisits spinCount role isDeleted createdAt')
      .lean();

    if (!customer) {
      return res.status(404).json({ message: 'Customer record not found.' });
    }

    const now = new Date();

    // Soft-expire past-due stamps
    await VisitLog.updateMany(
      {
        user: customer._id,
        status: 'active',
        expiresAt: { $lte: now, $ne: null },
      },
      { $set: { status: 'expired' } }
    );

    const visits = await VisitLog.find({ user: customer._id })
      .populate('admin', 'name email role')
      .populate('redeemedCoupon', 'code title discountType discountPercent status')
      .sort({ visitedAt: -1 })
      .lean();

    const formattedHistory = visits.map((v) => {
      let computedStatus = v.status || 'active';
      if (computedStatus === 'active' && v.expiresAt && new Date(v.expiresAt) <= now) {
        computedStatus = 'expired';
      }

      return {
        _id: v._id,
        serviceType: v.serviceType || 'Legacy Stamp',
        serviceName: v.serviceName,
        notes: v.notes,
        stampAwarded: v.stampAwarded || 1,
        visitedAt: v.visitedAt,
        expiresAt: v.expiresAt,
        status: computedStatus,
        admin: v.admin
          ? {
              _id: v.admin._id,
              name: v.admin.name,
              email: v.admin.email,
            }
          : null,
        redeemedAt: v.redeemedAt,
        redeemedCoupon: v.redeemedCoupon
          ? {
              _id: v.redeemedCoupon._id,
              code: v.redeemedCoupon.code,
              discountType: v.redeemedCoupon.discountType,
              discountPercent: v.redeemedCoupon.discountPercent,
            }
          : null,
      };
    });

    return res.status(200).json({
      customer: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        currentStamps: customer.currentStamps,
        lifetimeVisits: customer.lifetimeVisits,
        spinCount: customer.spinCount || 0,
      },
      history: formattedHistory,
    });
  } catch (error) {
    console.error('Get Customer Service & Stamp History Error:', error);
    return res.status(500).json({ message: 'Failed to fetch customer stamp and service history.' });
  }
};


