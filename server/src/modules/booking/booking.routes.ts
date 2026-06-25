import { Router } from 'express';
import { ResponseUtil } from '../../utils/responseUtils';
import { verifyAccessToken } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';
import { validateBody } from '../../middlewares/validation.middleware';
import { PERMISSIONS as P } from '../../constants/permissions';
import { checkoutBodySchema, verifyPaymentBodySchema } from './booking.validator';
import { initCheckout, verifyPayment } from './booking.controller';

const router: Router = Router();

/**
 * @openapi
 * /bookings/checkout:
 *   post:
 *     tags: [Bookings]
 *     summary: Initiate checkout — create a Razorpay order (Step 2 of 3)
 *     description: |
 *       Validates the slot lock is still alive and within the buffer window,
 *       then creates a Razorpay order. Requires a valid `lockId` from Step 1.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lockId]
 *             properties:
 *               lockId:
 *                 type: string
 *                 description: MongoDB ObjectId returned from /availability/:id/block
 *                 example: 64b1f2c3d4e5f6a7b8c9d0e2
 *     responses:
 *       200:
 *         description: Razorpay order created — return order ID to client for payment
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         orderId:
 *                           type: string
 *                         amount:
 *                           type: integer
 *                           description: Amount in paise
 *                         currency:
 *                           type: string
 *                           example: INR
 *       400:
 *         description: Invalid lockId or lock expired
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 *       409:
 *         description: Lock no longer valid or slot taken
 */
router
  .route('/checkout')
  .post(
    verifyAccessToken,
    requirePermission(P.bookings.create),
    validateBody(checkoutBodySchema),
    initCheckout
  );

/**
 * @openapi
 * /bookings/verify-payment:
 *   post:
 *     tags: [Bookings]
 *     summary: Verify Razorpay payment signature (Step 3 of 3)
 *     description: |
 *       Client-side verification step called after the Razorpay payment modal closes.
 *       The server re-verifies the HMAC signature before confirming the booking.
 *       Final booking creation is triggered by the Razorpay webhook automatically.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, paymentId, signature]
 *             properties:
 *               orderId:
 *                 type: string
 *                 example: order_OIBFHxxx
 *               paymentId:
 *                 type: string
 *                 example: pay_OIBFHyyy
 *               signature:
 *                 type: string
 *                 example: abc123hmac
 *     responses:
 *       200:
 *         description: Payment signature verified
 *       400:
 *         description: Invalid or mismatched signature
 *       401:
 *         description: Not authenticated
 */
router
  .route('/verify-payment')
  .post(
    verifyAccessToken,
    requirePermission(P.bookings.create),
    validateBody(verifyPaymentBodySchema),
    verifyPayment
  );

/**
 * @openapi
 * /bookings:
 *   get:
 *     tags: [Bookings]
 *     summary: List the authenticated user's bookings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of bookings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Not authenticated
 */
router
  .route('/')
  .get(verifyAccessToken, requirePermission(P.bookings.read), (_req, res) => {
    ResponseUtil.success(res, 'read bookings — controller not yet implemented');
  });

/**
 * @openapi
 * /bookings/{bookingId}:
 *   get:
 *     tags: [Bookings]
 *     summary: Get a booking by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking details
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Booking not found
 *   put:
 *     tags: [Bookings]
 *     summary: Update a booking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Booking updated
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Booking not found
 *   delete:
 *     tags: [Bookings]
 *     summary: Cancel a booking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking cancelled
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Booking not found
 */
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
