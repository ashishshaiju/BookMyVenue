import { ReviewModel } from '../review/review.model';
import { VenueModel } from '../venue/venue.model';
import { UserModel } from '../user/user.models';
import type { Types } from 'mongoose';

interface FlaggedReviewLean {
  _id: Types.ObjectId;
  rating: number;
  comment?: string;
  venueId: { _id: Types.ObjectId; name: string };
  userId: { _id: Types.ObjectId; username: string };
  moderationReason?: string;
  moderatedAt?: Date;
  createdAt: Date;
}

interface HideRequestLean {
  _id: Types.ObjectId;
  rating: number;
  comment?: string;
  venueId: {
    _id: Types.ObjectId;
    name: string;
    ownerUserId: { _id: Types.ObjectId; username: string; email: string };
  };
  userId: { _id: Types.ObjectId; username: string; email: string };
  hideRequestReason?: string;
  hideRequestedAt?: Date;
  createdAt: Date;
}

interface SuspendedVenueLean {
  _id: Types.ObjectId;
  name: string;
  suspensionReason?: string;
  ownerUserId: Types.ObjectId;
  createdAt: Date;
}

interface BannedUserLean {
  _id: Types.ObjectId;
  username: string;
  email: string;
  banReason?: string;
  bannedBy?: Types.ObjectId;
  bannedAt?: Date;
  createdAt: Date;
}

export interface ModerationSummary {
  flaggedReviews: {
    _id: string;
    rating: number;
    comment?: string;
    venueId: string;
    venueName?: string;
    userId: string;
    userName?: string;
    moderationReason?: string;
    moderatedAt?: Date;
    createdAt: Date;
  }[];
  hideRequests: {
    _id: string;
    rating: number;
    comment?: string;
    venueId: string;
    venueName?: string;
    ownerId: string;
    ownerUsername?: string;
    ownerEmail?: string;
    userId: string;
    userName?: string;
    userEmail?: string;
    hideRequestReason?: string;
    hideRequestedAt?: Date;
    createdAt: Date;
  }[];
  suspendedVenues: {
    _id: string;
    name: string;
    suspensionReason?: string;
    ownerUserId: string;
    suspendedAt?: Date;
    createdAt: Date;
  }[];
  bannedUsers: {
    _id: string;
    username: string;
    email: string;
    banReason?: string;
    bannedBy?: string;
    bannedAt?: Date;
    createdAt: Date;
  }[];
}

export async function getModerationSummary(): Promise<ModerationSummary> {
  // Get top 10 flagged/removed reviews
  const flaggedReviews = await ReviewModel.find({
    $or: [{ status: 'flagged' }, { status: 'removed' }],
  })
    .sort({ moderatedAt: -1, createdAt: -1 })
    .limit(10)
    .populate('userId', 'username')
    .populate('venueId', 'name')
    .lean()
    .exec();

  // Get top 10 pending hide requests
  const hideRequests = await ReviewModel.find({
    hideRequestStatus: 'pending',
  })
    .sort({ hideRequestedAt: -1 })
    .limit(10)
    .populate('userId', 'username email')
    .populate({
      path: 'venueId',
      select: 'name ownerUserId',
      populate: { path: 'ownerUserId', select: 'username email' },
    })
    .lean()
    .exec();

  // Get top 10 suspended venues
  const suspendedVenues = await VenueModel.find({
    status: 'Suspended',
    deleted: false,
  })
    .sort({ updatedAt: -1 })
    .limit(10)
    .select('_id name suspensionReason ownerUserId createdAt')
    .lean()
    .exec();

  // Get top 10 banned users
  const bannedUsers = await UserModel.find({
    bannedAt: { $exists: true, $ne: null },
  })
    .sort({ bannedAt: -1 })
    .limit(10)
    .select('_id username email banReason bannedBy bannedAt createdAt')
    .lean()
    .exec();

  return {
    flaggedReviews: (flaggedReviews as unknown as FlaggedReviewLean[]).map((r) => ({
      _id: r._id.toString(),
      rating: r.rating,
      comment: r.comment,
      venueId: r.venueId._id.toString(),
      venueName: r.venueId.name,
      userId: r.userId._id.toString(),
      userName: r.userId.username,
      moderationReason: r.moderationReason,
      moderatedAt: r.moderatedAt,
      createdAt: r.createdAt,
    })),
    hideRequests: (hideRequests as unknown as HideRequestLean[]).map((r) => ({
      _id: r._id.toString(),
      rating: r.rating,
      comment: r.comment,
      venueId: r.venueId._id.toString(),
      venueName: r.venueId.name,
      ownerId: r.venueId.ownerUserId._id.toString(),
      ownerUsername: r.venueId.ownerUserId.username,
      ownerEmail: r.venueId.ownerUserId.email,
      userId: r.userId._id.toString(),
      userName: r.userId.username,
      userEmail: r.userId.email,
      hideRequestReason: r.hideRequestReason,
      hideRequestedAt: r.hideRequestedAt,
      createdAt: r.createdAt,
    })),
    suspendedVenues: (suspendedVenues as unknown as SuspendedVenueLean[]).map((v) => ({
      _id: v._id.toString(),
      name: v.name,
      suspensionReason: v.suspensionReason,
      ownerUserId: v.ownerUserId.toString(),
      createdAt: v.createdAt,
    })),
    bannedUsers: (bannedUsers as unknown as BannedUserLean[]).map((u) => ({
      _id: u._id.toString(),
      username: u.username,
      email: u.email,
      banReason: u.banReason,
      bannedBy: u.bannedBy?.toString(),
      bannedAt: u.bannedAt,
      createdAt: u.createdAt,
    })),
  };
}
