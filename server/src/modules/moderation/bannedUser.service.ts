import * as repo from './bannedUser.repository';
import { getUserRole } from '../../services/roles.service';
import { ForbiddenError, NotFoundError, ValidationError } from '../../utils/errors';
import type { IBannedUser, BanScope } from './bannedUser.model';
import { UserModel } from '../user/user.models';
import { VenueModel } from '../venue/venue.model';

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

  const ban = await repo.createBan(userId, scope, reason, adminId, options);

  // Send email notification
  const venueName = options?.venueId
    ? await VenueModel.findById(options.venueId)
        .select('name')
        .lean()
        .then((v) => v?.name)
    : undefined;
  const { emailService } = await import('../../services/email.service.js');
  void emailService.sendUserBannedEmail(targetUser.email, {
    scope,
    reason,
    expiresAt: options?.expiresAt ?? null,
    venueName,
  });

  // Log activity
  const { logModerationAction } = await import('./moderationActivity.service.js');
  await logModerationAction(adminId, 'ban_user', userId, 'user', reason, { scope, ...options });

  return ban;
}

export async function liftBan(adminId: string, banRecordId: string): Promise<IBannedUser> {
  const updated = await repo.liftBan(banRecordId, adminId);
  if (!updated) {
    throw new NotFoundError('Ban record not found');
  }

  // Send email notification
  const { emailService } = await import('../../services/email.service.js');
  const user = await UserModel.findById(updated.userId).select('email').lean();
  if (user?.email) {
    void emailService.sendUserUnbannedEmail(user.email);
  }

  // Log activity
  const { logModerationAction } = await import('./moderationActivity.service.js');
  await logModerationAction(adminId, 'unban_user', updated.userId.toString(), 'user', undefined, {
    banRecordId,
  });

  return updated;
}

export async function liftAllBansForUser(adminId: string, userId: string): Promise<number> {
  const targetUser = await UserModel.findById(userId).exec();
  if (!targetUser) {
    throw new NotFoundError('User not found');
  }

  const count = await repo.liftAllBansForUser(userId, adminId);

  if (count > 0) {
    // Send email notification
    const { emailService } = await import('../../services/email.service.js');
    void emailService.sendUserUnbannedEmail(targetUser.email);

    // Log activity
    const { logModerationAction } = await import('./moderationActivity.service.js');
    await logModerationAction(adminId, 'unban_user', userId, 'user', undefined, { count });
  }

  return count;
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
