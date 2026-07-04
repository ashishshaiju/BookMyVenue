import crypto from 'crypto';
import * as repo from './user.repository';
import { NotFoundError } from '../../utils/errors';
import type { IUser } from './user.models';
import { getUserRole } from '../../services/roles.service';
import type { PaginatedResponse, PaginationParams } from '../../types/pagination.types';

export async function getProfile(userId: string): Promise<{
  _id: string;
  name: string;
  email: string;
  role?: string;
}> {
  const user = await repo.findUserById(userId);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const roleInfo = await getUserRole(userId);

  return {
    _id: user._id.toString(),
    name: user.username,
    email: user.email,
    role: roleInfo?.roleName,
  };
}

export async function getAllUsers(
  paginationParams: PaginationParams,
  filters?: { role?: string }
): Promise<PaginatedResponse<Record<string, unknown>, 'users'>> {
  return repo.findAllUsers(paginationParams, filters);
}

export async function toggleUserStatus(userId: string): Promise<IUser | null> {
  return repo.toggleUserStatus(userId);
}

export async function generateRandomPasswordWithHash(): Promise<{ plain: string; hashed: string }> {
  const bcrypt = await import('bcrypt');
  const newPassword = crypto.randomBytes(12).toString('base64url');
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  return { plain: newPassword, hashed: hashedPassword };
}
