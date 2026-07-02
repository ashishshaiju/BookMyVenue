import { Router } from 'express';
import { verifyAccessToken } from '../../middlewares/auth.middleware';
import { requirePermission, requireRole } from '../../middlewares/rbac.middleware';
import { PERMISSIONS as P } from '../../constants/permissions';
import * as controller from './venue.controller';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../middlewares/validation.middleware';
import * as validator from './venue.validator';
import rateLimit from 'express-rate-limit';
import { paginationMiddleware } from '../../middlewares/pagination.middleware';

const router: Router = Router();

const uploadSignatureLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 10,
  message: 'Too many upload requests, please try again later',
});

/**
 * @openapi
 * /venues/upload-signature:
 *   get:
 *     tags: [Venues]
 *     summary: Get a Cloudinary upload signature for direct browser uploads
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cloudinary signature and upload parameters
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
 *                         signature:
 *                           type: string
 *                         timestamp:
 *                           type: integer
 *                         cloudName:
 *                           type: string
 *                         apiKey:
 *                           type: string
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 *       429:
 *         description: Too many upload signature requests
 */
router
  .route('/upload-signature')
  .get(
    verifyAccessToken,
    uploadSignatureLimiter,
    controller.getUploadSignature
  );

/**
 * @openapi
 * /venues:
 *   post:
 *     tags: [Venues]
 *     summary: Create a new venue
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Venue creation payload — validated by createVenueSchema
 *     responses:
 *       201:
 *         description: Venue created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 *   get:
 *     tags: [Venues]
 *     summary: List active venues (public, paginated)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: minCapacity
 *         schema:
 *           type: integer
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Paginated list of active venues
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     meta:
 *                       $ref: '#/components/schemas/PaginatedMeta'
 */
router
  .route('/')
  .post(
    verifyAccessToken,
    validateBody(validator.createVenueSchema),
    controller.createVenue
  )
  .get(
    validateQuery(validator.publicVenueFiltersSchema),
    paginationMiddleware(),
    controller.getPaginatedActiveVenues
  );

/**
 * @openapi
 * /venues/my-venues:
 *   get:
 *     tags: [Venues]
 *     summary: List the authenticated owner's venues
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of venues owned by the current user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 */
router
  .route('/my-venues')
  .get(verifyAccessToken, requirePermission(P.venues.read), controller.getMyVenues);

/**
 * @openapi
 * /venues/draft:
 *   put:
 *     tags: [Venues]
 *     summary: Create or update the owner's draft venue
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Partial venue payload for draft persistence
 *     responses:
 *       200:
 *         description: Draft saved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Not authenticated
 *   get:
 *     tags: [Venues]
 *     summary: Get the owner's current draft venue
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Draft venue object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: No draft found
 */
router
  .route('/draft')
  .put(
    verifyAccessToken,
    controller.upsertDraft
  )
  .get(
    verifyAccessToken,
    requirePermission(P.venues.read),
    controller.getMyDraft
  );

/**
 * @openapi
 * /venues/pending:
 *   get:
 *     tags: [Venues]
 *     summary: List venues pending admin approval (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of pending venues
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Admin role required
 */
router
  .route('/pending')
  .get(
    verifyAccessToken,
    requireRole('admin'),
    requirePermission(P.venues.activate),
    controller.getPendingVenues
  );

/**
 * @openapi
 * /venues/all:
 *   get:
 *     tags: [Venues]
 *     summary: List all venues regardless of status (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, pending, active, rejected, deactivated]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated list of all venues
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Admin role required
 */
router
  .route('/all')
  .get(
    verifyAccessToken,
    requireRole('admin'),
    requirePermission(P.venues.activate),
    validateQuery(validator.adminVenueFiltersSchema),
    paginationMiddleware(),
    controller.getAllVenues
  );

