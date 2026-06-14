import type { IUser } from './user.models';
import { UserModel } from './user.models';
import type mongoose from 'mongoose';

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
