import { handleError } from '../../utils/errors';
import { ResponseUtil } from '../../utils/responseUtils';
import { setTokenCookies, clearTokenCookies } from '../../utils/tokenUtils';
import * as service from './auth.service';
import type * as authScheme from './auth.validator';
import type { Request, Response } from 'express';
import type { z } from 'zod';


export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const dto = req.validated?.body as z.infer<typeof authScheme.registerSchema>;
    const userId = await service.registerUser(dto);

    ResponseUtil.created(res, 'User registered successfully! Please login.', { userId });
  } catch (e) {
    handleError(res, e, 'register');
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const dto = req.validated?.body as z.infer<typeof authScheme.loginSchema>;
    const ip = req.ip ?? 'unknown';
    const userAgent = req.get('user-agent') ?? 'unknown';

    const result = await service.loginUser(dto, ip, userAgent);

    setTokenCookies(res, result.accessToken, result.refreshToken);

    ResponseUtil.success(res, 'User logged in successfully', {
      userId: result.userId,
      username: result.username,
      email: result.email,
    });
  } catch (e) {
    handleError(res, e, 'login');
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const decodedToken = req.token?.decoded;
    const storedToken = req.token?.stored;

    const result = await service.rotateRefreshToken(storedToken, decodedToken);

    setTokenCookies(res, result.accessToken, result.refreshToken);

    ResponseUtil.success(res, 'Refresh token generated successfully', {
      userId: result.userId,
      username: result.username,
      email: result.email,
    });
  } catch (e) {
    handleError(res, e, 'refreshToken');
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      ResponseUtil.unauthorized(res, 'Unauthorized');
      return;
    }

    const storedToken = req.token?.stored;
    await service.logoutUser(userId, storedToken);

    clearTokenCookies(res);

    ResponseUtil.success(res, 'Logout successful');
  } catch (e) {
    handleError(res, e, 'logout');
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const dto = req.validated?.body as z.infer<typeof authScheme.forgotPasswordSchema>;
    const ip = req.ip ?? 'unknown';
    const userAgent = req.get('user-agent') ?? 'unknown';

    await service.processForgotPassword(dto, ip, userAgent);

    ResponseUtil.success(res, 'If an account exists, a reset link has been sent.');
  } catch (e) {
    handleError(res, e, 'forgotPassword');
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const dto = req.validated?.body as z.infer<typeof authScheme.resetPasswordSchema>;

    const ip = req.ip ?? 'unknown';
    const userAgent = req.get('user-agent') ?? 'unknown';

    await service.processResetPassword(dto, ip, userAgent);

    ResponseUtil.success(res, 'Password reset successful. Please log in with your new password.');
  } catch (e) {
    handleError(res, e, 'resetPassword');
  }
};
