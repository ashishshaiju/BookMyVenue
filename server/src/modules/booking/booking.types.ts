import type { Document, Types } from 'mongoose';

// ---------------------------------------------------------------------------
// Booking
// ---------------------------------------------------------------------------

export type BookingStatus = 'Confirmed' | 'Cancelled';

export interface IBooking extends Document {
  venueId: Types.ObjectId;
  userId: Types.ObjectId;
  date: string; // YYYY-MM-DD
  startTime: number; // minutes from midnight (integer)
  endTime: number; // minutes from midnight (integer)
  price: number;
  paymentReference: string; // Razorpay payment_id
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// FailedBooking  (collision audit log — never deleted)
// ---------------------------------------------------------------------------

export interface IFailedBooking extends Document {
  venueId: Types.ObjectId;
  userId: Types.ObjectId;
  date: string;
  startTime: number;
  endTime: number;
  amountPaid: number; // in smallest currency unit (paise)
  paymentReference: string; // Razorpay payment_id
  refundReference: string; // Razorpay refund_id
  reason: string; // e.g. 'TTL_EXPIRED_COLLISION'
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// ProcessedWebhook  (idempotency gate — eventId is unique)
// ---------------------------------------------------------------------------

export interface IProcessedWebhook extends Document {
  eventId: string; // Razorpay event_id — enforced unique at DB level
  createdAt: Date;
}
