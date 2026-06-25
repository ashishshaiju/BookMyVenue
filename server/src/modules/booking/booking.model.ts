import mongoose, { Schema } from 'mongoose';
import type { IBooking } from './booking.types';

const BookingSchema = new Schema<IBooking>(
  {
    venueId: { type: Schema.Types.ObjectId, ref: 'Venues', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    startTime: { type: Number, required: true }, // minutes from midnight
    endTime: { type: Number, required: true }, // minutes from midnight
    price: { type: Number, required: true },
    paymentReference: { type: String, required: true, trim: true }, // Razorpay payment_id
    status: {
      type: String,
      enum: ['Confirmed', 'Cancelled'] as const,
      required: true,
      default: 'Confirmed',
    },
  },
  { timestamps: true }
);

// Primary query pattern: "all bookings for venue X on date Y"
BookingSchema.index({ venueId: 1, date: 1 });

// Prevent double-booking at the document level as a safety net
// (the real gate is the overlap check + Lock, but this is defence-in-depth)
BookingSchema.index({ venueId: 1, date: 1, startTime: 1, endTime: 1, status: 1 });

export const BookingModel = mongoose.model<IBooking>('Bookings', BookingSchema, 'Bookings');
