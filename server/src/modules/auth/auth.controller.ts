import type { Request, Response } from 'express';
import * as bcrypt from 'bcrypt';
import { z } from 'zod';
import { ResponseUtil } from '../../utils/responseUtils';
import { parseDurationToMs } from '../../utils/timeUtils';
import * as authScheme from './auth.validator';
import { UserModel } from '../user/user.models';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { RefreshTokenModel } from './models/refresh-token.model';
import { PasswordResetTokenModel } from './models/password-reset-token.model';
import { PasswordResetRequestModel } from './models/password-reset-request.model';
import { EmailTaskModel } from '../../models/email-task.model';
import { authEnvs, jwtConfig } from '../../constants/env';
import {
  AuthConstants,
  TokenRevocationReason,
  type TokenRevocationReasonType,
} from '../../constants/auth.constants';
import type { RefreshTokenPayload, TokenPayload } from '../../types/express';
import { RoleModel } from '../../models/role.model';
import { UserRoleModel } from '../../models/user-role.model';

const generateAccessToken = (userId: string, username: string, email: string): string => {
  try {
    const payload: TokenPayload = {
      id: userId,
      username,
      email,
      iat: Math.floor(Date.now() / 1000),
    };

    const jwtOptions: jwt.SignOptions = {
      expiresIn: authEnvs.accessTokenExpiry as jwt.SignOptions['expiresIn'],
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
      algorithm: jwtConfig.algorithm,
      subject: userId,
    };

    if (!authEnvs.accessTokenSecret) {
      throw new Error('Access token secret not defined');
    }

    return jwt.sign(payload, authEnvs.accessTokenSecret, jwtOptions);
  } catch (error) {
    throw new Error(`Failed to generate access token: ${(error as Error).message}`, {
      cause: error,
    });
  }
};

const generateRefreshToken = async (userId: string): Promise<string> => {
  try {
    const jti = `${userId}-${String(Date.now())}-${crypto.randomBytes(32).toString('hex')}`;
    const payload: RefreshTokenPayload = {
      id: userId,
      iat: Math.floor(Date.now() / 1000),
      jti,
    };

    const jwtOptions: jwt.SignOptions = {
      expiresIn: authEnvs.refreshTokenExpiry as jwt.SignOptions['expiresIn'],
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
      algorithm: jwtConfig.algorithm,
      subject: userId,
    };

    if (!authEnvs.refreshTokenSecret) {
      throw new Error('Refresh token secret not defined');
    }

    const token = jwt.sign(payload, authEnvs.refreshTokenSecret, jwtOptions);
    const tokenHash = crypto.createHash('sha256').update(jti).digest('hex');
    const expiresAt = new Date(Date.now() + parseDurationToMs(authEnvs.refreshTokenExpiry));

    await RefreshTokenModel.create({
      userId: new mongoose.Types.ObjectId(userId),
      tokenHash,
      expiresAt,
    });

    return token;
  } catch (error) {
    throw new Error(`Failed to generate refresh token: ${(error as Error).message}`, {
      cause: error,
    });
  }
};

const revokeRefreshToken = async (
  tokenHash: string,
  reason: TokenRevocationReasonType
): Promise<void> => {
  try {
    await RefreshTokenModel.updateOne(
      {
        tokenHash,
        active: true,
        isUsed: false,
      },
      {
        $set: {
          active: false,
          isUsed: true,
          revokedAt: new Date(),
          revokedReason: reason,
        },
      }
    );
  } catch (error) {
    throw new Error(`Failed to revoke refresh token: ${(error as Error).message}`, {
      cause: error,
    });
  }
};

const setTokenCookies = (res: Response, accessToken: string, refreshToken: string): Response => {
  const isProduction = process.env.NODE_ENV === 'production';
  const accessTokenMaxAge = parseDurationToMs(authEnvs.accessTokenExpiry);
  const refreshTokenMaxAge = parseDurationToMs(authEnvs.refreshTokenExpiry);

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: accessTokenMaxAge,
    path: '/',
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: refreshTokenMaxAge,
    path: '/',
  });

  return res;
};

const clearTokenCookies = (res: Response): Response => {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });
  return res;
};

