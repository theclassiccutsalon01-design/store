import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['Hair Styling', 'Beard & Shave', 'Spa & Therapy', 'Royal Combos'],
      default: 'Hair Styling',
    },
    price: {
      type: Number,
      required: true,
    },
    duration: {
      type: String,
      default: '30 mins',
    },
    description: {
      type: String,
      default: '',
    },
    popular: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const Service = mongoose.model('Service', serviceSchema);
