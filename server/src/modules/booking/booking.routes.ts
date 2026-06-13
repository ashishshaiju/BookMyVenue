import { Router } from 'express';
import { ResponseUtil } from '../../utils/responseUtils';
import { verifyAccessToken } from '../../middlewares/auth.middleware';
import { requirePermission } from '../../middlewares/rbac.middleware';
import { PERMISSIONS as P } from '../../constants/permissions';

const router: Router = Router();

router
  .route('/')
  .get(verifyAccessToken, requirePermission(P.bookings.read), (_req, res) => {
    ResponseUtil.success(res, 'read bookings — replace with controller');
  })
  .post(verifyAccessToken, requirePermission(P.bookings.create), (_req, res) => {
    ResponseUtil.success(res, 'create booking — replace with controller');
  });

router
  .route('/:bookingId')
  .get(verifyAccessToken, requirePermission(P.bookings.read), (_req, res) => {
    ResponseUtil.success(res, 'read booking by ID — replace with controller');
  })
  .put(verifyAccessToken, requirePermission(P.bookings.update), (_req, res) => {
    ResponseUtil.success(res, 'update booking by ID — replace with controller');
  })
  .delete(verifyAccessToken, requirePermission(P.bookings.delete), (_req, res) => {
    ResponseUtil.success(res, 'delete booking by ID — replace with controller');
  });

export { router as bookingRouter };
