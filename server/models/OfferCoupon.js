import mongoose from 'mongoose';

const offerCouponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      default: 'Luxury Grooming Offer Coupon',
    },
    discountType: {
      type: String,
      default: '30% to 40% OFF',
    },
    status: {
      type: String,
      enum: ['active', 'redeemed', 'expired'],
      default: 'active',
    },
    isRedeemed: {
      type: Boolean,
      default: false,
    },
    redeemedAt: {
      type: Date,
      default: null,
    },
    redeemedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), // 35 days validity
    },
    expiredReason: {
      type: String,
      default: null,
    },
    extendedCount: {
      type: Number,
      default: 0,
    },
    lastExtendedAt: {
      type: Date,
      default: null,
    },
    extendedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reminded5DaysSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Helpful index on user and status
offerCouponSchema.index({ user: 1, status: 1 });

export const OfferCoupon = mongoose.model('OfferCoupon', offerCouponSchema);
