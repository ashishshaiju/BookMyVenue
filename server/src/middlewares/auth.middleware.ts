import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import type { RefreshTokenPayload, TokenPayload } from '../types/express';
import { ResponseUtil } from '../utils/responseUtils';
import { RefreshTokenModel } from '../modules/auth/models/refresh-token.model';
import { SessionModel } from '../models/session.model';
import { tokenVerifyOptions } from '../utils/tokenUtils';
import { TokenRevocationReason } from '../constants/auth.constants';
import crypto from 'crypto';
import { logWarn, logError } from '../utils/logger';

export const verifyAccessToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const accessToken = req.cookies.accessToken as string | undefined;

    if (!accessToken) {
      logWarn('Access token missing', { path: req.path, method: req.method });
      ResponseUtil.unauthorized(res, 'Access token required');
      return;
    }

    const accessSecret = process.env.JWT_ACCESS_SECRET;
    if (!accessSecret) {
      logError('JWT_ACCESS_SECRET not configured', { path: req.path });
      ResponseUtil.internalServerError(res, 'Server configuration error');
      return;
    }

    const decoded = jwt.verify(accessToken, accessSecret, tokenVerifyOptions) as TokenPayload;

    if (!decoded.id || !decoded.username || !decoded.email) {
      logWarn('Invalid access token payload', { path: req.path });
      ResponseUtil.unauthorized(res, 'Invalid access token');
      return;
    }

    req.user = {
      userId: decoded.id,
      username: decoded.username,
      email: decoded.email,
      role: {},
    };

    next();
  } catch (error) {
    const authError = error as Error;
    logWarn('Access token verification failed', {
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
      logWarn('Refresh token missing', { path: req.path });
      ResponseUtil.unauthorized(res, 'Refresh token required');
      return;
    }

    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!refreshSecret) {
      logError('JWT_REFRESH_SECRET not configured', { path: req.path });
      ResponseUtil.internalServerError(res, 'Server configuration error');
      return;
    }

    const decoded = jwt.verify(
      refreshToken,
      refreshSecret,
      tokenVerifyOptions
    ) as RefreshTokenPayload;

    if (!decoded.id || !decoded.jti) {
      logWarn('Invalid refresh token payload', { path: req.path });
      ResponseUtil.unauthorized(res, 'Invalid refresh token');
      return;
    }

    const tokenHash = crypto.createHash('sha256').update(decoded.jti).digest('hex');

    const storedToken = await RefreshTokenModel.findOne({
      tokenHash,
      userId: new mongoose.Types.ObjectId(decoded.id),
      deleted: false,
    });

    if (!storedToken) {
      logWarn('Refresh token not found', { path: req.path });
      ResponseUtil.unauthorized(res, 'Invalid refresh token');
      return;
    }

    if (storedToken.expiresAt < new Date()) {
      logWarn('Refresh token expired', { path: req.path });
      ResponseUtil.unauthorized(res, 'Refresh token expired, please login again');
      return;
    }

    // Reuse detection
    if (!storedToken.active) {
      logWarn('Refresh token reuse detected — revoking entire token family', {
        path: req.path,
        rootTokenId: storedToken.rootTokenId.toString(),
        userId: decoded.id,
      });

      await RefreshTokenModel.updateMany(
        { rootTokenId: storedToken.rootTokenId },
        {
          $set: {
            active: false,
            revokedAt: new Date(),
            revokedReason: TokenRevocationReason.SUSPICIOUS_ACTIVITY,
          },
        }
      ).catch((err: unknown) => {
        const error = err as Error;
        logError('Failed to revoke token family on reuse detection', {
          error: error.message,
          rootTokenId: storedToken.rootTokenId.toString(),
        });
      });

      await SessionModel.findOneAndUpdate(
        { rootTokenId: storedToken.rootTokenId },
        { $set: { active: false } }
      ).catch((err: unknown) => {
        const error = err as Error;
        logError('Failed to deactivate session on reuse detection', {
          error: error.message,
          rootTokenId: storedToken.rootTokenId.toString(),
        });
      });

      ResponseUtil.unauthorized(res, 'Invalid refresh token');
      return;
    }

    // Session validation
    const session = await SessionModel.findOne({
      rootTokenId: storedToken.rootTokenId,
      deleted: false,
    });

    if (!session) {
      logWarn('Session not found for refresh token', { path: req.path });
      ResponseUtil.unauthorized(res, 'Invalid refresh token');
      return;
    }

    if (!session.active) {
      logWarn('Session is inactive', { path: req.path });
      ResponseUtil.unauthorized(res, 'Session has been terminated, please log in again');
      return;
    }

    if (session.absoluteExpiresAt < new Date()) {
      logWarn('Session absolute expiry reached', { path: req.path });
      ResponseUtil.unauthorized(res, 'Session expired, please log in again');
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
    logWarn('Refresh token verification failed', {
      error: authError.message,
    });

    if (authError.name === 'TokenExpiredError') {
      ResponseUtil.unauthorized(res, 'Refresh token expired');
      return;
    }

    ResponseUtil.unauthorized(res, 'Invalid refresh token');
  }
};
