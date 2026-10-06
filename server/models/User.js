import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator: function (v) {
          if (!v) return true;
          // Must only contain digits and optional +91 prefix (NO alphabets allowed)
          return !/[a-zA-Z]/.test(v) && /^\+?[0-9\s-]{10,15}$/.test(v);
        },
        message: 'Mobile number must contain digits only and cannot contain letters/alphabets.',
      },
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'superadmin'],
      default: 'user',
    },
    currentStamps: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    lifetimeVisits: {
      type: Number,
      default: 0,
    },
    lastStampDate: {
      type: Date,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    googleId: {
      type: String,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    restoreExpiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    archivedStamps: {
      type: Number,
      default: 0,
    },
    archivedVisits: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password helper
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

export const User = mongoose.model('User', userSchema);
