import { Router } from 'express';
import { verifyAccessToken } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';
import { ownerTenantMiddleware } from '../../middlewares/ownerTenant.middleware';
import { validateBody, validateParams } from '../../middlewares/validation.middleware';
import { PERMISSIONS as P } from '../../constants/permissions';
import * as controller from './owner.controller';
import * as validator from './owner.validator';

const router: Router = Router();

/**
 * @openapi
 * /owner/analytics/{venueId}:
 *   get:
 *     tags: [Owner]
 *     summary: Get analytics for a specific venue
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: venueId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Venue analytics data
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 */
router.get(
  '/analytics/:venueId',
  verifyAccessToken,
  requirePermission(P.venues.read),
  validateParams(validator.analyticsParamsSchema),
  ownerTenantMiddleware,
  controller.getVenueAnalytics
);

/**
 * @openapi
 * /owner/{venueId}/block-dates:
 *   post:
 *     tags: [Owner]
 *     summary: Block dates for a venue
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: venueId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [startDate, endDate]
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Dates blocked successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 */
router.post(
  '/:venueId/block-dates',
  verifyAccessToken,
  requirePermission(P.venues.update),
  validateParams(validator.analyticsParamsSchema),
  validateBody(validator.blockDatesSchema),
  ownerTenantMiddleware,
  controller.blockDates
);

/**
 * @openapi
 * /owner/{venueId}/unblock-dates:
 *   post:
 *     tags: [Owner]
 *     summary: Unblock dates for a venue
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: venueId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [startDate, endDate]
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Dates unblocked successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 */
router.post(
  '/:venueId/unblock-dates',
  verifyAccessToken,
  requirePermission(P.venues.update),
  validateParams(validator.analyticsParamsSchema),
  validateBody(validator.unblockDatesSchema),
  ownerTenantMiddleware,
  controller.unblockDates
);

/**
 * @openapi
 * /owner/venue/{venueId}/bookings:
 *   get:
 *     tags: [Owner]
 *     summary: Get all bookings for a specific venue
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: venueId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of venue bookings
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 */
router.get(
  '/venue/:venueId/bookings',
  verifyAccessToken,
  requirePermission(P.bookings.read),
  validateParams(validator.analyticsParamsSchema),
  ownerTenantMiddleware,
  controller.getVenueBookings
);

/**
 * @openapi
 * /owner/venue/{venueId}/availability-calendar:
 *   get:
 *     tags: [Owner]
 *     summary: Get availability calendar for a venue
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: venueId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Availability calendar data
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 */
router.get(
  '/venue/:venueId/availability-calendar',
  verifyAccessToken,
  requirePermission(P.venues.read),
  validateParams(validator.analyticsParamsSchema),
  ownerTenantMiddleware,
  controller.getVenueAvailabilityCalendar
);

/**
 * @openapi
 * /owner/bookings/offline:
 *   post:
 *     tags: [Owner]
 *     summary: Create an offline booking
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [venueId, date, startTime, endTime, customerName, customerPhone]
 *             properties:
 *               venueId:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               startTime:
 *                 type: integer
 *               endTime:
 *                 type: integer
 *               customerName:
 *                 type: string
 *               customerPhone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Offline booking created successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 */
router.post(
  '/bookings/offline',
  verifyAccessToken,
  requirePermission(P.bookings.create),
  validateBody(validator.offlineBookingSchema),
  ownerTenantMiddleware,
  controller.createOfflineBooking
);

export default router;
