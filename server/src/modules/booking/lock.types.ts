import type { Document, Types } from 'mongoose';

export interface ILock extends Document {
  venueId: Types.ObjectId;
  userId: Types.ObjectId;
  date: string;
  startTime: number;
  endTime: number;
  price: number;
  sessionTokenHash?: string;
  guestCount?: number;
  eventType?: string;
  bookerInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    place?: string;
    note?: string;
  };
  createdAt: Date;
}
