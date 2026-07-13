import { ModerationActivityModel, type ModerationActionType } from './moderationActivity.model';
import type mongoose from 'mongoose';

export async function logModerationAction(
  adminId: string | mongoose.Types.ObjectId,
  action: ModerationActionType,
  targetId: string,
  targetType: 'user' | 'venue' | 'review',
  reason?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await ModerationActivityModel.create({
      adminId,
      action,
      targetId,
      targetType,
      reason,
      metadata,
    });
  } catch (error) {
    // Log the error but don't fail the primary moderation action
    console.error('Failed to log moderation activity:', error);
  }
}

export async function getModerationLogs(page: number, limit: number): Promise<{ logs: any[]; total: number }> {
  const skip = (page - 1) * limit;
  
  const [logs, total] = await Promise.all([
    ModerationActivityModel.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('adminId', 'username email')
      .lean()
      .exec(),
    ModerationActivityModel.countDocuments()
  ]);

  return { logs, total };
}
