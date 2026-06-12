import { Router } from 'express';
import { verifyAccessToken } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';
import { PERMISSIONS as P } from '../../constants/permissions';
import * as controller from './venue.controller';

const router: Router = Router();

// ── Owner Routes ──────────────────────────────────────────────────────────────

router.post(
  '/',
  verifyAccessToken,
  requirePermission(P.venues.create),
  controller.createVenue
);

router.get(
  '/my-venues',
  verifyAccessToken,
  requirePermission(P.venues.read),
  controller.getMyVenues
);

// ── Admin Routes (static segments) ────────────────────────────────────────────

router.get(
  '/pending',
  verifyAccessToken,
  requirePermission(P.venues.activate), // reusing activate logic for approval perms
  controller.getPendingVenues
);

router.get(
  '/all',
  verifyAccessToken,
  requirePermission(P.venues.activate), // reusing activate logic for admin viewing
  controller.getAllVenues
);

// ── Parameterised Owner Routes ────────────────────────────────────────────────

router.get(
  '/:id',
  verifyAccessToken,
  requirePermission(P.venues.read),
  controller.getVenueById
);

router.put(
  '/:id',
  verifyAccessToken,
  requirePermission(P.venues.update),
  controller.updateVenue
);

router.delete(
  '/:id',
  verifyAccessToken,
  requirePermission(P.venues.delete),
  controller.deleteVenue
);

router.post(
  '/:id/submit',
  verifyAccessToken,
  requirePermission(P.venues.update),
  controller.submitVenue
);

// ── Parameterised Admin Routes ────────────────────────────────────────────────

// Note: venues only have activate/deactivate in PERMISSIONS (unlike property which had approve/reject).
// We will use activate/deactivate permissions to cover approve/reject logic for now,
// or we could add approve/reject to venues in constants. Let's use activate for approve, and deactivate for reject.

router.post(
  '/:id/approve',
  verifyAccessToken,
  requirePermission(P.venues.activate),
  controller.approveVenue
);

router.post(
  '/:id/reject',
  verifyAccessToken,
  requirePermission(P.venues.deactivate),
  controller.rejectVenue
);

router.post(
  '/:id/activate',
  verifyAccessToken,
  requirePermission(P.venues.activate),
  controller.activateVenue
);

router.post(
  '/:id/deactivate',
  verifyAccessToken,
  requirePermission(P.venues.deactivate),
  controller.deactivateVenue
);

export { router as venueRouter };
