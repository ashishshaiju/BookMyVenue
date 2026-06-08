import { EmailTaskModel, type IEmailTask } from '../models/email-task.model';
import { emailService } from '../services/email.service';
import { EmailIntent, EmailTaskStatus, EmailConstants } from '../constants/email.constants';

let isShuttingDown = false;
let pollingInterval: NodeJS.Timeout | null = null;
let activeTasks = 0;

async function dispatch(task: IEmailTask): Promise<void> {
  const { intent, recipient, metadata } = task;

  switch (intent) {
    case EmailIntent.PASSWORD_RESET: {
      const resetLink = metadata.resetLink;
      if (!resetLink) {
        throw new Error(`Missing resetLink in metadata for ${EmailIntent.PASSWORD_RESET} intent`);
      }
      const result = await emailService.sendPasswordResetEmail(recipient, resetLink);
      if (!result.success) {
        throw new Error('Failed to send password reset email via Resend');
      }
      break;
    }
    case EmailIntent.SECURITY_ALERT: {
      const result = await emailService.sendPasswordChangedEmail(recipient);
      if (!result.success) {
        throw new Error('Failed to send security alert email via Resend');
      }
      break;
    }
    default:
      throw new Error(`Unknown email intent: ${intent}`);
  }
}

async function processNextTask(): Promise<void> {
  if (isShuttingDown) return;

  const now = new Date();
  const staleCutoff = new Date(Date.now() - EmailConstants.STALE_CUTOFF_MS);
  const pid = process.pid.toString();

  try {
    const task = await EmailTaskModel.findOneAndUpdate(
      {
        status: EmailTaskStatus.PENDING,
        $or: [{ lockedAt: null }, { lockedAt: { $lt: staleCutoff } }],
      },
      {
        $set: {
          status: EmailTaskStatus.QUEUED,
          workerId: pid,
          lockedAt: now,
        },
      },
      { returnDocument: 'after' }
    );

    if (!task) return;

    activeTasks++;

    try {
      await dispatch(task);
      task.status = EmailTaskStatus.COMPLETED;
      await task.save();
      console.log(`[email-worker] Task ${task._id.toString()} completed successfully.`);
    } catch (e) {
      const error = e as Error;
      task.retries += 1;
      task.lastError = error.message;

      if (task.retries >= EmailConstants.MAX_RETRIES) {
        task.status = EmailTaskStatus.FAILED;
        console.error(`[email-worker] Task ${task._id.toString()} failed permanently.`, {
          error: error.message,
        });
      } else {
        task.status = EmailTaskStatus.PENDING;
        // Exponential backoff
        const backoffMs = 2 ** task.retries * 30000; // 30s, 60s, 120s...
        task.lockedAt = new Date(Date.now() + backoffMs);
        console.warn(
          `[email-worker] Task ${task._id.toString()} failed. Retrying in ${backoffMs / 1000}s.`,
          { error: error.message }
        );
      }

      await task.save();
    } finally {
      activeTasks--;
    }
  } catch (err) {
    console.error('[email-worker] Polling loop encountered an error:', err);
  }
}

export function startEmailWorker(): void {
  if (pollingInterval) return;
  console.log(`[email-worker] Started, polling every ${EmailConstants.POLL_INTERVAL_MS / 1000}s.`);
  pollingInterval = setInterval(() => void processNextTask(), EmailConstants.POLL_INTERVAL_MS);
}

export async function stopEmailWorker(): Promise<void> {
  console.log('[email-worker] Shutdown initiated...');
  isShuttingDown = true;

  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }

  // Wait for in-flight tasks to complete (max 30 seconds)
  const waitInterval = 500;
  let waited = 0;
  const maxWait = 30000;

  while (activeTasks > 0 && waited < maxWait) {
    await new Promise((resolve) => setTimeout(resolve, waitInterval));
    waited += waitInterval;
  }

  if (activeTasks > 0) {
    console.warn(
      `[email-worker] Shutdown complete, but ${String(activeTasks)} tasks were left incomplete.`
    );
  } else {
    console.log('[email-worker] Shutdown complete gracefully.');
  }
}
