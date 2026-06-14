import * as repo from './user.repository';
import { NotFoundError } from '../../utils/errors';

export async function getProfile(userId: string): Promise<{
  userId: string;
  username: string;
  email: string;
}> {
  const user = await repo.findUserById(userId);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return {
    userId: user._id.toString(),
    username: user.username,
    email: user.email,
  };
}
