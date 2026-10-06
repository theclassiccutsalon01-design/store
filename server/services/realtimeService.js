// Real-time Event Streaming Service using native Server-Sent Events (SSE)
// Supports instant, zero-reload updates for stamps, coupon redemption, and profile changes

const clients = new Set();

/**
 * Register a new SSE connection
 */
export const registerRealtimeClient = (req, res, user = null) => {
  // Set SSE Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable proxy buffering for Nginx / Render
  });

  const client = {
    id: Date.now() + Math.random().toString(36).substring(2, 9),
    res,
    userId: user?._id?.toString() || null,
    role: user?.role || 'guest',
  };

  clients.add(client);

  // Send initial connection greeting
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', clientId: client.id, timestamp: new Date() })}\n\n`);

  // Heartbeat every 25 seconds to keep connection alive through cloud proxies (Render, Netlify)
  const heartbeatInterval = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch (e) {
      clearInterval(heartbeatInterval);
    }
  }, 25000);

  // Clean up on connection close
  req.on('close', () => {
    clearInterval(heartbeatInterval);
    clients.delete(client);
  });
};

/**
 * Broadcast real-time event to all connected clients (or specific target user)
 */
export const broadcastRealtimeEvent = (eventData) => {
  const payload = `data: ${JSON.stringify(eventData)}\n\n`;

  for (const client of clients) {
    try {
      // If target userId specified, send only to that user and all admins
      if (eventData.targetUserId) {
        if (
          client.userId === eventData.targetUserId.toString() ||
          client.role === 'admin' ||
          client.role === 'superadmin'
        ) {
          client.res.write(payload);
        }
      } else {
        // Broadcast to all active clients
        client.res.write(payload);
      }
    } catch (err) {
      console.warn('Failed to send SSE to client:', client.id, err.message);
      clients.delete(client);
    }
  }
};
