import { resendConfig } from '../constants/env';

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
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
               style="max-width:600px;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color:#1d4ed8;padding:32px 40px;text-align:center;">
              <span style="font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">${appName}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              ${bodyContent}
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:0;" />
            </td>
          </tr>
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
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function getPasswordResetTemplate(resetLink: string, email: string): string {
  const appName = resendConfig.appName;
  const isDev = process.env.NODE_ENV === 'development';

  const bodyContent = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Reset your password</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#374151;">
      We received a request to reset the password for your <strong>${appName}</strong> account.
      Click the button below to choose a new password.
    </p>
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
    ${isDev ? `<p style="margin:16px 0 0;font-size:13px;color:#92400e;"><strong>Development mode</strong> - Email sent to ${email}</p>` : ''}
  `;

  return buildEmailWrapper(bodyContent);
}

// Admin Password Reset Template
export function getAdminPasswordResetTemplate(newPassword: string, username: string): string {
  const appName = resendConfig.appName;
  const bodyContent = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Your Password Has Been Reset</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#374151;">
      Hi ${username}, an administrator has reset your password for your <strong>${appName}</strong> account.
    </p>
    <div style="background-color:#f3f4f6;padding:16px;border-radius:6px;margin-bottom:24px;">
      <p style="margin:0;font-size:15px;color:#374151;">Your new temporary password is:</p>
      <p style="margin:8px 0 0;font-size:20px;font-weight:700;color:#111827;">${newPassword}</p>
    </div>
    <p style="margin:0;font-size:15px;line-height:1.6;color:#374151;">
      Please log in with this new password and change it immediately from your profile settings.
    </p>
  `;
  
  return buildEmailWrapper(bodyContent);
}

export function getPasswordChangedTemplate(): string {
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

  return buildEmailWrapper(bodyContent);
}

export function getBookingConfirmationTemplate(details: {
  venueName: string;
  date: string;
  startTime: string;
  endTime: string;
  amount: number;
  paymentReference: string;
}): string {
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

  return buildEmailWrapper(bodyContent);
}

export function getRefundNotificationTemplate(details: {
  venueName: string;
  date: string;
  startTime: string;
  endTime: string;
  amount: number;
  refundReference: string;
}): string {
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

  return buildEmailWrapper(bodyContent);
}

export function getBookingCancellationTemplate(details: {
  venueName: string;
  date: string;
  timeRange: string;
  refundAmount: number;
  bookingRef: string;
}): string {
  const appName = resendConfig.appName;

  const bodyContent = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Booking Cancelled</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#374151;">
      Your booking at <strong>${details.venueName}</strong> has been successfully cancelled.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="background-color:#fef2f2;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 8px;font-size:14px;color:#991b1b;"><strong>Venue</strong></p>
          <p style="margin:0 0 16px;font-size:16px;color:#111827;font-weight:600;">${details.venueName}</p>
          <p style="margin:0 0 8px;font-size:14px;color:#991b1b;"><strong>Date</strong></p>
          <p style="margin:0 0 16px;font-size:16px;color:#111827;">${details.date}</p>
          <p style="margin:0 0 8px;font-size:14px;color:#991b1b;"><strong>Time Slot</strong></p>
          <p style="margin:0 0 16px;font-size:16px;color:#111827;">${details.timeRange}</p>
          <p style="margin:0 0 8px;font-size:14px;color:#991b1b;"><strong>Refund Amount</strong></p>
          <p style="margin:0;font-size:20px;color:#111827;font-weight:700;">₹${details.refundAmount.toLocaleString('en-IN')}</p>
        </td>
      </tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="background-color:#fef9c3;border-radius:6px;margin-bottom:16px;">
      <tr>
        <td style="padding:14px 16px;">
          <p style="margin:0;font-size:13px;color:#92400e;line-height:1.5;">
            <strong>Important notice:</strong> If this cancellation was a mistake or was not done by you,
            please contact our support team immediately.
          </p>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;color:#9ca3af;">
      Booking Reference: <code style="font-size:12px;color:#6b7280;">${details.bookingRef}</code>
    </p>
    <p style="margin:16px 0 0;font-size:14px;color:#374151;">
      We hope to host you another time on ${appName}.
    </p>
  `;
  return buildEmailWrapper(bodyContent);
}

export function getVenueApprovedTemplate(venueName: string): string {
  const bodyContent = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Venue Approved! 🎉</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#374151;">
      Great news! Your venue <strong>${venueName}</strong> has been approved by our admin team and is now live on the platform.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="background-color:#f0fdf4;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0;font-size:15px;color:#166534;line-height:1.6;">
            Users can now view and book your venue. Make sure your availability and pricing are up to date!
          </p>
        </td>
      </tr>
    </table>
  `;
  return buildEmailWrapper(bodyContent);
}

export function getVenueRejectedTemplate(venueName: string, reason: string): string {
  const bodyContent = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Venue Application Update</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#374151;">
      We reviewed your application for <strong>${venueName}</strong>, but unfortunately, we cannot approve it at this time.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="background-color:#fef2f2;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 8px;font-size:14px;color:#991b1b;"><strong>Reason for Rejection:</strong></p>
          <p style="margin:0;font-size:15px;color:#7f1d1d;line-height:1.5;">${reason}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:15px;line-height:1.6;color:#374151;">
      You can update your venue details in the owner dashboard and submit it again for review once the issues have been addressed.
    </p>
  `;
  return buildEmailWrapper(bodyContent);
}

export function getVenueSuspendedTemplate(venueName: string, reason: string): string {
  const bodyContent = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Venue Suspended</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#374151;">
      Your venue <strong>${venueName}</strong> has been temporarily suspended by our admin team and is currently not visible to users.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="background-color:#fef9c3;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 8px;font-size:14px;color:#854d0e;"><strong>Reason for Suspension:</strong></p>
          <p style="margin:0;font-size:15px;color:#713f12;line-height:1.5;">${reason}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:15px;line-height:1.6;color:#374151;">
      Please contact our support team to resolve this issue and have your venue unsuspended.
    </p>
  `;
  return buildEmailWrapper(bodyContent);
}

export function getVenueUnsuspendedTemplate(venueName: string): string {
  const bodyContent = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Venue Reactivated</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#374151;">
      The suspension on your venue <strong>${venueName}</strong> has been lifted.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="background-color:#f0fdf4;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0;font-size:15px;color:#166534;line-height:1.6;">
            Your venue is now active again and visible to all users on the platform. Welcome back!
          </p>
        </td>
      </tr>
    </table>
  `;
  return buildEmailWrapper(bodyContent);
}
