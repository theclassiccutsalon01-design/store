import http from 'http';
import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from './models/User.js';
import loyaltyRoutes from './routes/loyaltyRoutes.js';
import { createStreamTicket, _resetTicketStore } from './services/ticketService.js';

// SEC-009-A: Actual Router Integration Test Suite
// Mounts the genuine server/routes/loyaltyRoutes.js onto an ephemeral Express test server (127.0.0.1:0).
// Mocks User.findById in memory only and restores it in a finally block.
// Zero outbound network calls, zero external database connections.

const JWT_SECRET = 'test_secret_for_actual_router_isolation_2026';
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

const runActualRouterTests = async () => {
  console.log('\n=============================================================');
  console.log('🧪 SEC-009-A — ACTUAL LOYALTY ROUTER INTEGRATION TEST');
  console.log('=============================================================\n');

  // In-memory mock user store
  const mockUserStore = new Map([
    ['650000000000000000000001', { _id: '650000000000000000000001', name: 'Alice Customer', role: 'user', isDeleted: false }],
    ['650000000000000000000002', { _id: '650000000000000000000002', name: 'Bob Admin', role: 'admin', isDeleted: false }],
    ['650000000000000000000003', { _id: '650000000000000000000003', name: 'Charlie Deleted', role: 'user', isDeleted: true }],
    ['650000000000000000000004', { _id: '650000000000000000000004', name: 'David Demoted', role: 'admin', isDeleted: false }],
  ]);

  let mockDbError = null;

  // Save original User.findById for mandatory restoration in finally block
  const originalFindById = User.findById;

  // Intercept User.findById in memory only (supports both protect middleware and live-stream query signatures)
  User.findById = function (id) {
    return {
      select: (fields) => {
        return {
          maxTimeMS: async (ms) => {
            if (mockDbError) throw mockDbError;
            return mockUserStore.get(String(id)) || null;
          },
          then: (resolve, reject) => {
            if (mockDbError) return reject(mockDbError);
            return resolve(mockUserMapGet(String(id)));
          },
        };
      },
    };
  };

  const mockUserMapGet = (id) => mockUserStore.get(String(id)) || null;

  // Create ephemeral Express application mounting the ACTUAL loyaltyRoutes router
  const app = express();
  app.use(express.json());
  app.use('/api/loyalty', loyaltyRoutes);

  const server = http.createServer(app);
  let serverPort = 0;

  try {
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    serverPort = server.address().port;
    console.log(`Ephemeral test server bound to 127.0.0.1:${serverPort} (zero external access)`);

    const sendRequest = (options, postData = null) => {
      return new Promise((resolve, reject) => {
        const reqOpts = {
          hostname: '127.0.0.1',
          port: serverPort,
          ...options,
        };

        const req = http.request(reqOpts, (res) => {
          let body = '';
          // If SSE stream, read first chunk and cleanly destroy connection to prevent hanging
          if (res.headers['content-type']?.includes('text/event-stream')) {
            res.on('data', (chunk) => {
              body += chunk.toString();
              res.destroy();
              resolve({
                status: res.statusCode,
                headers: res.headers,
                body,
                json: null,
              });
            });
            return;
          }

          res.on('data', (chunk) => {
            body += chunk;
          });
          res.on('end', () => {
            let json = null;
            try {
              json = JSON.parse(body);
            } catch (e) {}
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body,
              json,
            });
          });
        });

        req.on('error', (err) => {
          if (err.code === 'ECONNRESET') return;
          reject(err);
        });

        if (postData) {
          req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
        }
        req.end();
      });
    };

    const aliceJwt = jwt.sign({ id: '650000000000000000000001' }, JWT_SECRET, { expiresIn: '1h' });
    const bobJwt = jwt.sign({ id: '650000000000000000000002' }, JWT_SECRET, { expiresIn: '1h' });
    const charlieJwt = jwt.sign({ id: '650000000000000000000003' }, JWT_SECRET, { expiresIn: '1h' });
    const davidJwt = jwt.sign({ id: '650000000000000000000004' }, JWT_SECRET, { expiresIn: '1h' });

    // -------------------------------------------------------------
    // Test 1: Route Path & Unauthenticated Request on POST /stream-ticket
    // -------------------------------------------------------------
    console.log('\n--- 1. POST /api/loyalty/stream-ticket Authentication Pipeline ---');
    const unauthRes = await sendRequest({
      path: '/api/loyalty/stream-ticket',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    assert(unauthRes.status === 401, 'Unauthenticated request to actual router returns 401');
    assert(
      unauthRes.json?.message === 'Not authorized, no token provided',
      'protect middleware executes first and returns expected message'
    );

    // -------------------------------------------------------------
    // Test 2: Valid Ticket Issuance via Actual Router
    // -------------------------------------------------------------
    const issueRes1 = await sendRequest({
      path: '/api/loyalty/stream-ticket',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aliceJwt}`,
      },
    });
    assert(issueRes1.status === 200, 'Authenticated request to actual router returns 200 OK');
    assert(typeof issueRes1.json?.ticket === 'string', 'Returns ticket UUID string');
    assert(issueRes1.json?.expiresIn === 30, 'Returns expiresIn: 30');
    const validTicketAlice = issueRes1.json?.ticket;

    // -------------------------------------------------------------
    // Test 3: Missing Ticket on Actual GET /api/loyalty/live-stream
    // -------------------------------------------------------------
    console.log('\n--- 2. GET /api/loyalty/live-stream Input & Expiry Validation ---');
    const noTicketRes = await sendRequest({
      path: '/api/loyalty/live-stream',
      method: 'GET',
    });
    assert(noTicketRes.status === 401, 'Missing ticket on actual router returns 401');
    assert(noTicketRes.json?.message === 'Stream ticket is required', 'Returns exact message "Stream ticket is required"');
    assert(
      !noTicketRes.headers['content-type']?.includes('text/event-stream'),
      'Headers NOT sent as text/event-stream on missing ticket'
    );

    // -------------------------------------------------------------
    // Test 4: Legacy JWT in URL Rejected
    // -------------------------------------------------------------
    const legacyJwtRes = await sendRequest({
      path: `/api/loyalty/live-stream?token=${aliceJwt}`,
      method: 'GET',
    });
    assert(legacyJwtRes.status === 401, 'Passing ?token=JWT is rejected by actual router with 401');
    assert(
      legacyJwtRes.json?.message === 'Stream ticket is required',
      'Requires ticket parameter exclusively; ignores raw JWT'
    );

    // -------------------------------------------------------------
    // Test 5: Invalid / Malformed Ticket
    // -------------------------------------------------------------
    const bogusRes = await sendRequest({
      path: '/api/loyalty/live-stream?ticket=bogus-invalid-ticket-123',
      method: 'GET',
    });
    assert(bogusRes.status === 401, 'Invalid ticket on actual router returns 401');
    assert(
      bogusRes.json?.message === 'Invalid or expired stream ticket',
      'Returns message "Invalid or expired stream ticket"'
    );

    // -------------------------------------------------------------
    // Test 6: Expired Ticket
    // -------------------------------------------------------------
    const shortTicket = createStreamTicket('650000000000000000000001', 'user', 50); // 50ms TTL
    await new Promise((r) => setTimeout(r, 75));
    const expiredRes = await sendRequest({
      path: `/api/loyalty/live-stream?ticket=${shortTicket.ticket}`,
      method: 'GET',
    });
    assert(expiredRes.status === 401, 'Expired ticket on actual router returns 401');
    assert(
      expiredRes.json?.message === 'Invalid or expired stream ticket',
      'Expired ticket rejected with "Invalid or expired stream ticket"'
    );

    // -------------------------------------------------------------
    // Test 7: Successful Connection & Greeting
    // -------------------------------------------------------------
    console.log('\n--- 3. Successful Handshake & Single-Use Replay Protection ---');
    const sseConnectRes = await sendRequest({
      path: `/api/loyalty/live-stream?ticket=${validTicketAlice}`,
      method: 'GET',
    });
    assert(sseConnectRes.status === 200, 'Valid ticket on actual router connects with 200 OK');
    assert(
      sseConnectRes.headers['content-type']?.includes('text/event-stream'),
      'Content-Type is text/event-stream'
    );
    assert(sseConnectRes.body?.includes('CONNECTED'), 'Initial greeting frame received from realtimeService');

    // -------------------------------------------------------------
    // Test 8: Replay Attack (Second Redemption of Same Ticket)
    // -------------------------------------------------------------
    const replayRes = await sendRequest({
      path: `/api/loyalty/live-stream?ticket=${validTicketAlice}`,
      method: 'GET',
    });
    assert(replayRes.status === 401, 'Replaying redeemed ticket on actual router returns 401');
    assert(
      replayRes.json?.message === 'Invalid or expired stream ticket',
      'Replay rejected with "Invalid or expired stream ticket"'
    );

    // -------------------------------------------------------------
    // Test 9: Soft-Deleted User Rejection at Live Verification
    // -------------------------------------------------------------
    console.log('\n--- 4. Live DB Verification: Soft-Deleted & Demoted Accounts ---');
    // Issue ticket for Charlie (isDeleted: true in mockUserStore)
    // Note: protect in POST /stream-ticket blocks if isDeleted is already true.
    // To test live verification in GET /live-stream: issue ticket, then set isDeleted = true.
    const issueResBob = await sendRequest({
      path: '/api/loyalty/stream-ticket',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bobJwt}`,
      },
    });
    const ticketBob = issueResBob.json?.ticket;

    // Mutate Bob to isDeleted = true BEFORE redemption
    mockUserStore.get('650000000000000000000002').isDeleted = true;

    const delRedeemRes = await sendRequest({
      path: `/api/loyalty/live-stream?ticket=${ticketBob}`,
      method: 'GET',
    });
    assert(delRedeemRes.status === 401, 'Soft-deleted account rejected by live verification with 401');
    assert(
      delRedeemRes.json?.message === 'Account has been deactivated or deleted',
      'Returns message "Account has been deactivated or deleted"'
    );
    assert(
      !delRedeemRes.headers['content-type']?.includes('text/event-stream'),
      'Zero SSE headers sent to deleted account'
    );

    // Restore Bob
    mockUserStore.get('650000000000000000000002').isDeleted = false;

    // -------------------------------------------------------------
    // Test 10: Dynamic Live Role Assignment (Demoted Staff)
    // -------------------------------------------------------------
    const issueResDavid = await sendRequest({
      path: '/api/loyalty/stream-ticket',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${davidJwt}`,
      },
    });
    const ticketDavid = issueResDavid.json?.ticket;

    // Demote David in DB from admin to user BEFORE redemption
    mockUserStore.get('650000000000000000000004').role = 'user';

    const demotedConnectRes = await sendRequest({
      path: `/api/loyalty/live-stream?ticket=${ticketDavid}`,
      method: 'GET',
    });
    assert(demotedConnectRes.status === 200, 'Demoted staff member connects with 200 OK');
    assert(
      demotedConnectRes.headers['content-type']?.includes('text/event-stream'),
      'Demoted member upgraded to SSE stream with live user role'
    );

    // -------------------------------------------------------------
    // Test 11: Fail-Closed Database Failure Handling (503 Before Headers)
    // -------------------------------------------------------------
    console.log('\n--- 5. Fail-Closed Database Failure & Single-Use Consumption ---');
    const issueResAlice2 = await sendRequest({
      path: '/api/loyalty/stream-ticket',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aliceJwt}`,
      },
    });
    const ticketDbFail = issueResAlice2.json?.ticket;

    // Simulate MongoDB connection failure / timeout
    mockDbError = new Error('MongooseServerSelectionError: connection timed out');

    const dbFailRes = await sendRequest({
      path: `/api/loyalty/live-stream?ticket=${ticketDbFail}`,
      method: 'GET',
    });
    // Restore DB mock to healthy
    mockDbError = null;

    assert(dbFailRes.status === 503, 'Database failure returns fail-closed 503 Service Unavailable');
    assert(
      dbFailRes.json?.message === 'Authentication service temporarily unavailable. Please retry shortly.',
      'Returns expected 503 error message'
    );
    assert(
      !dbFailRes.headers['content-type']?.includes('text/event-stream'),
      'Headers NOT sent as text/event-stream on database failure'
    );

    // -------------------------------------------------------------
    // Test 12: Ticket Consumed Even After 503 (Must Request Fresh Ticket)
    // -------------------------------------------------------------
    const retryConsumedRes = await sendRequest({
      path: `/api/loyalty/live-stream?ticket=${ticketDbFail}`,
      method: 'GET',
    });
    assert(retryConsumedRes.status === 401, 'Retrying ticket consumed during 503 returns 401 (client must fetch fresh ticket)');
    assert(
      retryConsumedRes.json?.message === 'Invalid or expired stream ticket',
      'Ticket was destroyed in memory upon first redemption attempt'
    );

    // -------------------------------------------------------------
    // Test 13: Dedicated Rate-Limiting Enforcement on Actual Router
    // -------------------------------------------------------------
    console.log('\n--- 6. Dedicated Rate-Limiter (streamTicketLimiter) on Actual Route ---');
    // App already handled ~5 ticket POST requests. Send requests until 15 is exceeded.
    let rateLimitHit = false;
    let hitMessage = '';
    for (let i = 0; i < 15; i++) {
      const r = await sendRequest({
        path: '/api/loyalty/stream-ticket',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${aliceJwt}`,
        },
      });
      if (r.status === 429) {
        rateLimitHit = true;
        hitMessage = r.json?.message || '';
        break;
      }
    }
    assert(rateLimitHit, 'Rapid requests to actual /stream-ticket trigger HTTP 429');
    assert(
      hitMessage === 'Too many stream ticket requests from this IP, please try again in a minute',
      'Returns exact configured streamTicketLimiter error message'
    );

  } finally {
    // Mandatory restoration of User.findById and server teardown
    User.findById = originalFindById;
    _resetTicketStore();
    if (server.listening) {
      await new Promise((r) => server.close(r));
    }
    console.log('Teardown complete: User.findById restored to original reference, ephemeral server closed.');
  }

  console.log('\n=============================================================');
  console.log(`📊 ACTUAL ROUTER INTEGRATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
};

runActualRouterTests().catch((err) => {
  console.error('Fatal test error in actual router test:', err);
  process.exit(1);
});
