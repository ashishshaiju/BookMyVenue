export type EmailIntentType = (typeof EmailIntent)[keyof typeof EmailIntent];
export type EmailTaskStatusType = (typeof EmailTaskStatus)[keyof typeof EmailTaskStatus];

export const EmailIntent = {
  ACCOUNT_NOTIFICATION: 'account_notification',
  EMAIL_VERIFICATION: 'email_verification',
  PASSWORD_RESET: 'password_reset',
  SECURITY_ALERT: 'security_alert',
  WELCOME: 'welcome',
} as const;

export const EmailTaskStatus = {
  COMPLETED: 'completed',
  FAILED: 'failed',
  PENDING: 'pending',
  QUEUED: 'queued',
} as const;

export const EmailConstants = {
  MAX_RETRIES: 3,
  POLL_INTERVAL_MS: 5000, // 5 seconds
  STALE_CUTOFF_MS: 5 * 60 * 1000, // 5 minutes
} as const;
