import type { Request, Response } from 'express';
import { ResponseUtil } from '../../utils/responseUtils';
import * as service from './user.service';
import * as workflow from './user.workflow';
import { handleError } from '../../utils/errors';

interface BanUserRequest {
  banReason: string;
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

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const role = req.query.role as string | undefined;

    const result = await service.getAllUsers({ page, limit, skip: (page - 1) * limit, sort: '-createdAt' }, { role });
    ResponseUtil.success(res, 'Users retrieved successfully', result);
  } catch (e) {
    handleError(res, e, 'getAllUsers');
  }
};

export const toggleUserStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    
    // Prevent modifying own status
    if (req.user?.userId === userId) {
      ResponseUtil.badRequest(res, 'You cannot toggle your own status');
      return;
    }
    const user = await service.toggleUserStatus(userId as string);
    if (!user) {
      ResponseUtil.notFound(res, 'User not found');
      return;
    }

    ResponseUtil.success(res, `User is now ${user.active ? 'active' : 'inactive'}`, { active: user.active });
  } catch (e) {
    handleError(res, e, 'toggleUserStatus');
  }
};

export const resetUserPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    await workflow.resetUserPasswordWorkflow(userId as string);

    ResponseUtil.success(res, 'Password reset successfully, email dispatched');
  } catch (e) {
    const error = e as Error;
    if (error.message.includes('not found')) {
      ResponseUtil.notFound(res, error.message);
    } else {
      handleError(res, e, 'resetUserPassword');
    }
  }
};

export const banUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.userId;
    if (!adminId) {
      ResponseUtil.unauthorized(res, 'Unauthorized');
      return;
    }

    const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
    const { banReason } = req.body as BanUserRequest;

    if (!banReason || banReason.trim().length < 10) {
      ResponseUtil.badRequest(res, 'Ban reason must be at least 10 characters');
      return;
    }

    const user = await service.banUser(userId, adminId, banReason);
    ResponseUtil.success(res, 'User banned successfully', { username: user.username, isBanned: user.isBanned });
  } catch (e) {
    handleError(res, e, 'banUser');
  }
};

export const unbanUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
    const user = await service.unbanUser(userId);
    ResponseUtil.success(res, 'User unbanned successfully', { username: user.username });
  } catch (e) {
    handleError(res, e, 'unbanUser');
  }
};
