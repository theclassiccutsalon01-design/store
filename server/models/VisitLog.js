import mongoose from 'mongoose';

const visitLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    serviceType: {
      type: String,
      enum: ['Beard', 'Haircut + Beard', 'Haircut Only', null],
      default: null,
    },
    serviceName: {
      type: String,
      default: 'Royal Haircut & Beard Grooming',
    },
    notes: {
      type: String,
      default: '',
    },
    stampAwarded: {
      type: Number,
      default: 1,
    },
    visitedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'redeemed'],
      default: 'active',
    },
    redeemedAt: {
      type: Date,
      default: null,
    },
    redeemedCoupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OfferCoupon',
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes for performance and query optimization
visitLogSchema.index({ user: 1, status: 1, expiresAt: 1 });
visitLogSchema.index({ user: 1, visitedAt: -1 });

export const VisitLog = mongoose.model('VisitLog', visitLogSchema);
