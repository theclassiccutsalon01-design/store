import { User } from '../models/User.js';
import { VisitLog } from '../models/VisitLog.js';
import { OfferCoupon } from '../models/OfferCoupon.js';
import { SiteConfig } from '../models/SiteConfig.js';
import { broadcastRealtimeEvent } from '../services/realtimeService.js';

// Safely drop old TTL index so expired coupons are soft-preserved with reason rather than wiped out
OfferCoupon.collection?.dropIndex('expiresAt_1').catch(() => {});

// Helper: Soft-expire coupons that have passed their validity period (2 minutes in TEST MODE)
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
          expiredReason: 'Validity duration of 2 minutes (TEST MODE) expired without salon counter redemption.',
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

// Helper: Check and apply 3-minute inactivity decay to user's stamps (TEMPORARY TEST MODE)
// If user does not visit within 3 minutes of last stamp, decrement stamps by 1 (minimum 0)
export const applyStampInactivityCheck = async (user) => {
  if (!user) return { decayed: false, stampsDecayed: 0, daysUntilDecay: 0, minutesUntilDecay: 0 };

  // If user has stamps > 0 but lastStampDate wasn't set previously, initialize it
  if (user.currentStamps > 0 && !user.lastStampDate) {
    user.lastStampDate = user.updatedAt || new Date();
    await user.save();
  }

  if (user.currentStamps <= 0 || !user.lastStampDate) {
    return { decayed: false, stampsDecayed: 0, daysUntilDecay: 0, minutesUntilDecay: 0 };
  }

  const now = Date.now();
  const lastStampTime = new Date(user.lastStampDate).getTime();
  const elapsedMs = now - lastStampTime;
  const INACTIVITY_MS = 3 * 60 * 1000; // 3 minutes TEST MODE

  if (elapsedMs >= INACTIVITY_MS) {
    const periods = Math.floor(elapsedMs / INACTIVITY_MS);
    const prevStamps = user.currentStamps;
    user.currentStamps = Math.max(0, user.currentStamps - periods);
    const stampsDecayed = prevStamps - user.currentStamps;

    if (user.currentStamps === 0) {
      user.lastStampDate = null;
    } else {
      user.lastStampDate = new Date(lastStampTime + periods * INACTIVITY_MS);
    }
    await user.save();

    const msRemaining = user.lastStampDate
      ? Math.max(0, (new Date(user.lastStampDate).getTime() + INACTIVITY_MS) - now)
      : 0;
    const minutesUntilDecay = Math.max(0, Math.ceil(msRemaining / (1000 * 60)));

    return { decayed: true, stampsDecayed, daysUntilDecay: minutesUntilDecay, minutesUntilDecay };
  }

  const msRemaining = (lastStampTime + INACTIVITY_MS) - now;
  const minutesUntilDecay = Math.max(0, Math.ceil(msRemaining / (1000 * 60)));
  return { decayed: false, stampsDecayed: 0, daysUntilDecay: minutesUntilDecay, minutesUntilDecay };
};

