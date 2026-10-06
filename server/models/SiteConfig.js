import mongoose from 'mongoose';

const siteConfigSchema = new mongoose.Schema(
  {
    salonName: {
      type: String,
      default: 'The Classic Cut Salon',
      required: true,
    },
    tagline: {
      type: String,
      default: 'Where Vintage Craftsmanship Meets Modern Luxury',
    },
    aboutStory: {
      type: String,
      default: 'Founded on the timeless traditions of classic gentleman grooming, The Classic Cut Salon delivers unmatched scissor craftsmanship, soothing hair therapy, and precision straight-razor beard styling in an ambiance of refined sophistication.',
    },
    phone: {
      type: String,
      default: '+91 93221 88848',
    },
    whatsapp: {
      type: String,
      default: '+919322188848',
    },
    email: {
      type: String,
      default: 'sraut7285@gmail.com',
    },
    address: {
      type: String,
      default: 'At Gevrai jategaon road Rohithal, Tq gevrai dist beed 431127 Maharashtra',
    },
    mapDirectionsUrl: {
      type: String,
      default: 'https://www.google.com/maps/dir/?api=1&destination=19.2528181,75.8555902',
    },
    mapEmbedUrl: {
      type: String,
      default: 'https://maps.google.com/maps?q=19.2528181,75.8555902&hl=en&z=15&output=embed',
    },
    openingHours: {
      weekday: {
        type: String,
        default: 'Tuesday to Friday: 9:30 AM - 9:00 PM',
      },
      weekend: {
        type: String,
        default: 'Saturday & Sunday: 8:30 AM - 10:00 PM',
      },
      monday: {
        type: String,
        default: 'CLOSED (Shop is closed on every Monday)',
      },
    },
    ownerName: {
      type: String,
      default: 'Master Barber Alex Thorne',
    },
    ownerTitle: {
      type: String,
      default: 'Founder & Chief Barber',
    },
    ownerBio: {
      type: String,
      default: 'With over 15 years mastering British and Italian scissor sculpting and straight-razor artistry, Alex founded The Classic Cut Salon to bring authentic gentleman luxury and personalized grooming back to the modern man.',
    },
    ownerImage: {
      type: String,
      default: '',
    },
    heroVideoUrl: {
      type: String,
      default: '/video/backgroundvideo.mp4',
    },
    defaultOfferTitle: {
      type: String,
      default: 'Luxury Grooming Offer Coupon',
    },
    defaultOfferDiscount: {
      type: String,
      default: '30% to 40% OFF',
    },
  },
  { timestamps: true }
);

export const SiteConfig = mongoose.model('SiteConfig', siteConfigSchema);
