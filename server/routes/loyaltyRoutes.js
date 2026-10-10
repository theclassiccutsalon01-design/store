import express from 'express';
import {
  addVisitStamp,
  getAllCustomers,
  getVisitHistory,
  getMyLoyalty,
  redeemCoupon,
  deleteCustomer,
  getDeletedCustomers,
  restoreCustomer,
  permanentDeleteCustomer,
  updateCustomerByAdmin,
  getAllCouponsAdmin,
  extendCouponExpiryAdmin,
  spinDiscountWheel,
  getCustomerServiceAndStampHistory,
} from '../controllers/loyaltyController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { streamTicketLimiter } from '../middleware/rateLimiter.js';
import { User } from '../models/User.js';
import { registerRealtimeClient } from '../services/realtimeService.js';
import { createStreamTicket, redeemStreamTicket } from '../services/ticketService.js';

const router = express.Router();

// SEC-009-A: One-time SSE Stream Ticket Issuance Endpoint
// Protected by JWT authentication and dedicated rate limiter (15 req/min)
router.post('/stream-ticket', protect, streamTicketLimiter, (req, res) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: 'Authentication required to obtain stream ticket' });
  }

  const result = createStreamTicket(req.user._id, req.user.role);
  if (result.error === 'CAPACITY_REACHED') {
    return res.status(429).json({
      message: 'Server ticket capacity reached. Please retry shortly.',
    });
  }

  return res.status(200).json({
    ticket: result.ticket,
    expiresIn: result.expiresIn,
  });
});

// Real-time Live-Stream endpoint (SSE for zero-reload updates)
// SEC-009-A & SEC-009-B: Requires a valid, single-use stream ticket.
// Reject unauthenticated guests, replayed, expired, or invalid tickets with 401.
router.get('/live-stream', async (req, res) => {
  const ticketId = req.query.ticket;
  if (!ticketId || typeof ticketId !== 'string') {
    return res.status(401).json({ message: 'Stream ticket is required' });
  }

  // 1. Redeem ticket synchronously (single-use consumption)
  // A redeemed ticket is deleted immediately. Even if DB check fails/times out, it cannot be reused.
  const ticketData = redeemStreamTicket(ticketId.trim());
  if (!ticketData) {
    return res.status(401).json({ message: 'Invalid or expired stream ticket' });
  }

  // 2. Live User & Role Verification from MongoDB
  let user;
  try {
    user = await User.findById(ticketData.userId).select('role isDeleted').maxTimeMS(3000);
  } catch (dbErr) {
    console.error('❌ [SSE AUTH] Database error during live user verification:', dbErr.message);
    // Fail-closed: do not establish SSE connection when authentication cannot be verified
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

  // 3. Establish SSE Connection with live dynamic role
  registerRealtimeClient(req, res, { _id: user._id, role: user.role });
});


// User endpoints
router.get('/my-stamps', protect, getMyLoyalty);
router.get('/visits/:userId?', protect, getVisitHistory);
router.post('/spin-wheel', protect, spinDiscountWheel);

// Admin endpoints
router.post('/add-stamp', protect, adminOnly, addVisitStamp);
router.get('/customers', protect, adminOnly, getAllCustomers);
router.get('/customer-history/:userId', protect, adminOnly, getCustomerServiceAndStampHistory);
router.put('/customers/:id', protect, adminOnly, updateCustomerByAdmin);
router.post('/redeem-coupon', protect, adminOnly, redeemCoupon);
router.get('/all-coupons', protect, adminOnly, getAllCouponsAdmin);
router.put('/coupons/:id/extend', protect, adminOnly, extendCouponExpiryAdmin);

// Customer soft delete & 24h recovery endpoints
router.delete('/customers/:id', protect, adminOnly, deleteCustomer);
router.get('/deleted-customers', protect, adminOnly, getDeletedCustomers);
router.post('/customers/:id/restore', protect, adminOnly, restoreCustomer);
router.delete('/customers/:id/permanent', protect, adminOnly, permanentDeleteCustomer);

export default router;
