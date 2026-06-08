import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

export interface IRefreshToken extends Document {
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  isUsed: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
  deleted: boolean;
  revokedAt?: Date;
  revokedReason?: string | null;
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'users', required: true },
    tokenHash: { type: String, required: true },
    isUsed: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    active: { type: Boolean, default: true },
    deleted: { type: Boolean, default: false },
    revokedAt: { type: Date, default: null },
    revokedReason: { type: String, default: null },
  },
  { timestamps: true }
);

RefreshTokenSchema.index({ tokenHash: 1 }, { unique: true });
RefreshTokenSchema.index({ id: 1, tokenHash: 1 }, { unique: true });

export const RefreshTokenModel = mongoose.model<IRefreshToken>(
  'RefreshTokens',
  RefreshTokenSchema,
  'RefreshTokens'
);
