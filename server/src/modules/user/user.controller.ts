import type { Request, Response } from 'express';
import { ResponseUtil } from '../../utils/responseUtils';
import * as service from './user.service';
import { logError } from '../../utils/logger';
import { AppError, NotFoundError } from '../../utils/errors';

// Error mapper
function handleError(res: Response, error: unknown, context: string): void {
  if (error instanceof NotFoundError) {
    ResponseUtil.notFound(res, error.message);
    return;
  }
  if (error instanceof AppError) {
    ResponseUtil.error(res, error.message, undefined, error.statusCode);
    return;
  }

  const err = error as Error;
  logError(`${context}: unexpected error`, { error: err.message, stack: err.stack });
  ResponseUtil.internalServerError(res, 'Server error');
}

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