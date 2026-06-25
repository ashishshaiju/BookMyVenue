import { Resend } from 'resend';
import { z } from 'zod';
import { EmailIntent, type EmailIntentType } from '../constants/email.constants';
import { resendConfig } from '../constants/env';
import { logError, logInfo } from '../utils/logger';

// Validates required email configuration on startup.
export function validateEmailConfig(): void {
  const missing: string[] = [];

  if (!resendConfig.apiKey) missing.push('RESEND_API_KEY');
  if (!resendConfig.fromName) missing.push('EMAIL_FROM_NAME');
  if (!resendConfig.fromEmail) missing.push('EMAIL_FROM_EMAIL');
  if (!resendConfig.devToEmail) missing.push('RESEND_DEV_EMAIL_ADDRESS');
  if (!resendConfig.frontendUrl) missing.push('FRONTEND_URL');

  if (missing.length > 0) {
    logError('Missing required email environment variables', { module: "email.service.ts/validateEmailConfig",missing });
    process.exit(1);
  }

  logInfo('Resend Email service config validated');
}

let _resend: Resend | null = null;

function getResendClient(): Resend {
  if (!_resend) {
    if (!resendConfig.apiKey) {
      throw new Error('RESEND_API_KEY is not set');
    }
    _resend = new Resend(resendConfig.apiKey);
  }
  return _resend;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
}

