import { randomUUID } from 'crypto';

/**
 * SEC-009-A: Server-Sent Events (SSE) One-Time Stream Ticket Service
 *
 * Provides short-lived (30s), single-use, high-entropy tokens to authenticate
 * the native browser EventSource without exposing the 30-day JWT in URL query strings.
 */

const MAX_TICKETS = 1000;
const MAX_PENDING_PER_USER = 5;
const DEFAULT_TTL_MS = 30000; // 30 seconds

// ticketId -> { ticketId, userId, role, createdAt, expiresAt }
const ticketStore = new Map();

// userId (string) -> Set<ticketId>
const userPendingTickets = new Map();

/**
 * Clean up expired tickets from stores
 */
export const purgeExpiredTickets = (now = Date.now()) => {
  for (const [ticketId, record] of ticketStore.entries()) {
    if (record.expiresAt <= now) {
      ticketStore.delete(ticketId);
      const userSet = userPendingTickets.get(record.userId);
      if (userSet) {
        userSet.delete(ticketId);
        if (userSet.size === 0) {
          userPendingTickets.delete(record.userId);
        }
      }
    }
  }
};

// Periodic background sweep every 30 seconds
const sweepInterval = setInterval(() => {
  purgeExpiredTickets();
}, 30000);

// Unref timer so it does not prevent Node.js process exit or hang test runners
if (sweepInterval.unref) {
  sweepInterval.unref();
}

/**
 * Issue a one-time stream ticket for an authenticated user.
 *
 * Capacity & Eviction Rules:
 * 1. Global limit: MAX_TICKETS = 1000. If reached after purging expired tickets,
 *    issuance fails with { error: 'CAPACITY_REACHED' }. Never silently evicts another user's tickets.
 * 2. Per-user limit: MAX_PENDING_PER_USER = 5. If a single user requests more than 5 tickets
 *    before redeeming (e.g. opening >5 tabs simultaneously), ONLY that user's oldest pending ticket
 *    is evicted. No other user's tickets are touched.
 *
 * @param {string} userId - Mongoose User ID string
 * @param {string} role - User role ('user', 'admin', 'superadmin')
 * @param {number} [customTtlMs] - Optional custom TTL in milliseconds (defaults to 30000ms)
 * @returns {{ ticket: string, expiresIn: number } | { error: string }}
 */
export const createStreamTicket = (userId, role = 'user', customTtlMs = DEFAULT_TTL_MS) => {
  const now = Date.now();
  const uId = String(userId);

  // Opportunistic cleanup of expired tickets
  purgeExpiredTickets(now);

  // 1. Enforce global capacity check
  if (ticketStore.size >= MAX_TICKETS) {
    return { error: 'CAPACITY_REACHED' };
  }

  // 2. Enforce per-user limit with scoped eviction
  let userSet = userPendingTickets.get(uId);
  if (!userSet) {
    userSet = new Set();
    userPendingTickets.set(uId, userSet);
  }

  // If this user already has 5 pending tickets, find and evict ONLY their oldest ticket
  if (userSet.size >= MAX_PENDING_PER_USER) {
    let oldestTicketId = null;
    let oldestCreated = Infinity;

    for (const pendingId of userSet) {
      const record = ticketStore.get(pendingId);
      if (record && record.createdAt < oldestCreated) {
        oldestCreated = record.createdAt;
        oldestTicketId = pendingId;
      }
    }

    if (oldestTicketId) {
      ticketStore.delete(oldestTicketId);
      userSet.delete(oldestTicketId);
    }
  }

  // Generate cryptographically secure UUID ticket
  const ticketId = randomUUID();
  const ttl = typeof customTtlMs === 'number' && customTtlMs > 0 ? customTtlMs : DEFAULT_TTL_MS;
  const expiresAt = now + ttl;

  const record = {
    ticketId,
    userId: uId,
    role: String(role),
    createdAt: now,
    expiresAt,
  };

  ticketStore.set(ticketId, record);
  userSet.add(ticketId);

  return {
    ticket: ticketId,
    expiresIn: Math.floor(ttl / 1000),
  };
};

/**
 * Redeem a one-time stream ticket synchronously.
 *
 * Atomicity Guarantee:
 * Executes synchronously in a single JavaScript event-loop turn.
 * The ticket is deleted immediately upon retrieval.
 * Even if subsequent database verification fails or times out,
 * this ticket remains consumed and cannot be reused or replayed.
 *
 * @param {string} ticketId - UUID string
 * @returns {{ userId: string, role: string } | null} Valid ticket payload or null
 */
export const redeemStreamTicket = (ticketId) => {
  if (!ticketId || typeof ticketId !== 'string') {
    return null;
  }

  const record = ticketStore.get(ticketId);
  if (!record) {
    return null;
  }

  // Always delete immediately to guarantee single-use consumption
  ticketStore.delete(ticketId);

  // Clean up user tracking
  const userSet = userPendingTickets.get(record.userId);
  if (userSet) {
    userSet.delete(ticketId);
    if (userSet.size === 0) {
      userPendingTickets.delete(record.userId);
    }
  }

  // Check expiration boundary
  if (record.expiresAt <= Date.now()) {
    return null;
  }

  return {
    userId: record.userId,
    role: record.role,
  };
};

/**
 * Diagnostic helper for testing and monitoring
 */
export const getTicketStoreStats = () => ({
  activeTickets: ticketStore.size,
  activeUsers: userPendingTickets.size,
  maxCapacity: MAX_TICKETS,
  maxPerUser: MAX_PENDING_PER_USER,
});

/**
 * Test isolation helper to clear internal state
 */
export const _resetTicketStore = () => {
  ticketStore.clear();
  userPendingTickets.clear();
};
