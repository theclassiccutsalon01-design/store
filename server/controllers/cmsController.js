import { SiteConfig } from '../models/SiteConfig.js';

const defaultCMS = {
  salonName: 'The Classic Cut Salon',
  tagline: 'Where Vintage Craftsmanship Meets Modern Luxury',
  aboutStory: 'Founded on the timeless traditions of classic gentleman grooming, The Classic Cut Salon delivers unmatched scissor craftsmanship, soothing hair therapy, and precision straight-razor beard styling in an ambiance of refined sophistication.',
  phone: '+91 93221 88848',
  whatsapp: '+919322188848',
  email: 'theclassiccutsalon01@gmail.com',
  address: 'At Gevrai jategaon road Rohithal, Tq gevrai dist beed 431127 Maharashtra',
  mapDirectionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=19.2528181,75.8555902',
  mapEmbedUrl: 'https://maps.google.com/maps?q=19.2528181,75.8555902&hl=en&z=15&output=embed',
  openingHours: {
    weekday: 'Tuesday to Friday: 9:30 AM - 9:00 PM',
    weekend: 'Saturday & Sunday: 8:30 AM - 10:00 PM',
    monday: 'CLOSED (Shop is closed on every Monday)',
  },
  heroVideoUrl: '/video/backgroundvideo.mp4',
  defaultOfferTitle: 'Luxury Grooming Offer Coupon',
  defaultOfferDiscount: '30% to 40% OFF',
};

// 1. Public: Get Active Site Configuration
export const getSiteConfig = async (req, res) => {
  try {
    let config = await SiteConfig.findOne();
    if (!config) {
      config = await SiteConfig.create(defaultCMS);
    }
    res.status(200).json(config);
  } catch (error) {
    // If MongoDB is offline/connecting, gracefully return defaults with 200 OK
    res.status(200).json(defaultCMS);
  }
};

// 2. Admin: Update Site Configuration
export const updateSiteConfig = async (req, res) => {
  try {
    let config = await SiteConfig.findOne();
    if (!config) {
      config = new SiteConfig();
    }

    if (req.body.mapEmbedUrl !== undefined) {
      const url = String(req.body.mapEmbedUrl).trim();
      if (url && !url.startsWith('https://')) {
        return res.status(400).json({ message: 'Map embed URL must use secure HTTPS protocol.' });
      }
    }

    if (req.body.heroVideoUrl !== undefined) {
      const url = String(req.body.heroVideoUrl).trim();
      if (url && !url.startsWith('/') && !url.startsWith('https://')) {
        return res.status(400).json({ message: 'Video URL must be a relative path or secure HTTPS URL.' });
      }
    }

    const fieldsToUpdate = [
      'salonName',
      'tagline',
      'aboutStory',
      'phone',
      'whatsapp',
      'email',
      'address',
      'mapEmbedUrl',
      'openingHours',
      'heroVideoUrl',
      'defaultOfferTitle',
      'defaultOfferDiscount',
    ];

    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        config[field] = req.body[field];
      }
    });

    const updatedConfig = await config.save();

    res.status(200).json({
      message: 'Site configuration updated successfully',
      config: updatedConfig,
    });
  } catch (error) {
    console.error('Update Site Config Error:', error);
    res.status(500).json({ message: 'Failed to update site configuration. ' + error.message });
  }
};
