import { Router } from 'express';
import { ResponseUtil } from './utils/responseUtils';
import { authRouter } from './modules/auth/auth.routes';
import { userRouter } from './modules/user/user.routes';
import { venueRouter } from './modules/venue/venue.routes';
import { verifyAccessToken } from './middlewares/auth.middleware';
import { requirePermission, requireSuperAdmin } from './middlewares/rbac.middleware';
import { PERMISSIONS as P } from './constants/permissions';
import { getStats, clearAll, invalidateRole } from './services/cache/permission-cache.service';

const router: Router = Router();

router.get('/health', (_req, res) => {
  ResponseUtil.success(res, 'Service is healthy');
});

router.use('/auth', authRouter);
router.use('/user', userRouter);
router.use('/venues', venueRouter);

// Bookings
router.post(
  '/bookings',
  verifyAccessToken,
  requirePermission(P.bookings.create),
  (_req, res) => { ResponseUtil.success(res, 'create booking — replace with controller'); }
);

router.get(
  '/bookings',
  verifyAccessToken,
  requirePermission(P.bookings.read),
  (_req, res) => { ResponseUtil.success(res, 'read bookings — replace with controller'); }
);

// ── Permission cache management (superAdmin only) ─────────────────────────────

router.get('/rbac/cache/stats', verifyAccessToken, requireSuperAdmin, (_req, res) => {
  ResponseUtil.success(res, 'Cache stats retrieved', getStats());
});

router.delete('/rbac/cache', verifyAccessToken, requireSuperAdmin, (_req, res) => {
  clearAll();
  ResponseUtil.success(res, 'Permission cache cleared');
});

router.delete('/rbac/cache/:roleId', verifyAccessToken, requireSuperAdmin, (req, res) => {
  invalidateRole(String(req.params.roleId));
  ResponseUtil.success(res, `Cache invalidated for role ${String(req.params.roleId)}`);
});

export default router;
