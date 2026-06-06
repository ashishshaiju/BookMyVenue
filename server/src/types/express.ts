import type { IRefreshToken } from '../models/refresh-token.model';

export interface AuthenticatedUser {
  userId: string;
  username: string;
  email: string;
}

export interface DecodedToken {
  id: string;
  jti: string;
}

export interface TokenPayload {
  id: string;
  username: string;
  email: string;
  iat: number;
  jti: string;
}

export interface RefreshTokenPayload {
  id: string;
  iat?: number;
  jti: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  code?: string;
}

export interface RequestToken {
  decoded: DecodedToken;
  stored: IRefreshToken;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      token?: RequestToken;
    }
  }
}
