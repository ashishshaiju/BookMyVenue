import { EmailTaskModel } from '../models/email-task.model';
import type { EmailIntentType, EmailTaskStatusType } from '../constants/email.constants';

export async function enqueueEmailTask(
  recipient: string,
  intent: EmailIntentType,
  subject: string,
  status: EmailTaskStatusType,
  metadata: Record<string, string>
): Promise<void> {
  await EmailTaskModel.create({
    recipient,
    intent,
    subject,
    status,
    retryAfter: new Date(),
    metadata,
  });
}
