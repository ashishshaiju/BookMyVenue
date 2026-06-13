import { Router } from 'express';
import { verifyAccessToken } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';
import { PERMISSIONS as P } from '../../constants/permissions';
import * as controller from './venue.controller';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../middlewares/validation.middleware';
import * as validator from './venue.validator';

const router: Router = Router();

// Owner Routes
router
  .route('/')
  .post(
    verifyAccessToken,
    requirePermission(P.venues.create),
    validateBody(validator.createVenueSchema),
    controller.createVenue
  );
router
  .route('/my-venues')
  .get(verifyAccessToken, requirePermission(P.venues.read), controller.getMyVenues);

// Admin Routes
router
  .route('/pending')
  .get(verifyAccessToken, requirePermission(P.venues.activate), controller.getPendingVenues);

router
  .route('/all')
  .get(
    verifyAccessToken,
    requirePermission(P.venues.activate),
    validateQuery(validator.adminVenueFiltersSchema),
    controller.getAllVenues
  );

// Parameterised Owner Routes
router
  .route('/:id')
  .get(
    requirePermission(P.venues.read),
    validateParams(validator.venueIdParamSchema),
    controller.getVenueById
  )
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

router
  .route('/:id/submit')
  .post(
    verifyAccessToken,
    requirePermission(P.venues.update),
    validateParams(validator.venueIdParamSchema),
    controller.submitVenue
  );

// Parameterised Admin Routes
router
  .route('/:id/approve')
  .post(
    verifyAccessToken,
    requirePermission(P.venues.activate),
    validateParams(validator.venueIdParamSchema),
    controller.approveVenue
  );

router
  .route('/:id/reject')
  .post(
    verifyAccessToken,
    requirePermission(P.venues.deactivate),
    validateParams(validator.venueIdParamSchema),
    validateBody(validator.rejectVenueSchema),
    controller.rejectVenue
  );

router
  .route('/:id/activate')
  .post(
    verifyAccessToken,
    requirePermission(P.venues.activate),
    validateParams(validator.venueIdParamSchema),
    controller.activateVenue
  );

router
  .route('/:id/deactivate')
  .post(
    verifyAccessToken,
    requirePermission(P.venues.deactivate),
    validateParams(validator.venueIdParamSchema),
    controller.deactivateVenue
  );

export { router as venueRouter };
