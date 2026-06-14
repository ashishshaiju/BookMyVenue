import type { Request, Response } from 'express';
import crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { authEnvs } from '../../constants/env';
import { AuthConstants, TokenRevocationReason } from '../../constants/auth.constants';
import { PasswordResetRequestModel } from './models/password-reset-request.model';
import { PasswordResetTokenModel } from './models/password-reset-token.model';
import { RefreshTokenModel } from './models/refresh-token.model';
import { SessionModel } from '../../models/session.model';
import { EmailTaskModel } from '../../models/email-task.model';
import { RoleModel } from '../../models/role.model';
import { UserRoleModel } from '../../models/user-role.model';
import * as authScheme from './auth.validator';
import { logError, logWarn, logInfo } from '../../utils/logger';
import { ResponseUtil } from '../../utils/responseUtils';
import { runInTransaction } from '../../utils/dbUtils';
import {
  generateAccessToken,
  generateRefreshToken,
  revokeRefreshToken,
  setTokenCookies,
  clearTokenCookies,
} from '../../utils/tokenUtils';
import { UserModel } from '../user/user.models';
import { z } from 'zod';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.validated?.body as z.infer<
      typeof authScheme.registerSchema
    >;

    const existingUser = await UserModel.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      logWarn('Registration attempt with existing user', { username, email });
      ResponseUtil.badRequest(
        res,
        'User already exists! please login instead, or choose a different username/email'
      );
      return;
    }

    const defaultRole = await RoleModel.findOne({
      name: 'user',
      active: true,
      deleted: false,
    }).lean();

    if (!defaultRole) {
      logError('register: default "user" role missing from system configs', {
        module: 'auth.controller.ts:register',
      });
      ResponseUtil.internalServerError(res, 'System initialization Error, Pls contact admin...');
      return;
    }

    let createdUserId = '';

    await runInTransaction(async (session) => {
      const hashedPassword = await bcrypt.hash(password, 12);
      const newUser = new UserModel({
        username,
        email,
        password: hashedPassword,
      });

      await newUser.save({ session });
      createdUserId = newUser._id.toString();

      await UserRoleModel.updateOne(
        { userId: newUser._id, roleId: defaultRole._id },
        {
          $set: {
            userId: newUser._id,
            roleId: defaultRole._id,
            active: true,
            deleted: false,
          },
        },
        { upsert: true, session }
      );
    });

    logInfo('New user registered successfully', { username, email });
    ResponseUtil.created(res, 'User registered successfully! Please login.', {
      userId: createdUserId,
    });
  } catch (e) {
    const error = e as Error;
    logError('Failed to register user', {
      error: error.message,
      stack: error.stack,
    });
    ResponseUtil.internalServerError(res, 'Server error during registration');
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.validated?.body as z.infer<
      typeof authScheme.loginSchema
    >;
    const identifier = username ?? email;

    logInfo('Login attempt', { credential: identifier });

    if (!identifier || !password) {
      logWarn('Login attempt with missing credentials');
      ResponseUtil.badRequest(res, 'Username/Email and password required');
      return;
    }

    const user = await UserModel.findOne({
      $or: [{ username: identifier }, { email: identifier }],
      active: true,
      deleted: false,
    }).select('+password');

    if (!user) {
      logWarn('Login attempt with non-existent user', { credential: identifier });
      ResponseUtil.unauthorized(res, 'Invalid username or password');
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      logWarn('Login attempt with invalid password', { credential: identifier });
      ResponseUtil.unauthorized(res, 'Invalid username or password');
      return;
    }

    if (!authEnvs.accessTokenSecret || !authEnvs.refreshTokenSecret) {
      logError('JWT secrets not configured');
      ResponseUtil.internalServerError(res, 'Server configuration error');
      return;
    }

    const userId = user._id.toString();
    let refreshToken = '';

    await runInTransaction(async (session) => {
      try {
        await PasswordResetTokenModel.updateMany(
          { userId: user._id, active: true },
          {
            $set: {
              active: false,
              revokedAt: new Date(),
              revokedReason: TokenRevocationReason.USER_LOGIN,
            },
          },
          { session }
        );
      } catch (err: unknown) {
        logError('Failed to cleanup reset tokens on login', {
          error: err instanceof Error ? err.message : String(err),
        });
      }

      const result = await generateRefreshToken(userId, undefined, undefined, session);
      refreshToken = result.token;

      await SessionModel.create(
        [
          {
            userId: user._id,
            rootTokenId: result.rootTokenId,
            absoluteExpiresAt: new Date(Date.now() + AuthConstants.SESSION_ABSOLUTE_EXPIRY_MS),
            lastLogin: new Date(),
            ipAddress: req.ip ?? 'unknown',
            userAgent: req.get('user-agent') ?? 'unknown',
          },
        ],
        { session }
      );
    });

    const accessToken = generateAccessToken(userId, user.username, user.email);

    logInfo('User logged in successfully', { username: user.username, userId });

    setTokenCookies(res, accessToken, refreshToken);

    ResponseUtil.success(res, 'User logged in successfully', {
      userId,
      username: user.username,
      email: user.email,
    });
  } catch (e) {
    const error = e as Error;

    if (e instanceof z.ZodError) {
      logWarn('Login validation failed', { error: error.message });
      ResponseUtil.badRequest(res, 'Invalid credentials');
    } else {
      logError('Login process failed', {
        error: error.message,
        stack: error.stack,
        endpoint: '/auth/login',
        method: 'POST',
      });
      ResponseUtil.internalServerError(res, 'Server error during login');
    }
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const decodedToken = req.token?.decoded;
    const storedToken = req.token?.stored;

    if (!decodedToken || !storedToken) {
      ResponseUtil.unauthorized(res, 'Invalid refresh token');
      return;
    }

    const userId = decodedToken.id;

    const user = await UserModel.findById(userId);

    if (!user?.active) {
      ResponseUtil.unauthorized(res, 'Invalid refresh token');
      return;
    }

    const newAccessToken = generateAccessToken(userId, user.username, user.email);
    let newRefreshToken = '';

    await runInTransaction(async (session) => {
      const result = await generateRefreshToken(
        userId,
        storedToken.rootTokenId.toString(),
        storedToken._id.toString(),
        session
      );
      newRefreshToken = result.token;

      await revokeRefreshToken(
        storedToken.tokenHash,
        TokenRevocationReason.TOKEN_ROTATION,
        session
      );
    });

    setTokenCookies(res, newAccessToken, newRefreshToken);

    ResponseUtil.success(res, 'Refresh token generated successfully', {
      userId,
      username: user.username,
      email: user.email,
    });
  } catch (e) {
    const error = e as Error;
    logError('Token refresh failed', {
      error: error.message,
      stack: error.stack,
    });
    ResponseUtil.internalServerError(res, 'Server error during token refresh');
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
    if (storedToken) {
      await runInTransaction(async (session) => {
        await revokeRefreshToken(
          storedToken.tokenHash,
          TokenRevocationReason.USER_LOGOUT,
          session
        );

        await SessionModel.findOneAndUpdate(
          { rootTokenId: storedToken.rootTokenId },
          { $set: { active: false } },
          { session }
        );
      });
    }

    logInfo('User logged out', { userId });

    clearTokenCookies(res);

    ResponseUtil.success(res, 'Logout successful');
  } catch (e) {
    const error = e as Error;
    logError('Logout failed', {
      error: error.message,
      stack: error.stack,
    });
    ResponseUtil.internalServerError(res, 'Server error during logout');
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const ip = req.ip ?? 'unknown';
  const userAgent = req.get('user-agent') ?? 'unknown';

  try {
    const { email } = req.validated?.body as z.infer<typeof authScheme.forgotPasswordSchema>;
    const normalizedEmail = email.trim().toLowerCase();
    const emailHash = crypto.createHash('sha256').update(normalizedEmail).digest('hex');

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const [rateLimitData] = (await PasswordResetRequestModel.aggregate<{
      totalRequests: ({ n: number } | undefined)[];
      emailsSent: ({ n: number } | undefined)[];
      lastEmailSent: ({ createdAt: Date } | undefined)[];
    }>([
      { $match: { emailHash, createdAt: { $gte: oneHourAgo } } },
      {
        $facet: {
          totalRequests: [{ $count: 'n' }],
          emailsSent: [{ $match: { emailSent: true } }, { $count: 'n' }],
          lastEmailSent: [
            { $match: { emailSent: true } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            { $project: { createdAt: 1 } },
          ],
        },
      },
    ])) as (
      | {
          totalRequests: ({ n: number } | undefined)[];
          emailsSent: ({ n: number } | undefined)[];
          lastEmailSent: ({ createdAt: Date } | undefined)[];
        }
      | undefined
    )[];

    const totalCount = rateLimitData?.totalRequests[0]?.n ?? 0;
    const emailCount = rateLimitData?.emailsSent[0]?.n ?? 0;
    const lastEmailAt = rateLimitData?.lastEmailSent[0]?.createdAt ?? null;

    // Rate limit: max 20 requests per emailHash per hour
    if (totalCount >= AuthConstants.MAX_REQUESTS_PER_HR) {
      logWarn('forgot-password: request limit exceeded', { emailHash, ip, userAgent });
      ResponseUtil.rateLimitExceeded(res);
      return;
    }

    // Rate limit: max 5 emails per emailHash per hour
    if (emailCount >= AuthConstants.MAX_EMAILS_PER_HR) {
      logWarn('forgot-password: email send limit exceeded', { emailHash, ip, userAgent });
      ResponseUtil.rateLimitExceeded(res);
      return;
    }

    // Cooldown: 30 seconds between email sends for this emailHash
    if (lastEmailAt) {
      const msSinceLastEmail = Date.now() - lastEmailAt.getTime();
      if (msSinceLastEmail < AuthConstants.RESEND_COOLDOWN_MS) {
        const secondsRemaining = Math.ceil(
          (AuthConstants.RESEND_COOLDOWN_MS - msSinceLastEmail) / 1000
        );
        logWarn('forgot-password: cooldown active', {
          emailHash,
          ip,
          userAgent,
          secondsRemaining,
        });
        ResponseUtil.rateLimitExceeded(
          res,
          `Please wait ${secondsRemaining.toString()} seconds before resending reset link`
        );
        return;
      }
    }

    // Look up user
    const user = await UserModel.findOne({ email: normalizedEmail, active: true, deleted: false });
    if (!user) {
      await PasswordResetRequestModel.create([{ emailHash, ip, userAgent, emailSent: false }]);
      logWarn('forgot-password: user not found or inactive', { ip, userAgent });
      ResponseUtil.success(res, 'If an account exists, a reset link has been sent.');
      return;
    }

    // Generate token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + AuthConstants.TOKEN_EXPIRY_MS);

    await runInTransaction(async (session) => {
      const activeTokens = await PasswordResetTokenModel.find(
        {
          userId: user._id,
          used: false,
          active: true,
          deleted: false,
          expiresAt: { $gt: new Date() },
        },
        { _id: 1 },
        { sort: { createdAt: 1 } }
      ).session(session);

      if (activeTokens.length >= AuthConstants.MAX_ACTIVE_TOKENS) {
        const excess = activeTokens.slice(
          0,
          activeTokens.length - AuthConstants.MAX_ACTIVE_TOKENS + 1
        );
        await PasswordResetTokenModel.updateMany(
          { _id: { $in: excess.map((t) => t._id) } },
          { $set: { active: false, deleted: true } },
          { session }
        );
      }

      await PasswordResetRequestModel.create([{ emailHash, ip, userAgent, emailSent: true }], {
        session,
      });
      await PasswordResetTokenModel.create([
        { userId: user._id, tokenHash, expiresAt, requestIp: ip, userAgent },
      ], {session});

      const frontendUrl = process.env.FRONTEND_URL ?? '';
      const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;
      const appName = process.env.APP_NAME ?? 'BookMyVenue';

      await EmailTaskModel.create([
        {
          intent: 'password_reset',
          recipient: user.email,
          subject: `Reset your ${appName} password`,
          metadata: { resetLink },
        },
      ], {session});
    });

    logInfo('forgot-password: reset email successfully synced & queued', {
      userId: user._id.toString(),
      ip,
      userAgent,
    });

    ResponseUtil.success(res, 'If an account exists, a reset link has been sent.');
    return;
  } catch (e) {
    const error = e as Error;
    logError('forgot-password: unexpected error', {
      module: 'auth.controller.ts:forgotPassword',
      error: error.message,
      stack: error.stack,
      ip,
      userAgent,
    });
    ResponseUtil.internalServerError(
      res,
      'Server error during forgot password request, please try again later'
    );
    return;
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const ip = req.ip ?? 'unknown';
  const userAgent = req.get('user-agent') ?? 'unknown';

  try {
    const parseResult = authScheme.resetPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      ResponseUtil.badRequest(res, 'Invalid request');
      return;
    }

    const { token, password } = parseResult.data;

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await runInTransaction(async (session) => {
      const tokenRecord = await PasswordResetTokenModel.findOneAndUpdate(
        { tokenHash, active: true, used: false, deleted: false },
        { $set: { active: false, used: true, usedAt: new Date() } },
        { returnDocument: 'after', session }
      );

      if (!tokenRecord) {
        logWarn('reset-password: token not found or already used', { ip, userAgent });
        ResponseUtil.badRequest(res, 'Invalid or expired reset token');
        return;
      }

      if (tokenRecord.expiresAt < new Date()) {
        logWarn('reset-password: token expired', {
          userId: tokenRecord.userId.toString(),
          ip,
          userAgent,
        });
        ResponseUtil.badRequest(res, 'Invalid or expired reset token');
        return;
      }

      const user = await UserModel.findOne({
        _id: tokenRecord.userId,
        active: true,
        deleted: false,
      })
        .select('+password')
        .session(session);

      if (!user) {
        logWarn('reset-password: user not found or inactive', {
          userId: tokenRecord.userId.toString(),
          ip,
          userAgent,
        });
        ResponseUtil.badRequest(res, 'Invalid or expired reset token');
        return;
      }

      const userId = user._id;

      const isSamePassword = await bcrypt.compare(password, user.password);
      if (isSamePassword) {
        await PasswordResetTokenModel.updateMany(
          { userId, _id: { $ne: tokenRecord._id }, active: true, used: false, deleted: false },
          {
            $set: {
              active: false,
              revokedAt: new Date(),
              revokedReason: TokenRevocationReason.PASSWORD_REUSE_ATTEMPT,
            },
          },
          { session }
        );
        logWarn('reset-password: password reuse attempt', {
          userId: userId.toString(),
          ip,
          userAgent,
        });
        ResponseUtil.badRequest(res, 'New password cannot be the same as your old password');
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      await UserModel.updateOne(
        { _id: userId },
        { $set: { password: hashedPassword, passwordChangedAt: new Date() } },
        { session }
      );

      await PasswordResetTokenModel.updateMany(
        { userId, _id: { $ne: tokenRecord._id }, active: true },
        {
          $set: {
            active: false,
            revokedAt: new Date(),
            revokedReason: TokenRevocationReason.PASSWORD_CHANGED,
          },
        },
        { session }
      );

      await RefreshTokenModel.updateMany(
        { userId, active: true },
        {
          $set: {
            active: false,
            revokedAt: new Date(),
            revokedReason: TokenRevocationReason.PASSWORD_CHANGED,
          },
        },
        { session }
      );

      await SessionModel.updateMany(
        { userId, active: true },
        { $set: { active: false } },
        { session }
      );

      const appName = process.env.APP_NAME ?? 'BookMyVenue';
      // Send security notification — non-blocking via queue
      await EmailTaskModel.create(
        [
          {
            intent: 'security_alert',
            recipient: user.email,
            subject: `Your ${appName} password was changed`,
            metadata: {},
          },
        ],
        { session }
      );

      logInfo('reset-password: password reset successful', {
        userId: userId.toString(),
        ip,
        userAgent,
      });
    });

    ResponseUtil.success(res, 'Password reset successful. Please log in with your new password.');
  } catch (e) {
    const error = e as Error;
    logError('reset-password: unexpected error', {
      error: error.message,
      stack: error.stack,
      ip,
      userAgent,
    });
    ResponseUtil.internalServerError(res, 'Server error during password reset');
  }
};
