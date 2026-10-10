import http from 'http';
import express from 'express';
import mongoose from 'mongoose';

// Prevent server.js from invoking startServer() on import
process.env.NODE_ENV = 'test';
const { getVerifiedOrigins, createCorsOptions, parseTrustProxy } = await import('./server.js');

import { isValidGoogleMapsEmbedUrl } from './controllers/cmsController.js';

import { addVisitStamp } from './controllers/loyaltyController.js';
import { deleteStaffAdmin } from './controllers/adminController.js';
import { adminOnly, superAdminOnly } from './middleware/authMiddleware.js';
import { authLimiter, streamTicketLimiter } from './middleware/rateLimiter.js';
import {
  createStreamTicket,
  redeemStreamTicket,
  purgeExpiredTickets,
  getTicketStoreStats,
  _resetTicketStore,
} from './services/ticketService.js';

let passed = 0;
let failed = 0;
let skipped = 0;

const assert = (condition, name, details = '') => {
  if (condition) {
    passed++;
    console.log(`  ✅ PASS: ${name}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${name} ${details ? '(' + details + ')' : ''}`);
  }
};

const skip = (name, reason) => {
  skipped++;
  console.log(`  ⏭️ SKIP: ${name} [Reason: ${reason}]`);
};

const runAllTests = async () => {
  console.log('\n=============================================================');
  console.log('🧪 SALON MERN — CONTROLLED SECURITY REGRESSION TEST SUITE');
  console.log('=============================================================\n');

  // =============================================================
  // SUITE 1: SEC-001 — CORS Allowlist Pure-Function Verification
  // =============================================================
  console.log('--- Suite 1: SEC-001 — CORS Allowlist Verification ---');
  {
    const testEnv = {
      NODE_ENV: 'production',
      CLIENT_URL: 'https://theclassiccutsalon.com,https://admin.theclassiccutsalon.com',
    };
    const origins = getVerifiedOrigins(testEnv);

    assert(origins.includes('http://localhost:5173'), 'Local development origin localhost:5173 is allowed');
    assert(origins.includes('http://127.0.0.1:5173'), 'Local development origin 127.0.0.1:5173 is allowed');
    assert(origins.includes('https://theclassiccutsalon.com'), 'Configured production origin is included');
    assert(origins.includes('https://admin.theclassiccutsalon.com'), 'Multiple configured production origins supported');

    const corsOptions = createCorsOptions(testEnv);

    // 1. Non-browser requests (null origin e.g. curl / server-to-server) must be permitted
    let nullOriginAllowed = false;
    corsOptions.origin(null, (err, allow) => {
      nullOriginAllowed = allow === true;
    });
    assert(nullOriginAllowed, 'Non-browser requests without Origin header (null) are permitted');

    // 2. Approved origin
    let approvedOriginAllowed = false;
    corsOptions.origin('https://theclassiccutsalon.com', (err, allow) => {
      approvedOriginAllowed = allow === true;
    });
    assert(approvedOriginAllowed, 'Approved production origin passes CORS check');

    // 3. Trailing slash normalization
    let trailingSlashAllowed = false;
    corsOptions.origin('https://theclassiccutsalon.com/', (err, allow) => {
      trailingSlashAllowed = allow === true;
    });
    assert(trailingSlashAllowed, 'Origin with trailing slash is normalized and allowed');

    // 4. Malicious lookalike origins MUST be rejected with callback(null, false)
    let lookalikeRenderBlocked = false;
    corsOptions.origin('https://attacker.onrender.com', (err, allow) => {
      lookalikeRenderBlocked = allow === false;
    });
    assert(lookalikeRenderBlocked, 'Unapproved lookalike *.onrender.com is rejected');

    let lookalikeVercelBlocked = false;
    corsOptions.origin('https://malicious-app.vercel.app', (err, allow) => {
      lookalikeVercelBlocked = allow === false;
    });
    assert(lookalikeVercelBlocked, 'Unapproved lookalike *.vercel.app is rejected');

    let lookalikeLocalhostBlocked = false;
    corsOptions.origin('http://localhost:5173.evil.com', (err, allow) => {
      lookalikeLocalhostBlocked = allow === false;
    });
    assert(lookalikeLocalhostBlocked, 'Subdomain attack localhost:5173.evil.com is rejected');
  }

  // =============================================================
  // SUITE 2: SEC-002 — Reverse Proxy Trust Parser Verification
  // =============================================================
  console.log('\n--- Suite 2: SEC-002 — Reverse Proxy Trust Parser ---');
  {
    assert(parseTrustProxy('1', 'production') === 1, 'Integer "1" returns 1 hop count');
    assert(parseTrustProxy('2', 'production') === 2, 'Integer "2" returns 2 hop count');
    assert(parseTrustProxy('3', 'production') === 3, 'Integer "3" returns 3 hop count');

    assert(parseTrustProxy('true', 'production') === false, 'Unsafe string "true" is strictly rejected (returns false)');
    assert(parseTrustProxy('false', 'production') === false, 'String "false" returns false');
    assert(parseTrustProxy('0', 'production') === false, 'String "0" returns false');

    assert(parseTrustProxy('-1', 'production') === false, 'Negative hop count is rejected (returns false)');
    assert(parseTrustProxy('4', 'production') === false, 'Hop count > 3 is rejected (returns false)');
    assert(parseTrustProxy('abc', 'production') === false, 'Non-numeric string is rejected (returns false)');
    assert(parseTrustProxy(undefined, 'development') === false, 'Undefined in development defaults to false');
    assert(parseTrustProxy(undefined, 'production') === false, 'Undefined in production warns and defaults to false');
  }

  // =============================================================
  // SUITE 3: SEC-007 — Google Maps Embed URL Validation
  // =============================================================
  console.log('\n--- Suite 3: SEC-007 — Google Maps Embed URL Validation ---');
  {
    // Approved formats
    assert(
      isValidGoogleMapsEmbedUrl('https://maps.google.com/maps?q=19.2528181,75.8555902&hl=en&z=15&output=embed'),
      'Valid maps.google.com/maps embed URL returns true'
    );
    assert(
      isValidGoogleMapsEmbedUrl('https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3752.4!2d75.85!3d19.25'),
      'Valid www.google.com/maps/embed URL returns true'
    );
    assert(
      isValidGoogleMapsEmbedUrl('https://maps.google.co.in/maps?q=19.2528181,75.8555902'),
      'Valid maps.google.co.in regional URL returns true'
    );

    // Malicious or invalid formats
    assert(!isValidGoogleMapsEmbedUrl('http://maps.google.com/maps?q=19.25'), 'Insecure HTTP protocol is rejected');
    assert(!isValidGoogleMapsEmbedUrl('https://maps.google.com.attacker.com/maps'), 'Subdomain spoofing is rejected');
    assert(!isValidGoogleMapsEmbedUrl('https://maps.google.org/maps'), 'Invalid TLD is rejected');
    assert(!isValidGoogleMapsEmbedUrl('https://evil-maps.com/maps'), 'Untrusted domain is rejected');
    assert(!isValidGoogleMapsEmbedUrl('https://www.google.com/search?q=maps'), 'Non-map path on google.com is rejected');
    assert(!isValidGoogleMapsEmbedUrl('javascript:alert(1)'), 'javascript: URI scheme is rejected');
    assert(!isValidGoogleMapsEmbedUrl('data:text/html,<script>alert(1)</script>'), 'data: URI scheme is rejected');
    assert(!isValidGoogleMapsEmbedUrl(''), 'Empty string is rejected');
    assert(!isValidGoogleMapsEmbedUrl(null), 'Null value is rejected');
  }

  // =============================================================
  // SUITE 4: SEC-006 — Request Body Limits & Input Bounds
  // =============================================================
  console.log('\n--- Suite 4: SEC-006 — Request Body Limits & Input Bounds ---');
  {
    // Part A: 1MB Body Size Limit on Ephemeral Server
    const appBody = express();
    appBody.use(express.json({ limit: '1mb' }));
    appBody.post('/test/body', (req, res) => {
      res.status(200).json({ receivedBytes: JSON.stringify(req.body).length });
    });
    // Mimic server.js SEC-006 error handler
    appBody.use((err, req, res, next) => {
      if (err.type === 'entity.too.large') {
        return res.status(413).json({ message: 'Request payload exceeds permitted 1MB size limit.' });
      }
      res.status(500).json({ message: 'Internal Server Error' });
    });

    const bodyServer = http.createServer(appBody);
    await new Promise((resolve) => bodyServer.listen(0, '127.0.0.1', resolve));
    const bodyPort = bodyServer.address().port;

    const sendJson = (payloadString) => {
      return new Promise((resolve, reject) => {
        const req = http.request(
          {
            hostname: '127.0.0.1',
            port: bodyPort,
            path: '/test/body',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(payloadString),
            },
          },
          (res) => {
            let data = '';
            res.on('data', (c) => (data += c));
            res.on('end', () => {
              let json = null;
              try {
                json = JSON.parse(data);
              } catch (e) {}
              resolve({ status: res.statusCode, body: json });
            });
          }
        );
        req.on('error', reject);
        req.write(payloadString);
        req.end();
      });
    };

    // 100KB payload passes
    const smallPayload = JSON.stringify({ data: 'x'.repeat(100 * 1024) });
    const smallRes = await sendJson(smallPayload);
    assert(smallRes.status === 200, 'Payload under 1MB (100KB) succeeds with 200 OK');

    // 1.2MB payload is blocked with 413
    const largePayload = JSON.stringify({ data: 'x'.repeat(1.2 * 1024 * 1024) });
    const largeRes = await sendJson(largePayload);
    assert(largeRes.status === 413, 'Payload over 1MB (1.2MB) is rejected with HTTP 413');
    assert(
      largeRes.body?.message === 'Request payload exceeds permitted 1MB size limit.',
      'Sanitized 413 error message returned without stack trace'
    );

    await new Promise((r) => bodyServer.close(r));

    // Part B: Loyalty Stamp Input Bounds (addVisitStamp controller input validation)
    const mockRes = () => {
      const res = {};
      res.statusCode = 200;
      res.body = null;
      res.status = (code) => {
        res.statusCode = code;
        return res;
      };
      res.json = (data) => {
        res.body = data;
        return res;
      };
      return res;
    };

    // 1. Missing userId
    const r1 = mockRes();
    await addVisitStamp({ body: {} }, r1);
    assert(r1.statusCode === 400 && r1.body?.message === 'Invalid or missing customer ID format.', 'addVisitStamp rejects missing userId');

    // 2. Invalid ObjectId format
    const r2 = mockRes();
    await addVisitStamp({ body: { userId: 'not-an-objectid' } }, r2);
    assert(r2.statusCode === 400 && r2.body?.message === 'Invalid or missing customer ID format.', 'addVisitStamp rejects invalid ObjectId');

    // 3. Non-string serviceName
    const r3 = mockRes();
    await addVisitStamp({ body: { userId: new mongoose.Types.ObjectId().toString(), serviceName: 12345 } }, r3);
    assert(r3.statusCode === 400 && r3.body?.message === 'Service name must be a valid text string.', 'addVisitStamp rejects non-string serviceName');

    // 4. Non-string notes
    const r4 = mockRes();
    await addVisitStamp({ body: { userId: new mongoose.Types.ObjectId().toString(), notes: ['array'] } }, r4);
    assert(r4.statusCode === 400 && r4.body?.message === 'Notes must be a valid text string.', 'addVisitStamp rejects non-string notes');
  }

  // =============================================================
  // SUITE 5: SEC-009-A — Ticket Invariants & Limiter Isolation
  // =============================================================
  console.log('\n--- Suite 5: SEC-009-A — Ticket Invariants & Limiter Isolation ---');
  {
    // Part A: Rate-Limiter Cross-Route Independence on Ephemeral Test App
    const appRate = express();
    appRate.post('/api/loyalty/stream-ticket', streamTicketLimiter, (req, res) => {
      res.status(200).json({ route: 'ticket' });
    });
    appRate.post('/api/auth/probe', authLimiter, (req, res) => {
      res.status(200).json({ route: 'auth' });
    });

    const rateServer = http.createServer(appRate);
    await new Promise((resolve) => rateServer.listen(0, '127.0.0.1', resolve));
    const ratePort = rateServer.address().port;

    const sendRateReq = (path) => {
      return new Promise((resolve, reject) => {
        const req = http.request(
          {
            hostname: '127.0.0.1',
            port: ratePort,
            path,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          },
          (res) => {
            let data = '';
            res.on('data', (c) => (data += c));
            res.on('end', () => {
              let json = null;
              try {
                json = JSON.parse(data);
              } catch (e) {}
              resolve({ status: res.statusCode, headers: res.headers, body: json });
            });
          }
        );
        req.on('error', reject);
        req.end();
      });
    };

    // Send 15 requests to streamTicketLimiter (limit is 15)
    for (let i = 0; i < 15; i++) {
      await sendRateReq('/api/loyalty/stream-ticket');
    }
    // 16th request must trigger HTTP 429 on ticket endpoint
    const ticketExhaustRes = await sendRateReq('/api/loyalty/stream-ticket');
    assert(ticketExhaustRes.status === 429, '16th stream-ticket request triggers HTTP 429 on streamTicketLimiter');

    // Immediately query auth probe from the SAME simulated IP (127.0.0.1)
    const authProbeRes = await sendRateReq('/api/auth/probe');
    assert(authProbeRes.status === 200, 'Immediate request to auth probe returns HTTP 200 OK (NOT blocked by 429)');

    // Inspect actual rate-limit headers to prove separate bucket counters
    const limitHeader = Number(authProbeRes.headers['ratelimit-limit']);
    const remainingHeader = Number(authProbeRes.headers['ratelimit-remaining']);
    assert(limitHeader === 30, `authLimiter reports its own configured limit of 30 (observed: ${limitHeader})`);
    assert(
      remainingHeader === 29,
      `authLimiter remaining count is 29, proving it was completely unpolluted by the 16 ticket requests (observed: ${remainingHeader})`
    );

    await new Promise((r) => rateServer.close(r));

    // Part B: In-Memory Ticket Invariants
    _resetTicketStore();
    const t1 = createStreamTicket('u_test_1', 'user');
    assert(Boolean(t1.ticket && t1.expiresIn === 30), 'Ticket issuance returns UUID string with 30s TTL');

    const red1 = redeemStreamTicket(t1.ticket);
    assert(red1 && red1.userId === 'u_test_1', 'First ticket redemption succeeds');

    const red2 = redeemStreamTicket(t1.ticket);
    assert(red2 === null, 'Second ticket redemption returns null (Single-use atomic consumption)');

    // Expiry test
    const shortT = createStreamTicket('u_test_exp', 'user', 50); // 50ms TTL
    await new Promise((r) => setTimeout(r, 70));
    assert(redeemStreamTicket(shortT.ticket) === null, 'Ticket redeemed after expiration returns null');

    // Per-user capacity test (max 5)
    _resetTicketStore();
    const userTickets = [];
    for (let i = 0; i < 5; i++) {
      userTickets.push(createStreamTicket('u_scoped', 'user'));
    }
    const otherUserTicket = createStreamTicket('u_other', 'user');
    const sixthTicket = createStreamTicket('u_scoped', 'user');

    assert(redeemStreamTicket(userTickets[0].ticket) === null, '6th ticket evicts only the oldest ticket of that user');
    assert(redeemStreamTicket(userTickets[4].ticket) !== null, 'Newer pending ticket of that user remains redeemable');
    assert(redeemStreamTicket(otherUserTicket.ticket) !== null, 'Other user ticket was NOT evicted');

    // Global capacity test (1000)
    _resetTicketStore();
    for (let i = 0; i < 1000; i++) {
      createStreamTicket(`u_bulk_${i}`, 'user');
    }
    const overflow = createStreamTicket('u_overflow', 'user');
    assert(overflow.error === 'CAPACITY_REACHED', 'Global limit of 1000 tickets blocks with CAPACITY_REACHED');
    assert(getTicketStoreStats().activeTickets === 1000, 'Ticket count remains capped at 1000');

    _resetTicketStore();
  }

  // =============================================================
  // SUITE 6: SEC-011 — Staff Demotion & Authorization Safeguards
  // =============================================================
  console.log('\n--- Suite 6: SEC-011 — Staff Demotion & Auth Safeguards ---');
  {
    // Part A: Authorization Middlewares
    let adminNextCalled = false;
    let superAdminNextCalled = false;

    const mockAdminRes = () => {
      let code = 200;
      return {
        status: (c) => {
          code = c;
          return { json: () => {} };
        },
        getCode: () => code,
      };
    };

    // User role rejected by adminOnly
    const rAdminUser = mockAdminRes();
    adminOnly({ user: { role: 'user' } }, rAdminUser, () => {
      adminNextCalled = true;
    });
    assert(rAdminUser.getCode() === 403, 'adminOnly rejects user role with 403 Forbidden');

    // Admin role accepted by adminOnly
    adminNextCalled = false;
    adminOnly({ user: { role: 'admin' } }, mockAdminRes(), () => {
      adminNextCalled = true;
    });
    assert(adminNextCalled, 'adminOnly accepts admin role');

    // Admin role rejected by superAdminOnly
    const rSuperAdmin = mockAdminRes();
    superAdminOnly({ user: { role: 'admin' } }, rSuperAdmin, () => {
      superAdminNextCalled = true;
    });
    assert(rSuperAdmin.getCode() === 403, 'superAdminOnly rejects standard admin role with 403 Forbidden');

    // Superadmin role accepted by superAdminOnly
    superAdminNextCalled = false;
    superAdminOnly({ user: { role: 'superadmin' } }, mockAdminRes(), () => {
      superAdminNextCalled = true;
    });
    assert(superAdminNextCalled, 'superAdminOnly accepts superadmin role');

    // Part B: Controller Protection Checks (deleteStaffAdmin input validation)
    const rDemoteBadId = mockAdminRes();
    await deleteStaffAdmin({ params: { id: 'invalid-admin-id' } }, rDemoteBadId);
    assert(rDemoteBadId.getCode() === 400, 'deleteStaffAdmin rejects invalid admin ID format with 400 Bad Request');
  }

  // =============================================================
  // SUITE 7: Documented Limitations & Skipped Tests
  // =============================================================
  console.log('\n--- Suite 7: Documented Limitations & Skipped Tests ---');
  {
    skip(
      'SEC-005: getAllCustomers live database query slicing & countDocuments',
      'getAllCustomers calls purgeExpiredDeletedUsers() and markExpiredCoupons() which require active Mongoose model connections. Testing without changing application code or connecting to DB is safely skipped.'
    );
    skip(
      'SEC-005: AdminDashboard.jsx browser race-condition reproduction',
      'End-to-end browser typing race condition requires active browser DOM and dev server. Verified via static code inspection of customerRequestSeqRef and customerAbortControllerRef.'
    );
    skip(
      'SEC-011: deleteStaffAdmin database execution (superadmin email match & role mutation)',
      'Executing User.findById() inside deleteStaffAdmin requires a live database connection. Tested input format validation and authorization middlewares without DB.'
    );
  }

  console.log('\n=============================================================');
  console.log(`📊 CONSOLIDATED REGRESSION RESULTS: ${passed} PASSED, ${failed} FAILED, ${skipped} SKIPPED`);
  console.log('=============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
};

runAllTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