// 1. Admin Awards +1 Visit Stamp to Customer
export const addVisitStamp = async (req, res) => {
  try {
    const { userId, serviceName, notes } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Record visit log
    const visit = await VisitLog.create({
      user: user._id,
      admin: req.user._id,
      serviceName: serviceName || 'Salon Grooming & Haircut',
      notes: notes || '',
      stampAwarded: 1,
      visitedAt: new Date(),
    });

    user.currentStamps = (user.currentStamps || 0) + 1;
    user.lifetimeVisits = (user.lifetimeVisits || 0) + 1;
    user.lastStampDate = new Date(); // Stamp awarded date set to current visit date

    let offerUnlocked = false;
    let newCoupon = null;

    // Check if 5 stamps milestone reached
    if (user.currentStamps >= 5) {
      offerUnlocked = true;

      // Get salon default offer settings from CMS
      const siteConfig = await SiteConfig.findOne();
      const offerTitle = siteConfig?.defaultOfferTitle || 'Luxury Grooming Offer Coupon';
      const offerDiscount = siteConfig?.defaultOfferDiscount || '30% to 40% OFF';

      // Generate unique coupon
      let uniqueCode = generateCouponCode();
      while (await OfferCoupon.findOne({ code: uniqueCode })) {
        uniqueCode = generateCouponCode();
      }

      newCoupon = await OfferCoupon.create({
        code: uniqueCode,
        user: user._id,
        title: offerTitle,
        discountType: offerDiscount,
        expiresAt: new Date(Date.now() + 2 * 60 * 1000), // 2 minutes validity (TEST MODE)
      });

      // RESET active stamps to 0 for next cycle
      user.currentStamps = 0;
      user.lastStampDate = null;
    }

    await user.save();

    // Broadcast live event to customer's phone/desktop and all admins in real-time without reload
    broadcastRealtimeEvent({
      type: 'STAMP_AWARDED',
      targetUserId: user._id,
      userId: user._id,
      customerName: user.name,
      currentStamps: user.currentStamps,
      lifetimeVisits: user.lifetimeVisits,
      lastStampDate: user.lastStampDate,
      daysUntilStampDecay: 3, // 3 minutes in TEST MODE
      offerUnlocked,
      coupon: newCoupon,
      serviceName: serviceName || 'Salon Grooming & Haircut',
      timestamp: new Date(),
    });

    res.status(200).json({
      message: offerUnlocked
        ? '🎉 Congratulations! 5th Stamp reached! 30% to 40% OFF Special Offer Coupon awarded (valid for 2 minutes for testing) and stamps reset to 0.'
        : `Stamp awarded successfully! Customer now has ${user.currentStamps}/5 stamps. Next visit due within 3 minutes (Test Mode).`,
      currentStamps: user.currentStamps,
      lifetimeVisits: user.lifetimeVisits,
      lastStampDate: user.lastStampDate,
      daysUntilStampDecay: 3,
      offerUnlocked,
      coupon: newCoupon,
      visit,
    });
  } catch (error) {
    console.error('Add Stamp Error:', error);
    res.status(500).json({ message: 'Failed to add visit stamp. ' + error.message });
  }
};

// 2. Admin: Get All Customers with Stamp Counts, 45-Day Expiry & Filters
export const getAllCustomers = async (req, res) => {
  try {
    const { search = '' } = req.query;

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

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

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

    res.status(200).json(customerData);
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
      .populate('admin', 'name')
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

    const user = await User.findById(req.user._id).select('name email phone currentStamps lifetimeVisits lastStampDate');
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

    // Enhance active coupons with expiry countdown (2-min test mode)
    const coupons = activeRawCoupons.map((c) => {
      const msLeft = new Date(c.expiresAt).getTime() - now;
      const secondsLeft = Math.max(0, Math.ceil(msLeft / 1000));
      const minutesLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60)));
      const isExpiringSoon = msLeft <= 2 * 60 * 1000;
      return {
        ...c,
        secondsLeft,
        minutesLeft,
        daysRemaining: minutesLeft, // Test mode: minute countdown
        isExpiringSoon,
        reminderMessage: msLeft > 0
          ? `⚠️ TEST MODE: Coupon expires in ${secondsLeft}s (${minutesLeft}m) at ${new Date(c.expiresAt).toLocaleTimeString()}!`
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
      },
      currentStamps: user.currentStamps,
      lifetimeVisits: user.lifetimeVisits,
      lastStampDate: user.lastStampDate,
      daysUntilStampDecay: decayInfo.daysUntilDecay,
      isStampDecayWarning: decayInfo.daysUntilDecay > 0 && decayInfo.daysUntilDecay <= 2,
      stampDecayWarningMessage:
        decayInfo.daysUntilDecay > 0 && decayInfo.daysUntilDecay <= 2
          ? `⚠️ Inactivity Alert: 1 stamp will expire in ${decayInfo.daysUntilDecay} min unless you visit the salon!`
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

    // Broadcast live event so customer's active coupons remove this coupon instantly without reload
    broadcastRealtimeEvent({
      type: 'COUPON_REDEEMED',
      targetUserId: coupon.user?._id || coupon.user,
      userId: coupon.user?._id || coupon.user,
      code: coupon.code,
      customerName,
      timestamp: new Date(),
    });

    res.status(200).json({
      message: `✅ Coupon ${couponCode} redeemed successfully for ${customerName}!`,
      coupon,
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
    res.status(500).json({ message: 'Failed to delete customer: ' + error.message });
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
    res.status(500).json({ message: 'Failed to update customer: ' + error.message });
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

