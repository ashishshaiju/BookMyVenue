import type { IRefreshToken } from '../modules/auth/models/refresh-token.model';
import type { IPermission } from '../constants/permissions';

// ── RBAC ─────────────────────────────────────────────────────────────────────

export interface VerifiedRole {
  id?: string;                     // roleId (ObjectId string)
  name?: string;                   // 'user' | 'owner' | 'admin' | 'superAdmin' | future roles
  isSuperAdmin?: boolean;          // true → requirePermission short-circuits to next()
  permissions?: Set<IPermission>;  // full effective set, including inherited
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthenticatedUser {
  userId: string;
  username: string;
  email: string;
  role: VerifiedRole; // populated by verifyAccessToken; permissions loaded lazily by loadPermissions
}

export type Permission = IPermission;

export interface DecodedToken {
  id: string;
  jti: string;
}

export interface TokenPayload {
  id: string;
  username: string;
  email: string;
  iat: number;
  jti?: string;
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
