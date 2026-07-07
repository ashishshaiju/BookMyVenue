import crypto from 'crypto';
import { Types } from 'mongoose';
import { runInTransaction } from '../../utils/dbUtils';
import { checkOverlap } from '../../utils/timeUtils';
import { logInfo, logWarn, logError } from '../../utils/logger';
import { LockModel } from './lock.model';
import * as repo from './booking.repository';
import {
  validateDateForVenue,
  validateSelectedSlotsForVenue,
  computeServerTotalPrice,
  assertPriceWithinTolerance
} from './booking.validator';
import { issueRefund, createOrder } from '../../services/razorpay.service';
import { EmailTaskModel } from '../../models/email-task.model';
import { EmailIntent, EmailTaskStatus } from '../../constants/email.constants';
import { UserModel } from '../user/user.models';
import { BookingStatus } from '../../constants/booking.constants';

const LOCK_TTL_SECONDS = 600;
const CHECKOUT_BUFFER_MS = 60 * 1000;

export async function blockSlotWorkflow(
  venueId: string,
  userId: string,
  date: string,
  expectedPrice: number,
  selectedSlots: { startTime: number; endTime: number }[],
  sessionToken?: string
): Promise<{ lockId: string; expiresAt: string; amountToPay: number }> {
  const venue = await repo.fetchApprovedVenueForBooking(venueId);
  if (!venue) {
    throw new Error('Venue not found or unavailable for booking.');
  }

  const dateCheck = validateDateForVenue(venue, date);
  if (!dateCheck.valid) {
    throw new Error(dateCheck.reason ?? 'Invalid date');
  }

  const slotCheck = validateSelectedSlotsForVenue(venue, selectedSlots);
  if (!slotCheck.valid) {
    throw new Error(slotCheck.reason ?? 'Invalid slots');
  }

  const serverPrice = computeServerTotalPrice(venue, selectedSlots);
  const priceCheck = assertPriceWithinTolerance(serverPrice, expectedPrice, 2);
  if (!priceCheck.valid) {
    throw new Error(priceCheck.reason ?? 'Price mismatch');
  }

  const sortedSlots = [...selectedSlots].sort((a, b) => a.startTime - b.startTime);
  const effectiveStart = sortedSlots[0].startTime;
  const effectiveEnd = sortedSlots[sortedSlots.length - 1].endTime;

  const sessionTokenHash = sessionToken
    ? crypto.createHash('sha256').update(sessionToken).digest('hex')
    : undefined;

  const lock = await runInTransaction(async (session) => {
    const conflicts = await repo.fetchActiveConflicts(venueId, date, {
      excludeUserId: userId,
      excludeSessionTokenHash: sessionTokenHash,
      session,
    });

    if (checkOverlap(effectiveStart, effectiveEnd, conflicts)) {
      throw new Error('The selected time slot is no longer available. Please choose a different slot.');
    }

    const deleteConditions: Record<string, unknown>[] = [{ userId: new Types.ObjectId(userId) }];
    if (sessionTokenHash) {
      deleteConditions.push({ sessionTokenHash });
    }
    await LockModel.deleteMany({ $or: deleteConditions }, { session });

    const [newLock] = await LockModel.create(
      [
        {
          venueId: new Types.ObjectId(venueId),
          userId: new Types.ObjectId(userId),
          date,
          startTime: effectiveStart,
          endTime: effectiveEnd,
          price: serverPrice,
          sessionTokenHash,
          createdAt: new Date(),
        },
      ],
      { session }
    );
    return newLock;
  });

  const expiresAt = new Date(lock.createdAt.getTime() + LOCK_TTL_SECONDS * 1000);

  logInfo('Slot lock acquired', {
    lockId: lock._id.toString(),
    venueId,
    userId,
    date,
    startTime: effectiveStart,
    endTime: effectiveEnd,
  });

  return {
    lockId: lock._id.toString(),
    expiresAt: expiresAt.toISOString(),
    amountToPay: serverPrice,
  };
}

export async function saveBookerDetailsWorkflow(
  lockId: string,
  userId: string,
  guestCount?: number,
  eventType?: string,
  bookerInfo?: Record<string, unknown>
): Promise<boolean> {
  const lock = await repo.updateLockBookerDetails(lockId, userId, guestCount, eventType, bookerInfo);
  if (!lock) {
    throw new Error('Booking session expired. Please re-select your slot and try again.');
  }
  return true;
}