/**
 * @openapi
 * /venues/{id}:
 *   get:
 *     tags: [Venues]
 *     summary: Get a venue by ID (public)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: 64b1f2c3d4e5f6a7b8c9d0e1
 *     responses:
 *       200:
 *         description: Venue details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid venue ID format
 *       404:
 *         description: Venue not found
 *   put:
 *     tags: [Venues]
 *     summary: Update a venue (owner)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Fields to update — validated by updateVenueSchema
 *     responses:
 *       200:
 *         description: Venue updated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Venue not found
 *   delete:
 *     tags: [Venues]
 *     summary: Delete a venue (owner)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Venue deleted
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Venue not found
 */
router
  .route('/:id')
  .get(validateParams(validator.venueIdParamSchema), controller.getVenueById)
  .put(
    verifyAccessToken,
    requirePermission(P.venues.update),
    validateParams(validator.venueIdParamSchema),
    validateBody(validator.updateVenueSchema),
    controller.updateVenue
  )
  .delete(
    verifyAccessToken,
    requirePermission(P.venues.delete),
    validateParams(validator.venueIdParamSchema),
    controller.deleteVenue
  );

/**
 * @openapi
 * /venues/{id}/submit:
 *   post:
 *     tags: [Venues]
 *     summary: Submit a venue for admin review
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Venue submitted for review
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Venue not found
 */
router
  .route('/:id/submit')
  .post(
    verifyAccessToken,
    requirePermission(P.venues.update),
    validateParams(validator.venueIdParamSchema),
    controller.submitVenue
  );

/**
 * @openapi
 * /venues/{id}/approve:
 *   post:
 *     tags: [Venues]
 *     summary: Approve a venue (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Venue approved and set to active
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Admin role required
 *       404:
 *         description: Venue not found
 */
router
  .route('/:id/approve')
  .post(
    verifyAccessToken,
    requireRole('admin'),
    requirePermission(P.venues.activate),
    validateParams(validator.venueIdParamSchema),
    controller.approveVenue
  );

/**
 * @openapi
 * /venues/{id}/reject:
 *   post:
 *     tags: [Venues]
 *     summary: Reject a venue with a reason (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *                 example: Images do not meet quality standards
 *     responses:
 *       200:
 *         description: Venue rejected
 *       400:
 *         description: Rejection reason required
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Admin role required
 *       404:
 *         description: Venue not found
 */
router
  .route('/:id/reject')
  .post(
    verifyAccessToken,
    requireRole('admin'),
    requirePermission(P.venues.deactivate),
    validateParams(validator.venueIdParamSchema),
    validateBody(validator.rejectVenueSchema),
    controller.rejectVenue
  );

/**
 * @openapi
 * /venues/{id}/unsuspend:
 *   post:
 *     tags: [Venues]
 *     summary: Activate a venue (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Venue activated
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Admin role required
 *       404:
 *         description: Venue not found
 */
router
  .route('/:id/unsuspend')
  .post(
    verifyAccessToken,
    requireRole('admin'),
    requirePermission(P.venues.activate),
    validateParams(validator.venueIdParamSchema),
    controller.unsuspendVenue
  );

/**
 * @openapi
 * /venues/{id}/deactivate:
 *   post:
 *     tags: [Venues]
 *     summary: Deactivate a venue (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Venue deactivated
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Admin role required
 *       404:
 *         description: Venue not found
 */
router
  .route('/:id/deactivate')
  .post(
    verifyAccessToken,
    requireRole('admin'),
    requirePermission(P.venues.deactivate),
    validateParams(validator.venueIdParamSchema),
    validateBody(validator.suspendVenueSchema),
    controller.suspendVenue
  );

/**
 * @openapi
 * /venues/{id}/feature:
 *   post:
 *     tags: [Venues]
 *     summary: Feature a venue (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [duration]
 *             properties:
 *               duration:
 *                 type: integer
 *                 nullable: true
 *                 description: Duration in days to feature, or null for indefinite
 *     responses:
 *       200:
 *         description: Venue featured status updated
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Admin role required
 *       404:
 *         description: Venue not found
 *       409:
 *         description: Only approved venues can be featured
 */
router
  .route('/:id/feature')
  .post(
    verifyAccessToken,
    requireRole('admin'),
    requirePermission(P.venues.activate),
    validateParams(validator.venueIdParamSchema),
    validateBody(validator.featureVenueSchema),
    controller.featureVenue
  );

export { router as venueRouter };
