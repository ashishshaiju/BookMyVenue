import type { Request, Response } from 'express';
import { ResponseUtil } from '../../utils/responseUtils';
import * as service from './user.service';
import { handleError } from '../../utils/errors';


export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      ResponseUtil.unauthorized(res, 'Unauthorized');
      return;
    }

    const profile = await service.getProfile(userId);
    ResponseUtil.success(res, 'User profile retrieved successfully', profile);
  } catch (e) {
    handleError(res, e, 'getProfile');
  }
};
