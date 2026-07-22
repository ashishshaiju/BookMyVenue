import { EmailTaskModel, type IEmailTask } from '../models/email-task.model';
import { emailService } from '../services/email.service';
import { EmailIntent, EmailTaskStatus, EmailConstants } from '../constants/email.constants';
import { logError, logWarn, logInfo } from '../utils/logger';

let isShuttingDown = false;
let pollingInterval: ReturnType<typeof setInterval> | null = null;
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
    case EmailIntent.ADMIN_PASSWORD_RESET: {
      const { newPassword, username } = metadata;
      if (!newPassword || !username) {
        throw new Error(`Missing required metadata for ${EmailIntent.ADMIN_PASSWORD_RESET} intent`);
      }
      const result = await emailService.sendAdminPasswordResetEmail(
        recipient,
        newPassword,
        username
      );
      if (!result.success) {
        throw new Error('Failed to send admin password reset email via Resend');
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
    case EmailIntent.BOOKING_CONFIRMATION: {
      const { venueName, date, startTime, endTime, amount, paymentReference } = metadata;
      if (!venueName || !date || !startTime || !endTime || !amount || !paymentReference) {
        throw new Error(
          `Missing required metadata fields for ${EmailIntent.BOOKING_CONFIRMATION} intent`
        );
      }
      const result = await emailService.sendBookingConfirmation(recipient, {
        venueName,
        date,
        startTime,
        endTime,
        amount: parseFloat(amount),
        paymentReference,
      });
      if (!result.success) {
        throw new Error('Failed to send booking confirmation email via Resend');
      }
      break;
    }
    case EmailIntent.BOOKING_REFUND: {
      const { venueName, date, startTime, endTime, amount, refundReference } = metadata;
      if (!venueName || !date || !startTime || !endTime || !amount || !refundReference) {
        throw new Error(
          `Missing required metadata fields for ${EmailIntent.BOOKING_REFUND} intent`
        );
      }
      const result = await emailService.sendRefundNotification(recipient, {
        venueName,
        date,
        startTime,
        endTime,
        amount: parseFloat(amount),
        refundReference,
      });
      if (!result.success) {
        throw new Error('Failed to send booking refund email via Resend');
      }
      break;
    }
    case EmailIntent.BOOKING_CANCELLATION: {
      const { venueName, date, timeRange, refundAmount, bookingRef } = metadata;
      if (!venueName || !date || !timeRange || !refundAmount || !bookingRef) {
        throw new Error(
          `Missing required metadata fields for ${EmailIntent.BOOKING_CANCELLATION} intent`
        );
      }
      const result = await emailService.sendBookingCancellationEmail(recipient, {
        venueName,
        date,
        timeRange,
        refundAmount: parseFloat(refundAmount),
        bookingRef,
      });
      if (!result.success) {
        throw new Error('Failed to send booking cancellation email via Resend');
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
        retryAfter: { $lte: now },
      },
      {
        $set: {
          status: EmailTaskStatus.QUEUED,
          workerId: pid,
          lockedAt: now,
        },
      },
      { returnDocument: 'after', writeConcern: { w: 'majority' } }
    );

    if (!task) return;

    activeTasks++;

    try {
      await dispatch(task);
      task.status = EmailTaskStatus.COMPLETED;
      await task.save();
      logInfo(`Email task completed`, { taskId: task._id.toString() });
    } catch (e) {
      const error = e as Error;
      task.retries += 1;
      task.lastError = error.message;

      if (task.retries >= EmailConstants.MAX_RETRIES) {
        task.status = EmailTaskStatus.FAILED;
        logError(`Email task failed permanently`, {
          module: 'email.worker.ts/processNextTask',
          taskId: task._id.toString(),
          error: error.message,
        });
      } else {
        task.status = EmailTaskStatus.PENDING;
        // Exponential backoff
        const backoffMs = 2 ** task.retries * 30000; // 30s, 60s, 120s...
        task.lockedAt = new Date(Date.now() + backoffMs);
        logWarn(`Email task failed, scheduling retry`, {
          taskId: task._id.toString(),
          retryInSeconds: backoffMs / 1000,
          error: error.message,
        });
      }

      await task.save();
    } finally {
      activeTasks--;
    }
  } catch (err) {
    logError('Email worker polling loop encountered an error', {
      module: 'email.worker.ts/processNextTask',
      error: (err as Error).message,
    });
  }
}

export function startEmailWorker(): void {
  if (pollingInterval) return;
  logInfo('Email worker started', { pollIntervalSeconds: EmailConstants.POLL_INTERVAL_MS / 1000 });
  pollingInterval = setInterval(() => void processNextTask(), EmailConstants.POLL_INTERVAL_MS);
}

export async function stopEmailWorker(): Promise<void> {
  logInfo('Email worker shutdown initiated');
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
    logWarn('Email worker shutdown complete with incomplete tasks', { activeTasks });
  } else {
    logInfo('Email worker shutdown complete gracefully');
  }
}
