import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { RefreshTokenPayload, TokenPayload } from '../types/express';
import { ResponseUtil } from '../utils/responseUtils';
import { RefreshTokenModel } from '../modules/auth/models/refresh-token.model';
import crypto from 'crypto';
import { jwtConfig } from '../constants/env';

export const tokenVerifyOptions: jwt.VerifyOptions = {
  issuer: jwtConfig.issuer,
  audience: jwtConfig.audience,
  algorithms: [jwtConfig.algorithm],
};

export const verifyAccessToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const accessToken = req.cookies.accessToken as string | undefined;

    if (!accessToken) {
      console.warn('Access token missing', { path: req.path, method: req.method });
      ResponseUtil.unauthorized(res, 'Access token required');
      return;
    }

    const accessSecret = process.env.JWT_ACCESS_SECRET;
    if (!accessSecret) {
      console.error('JWT_ACCESS_SECRET not configured', { path: req.path });
      ResponseUtil.internalServerError(res, 'Server configuration error');
      return;
    }

    const decoded = jwt.verify(accessToken, accessSecret, tokenVerifyOptions) as TokenPayload;

    if (!decoded.id || !decoded.username || !decoded.email ) {
      console.warn('Invalid access token payload', { path: req.path });
      ResponseUtil.unauthorized(res, 'Invalid access token');
      return;
    }

    req.user = {
      userId: decoded.id,
      username: decoded.username,
      email: decoded.email,
      role: {}, // permissions resolved lazily by loadPermissions when a guard runs
    };

    next();
  } catch (error) {
    const authError = error as Error;
    console.warn('Access token verification failed', {
      error: authError.message,
      path: req.path,
    });

    if (authError.name === 'TokenExpiredError') {
      ResponseUtil.unauthorized(res, 'Access token expired');
      return;
    }

    ResponseUtil.unauthorized(res, 'Invalid access token');
  }
};

export const verifyRefreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken as string | undefined;

    if (!refreshToken) {
      console.warn('Refresh token missing', { path: req.path });
      ResponseUtil.unauthorized(res, 'Refresh token required');
      return;
    }

    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!refreshSecret) {
      console.error('JWT_REFRESH_SECRET not configured', { path: req.path });
      ResponseUtil.internalServerError(res, 'Server configuration error');
      return;
    }

    const decoded = jwt.verify(
      refreshToken,
      refreshSecret,
      tokenVerifyOptions
    ) as RefreshTokenPayload;

    if (!decoded.id || !decoded.jti) {
      console.warn('Invalid refresh token payload', { path: req.path });
      ResponseUtil.unauthorized(res, 'Invalid refresh token');
      return;
    }

    const tokenHash = crypto.createHash('sha256').update(decoded.jti).digest('hex');

    const storedToken = await RefreshTokenModel.findOne({
      tokenHash,
      deleted: false,
    });

    if (!storedToken) {
      console.warn('Refresh token not found', { path: req.path });
      ResponseUtil.unauthorized(res, 'Invalid refresh token');
      return;
    }

    if (storedToken.expiresAt < new Date()) {
      console.warn('Refresh token expired', { path: req.path });
      ResponseUtil.unauthorized(res, 'Refresh token expired, please login again');
      return;
    }

    if (!storedToken.active || storedToken.isUsed) {
      console.warn('Used or inactive refresh token', { path: req.path });
      ResponseUtil.badRequest(res, 'Invalid refresh token');
      return;
    }

    req.token = {
      decoded: {
        id: decoded.id,
        jti: decoded.jti,
      },
      stored: storedToken,
    };

    next();
  } catch (error) {
    const authError = error as Error;
    console.warn('Refresh token verification failed', {
      error: authError.message,
    });

    if (authError.name === 'TokenExpiredError') {
      ResponseUtil.unauthorized(res, 'Refresh token expired');
      return;
    }

    ResponseUtil.unauthorized(res, 'Invalid refresh token');
  }
};
