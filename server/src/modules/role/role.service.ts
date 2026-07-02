import { UserModel } from '../user/user.models';
import { RoleModel } from '../../models/role.model';
import { UserRoleModel } from '../../models/user-role.model';
import { NotFoundError, ConflictError } from '../../utils/errors';
import type { PaginationParams, PaginatedResponse } from '../../types/pagination.types';
import { buildPaginationMeta } from '../../utils/paginationUtils';

export async function promoteToAdmin(email: string): Promise<void> {
  const user = await UserModel.findOne({ email, active: true, deleted: false }).exec();
  if (!user) throw new NotFoundError('User not found');

  const adminRole = await RoleModel.findOne({ name: 'admin' }).exec();
  if (!adminRole) throw new Error('Admin role not found in system');

  const existing = await UserRoleModel.findOne({ userId: user._id, roleId: adminRole._id }).exec();
  if (existing) {
    if (existing.active && !existing.deleted) throw new ConflictError('User is already an admin');
    existing.active = true;
    existing.deleted = false;
    await existing.save();
    return;
  }

  await UserRoleModel.create({ userId: user._id, roleId: adminRole._id });
}

export async function demoteAdmin(userId: string): Promise<void> {
  const user = await UserModel.findById(userId).exec();
  if (!user) throw new NotFoundError('User not found');

  const adminRole = await RoleModel.findOne({ name: 'admin' }).exec();
  if (!adminRole) throw new Error('Admin role not found in system');

  const existing = await UserRoleModel.findOne({ userId: user._id, roleId: adminRole._id }).exec();
  if (!existing || !existing.active || existing.deleted) {
    throw new ConflictError('User is not an active admin');
  }

  existing.active = false;
  existing.deleted = true;
  await existing.save();
}

export async function getAdmins(paginationParams: PaginationParams): Promise<PaginatedResponse<Record<string, unknown>, 'admins'>> {
  const { limit, skip } = paginationParams;
  const adminRole = await RoleModel.findOne({ name: 'admin' }).exec();
  if (!adminRole) throw new Error('Admin role not found in system');

  const matchStage = { roleId: adminRole._id, active: true, deleted: false };
  const [userRoles, totalCountResult] = await Promise.all([
    UserRoleModel.aggregate<Record<string, unknown>>([
      { $match: matchStage },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'Users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: '$user._id',
          username: '$user.username',
          email: '$user.email',
          active: '$user.active',
          createdAt: '$user.createdAt',
        },
      },
    ]),
    UserRoleModel.countDocuments(matchStage),
  ]);

  return {
    admins: userRoles,
    pagination: buildPaginationMeta(totalCountResult, paginationParams),
  };
}
