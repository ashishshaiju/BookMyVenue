import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  createdAt: Date;
  active: boolean;
  deleted: boolean;
  passwordChangedAt?: Date | null;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    password: { type: String, required: true, select: false },
    active: { type: Boolean, default: true },
    deleted: { type: Boolean, default: false },
    passwordChangedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

UserSchema.index(
  { email: 1 },
  { unique: true, sparse: true, partialFilterExpression: { active: true } }
);

export const UserModel = mongoose.model<IUser>('Users', UserSchema, 'Users');
