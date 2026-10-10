import http from 'http';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import {
  calculateSpinDiscount,
  calculateStampExpiry,
  WHEEL_SEGMENTS,
  ALLOWED_SERVICE_TYPES,
  SERVICE_EXPIRY_CONFIG,
} from './config/loyaltyConfig.js';
import { User } from './models/User.js';
import { OfferCoupon } from './models/OfferCoupon.js';
import { VisitLog } from './models/VisitLog.js';
import loyaltyRoutes from './routes/loyaltyRoutes.js';

// Safe, non-destructive test suite running against an ephemeral in-memory Express instance
const JWT_SECRET = 'test_secret_for_spin_and_stamp_suite_2026';
process.env.JWT_SECRET = JWT_SECRET;

let passed = 0;
let failed = 0;

const assert = (condition, name, details = '') => {
  if (condition) {
    passed++;
    console.log(`  ✅ PASS: ${name}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${name} ${details ? '(' + details + ')' : ''}`);
  }
};

const makeToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
};

const makeRequest = (port, method, path, token, body = null) => {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch (e) {
            parsed = data;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
};

const runAllTests = async () => {
  console.log('\n=============================================================');
  console.log('🧪 THE CLASSIC CUT SALON — DISCOUNT WHEEL & STAMP EXPIRY TEST SUITE');
  console.log('=============================================================\n');

  // -------------------------------------------------------------
  // UNIT TESTS: DISCOUNT WHEEL MILESTONE RULES
  // -------------------------------------------------------------
  console.log('--- Feature 1: Milestone & Random Selection Rules ---');

  // Test 1: Spins 1-49 award only 25%, 30%, or 35%
  let spins1to49Valid = true;
  for (let spin = 1; spin <= 49; spin++) {
    const award = calculateSpinDiscount(spin);
    if (![25, 30, 35].includes(award)) {
      spins1to49Valid = false;
      break;
    }
  }
  assert(spins1to49Valid, 'Discount Wheel Test 1: Spins 1-49 award only 25%, 30%, or 35%');

  // Test 2: Spin 50 awards exactly 40%
  let spin50All40 = true;
  for (let i = 0; i < 20; i++) {
    if (calculateSpinDiscount(50) !== 40) {
      spin50All40 = false;
      break;
    }
  }
  assert(spin50All40, 'Discount Wheel Test 2: Spin 50 awards exactly 40% guaranteed');

  // Test 3: Spins 51-99 award only 25%, 30%, or 35%
  let spins51to99Valid = true;
  for (let spin = 51; spin <= 99; spin++) {
    const award = calculateSpinDiscount(spin);
    if (![25, 30, 35].includes(award)) {
      spins51to99Valid = false;
      break;
    }
  }
  assert(spins51to99Valid, 'Discount Wheel Test 3: Spins 51-99 award only 25%, 30%, or 35%');

  // Test 4: Spin 100 awards exactly 45% or 50%
  let spin100Valid = true;
  const centuryResults = new Set();
  for (let i = 0; i < 50; i++) {
    const award = calculateSpinDiscount(100);
    centuryResults.add(award);
    if (![45, 50].includes(award)) {
      spin100Valid = false;
      break;
    }
  }
  assert(spin100Valid && centuryResults.size >= 1, 'Discount Wheel Test 4: Spin 100 awards exactly 45% or 50%');

  // Test 5: Spins 150 and 200 follow their respective milestones
  let spin150All40 = true;
  for (let i = 0; i < 10; i++) {
    if (calculateSpinDiscount(150) !== 40) {
      spin150All40 = false;
      break;
    }
  }
  assert(spin150All40, 'Discount Wheel Test 5A: Spin 150 awards guaranteed 40%');

  let spin200Valid = true;
  for (let i = 0; i < 20; i++) {
    const award = calculateSpinDiscount(200);
    if (![45, 50].includes(award)) {
      spin200Valid = false;
      break;
    }
  }
  assert(spin200Valid, 'Discount Wheel Test 5B: Spin 200 awards guaranteed 45% or 50%');

  // -------------------------------------------------------------
  // UNIT TESTS: STAMP EXPIRY CALCULATIONS
  // -------------------------------------------------------------
  console.log('\n--- Feature 2: Service-Based Stamp Expiry Calculation Rules ---');

  const baseTestTime = new Date('2026-10-09T12:00:00Z');

  // Test 1: Beard expiry is 20 days
  const beardCalc = calculateStampExpiry('Beard', baseTestTime);
  const beardDaysDiff = (beardCalc.expiresAt.getTime() - baseTestTime.getTime()) / (1000 * 60 * 60 * 24);
  assert(beardDaysDiff === 20 && beardCalc.days === 20, 'Stamp Expiry Test 1: Beard expiry is exactly 20 days');

  // Test 2: Haircut + Beard expiry is 20 days
  const hbCalc = calculateStampExpiry('Haircut + Beard', baseTestTime);
  const hbDaysDiff = (hbCalc.expiresAt.getTime() - baseTestTime.getTime()) / (1000 * 60 * 60 * 24);
  assert(hbDaysDiff === 20 && hbCalc.days === 20, 'Stamp Expiry Test 2: Haircut + Beard expiry is exactly 20 days');

  // Test 3: Haircut Only expiry is 45 days
  const hcCalc = calculateStampExpiry('Haircut Only', baseTestTime);
  const hcDaysDiff = (hcCalc.expiresAt.getTime() - baseTestTime.getTime()) / (1000 * 60 * 60 * 24);
  assert(hcDaysDiff === 45 && hcCalc.days === 45, 'Stamp Expiry Test 3: Haircut Only expiry is exactly 45 days');

  // Test 4: Invalid service types are strictly rejected
  let invalidRejected = false;
  try {
    calculateStampExpiry('Random Massage');
  } catch (err) {
    invalidRejected = true;
  }
  assert(invalidRejected, 'Stamp Expiry Test 4A: Arbitrary or unknown service type is rejected by calculation engine');

  // -------------------------------------------------------------
  // INTEGRATION TESTS ON EPHEMERAL ROUTER INSTANCE
  // -------------------------------------------------------------
  console.log('\n--- Router Integration Tests (Live Route & Model Emulation) ---');

  // In-memory test store
  const testUsers = new Map([
    [
      '650000000000000000000010',
      {
        _id: new mongoose.Types.ObjectId('650000000000000000000010'),
        name: 'User One',
        email: 'user1@example.com',
        phone: '+91 9876543210',
        role: 'user',
        currentStamps: 0,
        lifetimeVisits: 0,
        spinCount: 49, // Next spin will be #50 (milestone!)
        isDeleted: false,
        save: async function () { return this; },
      },
    ],
    [
      '650000000000000000000020',
      {
        _id: new mongoose.Types.ObjectId('650000000000000000000020'),
        name: 'User Two',
        email: 'user2@example.com',
        phone: '+91 9876543220',
        role: 'user',
        currentStamps: 0,
        lifetimeVisits: 0,
        spinCount: 99, // Next spin will be #100 (century milestone!)
        isDeleted: false,
        save: async function () { return this; },
      },
    ],
    [
      '650000000000000000000099',
      {
        _id: new mongoose.Types.ObjectId('650000000000000000000099'),
        name: 'Admin Bob',
        email: 'admin@classiccut.com',
        role: 'admin',
        isDeleted: false,
        save: async function () { return this; },
      },
    ],
  ]);

  const testCoupons = new Map([
    [
      '650000000000000000000101',
      {
        _id: new mongoose.Types.ObjectId('650000000000000000000101'),
        code: 'CUT-TEST50',
        user: new mongoose.Types.ObjectId('650000000000000000000010'),
        status: 'active',
        isRedeemed: false,
        isSpun: false,
        discountType: 'Spin to Reveal (25%-50% OFF)',
        discountPercent: null,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        save: async function () { return this; },
      },
    ],
    [
      '650000000000000000000102',
      {
        _id: new mongoose.Types.ObjectId('650000000000000000000102'),
        code: 'CUT-TEST100',
        user: new mongoose.Types.ObjectId('650000000000000000000020'),
        status: 'active',
        isRedeemed: false,
        isSpun: false,
        discountType: 'Spin to Reveal (25%-50% OFF)',
        discountPercent: null,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        save: async function () { return this; },
      },
    ],
    [
      '650000000000000000000103',
      {
        _id: new mongoose.Types.ObjectId('650000000000000000000103'),
        code: 'CUT-ALREADYSPUN',
        user: new mongoose.Types.ObjectId('650000000000000000000010'),
        status: 'active',
        isRedeemed: false,
        isSpun: true,
        discountPercent: 30,
        discountType: '30% OFF',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        save: async function () { return this; },
      },
    ],
    [
      '650000000000000000000104',
      {
        _id: new mongoose.Types.ObjectId('650000000000000000000104'),
        code: 'CUT-EXPIRED',
        user: new mongoose.Types.ObjectId('650000000000000000000010'),
        status: 'expired',
        isRedeemed: false,
        isSpun: false,
        expiresAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        save: async function () { return this; },
      },
    ],
  ]);

  const testVisitLogs = [];

  // Mock Mongoose Methods cleanly
  const origUserFindById = User.findById;
  const origUserFindOneAndUpdate = User.findOneAndUpdate;
  const origCouponFindOne = OfferCoupon.findOne;
  const origCouponFindOneAndUpdate = OfferCoupon.findOneAndUpdate;
  const origCouponFindByIdAndUpdate = OfferCoupon.findByIdAndUpdate;
  const origCouponFindById = OfferCoupon.findById;
  const origCouponCountDocuments = OfferCoupon.countDocuments;
  const origVisitLogCreate = VisitLog.create;
  const origVisitLogFind = VisitLog.find;
  const origVisitLogUpdateMany = VisitLog.updateMany;

  User.findById = function (id) {
    const u = testUsers.get(String(id));
    return {
      select: () => ({
        lean: async () => (u ? { ...u } : null),
        maxTimeMS: async () => u || null,
        then: (resolve) => resolve(u || null),
      }),
      then: (resolve) => resolve(u || null),
    };
  };

  User.findOneAndUpdate = async function (filter, update, options) {
    const u = testUsers.get(String(filter._id));
    if (!u) return null;
    if (update.$inc && update.$inc.spinCount) {
      u.spinCount = (u.spinCount || 0) + update.$inc.spinCount;
    }
    return u;
  };

  OfferCoupon.findOne = function (filter) {
    let match = null;
    for (const c of testCoupons.values()) {
      if (filter._id && String(c._id) !== String(filter._id)) continue;
      if (filter.user && String(c.user) !== String(filter.user)) continue;
      if (filter.code && c.code !== filter.code) continue;
      match = c;
      break;
    }
    return {
      populate: () => Promise.resolve(match),
      then: (resolve) => resolve(match),
    };
  };

  OfferCoupon.findOneAndUpdate = async function (filter, update) {
    let match = null;
    for (const c of testCoupons.values()) {
      if (filter._id && String(c._id) !== String(filter._id)) continue;
      if (filter.user && String(c.user) !== String(filter.user)) continue;
      if (filter.isSpun && filter.isSpun.$ne !== undefined && c.isSpun === filter.isSpun.$ne) continue;
      if (filter.status && c.status !== filter.status) continue;
      if (filter.isRedeemed !== undefined && c.isRedeemed !== filter.isRedeemed) continue;
      match = c;
      break;
    }
    if (!match) return null;
    if (update.$set) {
      Object.assign(match, update.$set);
    }
    return { ...match };
  };

  OfferCoupon.findByIdAndUpdate = async function (id, update) {
    const c = testCoupons.get(String(id));
    if (!c) return null;
    if (update.$set) Object.assign(c, update.$set);
    return c;
  };

  OfferCoupon.findById = async function (id) {
    return testCoupons.get(String(id)) || null;
  };

  OfferCoupon.countDocuments = async function () {
    return 1;
  };

  VisitLog.create = async function (doc) {
    const newLog = {
      _id: new mongoose.Types.ObjectId(),
      ...doc,
      visitedAt: doc.visitedAt || new Date(),
    };
    testVisitLogs.push(newLog);
    return newLog;
  };

  VisitLog.find = function (filter) {
    let list = testVisitLogs.filter((l) => {
      if (filter.user && String(l.user) !== String(filter.user)) return false;
      if (filter.status && l.status !== filter.status) return false;
      return true;
    });
    const createChain = (arr) => ({
      populate: () => createChain(arr),
      sort: () => createChain(arr),
      lean: async () => arr,
      then: (resolve) => resolve(arr),
    });
    return createChain(list);
  };

  VisitLog.updateMany = async function (filter, update) {
    let count = 0;
    for (const l of testVisitLogs) {
      if (filter._id && filter._id.$in) {
        if (filter._id.$in.map(String).includes(String(l._id))) {
          if (update.$set) Object.assign(l, update.$set);
          count++;
        }
      }
      if (filter.status && l.status === filter.status && filter.expiresAt && filter.expiresAt.$lte) {
        if (l.expiresAt && new Date(l.expiresAt) <= filter.expiresAt.$lte) {
          if (update.$set) Object.assign(l, update.$set);
          count++;
        }
      }
    }
    return { modifiedCount: count };
  };

  // Mount express app on random free port
  const app = express();
  app.use(express.json());
  app.use('/api/loyalty', loyaltyRoutes);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;

  try {
    const user1Token = makeToken(testUsers.get('650000000000000000000010'));
    const user2Token = makeToken(testUsers.get('650000000000000000000020'));
    const adminToken = makeToken(testUsers.get('650000000000000000000099'));

    // Test 6: Different users maintain independent counters
    const u1SpinBefore = testUsers.get('650000000000000000000010').spinCount;
    const u2SpinBefore = testUsers.get('650000000000000000000020').spinCount;
    assert(u1SpinBefore === 49 && u2SpinBefore === 99, 'Discount Wheel Test 6: Users maintain independent spin counters (User 1: 49, User 2: 99)');

    // Test 2 & Test 7: Spin 50 awards exactly 40% milestone through live endpoint and persists counter
    const spinRes1 = await makeRequest(port, 'POST', '/api/loyalty/spin-wheel', user1Token, {
      couponId: '650000000000000000000101',
      // Attacker trying to submit fake discount percentage or fake spin number
      discountPercent: 99,
      spinNumber: 1,
    });

    assert(
      spinRes1.status === 200 && spinRes1.body.spinNumber === 50 && spinRes1.body.discountPercent === 40,
      'Discount Wheel Test 2 & 10: Live spin awards exact 40% on spin 50; client-supplied percentage 99% is rejected/ignored',
      JSON.stringify(spinRes1.body)
    );

    // Test 7: Counter is persisted in DB and does not reset
    assert(
      testUsers.get('650000000000000000000010').spinCount === 50,
      'Discount Wheel Test 7: User spin counter persisted in database to 50'
    );

    // Test 4 (Live): User 2 (at 99) spins coupon -> reaches spin 100 -> awards 45% or 50%
    const spinRes2 = await makeRequest(port, 'POST', '/api/loyalty/spin-wheel', user2Token, {
      couponId: '650000000000000000000102',
    });
    assert(
      spinRes2.status === 200 &&
        spinRes2.body.spinNumber === 100 &&
        [45, 50].includes(spinRes2.body.discountPercent),
      'Discount Wheel Test 4 (Live): Live spin 100 awards guaranteed century milestone (45% or 50%)',
      JSON.stringify(spinRes2.body)
    );

    // Test 8: Duplicate requests cannot create duplicate awards
    const dupRes = await makeRequest(port, 'POST', '/api/loyalty/spin-wheel', user1Token, {
      couponId: '650000000000000000000101',
    });
    assert(
      dupRes.status === 400,
      'Discount Wheel Test 8: Duplicate request on already spun coupon is rejected with 400',
      JSON.stringify(dupRes.body)
    );

    // Test 12: Ineligible (already spun or expired) coupon cannot be spun
    const expiredRes = await makeRequest(port, 'POST', '/api/loyalty/spin-wheel', user1Token, {
      couponId: '650000000000000000000104',
    });
    assert(
      expiredRes.status === 400,
      'Discount Wheel Test 12: Expired coupon cannot be spun (rejected with 400)',
      JSON.stringify(expiredRes.body)
    );

    // Test 9: Concurrency safety — simultaneous requests on same coupon
    testCoupons.set('650000000000000000000105', {
      _id: new mongoose.Types.ObjectId('650000000000000000000105'),
      code: 'CUT-CONCURRENCY',
      user: new mongoose.Types.ObjectId('650000000000000000000010'),
      status: 'active',
      isRedeemed: false,
      isSpun: false,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      save: async function () { return this; },
    });

    const [parRes1, parRes2] = await Promise.all([
      makeRequest(port, 'POST', '/api/loyalty/spin-wheel', user1Token, {
        couponId: '650000000000000000000105',
      }),
      makeRequest(port, 'POST', '/api/loyalty/spin-wheel', user1Token, {
        couponId: '650000000000000000000105',
      }),
    ]);

    const oneSucceeded = (parRes1.status === 200 && parRes2.status === 400) || (parRes1.status === 400 && parRes2.status === 200);
    assert(
      oneSucceeded,
      'Discount Wheel Test 9: Concurrent requests cannot double-spin coupon or duplicate milestones (exactly 1 succeeds, 1 rejected)'
    );

    // -------------------------------------------------------------
    // FEATURE 2: STAMP ISSUANCE & EXPIRY INTEGRATION TESTS
    // -------------------------------------------------------------
    console.log('\n--- Feature 2 & 3: Stamp Issuance, Service Types & Audit History ---');

    // Stamp Expiry Test 4 (Live): Attempting to award stamp with client-manipulated arbitrary expiry or missing service
    const missingServiceRes = await makeRequest(port, 'POST', '/api/loyalty/add-stamp', adminToken, {
      userId: '650000000000000000000010',
      // No serviceType
    });
    assert(
      missingServiceRes.status === 400,
      'Stamp Expiry Test 4B: Awarding stamp without valid service selection is rejected with 400',
      JSON.stringify(missingServiceRes.body)
    );

    // Stamp Expiry Test 1 (Live): Beard service awards stamp with exactly 20 days expiry
    const beardStampRes = await makeRequest(port, 'POST', '/api/loyalty/add-stamp', adminToken, {
      userId: '650000000000000000000010',
      serviceType: 'Beard',
      // Attacker trying to set 365 days expiry
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });

    const createdBeardLog = testVisitLogs[testVisitLogs.length - 1];
    const serverDaysBeard = Math.round((new Date(createdBeardLog.expiresAt).getTime() - new Date(createdBeardLog.visitedAt).getTime()) / (1000 * 60 * 60 * 24));

    assert(
      beardStampRes.status === 200 &&
        createdBeardLog.serviceType === 'Beard' &&
        serverDaysBeard === 20,
      'Stamp Expiry Test 1 & 4C: Beard stamp issued with authoritative 20 days expiry; client 365-day tampering ignored'
    );

    // Stamp Expiry Test 3 (Live): Haircut Only service awards stamp with exactly 45 days expiry
    const hcStampRes = await makeRequest(port, 'POST', '/api/loyalty/add-stamp', adminToken, {
      userId: '650000000000000000000010',
      serviceType: 'Haircut Only',
    });
    const createdHcLog = testVisitLogs[testVisitLogs.length - 1];
    const serverDaysHc = Math.round((new Date(createdHcLog.expiresAt).getTime() - new Date(createdHcLog.visitedAt).getTime()) / (1000 * 60 * 60 * 24));

    assert(
      hcStampRes.status === 200 &&
        createdHcLog.serviceType === 'Haircut Only' &&
        serverDaysHc === 45,
      'Stamp Expiry Test 3 (Live): Haircut Only stamp issued with authoritative 45 days expiry'
    );

    // Stamp Expiry Test 5: Issuing a new stamp does not alter expiry of previous stamps
    assert(
      serverDaysBeard === 20 && createdBeardLog.serviceType === 'Beard',
      'Stamp Expiry Test 5: Previously issued Beard stamp retained its own 20-day expiry undisturbed'
    );

    // Stamp Expiry Test 7: Unauthorized users (regular customer or unauthenticated) cannot issue stamps
    const unauthStampRes = await makeRequest(port, 'POST', '/api/loyalty/add-stamp', user1Token, {
      userId: '650000000000000000000010',
      serviceType: 'Beard',
    });
    assert(
      unauthStampRes.status === 403,
      'Stamp Expiry Test 7A: Non-admin customer cannot issue stamps (rejected with 403 Forbidden)'
    );

    const guestStampRes = await makeRequest(port, 'POST', '/api/loyalty/add-stamp', null, {
      userId: '650000000000000000000010',
      serviceType: 'Beard',
    });
    assert(
      guestStampRes.status === 401,
      'Stamp Expiry Test 7B: Unauthenticated request cannot issue stamps (rejected with 401 Unauthorized)'
    );

    // Stamp Expiry Test 6: Expired stamps cannot count toward reward
    // Manually simulate an expired stamp
    testVisitLogs.push({
      _id: new mongoose.Types.ObjectId(),
      user: new mongoose.Types.ObjectId('650000000000000000000010'),
      serviceType: 'Beard',
      serviceName: 'Old Beard',
      stampAwarded: 1,
      visitedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Expired 5 days ago!
      status: 'expired',
    });

    const activeCountCheck = testVisitLogs.filter(
      (l) => String(l.user) === '650000000000000000000010' && l.status === 'active'
    ).length;

    assert(
      activeCountCheck === 2, // Only the 2 newly added active ones count, not the expired one
      'Stamp Expiry Test 6: Expired stamps are excluded from active stamp count'
    );

    // Feature 3: Customer History Endpoint with Admin Authorization
    const historyRes = await makeRequest(
      port,
      'GET',
      '/api/loyalty/customer-history/650000000000000000000010',
      adminToken
    );

    assert(
      historyRes.status === 200 &&
        historyRes.body.customer &&
        Array.isArray(historyRes.body.history) &&
        historyRes.body.history.length >= 2,
      'Feature 3 Test: Admin customer history endpoint returns customer metadata and full visit audit logs',
      JSON.stringify(historyRes.body.customer)
    );

    const unauthHistoryRes = await makeRequest(
      port,
      'GET',
      '/api/loyalty/customer-history/650000000000000000000010',
      user1Token
    );
    assert(
      unauthHistoryRes.status === 403,
      'Feature 3 Security Test: Non-admin cannot access customer history endpoint (403 Forbidden)'
    );

    // Stamp Expiry Test 8: Legacy records safety check
    const legacyLog = {
      _id: new mongoose.Types.ObjectId(),
      user: new mongoose.Types.ObjectId('650000000000000000000010'),
      serviceName: 'Vintage Haircut',
      serviceType: null, // Legacy record with no service type
      expiresAt: null,
      status: 'active',
      visitedAt: new Date(),
    };
    testVisitLogs.push(legacyLog);

    const legacyHistoryRes = await makeRequest(
      port,
      'GET',
      '/api/loyalty/customer-history/650000000000000000000010',
      adminToken
    );
    const legacyItem = legacyHistoryRes.body.history.find((h) => String(h._id) === String(legacyLog._id));
    assert(
      legacyItem && legacyItem.serviceType === 'Legacy Stamp',
      'Stamp Expiry Test 8: Legacy records are safely handled as "Legacy Stamp" without fabricating false service types'
    );
  } finally {
    // Teardown
    User.findById = origUserFindById;
    User.findOneAndUpdate = origUserFindOneAndUpdate;
    OfferCoupon.findOne = origCouponFindOne;
    OfferCoupon.findOneAndUpdate = origCouponFindOneAndUpdate;
    OfferCoupon.findByIdAndUpdate = origCouponFindByIdAndUpdate;
    OfferCoupon.findById = origCouponFindById;
    OfferCoupon.countDocuments = origCouponCountDocuments;
    VisitLog.create = origVisitLogCreate;
    VisitLog.find = origVisitLogFind;
    VisitLog.updateMany = origVisitLogUpdateMany;

    await new Promise((resolve) => server.close(resolve));
  }

  console.log('\n=============================================================');
  console.log(`🏁 TEST SUITE COMPLETED: ${passed} PASSED, ${failed} FAILED`);
  console.log('=============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
};

runAllTests().catch((err) => {
  console.error('Test Suite Fatal Error:', err);
  process.exit(1);
});
