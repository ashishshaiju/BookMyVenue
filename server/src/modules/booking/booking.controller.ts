import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { ResponseUtil } from '../../utils/responseUtils';
import { logError, logInfo, logWarn } from '../../utils/logger';
import { checkOverlap } from '../../utils/timeUtils';
import { fetchActiveConflicts } from './booking.repository';
import { LockModel } from './lock.model';
import { createOrder, verifyPaymentSignature } from '../../services/razorpay.service';
import type {
  BlockSlotBodyDTO,
  CheckoutBodyDTO,
  VerifyPaymentBodyDTO,
  VenueIdParamDTO,
} from './booking.validator';

const LOCK_TTL_SECONDS = 600;
const CHECKOUT_BUFFER_MS = 60 * 1000; // 60s

// POST /api/v1/availability/:id/block
// Checks slot availability and acquires a TTL-based lock.
export const blockSlot = async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = req.validated;
    if (!validated) {
      ResponseUtil.badRequest(res, 'Validation failed');
      return;
    }
    const { id: venueId } = validated.params as VenueIdParamDTO;
    const { date, startTime, endTime, expectedPrice } = validated.body as BlockSlotBodyDTO;
    const userId = req.user?.userId;

    if (!userId) {
      ResponseUtil.unauthorized(res, 'User identity not found in token');
      return;
    }

    const conflicts = await fetchActiveConflicts(venueId, date);
    const hasConflict = checkOverlap(startTime, endTime, conflicts);

    if (hasConflict) {
      ResponseUtil.conflict(
        res,
        'The selected time slot is no longer available. Please choose a different slot.'
      );
      return;
    }

    const lock = await LockModel.create({
      venueId: new Types.ObjectId(venueId),
      userId: new Types.ObjectId(userId),
      date,
      startTime,
      endTime,
      price: expectedPrice,
      createdAt: new Date(),
    });

    const expiresAt = new Date(lock.createdAt.getTime() + LOCK_TTL_SECONDS * 1000);

    logInfo('Slot lock acquired', {
      lockId: lock._id.toString(),
      venueId,
      userId,
      date,
      startTime,
      endTime,
    });

    ResponseUtil.success(res, 'Slot locked successfully. Proceed to checkout.', {
      lockId: lock._id.toString(),
      expiresAt: expiresAt.toISOString(),
      amountToPay: expectedPrice,
    });
  } catch (err) {
    const error = err as Error;
    logError('blockSlot controller error', {
      module: 'booking.controller.ts/blockSlot',
      error: error.message,
    });
    ResponseUtil.internalServerError(res, 'Failed to acquire slot lock. Please try again.');
  }
};

// POST /api/v1/bookings/checkout
// Creates a Razorpay checkout order if the slot lock is still valid.
export const initCheckout = async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = req.validated;
    if (!validated) {
      ResponseUtil.badRequest(res, 'Validation failed');
      return;
    }
    const { lockId } = validated.body as CheckoutBodyDTO;
    const userId = req.user?.userId;

    if (!userId) {
      ResponseUtil.unauthorized(res, 'User identity not found in token');
      return;
    }

    const lock = await LockModel.findById(lockId).lean();

    if (!lock) {
      logWarn('Checkout attempted with expired or invalid lock', { lockId, userId });
      ResponseUtil.badRequest(
        res,
        'Lock expired. Please re-select your slot and try again.'
      );
      return;
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
      ResponseUtil.badRequest(
        res,
        'Insufficient time to complete payment. Please re-select your slot.'
      );
      return;
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

    ResponseUtil.success(res, 'Checkout order created successfully.', {
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    const error = err as Error;
    logError('initCheckout controller error', {
      module: 'booking.controller.ts/initCheckout',
      error: error.message,
    });
    ResponseUtil.internalServerError(
      res,
      'Failed to create checkout order. Please try again.'
    );
  }
};

// Verifies the Razorpay payment signature
export const verifyPayment = (req: Request, res: Response): void => {
  try {
    const validated = req.validated;
    if (!validated) {
      ResponseUtil.badRequest(res, 'Validation failed');
      return;
    }
    const { orderId, paymentId, signature } = validated.body as VerifyPaymentBodyDTO;

    if (!orderId || !paymentId || !signature) {
      ResponseUtil.badRequest(res, 'Missing required payment verification fields');
      return;
    }

    const isValid = verifyPaymentSignature({
      orderId,
      paymentId,
      signature,
    });

    if (!isValid) {
      logWarn('Payment signature verification failed', {
        orderId,
        paymentId,
      });
      ResponseUtil.badRequest(res, 'Invalid payment signature');
      return;
    }

    ResponseUtil.success(res, 'Payment verified successfully.', {
      orderId,
      paymentId,
    });
  } catch (err) {
    const error = err as Error;
    logError('verifyPayment controller error', {
      module: 'booking.controller.ts/verifyPayment',
      error: error.message,
    });
    ResponseUtil.internalServerError(
      res,
      'Failed to verify payment. Please try again.'
    );
  }
};
