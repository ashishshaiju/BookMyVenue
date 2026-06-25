/**
 * booking.repository.ts
 *
 * All database reads and writes for the booking domain.
 * Centralised here so both the booking controller and the webhook handler
 * share one source of truth for DB operations.
 */

import { Types } from 'mongoose';
import { LockModel } from './lock.model';
import { BookingModel } from './booking.model';
import { FailedBookingModel } from './failedBooking.model';
import { ProcessedWebhookModel } from './processedWebhook.model';
import type { BookingStatus, IBooking } from './booking.types';
import type { ILock } from './lock.types';

// ---------------------------------------------------------------------------
// Conflict resolution
// ---------------------------------------------------------------------------

/**
 * Returns all active time-slot conflicts for a venue on a given date.
 * A conflict is either:
 *   - An active Lock (TTL-based optimistic hold)
 *   - A confirmed Booking
 *
 * Output is a flat array of {start, end} pairs consumed by `checkOverlap`.
 */
export async function fetchActiveConflicts(
  venueId: string,
  date: string
): Promise<{ start: number; end: number }[]> {
  const vId = new Types.ObjectId(venueId);

  const [locks, bookings] = await Promise.all([
    LockModel.find({ venueId: vId, date }).lean(),
    BookingModel.find({ venueId: vId, date, status: 'Confirmed' }).lean(),
  ]);

  return [
    ...locks.map((l:ILock) => ({ start: l.startTime, end: l.endTime })),
    ...bookings.map((b:IBooking) => ({ start: b.startTime, end: b.endTime })),
  ];
}

// ---------------------------------------------------------------------------
// Booking writes
// ---------------------------------------------------------------------------

export interface CreateBookingData {
  venueId: string;
  userId: string;
  date: string;
  startTime: number;
  endTime: number;
  price: number;
  paymentReference: string;
  status?: BookingStatus;
}

/**
 * Inserts a new Booking document and returns it.
 */
export async function createBooking(data: CreateBookingData): Promise<IBooking> {
  const booking = await BookingModel.create({
    venueId: new Types.ObjectId(data.venueId),
    userId: new Types.ObjectId(data.userId),
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime,
    price: data.price,
    paymentReference: data.paymentReference,
    status: data.status ?? 'Confirmed',
  });
  return booking;
}

// ---------------------------------------------------------------------------
// FailedBooking audit
// ---------------------------------------------------------------------------

export interface CreateFailedBookingData {
  venueId: string;
  userId: string;
  date: string;
  startTime: number;
  endTime: number;
  amountPaid: number;
  paymentReference: string;
  refundReference: string;
  reason: string;
}

/**
 * Inserts an immutable audit record for a collision-triggered refund.
 */
export async function createFailedBooking(data: CreateFailedBookingData): Promise<void> {
  await FailedBookingModel.create({
    venueId: new Types.ObjectId(data.venueId),
    userId: new Types.ObjectId(data.userId),
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime,
    amountPaid: data.amountPaid,
    paymentReference: data.paymentReference,
    refundReference: data.refundReference,
    reason: data.reason,
  });
}

// ---------------------------------------------------------------------------
// Idempotency gate
// ---------------------------------------------------------------------------

/**
 * Inserts the Razorpay event_id into ProcessedWebhookModel.
 * Throws a MongoServerError with code 11000 if the event was already processed.
 * The caller MUST catch error.code === 11000 and return 200 immediately.
 */
export async function markWebhookProcessed(eventId: string): Promise<void> {
  await ProcessedWebhookModel.create({ eventId });
}
