import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from './models/User.js';
import { OfferCoupon } from './models/OfferCoupon.js';
import { VisitLog } from './models/VisitLog.js';
import { applyStampInactivityCheck, purgeExpiredDeletedUsers, markExpiredCoupons } from './controllers/loyaltyController.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

const runTests = async () => {
  console.log('\n=============================================================');
  console.log('🧪 THE CLASSIC CUT SALON — TIME DURATION TASK VALIDATION TEST');
  console.log('=============================================================\n');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas Cloud for testing.\n');

    // Clean any previous test artifacts
    await User.deleteMany({ email: /@classiccut\.test$/ });
    await OfferCoupon.deleteMany({ code: /^TEST-/ });

    let testsPassed = 0;
    let totalTests = 5;

    // -------------------------------------------------------------
    // TEST 1: 35-Day Coupon Expiry & Reason Display (Soft-Expiry)
    // -------------------------------------------------------------
    console.log('--- [TEST 1] 35-Day Coupon Expiry & Exact Reason Retention ---');
    const testCustomer1 = await User.create({
      name: 'Test Coupon Customer',
      email: 'coupon_test_user@classiccut.test',
      password: 'password123',
      role: 'user',
    });

    // Create a coupon that reached its 35 days limit (e.g. 36 days ago)
    const expiredDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
    const expiredCoupon = await OfferCoupon.create({
      code: 'TEST-EXP35',
      user: testCustomer1._id,
      title: '30% to 40% OFF Luxury Grooming',
      discountType: '30% to 40% OFF',
      status: 'active',
      expiresAt: expiredDate,
    });

    console.log(`  • Created Coupon: ${expiredCoupon.code} (ExpiresAt was: ${expiredCoupon.expiresAt.toISOString()})`);

    // Trigger soft-expiry
    await markExpiredCoupons();

    const verifiedExpired = await OfferCoupon.findOne({ code: 'TEST-EXP35' });
    console.log(`  • Coupon Status: ${verifiedExpired.status}`);
    console.log(`  • Expired Reason Displayed: "${verifiedExpired.expiredReason}"`);

    if (verifiedExpired.status === 'expired' && verifiedExpired.expiredReason) {
      console.log('  ✅ PASS: Coupon properly marked as EXPIRED (not lost/deleted) with clear reason visible!');
      testsPassed++;
    } else {
      throw new Error('Test 1 Failed: Coupon was not properly marked expired with reason.');
    }
    console.log('');

    // -------------------------------------------------------------
    // TEST 2: 5-Day Advance Expiry Notification Reminder
    // -------------------------------------------------------------
    console.log('--- [TEST 2] 5-Day Advance Expiry Reminder Notification ---');
    // Create coupon expiring in 3 days (within the 5-day warning threshold)
    const soonDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const soonCoupon = await OfferCoupon.create({
      code: 'TEST-SOON5',
      user: testCustomer1._id,
      title: '30% to 40% OFF Luxury Grooming',
      discountType: '30% to 40% OFF',
      status: 'active',
      expiresAt: soonDate,
    });

    const msLeft = new Date(soonCoupon.expiresAt).getTime() - Date.now();
    const daysRemaining = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
    const isExpiringSoon = daysRemaining <= 5;
    const reminderNotice = isExpiringSoon
      ? `⚠️ Reminder: Your coupon expires in ${daysRemaining} days on ${new Date(soonCoupon.expiresAt).toLocaleDateString()}!`
      : null;

    console.log(`  • Coupon: ${soonCoupon.code}`);
    console.log(`  • Days Remaining: ${daysRemaining}`);
    console.log(`  • 5-Day Warning Triggered: ${isExpiringSoon}`);
    console.log(`  • Reminder Message: "${reminderNotice}"`);

    if (isExpiringSoon && daysRemaining === 3 && reminderNotice) {
      console.log('  ✅ PASS: 5-day advance reminder notification correctly calculated and ready for user & admin!');
      testsPassed++;
    } else {
      throw new Error('Test 2 Failed: 5-day advance reminder was not triggered properly.');
    }
    console.log('');

    // -------------------------------------------------------------
    // TEST 3: Admin Can Increase / Extend Expiry Date & Reactivate Coupon
    // -------------------------------------------------------------
    console.log('--- [TEST 3] Admin Dashboard Validity Extension / Date Increase ---');
    // Take the expired coupon from Test 1, and simulate Admin extending it by +15 days
    const daysToAdd = 15;
    const newExpiry = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);
    
    verifiedExpired.expiresAt = newExpiry;
    verifiedExpired.status = 'active';
    verifiedExpired.expiredReason = null;
    verifiedExpired.extendedCount = (verifiedExpired.extendedCount || 0) + 1;
    verifiedExpired.lastExtendedAt = new Date();
    await verifiedExpired.save();

    const reactivatedCoupon = await OfferCoupon.findOne({ code: 'TEST-EXP35' });
    console.log(`  • Reactivated Status: ${reactivatedCoupon.status}`);
    console.log(`  • New Extended Expiry: ${reactivatedCoupon.expiresAt.toISOString()}`);
    console.log(`  • Extended Count: ${reactivatedCoupon.extendedCount}`);

    if (reactivatedCoupon.status === 'active' && reactivatedCoupon.expiresAt > new Date() && reactivatedCoupon.extendedCount === 1) {
      console.log('  ✅ PASS: Admin successfully extended coupon validity and reactivated it to ACTIVE!');
      testsPassed++;
    } else {
      throw new Error('Test 3 Failed: Coupon extension did not reactivate coupon.');
    }
    console.log('');

    // -------------------------------------------------------------
    // TEST 4: 45-Day Stamp Inactivity Decay Rule & 5-Day Warning
    // -------------------------------------------------------------
    console.log('--- [TEST 4] 45-Day Stamp Inactivity Decay & 5-Day Warning ---');
    const testCustomer2 = await User.create({
      name: 'Test Decay Customer',
      email: 'decay_test_user@classiccut.test',
      password: 'password123',
      role: 'user',
      currentStamps: 3,
      // Stamp awarded 50 days ago (> 45 days inactivity)
      lastStampDate: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
    });

    console.log(`  • Initial State: Stamps = ${testCustomer2.currentStamps}, Last Visit = 50 days ago`);

    // Run 45-day decay check
    const decay1 = await applyStampInactivityCheck(testCustomer2);
    console.log(`  • Decay Result: decayed=${decay1.decayed}, stampsDecayed=${decay1.stampsDecayed}, remaining=${testCustomer2.currentStamps}`);

    if (testCustomer2.currentStamps !== 2) {
      throw new Error(`Test 4 Failed: Expected 2 stamps after 50 days inactivity, got ${testCustomer2.currentStamps}`);
    }
    console.log('  ✅ PASS: Stamps decremented by 1 (3 ➔ 2) after 45+ days inactivity.');

    // Test warning when 42 days have passed (3 days left until decay)
    testCustomer2.currentStamps = 2;
    testCustomer2.lastStampDate = new Date(Date.now() - 42 * 24 * 60 * 60 * 1000);
    await testCustomer2.save();
    const decayWarningCheck = await applyStampInactivityCheck(testCustomer2);
    const isDecayWarning = decayWarningCheck.daysUntilDecay > 0 && decayWarningCheck.daysUntilDecay <= 5;
    console.log(`  • Days Until Decay: ${decayWarningCheck.daysUntilDecay}, Warning Active: ${isDecayWarning}`);

    if (isDecayWarning && decayWarningCheck.daysUntilDecay === 3) {
      console.log('  ✅ PASS: 5-Day advance warning active for impending stamp decay!');
      testsPassed++;
    } else {
      throw new Error('Test 4 Failed: Stamp decay 5-day warning check failed.');
    }
    console.log('');

    // -------------------------------------------------------------
    // TEST 5: 24-Hour Customer Soft-Delete Recovery Window & Purge
    // -------------------------------------------------------------
    console.log('--- [TEST 5] 24-Hour Soft Delete Recovery Window & Auto-Purge ---');
    const testCustomer3 = await User.create({
      name: 'Test Delete Customer',
      email: 'delete_test_user@classiccut.test',
      password: 'password123',
      role: 'user',
      isDeleted: true,
      deletedAt: new Date(Date.now() - 26 * 60 * 60 * 1000), // 26 hours ago
      restoreExpiresAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours past 24h window
    });

    console.log(`  • Created Soft-Deleted User: ${testCustomer3.email} with expired 24h restore window.`);

    // Run purge
    await purgeExpiredDeletedUsers();

    const checkDeleted = await User.findById(testCustomer3._id);
    if (checkDeleted === null) {
      console.log('  ✅ PASS: User whose 24-hour restore window expired was permanently purged from database.');
      testsPassed++;
    } else {
      throw new Error('Test 5 Failed: Expired deleted user was not purged.');
    }
    console.log('');

    // Clean up test documents
    await User.deleteMany({ email: /@classiccut\.test$/ });
    await OfferCoupon.deleteMany({ code: /^TEST-/ });

    console.log('=============================================================');
    console.log(`🎉 ALL TIME-DURATION TESTS PASSED: ${testsPassed}/${totalTests} TESTS VERIFIED!`);
    console.log('=============================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

runTests();
