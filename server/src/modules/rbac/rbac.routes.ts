import { Router } from 'express';
import { verifyAccessToken } from '../../middlewares/auth.middleware';
import { requireSuperAdmin } from '../../middlewares/rbac.middleware';
import { rbacController } from './rbac.controller';

const router: Router = Router();

// Permission cache management (superAdmin only)
router
  .route('/cache')
  .get(verifyAccessToken, requireSuperAdmin, rbacController.getCacheStats)
  .delete(verifyAccessToken, requireSuperAdmin, rbacController.clearCache);

router
  .route('/cache/:roleId')
  .delete(verifyAccessToken, requireSuperAdmin, rbacController.invalidateRoleCache);

export { router as rbacRouter };
