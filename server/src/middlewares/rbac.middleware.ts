import type { NextFunction, Request, Response } from 'express';
import { ResponseUtil } from '../utils/responseUtils';
import { getUserRole } from '../services/roles.service';
import { getPerms } from '../services/cache/permission-cache.service';
import type { IPermission } from '../constants/permissions';

/**
 * Resolves and attaches permissions to req.user.role.
 * Must run AFTER verifyAccessToken.
 *
 * Called internally by requirePermission and requireSuperAdmin —
 * not used directly in route definitions.
 *
 * DB cost:
 *   Cache hit  → 1 query  (getUserRole to resolve userId → roleId)
 *   Cache miss → 2 queries (getUserRole + fetchRolePermissions $graphLookup)
 *
 * Returns true if permissions were successfully loaded, false if the response
 * has already been sent (caller must return immediately on false).
 */
export const loadPermissions = async (req: Request, res: Response): Promise<boolean> => {
  const { user } = req;

  if (!user?.userId) {
    ResponseUtil.unauthorized(res, 'Unauthorized');
    return false;
  }

  // Idempotent within a single request — skip if already resolved
  if (user.role.permissions) return true;

  const { userId } = user;

  // Use role already on req.user if available (e.g. embedded later via JWT),
  // otherwise fall back to DB lookup
  const userRole =
    user.role.id && user.role.name
      ? { roleId: user.role.id, roleName: user.role.name }
      : await getUserRole(userId);

  if (!userRole) {
    ResponseUtil.unauthorized(res, 'Unauthorized');
    return false;
  }

  user.role.id = userRole.roleId;
  user.role.name = userRole.roleName;

  const permissions = await getPerms(userRole.roleId, userRole.roleName);

  user.role.permissions = new Set<IPermission>(permissions);
  user.role.isSuperAdmin = userRole.roleName === 'superAdmin';

  return true;
};

/**
 * Route guard — the user must hold ALL of the listed permissions.
 * superAdmin bypasses the check entirely.
 *
 * Usage:
 *   router.post('/', verifyAccessToken, requirePermission(P.properties.create), handler)
 *   router.put('/:id', verifyAccessToken, requirePermission(P.venues.update), handler)
 *
 * Note: requirePermission only checks WHETHER the user CAN perform the action.
 * Ownership (e.g. venue belongs to req.user) must be validated in the controller/service.
 */
export const requirePermission = (...required: IPermission[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.userId;

    if (!userId) {
      ResponseUtil.unauthorized(res, 'Unauthorized');
      return;
    }

    try {
      const loaded = await loadPermissions(req, res);
      if (!loaded) return;

      // superAdmin always passes
      if (req.user?.role.isSuperAdmin) {
        next();
        return;
      }

      const userPerms = req.user?.role.permissions;

      if (!userPerms) {
        console.warn('requirePermission: user has no permissions', { userId, path: req.path });
        ResponseUtil.unauthorized(res, 'Unauthorized');
        return;
      }

      const permitted = required.every((p) => userPerms.has(p));

      if (!permitted) {
        console.warn('requirePermission: access denied', {
          userId,
          required,
          path: req.path,
          method: req.method,
        });
        ResponseUtil.forbidden(res, 'Forbidden');
        return;
      }

      next();
    } catch (e) {
      const error = e as Error;
      console.error('requirePermission: unexpected error', { error: error.message, userId });
      ResponseUtil.internalServerError(res, 'Server error');
    }
  };
};

/**
 * Route guard — restricts access to superAdmin role only.
 * Use for RBAC management routes (cache invalidation, role/permission editing).
 *
 * Usage:
 *   router.get('/stats', verifyAccessToken, requireSuperAdmin, handler)
 */
export const requireSuperAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = req.user?.userId;

  if (!userId) {
    ResponseUtil.unauthorized(res, 'Unauthorized');
    return;
  }

  try {
    const loaded = await loadPermissions(req, res);
    if (!loaded) return;

    if (!req.user?.role.isSuperAdmin) {
      console.warn('requireSuperAdmin: access denied', { userId, path: req.path });
      ResponseUtil.forbidden(res, 'Forbidden');
      return;
    }

    next();
  } catch (e) {
    const error = e as Error;
    console.error('requireSuperAdmin: unexpected error', { error: error.message, userId });
    ResponseUtil.internalServerError(res, 'Server error');
  }
};
