import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';
import {
  EmailIntent,
  type EmailIntentType,
  EmailTaskStatus,
  type EmailTaskStatusType,
} from '../constants/email.constants';

export interface IEmailTask extends Document {
  intent: EmailIntentType;
  recipient: string;
  subject: string;
  metadata: Record<string, string>;
  status: EmailTaskStatusType;
  workerId: string | null;
  lockedAt: Date | null;
  retries: number;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const EmailTaskSchema = new Schema<IEmailTask>(
  {
    intent: {
      type: String,
      enum: Object.values(EmailIntent),
      required: true,
    },
    recipient: { type: String, required: true },
    subject: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: Object.values(EmailTaskStatus),
      default: EmailTaskStatus.PENDING,
    },
    workerId: { type: String, default: null },
    lockedAt: { type: Date, default: null },
    retries: { type: Number, default: 0 },
    lastError: { type: String, default: null },
  },
  { timestamps: true }
);

// Compound index for fast polling
EmailTaskSchema.index({ status: 1, lockedAt: 1 });
EmailTaskSchema.index({ createdAt: 1 }, { expireAfterSeconds: 15 * 60 });

export const EmailTaskModel = mongoose.model<IEmailTask>(
  'EmailTasks',
  EmailTaskSchema,
  'EmailTasks'
);
