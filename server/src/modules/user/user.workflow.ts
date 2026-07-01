import * as repo from './user.repository';
import * as service from './user.service';
import { EmailTaskModel } from '../../models/email-task.model';
import { EmailIntent, EmailTaskStatus } from '../../constants/email.constants';

export async function resetUserPasswordWorkflow(userId: string): Promise<boolean> {
  const user = await repo.findUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const { plain: newPassword, hashed: hashedPassword } = await service.generateRandomPasswordWithHash();

  await repo.updateUserPassword(userId, hashedPassword);

  await EmailTaskModel.create({
    recipient: user.email,
    intent: EmailIntent.ADMIN_PASSWORD_RESET,
    status: EmailTaskStatus.PENDING,
    metadata: { newPassword, username: user.username }
  });

  return true;
}
