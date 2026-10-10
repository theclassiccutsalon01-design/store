import http from 'http';
import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import { createStreamTicket, redeemStreamTicket, _resetTicketStore } from './services/ticketService.js';

// SEC-009-A: Test-Only Isolated Mock Backend for Browser Staging Verification
// Binds strictly to 127.0.0.1:5000. Zero MongoDB, zero Render, zero external access.

const PORT = 5000;
const HOST = '127.0.0.1';
const JWT_SECRET = 'browser_test_synthetic_secret_2026';

const syntheticUser = {
  _id: '650000000000000000000099',
  name: 'Test Browser User',
  email: 'test@example.com',
  role: 'user',
  currentStamps: 2,
  lifetimeVisits: 5,
  phone: '+91 9999999999',
};

const syntheticToken = jwt.sign({ id: syntheticUser._id, role: syntheticUser.role }, JWT_SECRET, {
  expiresIn: '1h',
});

const requestLog = [];
const activeSseClients = new Set();

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${HOST}:${PORT}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
  });

  req.on('end', () => {
    let jsonBody = null;
    try {
      if (body) jsonBody = JSON.parse(body);
    } catch (e) {}

    const logEntry = {
      timestamp: Date.now(),
      method,
      path: pathname,
      search: parsedUrl.search,
      headers: { ...req.headers },
      body: jsonBody,
    };
    requestLog.push(logEntry);

    // Standard CORS for local harness
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // 1. Health check
    if (pathname === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', environment: 'isolated-browser-test' }));
      return;
    }

    // 2. CMS Config (Required by layout and header)
    if (pathname === '/api/cms/config') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          salonName: 'The Classic Cut Salon (Test)',
          tagline: 'Isolated Browser Test Mode',
          phone: '+91 9999999999',
          whatsapp: '+919999999999',
          email: 'test@example.com',
          address: 'Test Environment, 127.0.0.1',
          mapDirectionsUrl: 'https://maps.google.com',
          mapEmbedUrl: 'https://maps.google.com',
          openingHours: {
            weekday: 'Tuesday to Friday: 9:30 AM - 9:00 PM',
            weekend: 'Saturday & Sunday: 8:30 AM - 10:00 PM',
            monday: 'CLOSED',
          },
          heroVideoUrl: '',
          defaultOfferTitle: 'Welcome Offer',
          defaultOfferDiscount: '20% OFF',
        })
      );
      return;
    }

    // 3. Auth login
    if (pathname === '/api/auth/login' && method === 'POST') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          token: syntheticToken,
          user: syntheticUser,
        })
      );
      return;
    }

    // 4. Auth profile
    if (pathname === '/api/auth/profile' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(syntheticUser));
      return;
    }

    // 5. Loyalty profile / stamps prefetch
    if (pathname === '/api/loyalty/my-stamps' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          currentStamps: syntheticUser.currentStamps,
          lifetimeVisits: syntheticUser.lifetimeVisits,
          coupons: [],
          daysUntilStampDecay: 45,
          stampsNeeded: 5 - syntheticUser.currentStamps,
        })
      );
      return;
    }

    // 6. SEC-009-A: Stream Ticket Request
    if (pathname === '/api/loyalty/stream-ticket' && method === 'POST') {
      const authHeader = req.headers['authorization'] || '';
      if (!authHeader.startsWith('Bearer ')) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Not authorized, no token provided' }));
        return;
      }
      const token = authHeader.replace('Bearer ', '').trim();
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const result = createStreamTicket(decoded.id, decoded.role || 'user');
        if (result.error === 'CAPACITY_REACHED') {
          res.writeHead(429, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Server ticket capacity reached' }));
          return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ticket: result.ticket, expiresIn: result.expiresIn }));
      } catch (err) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Invalid or expired token' }));
      }
      return;
    }

    // 7. SEC-009-A: Live SSE Stream Handshake
    if (pathname === '/api/loyalty/live-stream' && method === 'GET') {
      const ticket = parsedUrl.searchParams.get('ticket');
      if (!ticket) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Stream ticket is required' }));
        return;
      }

      const ticketData = redeemStreamTicket(ticket);
      if (!ticketData) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Invalid or expired stream ticket' }));
        return;
      }

      // Successful ticket validation -> Set SSE Headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      });

      const clientId = randomUUID();
      const client = { id: clientId, res, userId: ticketData.userId, role: ticketData.role };
      activeSseClients.add(client);

      // Send initial CONNECTED frame
      res.write(
        `data: ${JSON.stringify({ type: 'CONNECTED', clientId, timestamp: new Date().toISOString() })}\n\n`
      );

      res.on('close', () => {
        activeSseClients.delete(client);
      });
      return;
    }

    // -------------------------------------------------------------
    // Test Control Endpoints
    // -------------------------------------------------------------

    // Broadcast synthetic real-time event to connected browser clients
    if (pathname === '/test-control/broadcast' && method === 'POST') {
      const payload = jsonBody?.eventData;
      if (!payload) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'eventData required' }));
        return;
      }
      const dataStr = `data: ${JSON.stringify(payload)}\n\n`;
      let count = 0;
      for (const client of activeSseClients) {
        try {
          client.res.write(dataStr);
          count++;
        } catch (e) {}
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, broadcastCount: count }));
      return;
    }

    // Drop all SSE connections to simulate network disruption (TC-06)
    if (pathname === '/test-control/drop-sse' && method === 'POST') {
      let dropped = 0;
      for (const client of activeSseClients) {
        try {
          client.res.end();
          dropped++;
        } catch (e) {}
      }
      activeSseClients.clear();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, droppedCount: dropped }));
      return;
    }

    // Query active SSE clients count
    if (pathname === '/test-control/active-clients' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ activeClients: activeSseClients.size }));
      return;
    }

    // Query request history for assertion evidence
    if (pathname === '/test-control/history' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ history: requestLog }));
      return;
    }

    // Reset store and history
    if (pathname === '/test-control/reset' && method === 'POST') {
      _resetTicketStore();
      requestLog.length = 0;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
      return;
    }

    // Clean shutdown
    if (pathname === '/test-control/shutdown' && method === 'POST') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Shutting down mock test server' }));
      setImmediate(() => {
        for (const client of activeSseClients) {
          try {
            client.res.destroy();
          } catch (e) {}
        }
        server.close();
        process.exit(0);
      });
      return;
    }

    // Catch-all 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not mapped in mock harness', path: pathname }));
  });
});

server.listen(PORT, HOST, () => {
  console.log(`[SEC-009-A MOCK BACKEND] Listening strictly on http://${HOST}:${PORT}`);
  console.log(`[SEC-009-A MOCK BACKEND] Zero external connections, zero database mutations.`);
});
