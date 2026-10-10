import { User } from '../models/User.js';
import { SiteConfig } from '../models/SiteConfig.js';
import { Service } from '../models/Service.js';
import { OfferCoupon } from '../models/OfferCoupon.js';

export const seedInitialData = async () => {
  try {
    if (User.db.readyState !== 1) {
      console.log('ℹ️ MongoDB not connected yet. Seeder will run when database connection is established.');
      return;
    }
    // 1. Seed or initialize Super Admin User
    const targetAdminEmail = (process.env.ADMIN_EMAIL || 'theclassiccutsalon01@gmail.com').toLowerCase().trim();
    const targetAdminPassword = process.env.ADMIN_PASSWORD ? String(process.env.ADMIN_PASSWORD).trim() : '';
    let adminUser = await User.findOne({ email: targetAdminEmail });
    if (!adminUser) {
      if (!targetAdminPassword) {
        console.warn(`⚠️ [SEEDER] Super Admin account initialization skipped for ${targetAdminEmail}: ADMIN_PASSWORD environment variable is not defined.`);
      } else if (targetAdminPassword.length < 6) {
        console.warn(`⚠️ [SEEDER] Super Admin account initialization skipped for ${targetAdminEmail}: ADMIN_PASSWORD must be at least 6 characters.`);
      } else {
        console.log(`⚡ Initializing first Super Admin account: ${targetAdminEmail}...`);
        await User.create({
          name: 'Master Barber (Super Admin)',
          email: targetAdminEmail,
          phone: '+919322188848',
          password: targetAdminPassword,
          role: 'superadmin',
          isVerified: true,
        });
        console.log(`✅ Super Admin account initialized: ${targetAdminEmail}`);
      }
    } else {
      if (adminUser.role === 'superadmin') {
        console.log(`ℹ️ [SEEDER] Super Admin account already exists: ${targetAdminEmail}`);
      } else {
        console.warn(`⚠️ [SEEDER] Account with email ${targetAdminEmail} already exists with role '${adminUser.role}'. Automatic privilege promotion is disabled to prevent privilege escalation. Privileged roles must be assigned through authorized administration.`);
      }
    }

    // Ensure previous developer account ok8023361@gmail.com does not retain legacy superadmin role
    const previousAdmin = await User.findOne({ email: 'ok8023361@gmail.com' });
    if (previousAdmin && previousAdmin.role === 'superadmin') {
      previousAdmin.role = 'user';
      await previousAdmin.save();
      console.log('✅ Demoted ok8023361@gmail.com legacy superadmin role to regular customer user role');
    }

    // 2. Seed Site Config if none exists
    const configExists = await SiteConfig.findOne();
    if (!configExists) {
      console.log('⚡ Seeding Default Site CMS Configuration...');
      await SiteConfig.create({
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
        ownerName: 'Master Barber Alex Thorne',
        ownerTitle: 'Founder & Chief Barber',
        ownerBio: 'With over 15 years mastering British and Italian scissor sculpting and straight-razor artistry, Alex founded The Classic Cut Salon to bring authentic gentleman luxury and personalized grooming back to the modern man.',
        ownerImage: '',
        heroVideoUrl: '/video/salon-hero-video.mp4?v=20261010',
        defaultOfferTitle: 'Luxury Grooming Offer Coupon',
        defaultOfferDiscount: '25% to 50% OFF',
      });
      console.log('✅ Default Site CMS config seeded');
    } else {
      // Sync opening hours, video, and default discount in existing config if still set to old defaults
      let updated = false;
      if (!configExists.openingHours?.weekday?.includes('Tuesday')) {
        configExists.openingHours = {
          weekday: 'Tuesday to Friday: 9:30 AM - 9:00 PM',
          weekend: 'Saturday & Sunday: 8:30 AM - 10:00 PM',
          monday: 'CLOSED (Shop is closed on every Monday)',
        };
        updated = true;
      }
      if (!configExists.defaultOfferTitle || configExists.defaultOfferTitle.includes('Complimentary') || configExists.defaultOfferTitle.includes('Royal Haircut') || configExists.defaultOfferTitle.includes('Exclusive 5-Stamp')) {
        configExists.defaultOfferTitle = 'Luxury Grooming Offer Coupon';
        updated = true;
      }
      if (!configExists.email || configExists.email.includes('sraut7285')) {
        configExists.email = 'theclassiccutsalon01@gmail.com';
        updated = true;
      }
      if (!configExists.defaultOfferDiscount || configExists.defaultOfferDiscount.includes('100%') || configExists.defaultOfferDiscount.includes('30%') || configExists.defaultOfferDiscount.includes('30% - 40%')) {
        configExists.defaultOfferDiscount = '25% to 50% OFF';
        updated = true;
      }
      if (!configExists.heroVideoUrl || configExists.heroVideoUrl.includes('backgroundvideo.mp4') || configExists.heroVideoUrl.includes('video1.mp4')) {
        configExists.heroVideoUrl = '/video/salon-hero-video.mp4?v=20261010';
        updated = true;
      }
      if (updated) {
        await configExists.save();
        console.log('✅ Synchronized Site CMS config with updated email, hours, video, and offer');
      }

      // Also clean up any legacy coupons in database
      await OfferCoupon.updateMany(
        { $or: [{ title: /Complimentary/i }, { discountType: /100%/i }] },
        { $set: { title: 'Luxury Grooming Offer Coupon', discountType: '25% to 50% OFF' } }
      );
    }

    // 3. Seed Services if empty
    const servicesCount = await Service.countDocuments();
    if (servicesCount === 0) {
      console.log('⚡ Seeding luxury salon services...');
      const defaultServices = [
        {
          name: 'Signature Gentleman Scissor Cut',
          category: 'Hair Styling',
          price: 499,
          duration: '35 mins',
          description: 'Precision scissor consultation, personalized taper fade or classic gentleman parted cut, wash, and style.',
          popular: true,
        },
        {
          name: 'Royal Straight-Razor Shave & Hot Towel',
          category: 'Beard & Shave',
          price: 399,
          duration: '30 mins',
          description: 'Pre-shave essential oils, botanical warm lather, traditional Japanese feather razor cut, hot eucalyptus towel, and cold soothing compress.',
          popular: true,
        },
        {
          name: 'Master Beard Sculpt & Line Detailing',
          category: 'Beard & Shave',
          price: 299,
          duration: '25 mins',
          description: 'Precision trimmer gradation, razor cheek and neck line styling, finished with organic cedarwood beard oil.',
          popular: false,
        },
        {
          name: 'Revitalizing Deep Nourish Hair Spa',
          category: 'Spa & Therapy',
          price: 699,
          duration: '45 mins',
          description: 'Invigorating scalp acupressure massage, detoxifying clay cleanse, intensive keratin steam therapy, and rinse.',
          popular: true,
        },
        {
          name: 'The Classic Imperial Combo',
          category: 'Royal Combos',
          price: 999,
          duration: '75 mins',
          description: 'Signature haircut, beard sculpting, refreshing hair wash, express charcoal face detox, and styling finish.',
          popular: true,
        },
      ];
      await Service.insertMany(defaultServices);
      console.log('✅ Default Services seeded');
    }
  } catch (error) {
    console.error('Seeding Error:', error.message);
  }
};
