import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared param schema (reuse the venueId pattern from venue.validator.ts)
// ---------------------------------------------------------------------------

export const venueIdParamSchema = z.object({
  id: z
    .string()
    .trim()
    .regex(/^[a-f\d]{24}$/i, 'Invalid venue ID format'),
});

export type VenueIdParamDTO = z.infer<typeof venueIdParamSchema>;

// ---------------------------------------------------------------------------
// Step 1: Block Slot
// ---------------------------------------------------------------------------

export const blockSlotBodySchema = z
  .object({
    /** Booking date in YYYY-MM-DD format */
    date: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format'),

    /** Slot start time in minutes from midnight (0–1439) */
    startTime: z
      .number()
      .int('startTime must be an integer')
      .min(0, 'startTime cannot be negative')
      .max(1439, 'startTime cannot exceed 23:59 (1439 minutes)'),

    /** Slot end time in minutes from midnight (1–1440) */
    endTime: z
      .number()
      .int('endTime must be an integer')
      .min(1, 'endTime must be at least 1 minute')
      .max(1440, 'endTime cannot exceed 24:00 (1440 minutes)'),

    /**
     * The price the client calculated for this slot (in rupees, not paise).
     * Used as a sanity check — the server re-validates price server-side in future.
     */
    expectedPrice: z
      .number()
      .positive('expectedPrice must be greater than 0'),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: 'endTime must be strictly greater than startTime',
    path: ['endTime'],
  });

export type BlockSlotBodyDTO = z.infer<typeof blockSlotBodySchema>;

// ---------------------------------------------------------------------------
// Step 2: Checkout Init
// ---------------------------------------------------------------------------

export const checkoutBodySchema = z.object({
  lockId: z
    .string()
    .trim()
    .regex(/^[a-f\d]{24}$/i, 'Invalid lockId format'),
});

export type CheckoutBodyDTO = z.infer<typeof checkoutBodySchema>;

export const verifyPaymentBodySchema = z.object({
  orderId: z.string().trim().min(1, 'orderId is required'),
  paymentId: z.string().trim().min(1, 'paymentId is required'),
  signature: z.string().trim().min(1, 'razorpay_signature is required'),
});

export type VerifyPaymentBodyDTO = z.infer<typeof verifyPaymentBodySchema>;
