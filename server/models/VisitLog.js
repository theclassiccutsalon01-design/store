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
  },
  { timestamps: true }
);

export const VisitLog = mongoose.model('VisitLog', visitLogSchema);
