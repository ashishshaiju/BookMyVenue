import mongoose, { Schema } from 'mongoose';
import type { ILock } from './lock.types';

const LockSchema = new Schema<ILock>(
  {
    venueId: { type: Schema.Types.ObjectId, ref: 'Venues', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
    date: { type: String, required: true },
    startTime: { type: Number, required: true },
    endTime: { type: Number, required: true },
    price: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now, expires: 600 }, // 600s = 10 minutes
  }
);

LockSchema.index({ venueId: 1, date: 1 });

export const LockModel = mongoose.model<ILock>('Locks', LockSchema, 'Locks');