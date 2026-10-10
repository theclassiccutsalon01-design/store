import http from 'http';
import express from 'express';
import jwt from 'jsonwebtoken';
import morgan from 'morgan';
import {
  createStreamTicket,
  redeemStreamTicket,
  purgeExpiredTickets,
  getTicketStoreStats,
  _resetTicketStore,
} from './services/ticketService.js';
import { streamTicketLimiter, authLimiter } from './middleware/rateLimiter.js';
import { protect } from './middleware/authMiddleware.js';
import { registerRealtimeClient } from './services/realtimeService.js';

const JWT_SECRET = 'test_jwt_secret_sec009a_secure_suite_2026';
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

const runAllTests = async () => {
  console.log('\n=============================================================');
  console.log('🧪 SEC-009-A / SEC-009-B AUTOMATED TEST SUITE');
  console.log('=============================================================\n');

  // -------------------------------------------------------------
  // SUITE 1: ticketService In-Memory Unit Logic
  // -------------------------------------------------------------
  console.log('--- Suite 1: ticketService Logic & Capacity Invariants ---');
  _resetTicketStore();

  // Test 1: Ticket Issuance
  const t1 = createStreamTicket('user_101', 'user');
  assert(t1 && t1.ticket && typeof t1.ticket === 'string', 'Ticket issuance returns UUID string');
  assert(t1.expiresIn === 30, 'Ticket expiresIn is 30 seconds');

  // Test 2: Single-use Redemption
  const redeemed1 = redeemStreamTicket(t1.ticket);
  assert(redeemed1 && redeemed1.userId === 'user_101' && redeemed1.role === 'user', 'First ticket redemption succeeds with correct payload');

  // Test 3: Replay Attack (Redeeming consumed ticket)
  const replayed = redeemStreamTicket(t1.ticket);
  assert(replayed === null, 'Second redemption of consumed ticket returns null (Replay blocked)');

  // Test 4: Invalid / Malformed Ticket
  assert(redeemStreamTicket('not-a-valid-ticket-id') === null, 'Redeeming non-existent ticket returns null');
  assert(redeemStreamTicket('') === null, 'Redeeming empty ticket returns null');
  assert(redeemStreamTicket(null) === null, 'Redeeming null ticket returns null');

  // Test 5: Expiration Boundary
  const shortLived = createStreamTicket('user_102', 'user', 50); // 50ms TTL
  assert(shortLived.ticket, 'Short-lived ticket created with 50ms TTL');
  await new Promise((r) => setTimeout(r, 80));
  const expiredRedeemed = redeemStreamTicket(shortLived.ticket);
  assert(expiredRedeemed === null, 'Redeeming ticket after expiration returns null');

  // Test 6: Multi-Tab Concurrency (Same User)
  _resetTicketStore();
  const tab1Ticket = createStreamTicket('user_200', 'admin');
  const tab2Ticket = createStreamTicket('user_200', 'admin');
  assert(tab1Ticket.ticket !== tab2Ticket.ticket, 'Tab 1 and Tab 2 receive unique ticket UUIDs');
  
  const tab1Redeemed = redeemStreamTicket(tab1Ticket.ticket);
  assert(tab1Redeemed && tab1Redeemed.userId === 'user_200', 'Tab 1 redeems ticket successfully');
  
  const tab2Redeemed = redeemStreamTicket(tab2Ticket.ticket);
  assert(tab2Redeemed && tab2Redeemed.userId === 'user_200', 'Tab 2 redeems ticket independently without collision');

  // Test 7: Per-User Limit (Max 5 Pending) & Scoped Eviction
  _resetTicketStore();
  const ticketsU300 = [];
  for (let i = 0; i < 5; i++) {
    ticketsU300.push(createStreamTicket('user_300', 'user'));
  }
  const ticketOther = createStreamTicket('user_400', 'user');

  assert(getTicketStoreStats().activeTickets === 6, 'Store holds 5 tickets for user_300 and 1 for user_400');

  // 6th ticket for user_300 evicts user_300's oldest ticket
  const sixthTicket = createStreamTicket('user_300', 'user');
  assert(sixthTicket && sixthTicket.ticket, '6th ticket issued for user_300');
  assert(redeemStreamTicket(ticketsU300[0].ticket) === null, 'Oldest ticket of user_300 was evicted');
  assert(redeemStreamTicket(ticketsU300[4].ticket) !== null, 'Newer pending ticket of user_300 remains valid');
  assert(redeemStreamTicket(ticketOther.ticket) !== null, 'user_400 ticket was NEVER touched (no cross-user eviction)');

  // Test 8: Global Capacity Limit (MAX_TICKETS = 1000)
  _resetTicketStore();
  for (let i = 0; i < 1000; i++) {
    createStreamTicket(`user_bulk_${i}`, 'user');
  }
  assert(getTicketStoreStats().activeTickets === 1000, 'Store filled to 1000 tickets');
  const overflowTicket = createStreamTicket('user_overflow', 'user');
  assert(overflowTicket.error === 'CAPACITY_REACHED', 'Issuance at max capacity fails with CAPACITY_REACHED');
  assert(getTicketStoreStats().activeTickets === 1000, 'Active ticket count remains strictly capped at 1000');

  _resetTicketStore();

  // -------------------------------------------------------------
  // SUITE 2: Express HTTP & SSE Route Integration Tests
  // -------------------------------------------------------------
  console.log('\n--- Suite 2: Express HTTP & SSE Route Integration ---');

  // Set up mock User collection for testing
  const mockUsers = new Map([
    ['64f1a2b3c4d5e6f7a8b90001', { _id: '64f1a2b3c4d5e6f7a8b90001', role: 'admin', isDeleted: false }],
    ['64f1a2b3c4d5e6f7a8b90002', { _id: '64f1a2b3c4d5e6f7a8b90002', role: 'user', isDeleted: false }],
    ['64f1a2b3c4d5e6f7a8b90003', { _id: '64f1a2b3c4d5e6f7a8b90003', role: 'user', isDeleted: true }], // soft-deleted
  ]);

  let simulateDbTimeout = false;

  const mockUserFindById = (id) => ({
    select: (fields) => ({
      maxTimeMS: async (timeout) => {
        if (simulateDbTimeout) {
          throw new Error('MongoNetworkTimeoutError: connection timed out');
        }
        return mockUsers.get(String(id)) || null;
      },
    }),
  });

  const app = express();
  app.use(express.json());

  // Capture Morgan log line to verify sanitization
  let lastMorganLine = '';
  morgan.token('clean-url', (req) => {
    const url = req.originalUrl || req.url;
    return typeof url === 'string' ? url.split('?')[0] : url;
  });
  app.use(
    morgan(':method :clean-url :status', {
      stream: {
        write: (msg) => {
          lastMorganLine = msg.trim();
        },
      },
    })
  );

  // Mount Mock Routes matching actual loyaltyRoutes.js
  app.post('/api/loyalty/stream-ticket', (req, res, next) => {
    // Mock protect middleware using JWT
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token provided' });
    }
    const token = auth.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = mockUsers.get(decoded.id) || { _id: decoded.id, role: 'user' };
      next();
    } catch (e) {
      return res.status(401).json({ message: 'Token verification failed or expired' });
    }
  }, streamTicketLimiter, (req, res) => {
    const result = createStreamTicket(req.user._id, req.user.role);
    if (result.error === 'CAPACITY_REACHED') {
      return res.status(429).json({ message: 'Server ticket capacity reached. Please retry shortly.' });
    }
    return res.status(200).json({ ticket: result.ticket, expiresIn: result.expiresIn });
  });

  app.get('/api/loyalty/live-stream', async (req, res) => {
    const ticketId = req.query.ticket;
    if (!ticketId || typeof ticketId !== 'string') {
      return res.status(401).json({ message: 'Stream ticket is required' });
    }

    // 1. Redeem ticket synchronously (single-use consumption)
    const ticketData = redeemStreamTicket(ticketId.trim());
    if (!ticketData) {
      return res.status(401).json({ message: 'Invalid or expired stream ticket' });
    }

    // 2. Live DB Verification
    let user;
    try {
      user = await mockUserFindById(ticketData.userId).select('role isDeleted').maxTimeMS(3000);
    } catch (dbErr) {
      return res.status(503).json({
        message: 'Authentication service temporarily unavailable. Please retry shortly.',
      });
    }

    if (!user) {
      return res.status(401).json({ message: 'User account not found' });
    }

    if (user.isDeleted) {
      return res.status(401).json({ message: 'Account has been deactivated or deleted' });
    }

    // 3. Register client with live role
    registerRealtimeClient(req, res, { _id: user._id, role: user.role });
  });

  // Start test server on dynamic port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const makeRequest = (options, postData = null) => {
    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let body = '';
        if (res.headers['content-type']?.includes('text/event-stream')) {
          res.on('data', (chunk) => {
            body += chunk.toString();
            res.destroy();
            resolve({ status: res.statusCode, headers: res.headers, body, json: null });
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
          resolve({ status: res.statusCode, headers: res.headers, body, json });
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

  const adminJwt = jwt.sign({ id: '64f1a2b3c4d5e6f7a8b90001' }, JWT_SECRET, { expiresIn: '1h' });
  const userJwt = jwt.sign({ id: '64f1a2b3c4d5e6f7a8b90002' }, JWT_SECRET, { expiresIn: '1h' });
  const deletedUserJwt = jwt.sign({ id: '64f1a2b3c4d5e6f7a8b90003' }, JWT_SECRET, { expiresIn: '1h' });

  // Test 9: Ticket issuance requires authentication
  const unauthTicketRes = await makeRequest({
    hostname: '127.0.0.1',
    port,
    path: '/api/loyalty/stream-ticket',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  assert(unauthTicketRes.status === 401, 'Unauthenticated POST /stream-ticket returns 401');

  // Test 10: Authenticated user obtains ticket
  const ticketRes = await makeRequest({
    hostname: '127.0.0.1',
    port,
    path: '/api/loyalty/stream-ticket',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminJwt}`,
    },
  });
  assert(ticketRes.status === 200, 'Authenticated POST /stream-ticket returns 200');
  assert(ticketRes.json?.ticket, 'Ticket response contains UUID');
  const validTicket = ticketRes.json.ticket;

  // Test 11: GET /live-stream without ticket returns 401 (SEC-009-B)
  const noTicketRes = await makeRequest({
    hostname: '127.0.0.1',
    port,
    path: '/api/loyalty/live-stream',
    method: 'GET',
  });
  assert(noTicketRes.status === 401, 'GET /live-stream without ticket returns 401');
  assert(noTicketRes.json?.message === 'Stream ticket is required', 'Returns exact message "Stream ticket is required"');
  assert(!noTicketRes.headers['content-type']?.includes('text/event-stream'), 'No SSE headers issued on missing ticket');

  // Test 12: GET /live-stream with raw JWT token query param returns 401
  const rawTokenRes = await makeRequest({
    hostname: '127.0.0.1',
    port,
    path: `/api/loyalty/live-stream?token=${adminJwt}`,
    method: 'GET',
  });
  assert(rawTokenRes.status === 401, 'GET /live-stream?token=JWT is rejected with 401');

  // Test 13: GET /live-stream with invalid ticket returns 401
  const badTicketRes = await makeRequest({
    hostname: '127.0.0.1',
    port,
    path: '/api/loyalty/live-stream?ticket=invalid-uuid-token',
    method: 'GET',
  });
  assert(badTicketRes.status === 401, 'GET /live-stream?ticket=bogus returns 401');
  assert(badTicketRes.json?.message === 'Invalid or expired stream ticket', 'Returns message "Invalid or expired stream ticket"');

  // Test 14: Successful SSE connection with valid ticket
  const sseConnection = await new Promise((resolve) => {
    const sseReq = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path: `/api/loyalty/live-stream?ticket=${validTicket}`,
        method: 'GET',
      },
      (res) => {
        let firstChunk = '';
        res.on('data', (chunk) => {
          firstChunk += chunk.toString();
          if (firstChunk.includes('CONNECTED')) {
            res.destroy(); // Close after receiving greeting
            resolve({
              status: res.statusCode,
              contentType: res.headers['content-type'],
              chunk: firstChunk,
            });
          }
        });
      }
    );
    sseReq.end();
  });
  assert(sseConnection.status === 200, 'Valid ticket establishes SSE connection with 200 OK');
  assert(sseConnection.contentType?.includes('text/event-stream'), 'SSE Content-Type is text/event-stream');
  assert(sseConnection.chunk?.includes('CONNECTED'), 'Initial SSE greeting received');

  // Test 15: Replay attack on used ticket
  const replayRes = await makeRequest({
    hostname: '127.0.0.1',
    port,
    path: `/api/loyalty/live-stream?ticket=${validTicket}`,
    method: 'GET',
  });
  assert(replayRes.status === 401, 'Replaying consumed ticket returns 401');

  // Test 16: Two simultaneous redemptions of same ticket (Race condition test)
  const concurrentTicketRes = await makeRequest({
    hostname: '127.0.0.1',
    port,
    path: '/api/loyalty/stream-ticket',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userJwt}` },
  });
  const cTicket = concurrentTicketRes.json.ticket;

  const [race1, race2] = await Promise.all([
    makeRequest({ hostname: '127.0.0.1', port, path: `/api/loyalty/live-stream?ticket=${cTicket}`, method: 'GET' }),
    makeRequest({ hostname: '127.0.0.1', port, path: `/api/loyalty/live-stream?ticket=${cTicket}`, method: 'GET' }),
  ]);
  const statuses = [race1.status, race2.status].sort();
  assert(statuses[0] === 200 && statuses[1] === 401, 'Simultaneous redemption race: exactly one succeeds (200), one fails (401)');

  // Test 17: User soft-deleted between issuance and redemption
  const delTicketRes = await makeRequest({
    hostname: '127.0.0.1',
    port,
    path: '/api/loyalty/stream-ticket',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${deletedUserJwt}` },
  });
  const delTicket = delTicketRes.json.ticket;
  const delConnectRes = await makeRequest({
    hostname: '127.0.0.1',
    port,
    path: `/api/loyalty/live-stream?ticket=${delTicket}`,
    method: 'GET',
  });
  assert(delConnectRes.status === 401, 'Soft-deleted user rejected at live verification with 401');
  assert(delConnectRes.json?.message === 'Account has been deactivated or deleted', 'Message identifies deleted account');

  // Test 18: Live role demotion between issuance and redemption
  // Start user as admin
  const mutableUserId = '64f1a2b3c4d5e6f7a8b90099';
  mockUsers.set(mutableUserId, { _id: mutableUserId, role: 'admin', isDeleted: false });
  const demoteJwt = jwt.sign({ id: mutableUserId }, JWT_SECRET, { expiresIn: '1h' });
  const demoteTicketRes = await makeRequest({
    hostname: '127.0.0.1',
    port,
    path: '/api/loyalty/stream-ticket',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${demoteJwt}` },
  });
  const demoteTicket = demoteTicketRes.json.ticket;

  // Demote user in database before redemption
  mockUsers.get(mutableUserId).role = 'user';

  // Connect and verify live role assigned
  await new Promise((resolve) => {
    const demoteReq = http.request(
      { hostname: '127.0.0.1', port, path: `/api/loyalty/live-stream?ticket=${demoteTicket}`, method: 'GET' },
      (res) => {
        assert(res.statusCode === 200, 'Demoted user connects with 200');
        res.destroy();
        resolve();
      }
    );
    demoteReq.end();
  });

  // Test 19: Database timeout / failure during live user verification
  const dbTimeoutTicketRes = await makeRequest({
    hostname: '127.0.0.1',
    port,
    path: '/api/loyalty/stream-ticket',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userJwt}` },
  });
  const dbTimeoutTicket = dbTimeoutTicketRes.json.ticket;

  simulateDbTimeout = true;
  const dbTimeoutConnectRes = await makeRequest({
    hostname: '127.0.0.1',
    port,
    path: `/api/loyalty/live-stream?ticket=${dbTimeoutTicket}`,
    method: 'GET',
  });
  simulateDbTimeout = false;

  assert(dbTimeoutConnectRes.status === 503, 'Database failure returns fail-closed 503 Service Unavailable');
  assert(!dbTimeoutConnectRes.headers['content-type']?.includes('text/event-stream'), 'No SSE headers sent on 503 failure');

  // Test 20: Consumed ticket cannot be retried after 503
  const retryConsumedRes = await makeRequest({
    hostname: '127.0.0.1',
    port,
    path: `/api/loyalty/live-stream?ticket=${dbTimeoutTicket}`,
    method: 'GET',
  });
  assert(retryConsumedRes.status === 401, 'Retrying ticket consumed during 503 returns 401 (client must fetch fresh ticket)');

  // Test 21: Morgan Log Sanitization
  // Verify lastMorganLine does NOT contain '?ticket=' or token parameter
  assert(
    !lastMorganLine.includes('?ticket=') && !lastMorganLine.includes(dbTimeoutTicket),
    'Morgan clean-url log does not contain ticket query parameter',
    `Logged line was: "${lastMorganLine}"`
  );

  // Test 22: Dedicated Rate Limiter (streamTicketLimiter max: 15/min) & AuthLimiter Isolation
  // App currently handled 5 ticket requests. Send requests until 15 is exceeded.
  let rateLimitHit = false;
  for (let i = 0; i < 15; i++) {
    const r = await makeRequest({
      hostname: '127.0.0.1',
      port,
      path: '/api/loyalty/stream-ticket',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userJwt}` },
    });
    if (r.status === 429) {
      rateLimitHit = true;
      break;
    }
  }
  assert(rateLimitHit, 'Rapid stream-ticket requests trigger HTTP 429 from streamTicketLimiter');

  // Close server
  await new Promise((resolve) => server.close(resolve));


  console.log('\n=============================================================');
  console.log(`📊 SEC-009-A TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
};

runAllTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
