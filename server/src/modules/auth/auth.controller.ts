import type { Request, Response } from 'express';
import * as bcrypt from 'bcrypt';
import { z } from 'zod';
import { ResponseUtil } from '../../utils/responseUtils';
import * as authScheme from './auth.validator';
import { UserModel } from '../user/user.models';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { RefreshTokenModel } from '../../models/refresh-token.model';
import type { RefreshTokenPayload, TokenPayload } from '../../types/express';

const accessTokenExpiry = process.env.ACCESS_TOKEN_EXPIRY ?? '15m';
const refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRY ?? '7d';
const accessTokenSecret = process.env.JWT_ACCESS_SECRET;
const refreshTokenSecret = process.env.JWT_REFRESH_SECRET;
const jwtIssuer = process.env.JWT_ISSUER ?? 'BookMyVenue';
const jwtAudience = process.env.JWT_AUDIENCE ?? 'BookMyVenue';
const jwtAlgorithm = (process.env.JWT_ALGORITHM ?? 'HS256') as jwt.Algorithm;


const generateAccessToken = (userId: string, username: string, email: string): string => {
  try {
    const jti = `${userId}-${String(Date.now())}-${crypto.randomBytes(16).toString('hex')}`;
    const payload: TokenPayload = {
      id: userId,
      username,
      email,
      iat: Math.floor(Date.now() / 1000),
      jti,
    };

    const jwtOptions: jwt.SignOptions = {
      expiresIn: accessTokenExpiry as jwt.SignOptions['expiresIn'],
      issuer: jwtIssuer,
      audience: jwtAudience,
      algorithm: jwtAlgorithm,
      subject: userId,
    };

    if (!accessTokenSecret) {
      throw new Error('Access token secret not defined');
    }

    return jwt.sign(payload, accessTokenSecret, jwtOptions);
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
      expiresIn: refreshTokenExpiry as jwt.SignOptions['expiresIn'],
      issuer: jwtIssuer,
      audience: jwtAudience,
      algorithm: jwtAlgorithm,
      subject: userId,
    };

    if (!refreshTokenSecret) {
      throw new Error('Refresh token secret not defined');
    }

    const token = jwt.sign(payload, refreshTokenSecret, jwtOptions);
    const tokenHash = crypto.createHash('sha256').update(jti).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

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

const revokeRefreshToken = async (tokenHash: string): Promise<void> => {
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
  const accessTokenMaxAge = 15 * 60 * 1000; // 15 minutes
  const refreshTokenMaxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

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

    const user = await UserModel.findOne(
      {
        $or: [{ username: identifier }, { email: identifier }],
      },
      { active: true, deleted: false }
    ).select('+password');

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

    if (!accessTokenSecret || !refreshTokenSecret) {
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

    await revokeRefreshToken(storedToken.tokenHash);

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
      await revokeRefreshToken(storedToken.tokenHash);
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

    ResponseUtil.success(res, 'User profile retrieved', {
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
