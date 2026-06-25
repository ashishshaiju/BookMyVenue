import { Router } from 'express';
import { ResponseUtil } from '../../utils/responseUtils';
import { verifyAccessToken } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';
import { validateBody } from '../../middlewares/validation.middleware';
import { PERMISSIONS as P } from '../../constants/permissions';
import { checkoutBodySchema, verifyPaymentBodySchema } from './booking.validator';
import { initCheckout, verifyPayment } from './booking.controller';

const router: Router = Router();

// ---------------------------------------------------------------------------
// POST /api/v1/bookings/checkout
// Step 2: Validate lock is alive + buffer check, then create Razorpay order.
// ---------------------------------------------------------------------------
router
  .route('/checkout')
  .post(
    verifyAccessToken,
    requirePermission(P.bookings.create),
    validateBody(checkoutBodySchema),
    initCheckout
  );

router
  .route('/verify-payment')
  .post(
    verifyAccessToken,
    requirePermission(P.bookings.create),
    validateBody(verifyPaymentBodySchema),
    verifyPayment
  );

// ---------------------------------------------------------------------------
// Booking CRUD (to be implemented)
// ---------------------------------------------------------------------------

router
  .route('/')
  .get(verifyAccessToken, requirePermission(P.bookings.read), (_req, res) => {
    ResponseUtil.success(res, 'read bookings — controller not yet implemented');
  });

router
  .route('/:bookingId')
  .get(verifyAccessToken, requirePermission(P.bookings.read), (_req, res) => {
    ResponseUtil.success(res, 'read booking by ID — controller not yet implemented');
  })
  .put(verifyAccessToken, requirePermission(P.bookings.update), (_req, res) => {
    ResponseUtil.success(res, 'update booking by ID — controller not yet implemented');
  })
  .delete(verifyAccessToken, requirePermission(P.bookings.delete), (_req, res) => {
    ResponseUtil.success(res, 'delete booking by ID — controller not yet implemented');
  });

export { router as bookingRouter };

