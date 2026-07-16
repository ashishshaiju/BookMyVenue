import type { Document, Types } from 'mongoose';
import type { BookingStatusType } from '../../constants/booking.constants';

export type BookingStatus = BookingStatusType;

export interface RazorpayWebhookNotes {
  lockId?: string;
  venueId?: string;
  userId?: string;
}

export interface IBooking extends Document {
  venueId: Types.ObjectId;
  userId: Types.ObjectId;
  date: string; // YYYY-MM-DD
  startTime: number; // minutes from midnight
  endTime: number; // minutes from midnight
  price: number;
  paymentReference: string; // Razorpay payment_id
  status: BookingStatus;
  guestCount?: number;
  eventType?: string;
  bookerInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    place?: string;
    note?: string;
  };
  paymentMethod?: string;
  
  // Future update fields (Not needed for MVP now)
  advancePaid?: number;
  remainingAmount?: number;
  cancellationReason?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

// FailedBooking (No TTL - usefull later)

export interface IFailedBooking extends Document {
  venueId: Types.ObjectId;
  userId: Types.ObjectId;
  date: string;
  startTime: number;
  endTime: number;
  amountPaid: number; // in paise
  paymentReference: string; // Razorpay payment_id
  refundReference: string; // Razorpay refund_id
  reason: string; // e.g: 'TTL_EXPIRED_COLLISION'
  createdAt: Date;
}

// ProcessedWebhook

export interface IProcessedWebhook extends Document {
  eventId: string;
  createdAt: Date;
}