// Routes Handlers

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = authScheme.registerSchema.parse(req.body);

    if (!username || !email || !password) {
      console.warn('Registration attempt with missing fields');
      ResponseUtil.badRequest(res, 'Missing username, email or password');
      return;
    }

    const user = await UserModel.findOne({ $or: [{ username }, { email }] });
    if (user) {
      console.warn('Registration attempt with existing user', { username, email });
      ResponseUtil.badRequest(
        res,
        'User already exists! please login instead, or choose a different username/email'
      );
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new UserModel({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    // Assign the default 'user' role — every registrant starts as a user
    const defaultRole = await RoleModel.findOne({ name: 'user', active: true, deleted: false }).lean();
    if (defaultRole) {
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
        { upsert: true }
      );
    } else {
      console.warn('register: default "user" role not found — skipping role assignment', { username });
    }

    console.log('New user registered successfully', { username, email });

    ResponseUtil.created(res, 'User registered successfully! Please login.', {
      userId: newUser._id.toString(),
    });
  } catch (e) {
    const error = e as Error;
    if (e instanceof z.ZodError) {
      console.warn('Registration validation failed', { error: error.message });
      ResponseUtil.badRequest(res, 'Invalid registration data');
    } else {
      console.error('Failed to register user', {
        error: error.message,
        stack: error.stack,
      });
      ResponseUtil.internalServerError(res, 'Server error during registration');
    }
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = authScheme.loginSchema.parse(req.body);
    const identifier = username ?? email;

    console.log('Login attempt', { credential: identifier });

    if (!identifier || !password) {
      console.warn('Login attempt with missing credentials');
      ResponseUtil.badRequest(res, 'Username/Email and password required');
      return;
    }

    const user = await UserModel.findOne({
      $or: [{ username: identifier }, { email: identifier }],
      active: true,
      deleted: false,
    }).select('+password');

    if (!user) {
      console.warn('Login attempt with non-existent user', { credential: identifier });
      ResponseUtil.unauthorized(res, 'Invalid username or password');
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.warn('Login attempt with invalid password', { credential: identifier });
      ResponseUtil.unauthorized(res, 'Invalid username or password');
      return;
    }

    void PasswordResetTokenModel.updateMany(
      { userId: user._id, active: true },
      {
        $set: {
          active: false,
          revokedAt: new Date(),
          revokedReason: TokenRevocationReason.USER_LOGIN,
        },
      }
    ).catch((err: Error) => { console.error('Failed to cleanup reset tokens on login', { error: err.message }); });

    if (!authEnvs.accessTokenSecret || !authEnvs.refreshTokenSecret) {
      console.error('JWT secrets not configured');
      ResponseUtil.internalServerError(res, 'Server configuration error');
      return;
    }

    const userId = user._id.toString();
    const accessToken = generateAccessToken(userId, user.username, user.email);
    const refreshToken = await generateRefreshToken(userId);

    console.log('User logged in successfully', { username: user.username, userId });

    setTokenCookies(res, accessToken, refreshToken);

    ResponseUtil.success(res, 'User logged in successfully', {
      userId,
      username: user.username,
      email: user.email,
    });
  } catch (e) {
    const error = e as Error;

    if (e instanceof z.ZodError) {
      console.warn('Login validation failed', { error: error.message });
      ResponseUtil.badRequest(res, 'Invalid credentials');
    } else {
      console.error('Login process failed', {
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
    const newRefreshToken = await generateRefreshToken(userId);

    await revokeRefreshToken(storedToken.tokenHash, TokenRevocationReason.TOKEN_ROTATION);

    setTokenCookies(res, newAccessToken, newRefreshToken);

    ResponseUtil.success(res, 'Refresh token generated successfully', {
      userId,
      username: user.username,
      email: user.email,
    });
  } catch (e) {
    const error = e as Error;
    console.error('Token refresh failed', {
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
      await revokeRefreshToken(storedToken.tokenHash, TokenRevocationReason.USER_LOGOUT);
    }

    console.log('User logged out', { userId });

    clearTokenCookies(res);

    ResponseUtil.success(res, 'Logout successful');
  } catch (e) {
    const error = e as Error;
    console.error('Logout failed', {
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
    // Validate input
    const parseResult = authScheme.forgotPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      ResponseUtil.validationError(res, 'Invalid request', parseResult.error?.message); return;
    }

    const { email } = parseResult.data;
    const normalizedEmail = email.trim().toLowerCase();
    const emailHash = crypto.createHash('sha256').update(normalizedEmail).digest('hex');

    // Single aggregate replaces 3 separate countDocuments/findOne calls.
    // Uses the compound index { emailHash: 1, createdAt: -1 } for efficiency.
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const [rateLimitData] = await PasswordResetRequestModel.aggregate<{
      totalRequests: { n: number }[];
      emailsSent: { n: number }[];
      lastEmailSent: { createdAt: Date }[];
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
    ]);

    const totalCount = rateLimitData?.totalRequests[0]?.n ?? 0;
    const emailCount = rateLimitData?.emailsSent[0]?.n ?? 0;
    const lastEmailAt = rateLimitData?.lastEmailSent[0]?.createdAt ?? null;

    // Rate limit: max 20 requests per emailHash per hour
    if (totalCount >= AuthConstants.MAX_REQUESTS_PER_HR) {
      console.warn('forgot-password: request limit exceeded', { emailHash, ip, userAgent });
      ResponseUtil.rateLimitExceeded(res); return;
    }

    // Rate limit: max 5 emails per emailHash per hour
    if (emailCount >= AuthConstants.MAX_EMAILS_PER_HR) {
      console.warn('forgot-password: email send limit exceeded', { emailHash, ip, userAgent });
      ResponseUtil.rateLimitExceeded(res); return;
    }

    // Cooldown: 30 seconds between email sends for this emailHash
    if (lastEmailAt) {
      const msSinceLastEmail = Date.now() - lastEmailAt.getTime();
      if (msSinceLastEmail < AuthConstants.RESEND_COOLDOWN_MS) {
        const secondsRemaining = Math.ceil(
          (AuthConstants.RESEND_COOLDOWN_MS - msSinceLastEmail) / 1000
        );
        console.warn('forgot-password: cooldown active', {
          emailHash,
          ip,
          userAgent,
          secondsRemaining,
        });
        ResponseUtil.rateLimitExceeded(
          res,
          `Please wait ${Number(secondsRemaining)} seconds before resending reset link`
        ); return;
      }
    }

    //TODO: Optimise with single db write queries for nonusers and users
    // Look up user
    const user = await UserModel.findOne({ email: normalizedEmail, active: true, deleted: false });
    if (!user) {
      await PasswordResetRequestModel.create([{ emailHash, ip, userAgent, emailSent: false }]);
      console.warn('forgot-password: user not found or inactive', { ip, userAgent });
      ResponseUtil.success(res, 'If an account exists, a reset link has been sent.'); return;
    }

    const userId = user._id;
    const now = new Date();

    // Fire-and-forget: prune tokens for this user that exceed the active limit.
    // Done in background — does not block the response.
    void PasswordResetTokenModel.find(
      { userId, used: false, active: true, deleted: false, expiresAt: { $gt: now } },
      { _id: 1 },
      { sort: { createdAt: 1 } }
    ).then((activeTokens) => {
      if (activeTokens.length >= AuthConstants.MAX_ACTIVE_TOKENS) {
        const excess = activeTokens.slice(
          0,
          activeTokens.length - AuthConstants.MAX_ACTIVE_TOKENS + 1
        );
        void PasswordResetTokenModel.updateMany(
          { _id: { $in: excess.map((t) => t._id) } },
          { $set: { active: false, deleted: true } }
        );
      }
    });

    // Generate token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + AuthConstants.TOKEN_EXPIRY_MS);

    // These are non-critical, recoverable writes — no transaction needed.
    // Worst case: an orphaned token expires via TTL, or the user re-requests a link.
    await PasswordResetRequestModel.create([{ emailHash, ip, userAgent, emailSent: true }]);

    await PasswordResetTokenModel.create([
      { userId, tokenHash, expiresAt, requestIp: ip, userAgent },
    ]);

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
    ]);

    console.log('forgot-password: reset email queued', {
      userId: userId.toString(),
      ip,
      userAgent,
    });

    ResponseUtil.success(res, 'If an account exists, a reset link has been sent.'); return;
  } catch (e) {
    const error = e as Error;
    console.error('forgot-password: unexpected error', {
      error: error.message,
      stack: error.stack,
      ip,
      userAgent,
    });
    ResponseUtil.internalServerError(
      res,
      'Server error during forgot password request, please try again later'
    ); return;
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

    // Hash the incoming raw token for DB lookup
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const tokenRecord = await PasswordResetTokenModel.findOneAndUpdate(
      { tokenHash, active: true, used: false, deleted: false },
      { $set: { active: false, used: true, usedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!tokenRecord) {
      console.warn('reset-password: token not found or already used', { ip, userAgent });
      ResponseUtil.badRequest(res, 'Invalid or expired reset token');
      return;
    }

    if (tokenRecord.expiresAt < new Date()) {
      console.warn('reset-password: token expired', {
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
    }).select('+password');

    if (!user) {
      console.warn('reset-password: user not found or inactive', {
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
        }
      );
      console.warn('reset-password: password reuse attempt', {
        userId: userId.toString(),
        ip,
        userAgent,
      });
      ResponseUtil.badRequest(res, 'New password cannot be the same as your old password');
      return;
    }

    // 1. Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 2. Persist the new password
    await UserModel.updateOne(
      { _id: userId },
      { $set: { password: hashedPassword, passwordChangedAt: new Date() } }
    );

    // 3. Soft-invalidate all OTHER reset tokens for this user
    await PasswordResetTokenModel.updateMany(
      { userId, _id: { $ne: tokenRecord._id }, active: true },
      {
        $set: {
          active: false,
          revokedAt: new Date(),
          revokedReason: TokenRevocationReason.PASSWORD_CHANGED,
        },
      }
    );

    // 4. Revoke ALL active refresh tokens for this user — forces re-authentication
    await RefreshTokenModel.updateMany(
      { userId, active: true },
      {
        $set: {
          active: false,
          revokedAt: new Date(),
          revokedReason: TokenRevocationReason.PASSWORD_CHANGED,
        },
      }
    );

    const appName = process.env.APP_NAME ?? 'BookMyVenue';
    // Send security notification — non-blocking via queue
    await EmailTaskModel.create({
      intent: 'security_alert',
      recipient: user.email,
      subject: `Your ${appName} password was changed`,
      metadata: {},
    });

    console.log('reset-password: password reset successful', {
      userId: userId.toString(),
      ip,
      userAgent,
    });

    ResponseUtil.success(res, 'Password reset successful. Please log in with your new password.');
  } catch (e) {
    const error = e as Error;
    console.error('reset-password: unexpected error', {
      error: error.message,
      stack: error.stack,
      ip,
      userAgent,
    });
    ResponseUtil.internalServerError(res, 'Server error during password reset');
  }
};