export async function initCheckoutWorkflow(userId: string, lockId: string): Promise<{ orderId: string; amount: number; currency: string }> {
  const lock = await repo.findLockById(lockId);

  if (!lock) {
    throw new Error('Lock expired. Please re-select your slot and try again.');
  }

  const lockCreatedAt = lock.createdAt instanceof Date
    ? lock.createdAt.getTime()
    : new Date(lock.createdAt).getTime();

  const lockExpiresAtMs = lockCreatedAt + LOCK_TTL_SECONDS * 1000;
  const remainingMs = lockExpiresAtMs - Date.now();

  if (remainingMs < CHECKOUT_BUFFER_MS) {
    logWarn('Checkout rejected: insufficient time remaining on lock', {
      lockId,
      userId,
      remainingSeconds: Math.floor(remainingMs / 1000),
    });
    throw new Error('Insufficient time to complete payment. Please re-select your slot.');
  }

  const amountPaise = Math.round(lock.price * 100);

  const order = await createOrder({
    amountPaise,
    currency: 'INR',
    notes: {
      lockId: lock._id.toString(),
      venueId: lock.venueId.toString(),
      userId: lock.userId.toString(),
    },
  });

  logInfo('Razorpay checkout order created', {
    lockId: lock._id.toString(),
    orderId: order.orderId,
    amount: order.amount,
  });

  return {
    orderId: order.orderId,
    amount: order.amount,
    currency: order.currency,
  };
}

export async function releaseLockWorkflow(userId?: string, sessionToken?: string): Promise<void> {
  if (!userId && !sessionToken) return;

  const deleteConditions: Record<string, unknown>[] = [];
  if (userId) deleteConditions.push({ userId: new Types.ObjectId(userId) });
  if (sessionToken) {
    const sessionTokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
    deleteConditions.push({ sessionTokenHash });
  }

  await repo.deleteLocksByConditions(deleteConditions);
}

export async function cancelBookingWorkflow(userId: string, bookingId: string, reason?: string): Promise<boolean> {
  const booking = await repo.fetchUserBookingByRefIdOrId(bookingId, userId);
  
  if (!booking) {
    throw new Error('Booking not found');
  }

  if (booking.status !== BookingStatus.CONFIRMED) {
    throw new Error('Only confirmed bookings can be cancelled');
  }

  const now = new Date();
  const bookingEnd = new Date(`${booking.date}T00:00:00`);
  bookingEnd.setMinutes(booking.endTime);

  if (bookingEnd < now) {
    throw new Error('Cannot cancel a booking that has already started or completed');
  }

  const bookingDetails = await repo.fetchBookingById(booking._id.toString(), userId);
  if (!bookingDetails || (bookingDetails.cancellationRefundPct as number) === 0) {
     throw new Error('Cancellation window passed or non-refundable venue');
  }

  const amountPaise = booking.price * 100;
  const refundAmountPaise = Math.floor(amountPaise * ((bookingDetails.cancellationRefundPct as number) / 100));

  if (refundAmountPaise > 0 && booking.paymentReference) {
      try {
        await issueRefund(booking.paymentReference, refundAmountPaise);
      } catch (err) {
        logError('CRITICAL: Razorpay refund failed during manual cancellation', {
           module: 'booking.workflow.ts/cancelBookingWorkflow',
           paymentId: booking.paymentReference,
           amountPaise: refundAmountPaise,
           error: (err as Error).message,
        });
        throw new Error('Refund failed. Please contact support.', { cause: err });
      }
  }

  await repo.updateBookingToCancelled(booking, reason);

  try {
    const user = await UserModel.findById(userId).select('email').lean();
    const customerEmail = (user as { email?: string } | null)?.email;

    if (customerEmail) {
      const venueName = bookingDetails.venueName as string;
      const date = bookingDetails.date as string;
      const timeRange = bookingDetails.timeRange as string;
      const bookingRef = bookingDetails.bookingRef as string;
      
      await EmailTaskModel.create({
        recipient: customerEmail,
        intent: EmailIntent.ACCOUNT_NOTIFICATION,
        subject: `Booking Cancelled – ${venueName}`,
        status: EmailTaskStatus.PENDING,
        retryAfter: new Date(),
        metadata: {
          bookingRef,
          venueName,
          date,
          timeRange,
          refundAmount: (refundAmountPaise / 100).toString(),
        }
      });
    }
  } catch (emailErr) {
    logWarn('Failed to queue cancellation email', {
      bookingId,
      error: (emailErr as Error).message,
    });
  }

  return true;
}