// Shared branded wrapper
function buildEmailWrapper(bodyContent: string): string {
  const appName = resendConfig.appName;
  const currentYear = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${appName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
               style="max-width:600px;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color:#1d4ed8;padding:32px 40px;text-align:center;">
              <span style="font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">${appName}</span>
            </td>
          </tr>

          <!-- Body content -->
          <tr>
            <td style="padding:40px;">
              ${bodyContent}
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:0;" />
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">
                This email was sent by ${appName}. If you have questions, reply to this email.
              </p>
              <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;">
                If you did not request this, you can safely ignore this email.
                Your account remains secure and no action is required.
              </p>
              <p style="margin:0;font-size:12px;color:#d1d5db;">
                &copy; ${String(currentYear)} ${appName}. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>
  <!-- /Outer wrapper -->

</body>
</html>`;
}

// Email input validation
const emailAddressSchema = z.email('Invalid recipient email address');

function validateRecipient(email: string): string {
  if (process.env.NODE_ENV === 'development') {
    const res = resendConfig.devToEmail ?? '';
    if (!emailAddressSchema.safeParse(res).success) {
      throw new Error('Invalid development recipient email address');
    }
    return res;
  }
  return emailAddressSchema.parse(email);
}

// Core send helper
async function sendEmail(
  to: string,
  subject: string,
  html: string,
  intent: EmailIntentType
): Promise<SendEmailResult> {
  const from = `${resendConfig.fromName ?? ''} <${resendConfig.fromEmail ?? ''}>`; // guaranteed non-null after validateEmailConfig

  try {
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({ from, to, subject, html });

    if (error) {
      logError('Email delivery failed', {
        module: "email.service.ts/sendEmail",
        intent,
        recipient: to,
        providerError: error.message,
      });
      return { success: false };
    }

    logInfo('Email sent successfully', {
      intent,
      recipient: to,
      messageId: data.id,
    });

    return { success: true, messageId: data.id };
  } catch (e) {
    const err = e as Error;
    logError('Email service encountered an unexpected error', {
      module: "email.service.ts/sendEmail",
      intent,
      recipient: to,
      error: err.message,
    });
    return { success: false };
  }
}

class EmailService {
  /**
   * Sends a password reset email.
   * @param email     - Recipient email address
   * @param resetLink - Fully-qualified HTTPS reset URL (token included)
   */
  async sendPasswordResetEmail(email: string, resetLink: string): Promise<SendEmailResult> {
    const validatedRecipientEmail = validateRecipient(email);

    const appName = resendConfig.appName;

    const bodyContent = `
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Reset your password</h1>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#374151;">
        We received a request to reset the password for your <strong>${appName}</strong> account.
        Click the button below to choose a new password.
      </p>

      <!-- CTA button -->
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr>
          <td style="border-radius:6px;background-color:#1d4ed8;">
            <a href="${resetLink}"
               target="_blank"
               rel="noopener noreferrer"
               style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;
                      color:#ffffff;text-decoration:none;border-radius:6px;
                      background-color:#1d4ed8;">
              Reset Password
            </a>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 16px;font-size:14px;color:#6b7280;">
        This link expires in <strong>15 minutes</strong>. After that you will need to request a new one.
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="background-color:#fef9c3;border-radius:6px;margin-bottom:16px;">
        <tr>
          <td style="padding:14px 16px;">
            <p style="margin:0;font-size:13px;color:#92400e;line-height:1.5;">
              <strong>Security notice:</strong> If you did not request a password reset,
              please ignore this email. Your password will not be changed and your account
              remains secure.
            </p>
          </td>
        </tr>
      </table>

      <p style="margin:0;font-size:13px;color:#9ca3af;">
        If the button above does not work, copy and paste the following URL into your browser.
        Do not share this link with anyone.
      </p>
      <p style="margin:8px 0 0;font-size:13px;color:#6b7280;word-break:break-all;">
        ${resetLink}
      </p>

      ${process.env.NODE_ENV === 'development' ? `<p style="margin:16px 0 0;font-size:13px;color:#92400e;"><strong>Development mode</strong> - Email sent to ${email}</p>` : ''}
    `;

    return sendEmail(
      validatedRecipientEmail,
      `Reset your ${appName} password`,
      buildEmailWrapper(bodyContent),
      'password_reset'
    );
  }

  /**
   * Sends a security notification informing the user that their password was changed.
   * Contains no tokens, no links, and no sensitive data — purely informational.
   * @param email - Recipient email address
   */
  async sendPasswordChangedEmail(email: string): Promise<SendEmailResult> {
    const validatedRecipientEmail = validateRecipient(email);

    const appName = resendConfig.appName;

    const bodyContent = `
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Your password was changed</h1>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#374151;">
        The password for your <strong>${appName}</strong> account was successfully changed.
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="background-color:#fef9c3;border-radius:6px;margin-bottom:24px;">
        <tr>
          <td style="padding:14px 16px;">
            <p style="margin:0;font-size:13px;color:#92400e;line-height:1.5;">
              <strong>Was this you?</strong> No action is required. Your account is secure.<br />
              <strong>Was this NOT you?</strong> Contact our support team immediately so we can
              help secure your account.
            </p>
          </td>
        </tr>
      </table>

      <p style="margin:0;font-size:13px;color:#9ca3af;">
        For your security, all active sessions have been signed out. You will need to log in
        again with your new password.
      </p>
    `;

    return sendEmail(
      validatedRecipientEmail,
      `Your ${appName} password was changed`,
      buildEmailWrapper(bodyContent),
      'security_alert'
    );
  }
  // Booking flow emails

  /**
   * Sends a booking confirmation email to the customer.
   * @param email  - Customer email address
   * @param details - Booking details for rendering the email body
   */
  async sendBookingConfirmation(
    email: string,
    details: {
      venueName: string;
      date: string;
      startTime: string;
      endTime: string;
      amount: number;
      paymentReference: string;
    }
  ): Promise<SendEmailResult> {
    const validatedRecipientEmail = validateRecipient(email);

    const bodyContent = `
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Booking Confirmed! 🎉</h1>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#374151;">
        Your booking at <strong>${details.venueName}</strong> is confirmed.
        Here's a summary of your reservation.
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="background-color:#f0fdf4;border-radius:8px;margin-bottom:24px;">
        <tr>
          <td style="padding:20px 24px;">
            <p style="margin:0 0 8px;font-size:14px;color:#166534;"><strong>Venue</strong></p>
            <p style="margin:0 0 16px;font-size:16px;color:#111827;font-weight:600;">${details.venueName}</p>

            <p style="margin:0 0 8px;font-size:14px;color:#166534;"><strong>Date</strong></p>
            <p style="margin:0 0 16px;font-size:16px;color:#111827;">${details.date}</p>

            <p style="margin:0 0 8px;font-size:14px;color:#166534;"><strong>Time</strong></p>
            <p style="margin:0 0 16px;font-size:16px;color:#111827;">${details.startTime} – ${details.endTime}</p>

            <p style="margin:0 0 8px;font-size:14px;color:#166534;"><strong>Amount Paid</strong></p>
            <p style="margin:0;font-size:20px;color:#111827;font-weight:700;">₹${details.amount.toLocaleString('en-IN')}</p>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;">
        Payment Reference: <code style="font-size:12px;color:#6b7280;">${details.paymentReference}</code>
      </p>

      <p style="margin:16px 0 0;font-size:14px;color:#374151;">
        We look forward to hosting your event. If you have any questions, please reply to this email.
      </p>
    `;

    return sendEmail(
      validatedRecipientEmail,
      `Booking Confirmed – ${details.venueName} on ${details.date}`,
      buildEmailWrapper(bodyContent),
      EmailIntent.BOOKING_CONFIRMATION
    );
  }

  /**
   * Sends a refund notification to the customer when their booking fails
   * due to a slot collision after the lock TTL expired.
   */
  async sendRefundNotification(
    email: string,
    details: {
      venueName: string;
      date: string;
      startTime: string;
      endTime: string;
      amount: number;
      refundReference: string;
    }
  ): Promise<SendEmailResult> {
    const validatedRecipientEmail = validateRecipient(email);
    const appName = resendConfig.appName;

    const bodyContent = `
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Booking Unsuccessful – Refund Initiated</h1>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#374151;">
        We're sorry — by the time your payment was processed, the selected slot at
        <strong>${details.venueName}</strong> had been booked by another customer.
        We have initiated a full refund.
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="background-color:#fef2f2;border-radius:8px;margin-bottom:24px;">
        <tr>
          <td style="padding:20px 24px;">
            <p style="margin:0 0 8px;font-size:14px;color:#991b1b;"><strong>Venue</strong></p>
            <p style="margin:0 0 16px;font-size:16px;color:#111827;font-weight:600;">${details.venueName}</p>

            <p style="margin:0 0 8px;font-size:14px;color:#991b1b;"><strong>Requested Date</strong></p>
            <p style="margin:0 0 16px;font-size:16px;color:#111827;">${details.date}</p>

            <p style="margin:0 0 8px;font-size:14px;color:#991b1b;"><strong>Time Slot</strong></p>
            <p style="margin:0 0 16px;font-size:16px;color:#111827;">${details.startTime} – ${details.endTime}</p>

            <p style="margin:0 0 8px;font-size:14px;color:#991b1b;"><strong>Refund Amount</strong></p>
            <p style="margin:0;font-size:20px;color:#111827;font-weight:700;">₹${details.amount.toLocaleString('en-IN')}</p>
          </td>
        </tr>
      </table>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="background-color:#fef9c3;border-radius:6px;margin-bottom:16px;">
        <tr>
          <td style="padding:14px 16px;">
            <p style="margin:0;font-size:13px;color:#92400e;line-height:1.5;">
              <strong>Refund Timeline:</strong> Refunds typically reflect in your account within
              5–7 business days depending on your bank.
            </p>
          </td>
        </tr>
      </table>

      <p style="margin:0;font-size:13px;color:#9ca3af;">
        Refund Reference: <code style="font-size:12px;color:#6b7280;">${details.refundReference}</code>
      </p>

      <p style="margin:16px 0 0;font-size:14px;color:#374151;">
        We apologise for the inconvenience. Please try booking another available slot on ${appName}.
      </p>
    `;

    return sendEmail(
      validatedRecipientEmail,
      `Booking Failed – Full Refund Initiated for ${details.venueName}`,
      buildEmailWrapper(bodyContent),
      EmailIntent.BOOKING_REFUND
    );
  }
}

export const emailService = new EmailService();
