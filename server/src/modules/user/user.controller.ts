import type { Request, Response } from "express";
import { ResponseUtil } from "../../utils/responseUtils";
import { UserModel } from "../user/user.models";

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      ResponseUtil.unauthorized(res, 'Unauthorized');
      return;
    }

    const user = await UserModel.findById(userId).select('-password');

    if (!user) {
      ResponseUtil.notFound(res, 'User not found');
      return;
    }

    ResponseUtil.success(res, 'User profile retrieved successfully', {
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
    });
  } catch (e) {
    const error = e as Error;
    console.error('Failed to fetch user info', {
      error: error.message,
      stack: error.stack,
    });
    ResponseUtil.internalServerError(res, 'Server error');
  }
};