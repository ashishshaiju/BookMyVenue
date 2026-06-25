import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { validateBody, validateParams, validateQuery } from '../../middlewares/validation.middleware';
import { verifyAccessToken } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';
import { PERMISSIONS as P } from '../../constants/permissions';
import { venueIdParamSchema } from '../venue/venue.validator';
import { blockSlotBodySchema } from '../booking/booking.validator';
import { blockSlot } from '../booking/booking.controller';
import * as availabilityController from './availability.controller';

const router: ExpressRouter = Router();

import { availabilityQuerySchema } from './availability.validator';

router
.route('/:id')
.get(
  validateParams(venueIdParamSchema),
  validateQuery(availabilityQuerySchema),
  availabilityController.getVenueAvailability
);

// POST /api/v1/availability/:id/block
// Step 1 of the 3-step booking flow: acquires a DB lock on the slot.
// Does NOT create a Razorpay order — that happens in Step 2 (checkout).
router
  .route('/:id/block')
  .post(
    verifyAccessToken,
    requirePermission(P.bookings.create),
    validateParams(venueIdParamSchema),
    validateBody(blockSlotBodySchema),
    blockSlot
  );

export { router as availabilityRouter };
