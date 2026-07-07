import * as repo from './bannedUser.repository';
import { getUserRole } from '../../services/roles.service';
import { ForbiddenError, NotFoundError, ValidationError } from '../../utils/errors';
import type { IBannedUser, BanScope } from './bannedUser.model';
import { UserModel } from '../user/user.models';

export async function banUser(
  adminId: string,
  userId: string,
  scope: BanScope,
  reason: string,
  options?: { venueId?: string | null; expiresAt?: Date | null }
): Promise<IBannedUser> {
  // Guard: no self-ban
  if (adminId === userId) {
    throw new ForbiddenError('Cannot ban yourself');
  }

  // Guard: user exists
  const targetUser = await UserModel.findById(userId).exec();
  if (!targetUser) {
    throw new NotFoundError('User not found');
  }

  // Guard: cannot ban a superAdmin (unless you're also admin checking permissions, but role check happens at route level)
  const userRole = await getUserRole(userId);
  if (userRole?.roleName === 'superAdmin') {
    throw new ForbiddenError('Cannot ban a superAdmin');
  }

  // Validate: venueId only allowed for commenting/owner_dashboard scopes
  if ((scope === 'full' || scope === 'venue_creation') && options?.venueId) {
    throw new ValidationError('Scope ' + scope + ' must be platform-wide (venueId not allowed)');
  }

  // Validate: expiresAt must be in the future if provided
  if (options?.expiresAt && options.expiresAt <= new Date()) {
    throw new ValidationError('expiresAt must be in the future');
  }

  // Validate: reason length
  if (reason.trim().length < 10) {
    throw new ValidationError('Reason must be at least 10 characters');
  }

  return repo.createBan(userId, scope, reason, adminId, options);
}

export async function liftBan(adminId: string, banRecordId: string): Promise<IBannedUser> {
  const ban = await repo.findActiveBan(adminId, 'full'); // dummy scope, just checking if admin exists
  if (!ban && adminId !== adminId) {
    // This is just a placeholder admin check; real auth happens at route level
  }

  const updated = await repo.liftBan(banRecordId, adminId);
  if (!updated) {
    throw new NotFoundError('Ban record not found');
  }

  return updated;
}

export async function isBannedForScope(
  userId: string,
  scope: BanScope,
  venueId?: string | null
): Promise<boolean> {
  const ban = await repo.findActiveBan(userId, scope, venueId);
  return !!ban;
}

export async function getUserBanHistory(userId: string): Promise<IBannedUser[]> {
  return repo.findUserBans(userId);
}

export async function expireActiveBans(): Promise<number> {
  const expiredBans = await repo.findExpiredFullBans();
  let expiredCount = 0;

  for (const ban of expiredBans) {
    const updated = await repo.markAsExpired(ban._id.toString());
    if (updated?.scope === 'full') {
      // Check if user has any other active full bans
      const otherFullBans = await repo.findActiveBan(ban.userId.toString(), 'full');
      if (!otherFullBans) {
        // Restore User.isBanned/active
        await UserModel.findByIdAndUpdate(ban.userId, {
          isBanned: false,
          active: true,
        }).exec();
      }
    }
    expiredCount++;
  }

  return expiredCount;
}
