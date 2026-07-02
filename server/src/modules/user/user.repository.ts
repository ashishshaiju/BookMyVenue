import type { IUser } from './user.models';
import { UserModel } from './user.models';
import type mongoose from 'mongoose';
import type { PaginationParams, PaginatedResponse } from '../../types/pagination.types';
import { buildPaginationMeta } from '../../utils/paginationUtils';

export async function findUserById(userId: string): Promise<IUser | null> {
  return UserModel.findById(userId).select('-password').exec();
}

export async function findActiveUserById(id: string): Promise<IUser | null> {
  return UserModel.findOne({ _id: id, active: true, deleted: false }).exec();
}

export async function findActiveUserByIdWithPassword(
  id: string,
  session?: mongoose.ClientSession
): Promise<IUser | null> {
  return UserModel.findOne({ _id: id, active: true, deleted: false })
    .select('+password')
    .session(session ?? null)
    .exec();
}

export async function findUserByUsernameOrEmail(
  username?: string,
  email?: string
): Promise<IUser | null> {
  return UserModel.findOne({ $or: [{ username }, { email }] }).exec();
}

export async function findActiveUserByIdentifierWithPassword(
  identifier: string
): Promise<IUser | null> {
  return UserModel.findOne({
    $or: [{ username: identifier }, { email: identifier }],
    active: true,
    deleted: false,
  })
    .select('+password')
    .exec();
}

export async function findActiveUserByEmail(email: string): Promise<IUser | null> {
  return UserModel.findOne({ email, active: true, deleted: false }).exec();
}

export async function updateUserPassword(
  userId: string | mongoose.Types.ObjectId,
  passwordHash: string,
  session?: mongoose.ClientSession
): Promise<void> {
  await UserModel.updateOne(
    { _id: userId },
    { $set: { password: passwordHash, passwordChangedAt: new Date() } },
    { session }
  ).exec();
}

export async function createUser(
  data: { username: string; email: string; passwordHash: string },
  session?: mongoose.ClientSession
): Promise<IUser> {
  const newUser = new UserModel({
    username: data.username,
    email: data.email,
    password: data.passwordHash,
  });
  return newUser.save({ session });
}

export async function findAllUsers(
  paginationParams: PaginationParams,
  filters?: { role?: string }
): Promise<PaginatedResponse<Record<string, unknown>, 'users'>> {
  const { limit, skip } = paginationParams;
  const matchStage: Record<string, unknown> = { deleted: false };

  const pipeline: mongoose.PipelineStage[] = [
    { $match: matchStage },
    {
      $lookup: {
        from: 'UserRoles',
        localField: '_id',
        foreignField: 'userId',
        as: 'userRoles',
      },
    },
    {
      $lookup: {
        from: 'Roles',
        localField: 'userRoles.roleId',
        foreignField: '_id',
        as: 'roles',
      },
    },
    {
      $lookup: {
        from: 'Venues',
        localField: '_id',
        foreignField: 'ownerUserId',
        as: 'venues',
      }
    }
  ];

  if (filters?.role) {
    pipeline.push({
      $match: { 'roles.name': filters.role },
    });
  }

  const [users, totalCountResult] = await Promise.all([
    UserModel.aggregate<Record<string, unknown>>([
      ...pipeline,
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          username: 1,
          email: 1,
          active: 1,
          createdAt: 1,
          roles: { $map: { input: '$roles', as: 'r', in: '$$r.name' } },
          venues: 1,
        },
      },
    ]),
    UserModel.aggregate<Record<string, unknown>>([
      ...pipeline,
      { $count: 'total' },
    ]),
  ]);

  const totalCount = totalCountResult[0]?.total ?? 0;
  
  return {
    users,
    pagination: buildPaginationMeta(totalCount as number, paginationParams),
  };
}

export async function toggleUserStatus(userId: string): Promise<IUser | null> {
  const user = await UserModel.findById(userId);
  if (!user) {
    return null;
  }
  user.active = !user.active;
  await user.save();
  return user;
}
