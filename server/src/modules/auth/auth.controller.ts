import type { Request, Response } from 'express';
import { z } from 'zod';
import * as authScheme from './auth.validator';
import * as service from './auth.service';
import { logError } from '../../utils/logger';
import { ResponseUtil } from '../../utils/responseUtils';
import { setTokenCookies, clearTokenCookies } from '../../utils/tokenUtils';
import { AppError } from '../../utils/errors';

// Error mapper
function handleError(res: Response, error: unknown, context: string): void {
  if (error instanceof z.ZodError) {
    ResponseUtil.badRequest(res, 'Invalid request parameters');
    return;
  }
  if (error instanceof service.UnauthorizedError) {
    ResponseUtil.unauthorized(res, error.message);
    return;
  }
  if (error instanceof service.RateLimitError) {
    ResponseUtil.rateLimitExceeded(res, error.message);
    return;
  }
  if (error instanceof service.BadRequestError) {
    ResponseUtil.badRequest(res, error.message);
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
    const parseResult = authScheme.resetPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      ResponseUtil.badRequest(res, 'Invalid request');
      return;
    }

    const ip = req.ip ?? 'unknown';
    const userAgent = req.get('user-agent') ?? 'unknown';

    await service.processResetPassword(parseResult.data, ip, userAgent);

    ResponseUtil.success(res, 'Password reset successful. Please log in with your new password.');
  } catch (e) {
    handleError(res, e, 'resetPassword');
  }
};
