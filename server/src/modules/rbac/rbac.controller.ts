import type { Request, Response } from 'express';
import { ResponseUtil } from '../../utils/responseUtils';
import { getStats, clearAll, invalidateRole } from '../../services/cache/permission-cache.service';

export const rbacController = {
  getCacheStats: (_req: Request, res: Response): void => {
    ResponseUtil.success(res, 'Cache stats retrieved', getStats());
  },

  clearCache: (_req: Request, res: Response): void => {
    clearAll();
    ResponseUtil.success(res, 'Permission cache cleared');
  },

  invalidateRoleCache: (req: Request, res: Response): void => {
    invalidateRole(String(req.params.roleId));
    ResponseUtil.success(res, `Cache invalidated for role ${String(req.params.roleId)}`);
  }
};
