import type { Document, Types } from 'mongoose';

export interface ILock extends Document {
  venueId: Types.ObjectId;
  userId: Types.ObjectId;
  date: string;
  startTime: number;
  endTime: number;
  price: number;
  createdAt: Date;
}
