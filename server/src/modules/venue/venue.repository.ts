import type {
  IVenue,
  VenueStatus,
  AdminVenueFilters,
  CreateVenueData,
  UpdateVenueData,
} from './venue.types';
import { VenueModel } from './venue.model';
import { VenueDraftModel, type IVenueDraft } from './venueDraft.model';
import mongoose from 'mongoose';

// Helpers

const toObjectId = (id: string): mongoose.Types.ObjectId => {
  return new mongoose.Types.ObjectId(id);
};

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Read Operations

export async function findVenueById(venueId: string): Promise<IVenue | null> {
  return VenueModel.findOne({ _id: toObjectId(venueId), deleted: false }).exec();
}

/** Check if an active venue with this name already exists for this owner */
export async function existsByOwnerAndName(
  ownerUserId: string,
  name: string,
  excludeVenueId?: string
): Promise<boolean> {
  const query: Record<string, unknown> = {
    ownerUserId: toObjectId(ownerUserId),
    name: { $regex: new RegExp(`^${escapeRegex(name)}$`, 'i') },
    deleted: false,
  };

  if (excludeVenueId) {
    query._id = { $ne: toObjectId(excludeVenueId) };
  }

  const count = await VenueModel.countDocuments(query).exec();
  return count > 0;
}

/**
 * Get a lightweight projection of non-deleted venues for the My Venues card list.
 * Returns only the fields needed for the UI card — avoids sending pricing rules,
 * gallery arrays, package configs etc. to the client unnecessarily.
 */
export async function findMyVenuesProjected(ownerUserId: string): Promise<
  Pick<IVenue, '_id' | 'name' | 'city' | 'state' | 'venueType' | 'coverImage' | 'status' | 'rejectionReason' | 'createdAt'>[]
> {
  return VenueModel.find(
    { ownerUserId: toObjectId(ownerUserId), deleted: false },
    {
      _id: 1,
      name: 1,
      city: 1,
      state: 1,
      venueType: 1,
      coverImage: 1,
      status: 1,
      rejectionReason: 1,
      createdAt: 1,
    }
  )
    .sort({ createdAt: -1 })
    .lean()
    .exec();
}

/** Admin: Get all venues in PendingReview status */
export async function findPendingVenues(): Promise<IVenue[]> {
  return VenueModel.find({
    status: 'PendingReview',
    deleted: false,
  })
    .sort({ createdAt: 1 })
    .exec();
}

/** Admin: Get paginated venues with optional filters */
export async function findAllVenues(filters: AdminVenueFilters): Promise<{
  venues: IVenue[];
  total: number;
  page: number;
  limit: number;
}> {
  const { status, city, page, limit } = filters;
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = { deleted: false };
  if (status) query.status = status;
  if (city) query.city = { $regex: new RegExp(`^${escapeRegex(city)}$`, 'i') };

  const [venues, total] = await Promise.all([
    VenueModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
    VenueModel.countDocuments(query).exec(),
  ]);

  return { venues, total, page, limit };
}

// Write Operations

/** Insert a new venue document */
export async function createVenue(data: CreateVenueData): Promise<IVenue> {
  const venue = new VenueModel(data);
  return venue.save();
}

// Draft Operations

export async function upsertDraft(userId: string, step: number, formValues: Record<string, unknown>): Promise<IVenueDraft> {
  return VenueDraftModel.findOneAndUpdate(
    { userId: toObjectId(userId) },
    { $set: { step, formValues } },
    { new: true, upsert: true }
  ).exec();
}

export async function getDraft(userId: string): Promise<IVenueDraft | null> {
  return VenueDraftModel.findOne({ userId: toObjectId(userId) }).exec();
}

export async function deleteDraft(userId: string): Promise<void> {
  await VenueDraftModel.deleteOne({ userId: toObjectId(userId) }).exec();
}

/** Partial update of an existing venue */
export async function updateVenue(venueId: string, patch: UpdateVenueData): Promise<IVenue | null> {
  return VenueModel.findOneAndUpdate(
    { _id: toObjectId(venueId), deleted: false },
    { $set: patch },
    { new: true, runValidators: true }
  ).exec();
}

/** Soft-delete a venue */
export async function softDeleteVenue(venueId: string, updatedBy: string): Promise<boolean> {
  const result = await VenueModel.updateOne(
    { _id: toObjectId(venueId), deleted: false },
    {
      $set: {
        deleted: true,
        active: false,
        updatedBy: toObjectId(updatedBy),
      },
    }
  ).exec();

  return result.modifiedCount > 0;
}

// State Machine Operations

/**
 * Atomic status update.
 * @param extraFields allows injecting rejectionReason during a rejection
 */
export async function updateVenueStatus(
  venueId: string,
  newStatus: VenueStatus,
  updatedBy: string,
  extraFields?: Partial<IVenue>
): Promise<IVenue | null> {
  const patch: mongoose.UpdateQuery<IVenue> = {
    $set: {
      status: newStatus,
      updatedBy: toObjectId(updatedBy),
      ...(extraFields ?? {}),
    },
  };

  // If status is anything but Rejected, clear the rejection reason automatically
  if (newStatus !== 'Rejected') {
    patch.$unset = { rejectionReason: '' };
  }

  return VenueModel.findOneAndUpdate({ _id: toObjectId(venueId), deleted: false }, patch, {
    new: true,
    runValidators: true,
  }).exec();
}
