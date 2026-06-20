import type { PaginationParams, PaginatedResponse } from '../../types/pagination.types';
import { buildPaginationMeta } from '../../utils/paginationUtils';
import type {
  IVenue,
  VenueStatus,
  AdminVenueFilters,
  CreateVenueData,
  UpdateVenueData,
  PublicVenueFilters,
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

export async function findActiveVenues(): Promise<IVenue[]> {
  return VenueModel.find({ status: 'Approved', active: true, deleted: false })
    .sort({ createdAt: -1 })
    .select(
      '_id name description venueType city district coverImage maxCapacity slotDuration'
    )
    .exec();
}

export async function findPaginatedActiveVenues(
  paginationParams: PaginationParams,
  filters?: PublicVenueFilters
): Promise<PaginatedResponse<IVenue, 'venues'>> {
  const { limit, skip } = paginationParams;
  const conditions: Record<string, unknown>[] = [
    { status: 'Approved', active: true, deleted: false },
  ];

  if (filters?.searchTerm) {
    const searchRegex = new RegExp(escapeRegex(filters.searchTerm), 'i');
    conditions.push({
      $or: [
        { name: searchRegex },
        { city: searchRegex },
        { district: searchRegex },
        { description: searchRegex },
      ],
    });
  }

  if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
    const priceCondition: { $gte?: number; $lte?: number } = {};
    if (filters.minPrice !== undefined) priceCondition.$gte = filters.minPrice;
    if (filters.maxPrice !== undefined) priceCondition.$lte = filters.maxPrice;

    conditions.push({
      $or: [
        { samePrice: priceCondition },
        { 'fixedPackages.price': priceCondition },
        { 'pricingRules.price': priceCondition },
      ],
    });
  }

  if (filters?.venueType && filters.venueType.length > 0) {
    conditions.push({ venueType: { $in: filters.venueType } });
  }

  if (filters?.district) {
    conditions.push({
      district: { $regex: new RegExp(`^${escapeRegex(filters.district)}$`, 'i') },
    });
  }

  if (filters?.capacity) {
    conditions.push({ maxCapacity: { $gte: filters.capacity } });
  }

  if (filters?.spaceAttributes && filters.spaceAttributes.length > 0) {
    conditions.push({ spaceAttributes: { $in: filters.spaceAttributes } });
  }

  if (filters?.seatingConfigurations && filters.seatingConfigurations.length > 0) {
    conditions.push({ seatingConfigurations: { $in: filters.seatingConfigurations } });
  }

  if (filters?.amenities && filters.amenities.length > 0) {
    conditions.push({ amenities: { $all: filters.amenities } });
  }

  const query = { $and: conditions };

  let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
  if (filters?.sortBy) {
    switch (filters.sortBy) {
      case 'price-low':
        sortOption = { samePrice: 1 };
        break;
      case 'price-high':
        sortOption = { samePrice: -1 };
        break;
      case 'rating':
        sortOption = { createdAt: -1 }; // Replace with actual rating sort if exists
        break;
      default:
        sortOption = { createdAt: -1 };
        break;
    }
  }

  const [venues, total] = await Promise.all([
    VenueModel.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .select(
        '_id name description venueType city district coverImage maxCapacity slotDuration'
      )
      .exec(),
    VenueModel.countDocuments(query).exec(),
  ]);

  return {
    venues,
    pagination: buildPaginationMeta(total, paginationParams),
  };
}

// Read Operations
export async function findVenueById(venueId: string): Promise<IVenue | null> {
  return VenueModel.findOne({ _id: toObjectId(venueId), deleted: false }).exec();
}

// Check if an active venue with this name already exists for this owner
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

export async function findMyVenuesProjected(
  ownerUserId: string
): Promise<
  Pick<
    IVenue,
    | '_id'
    | 'name'
    | 'city'
    | 'venueType'
    | 'coverImage'
    | 'status'
    | 'rejectionReason'
    | 'createdAt'
  >[]
> {
  return VenueModel.find(
    { ownerUserId: toObjectId(ownerUserId), deleted: false },
    {
      _id: 1,
      name: 1,
      city: 1,
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

// Admin
export async function findPendingVenues(): Promise<IVenue[]> {
  return VenueModel.find({
    status: 'PendingReview',
    deleted: false,
  })
    .sort({ createdAt: 1 })
    .exec();
}

// Admin
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
export async function createVenue(data: CreateVenueData): Promise<IVenue> {
  const venue = new VenueModel(data);
  return venue.save();
}

// Draft Operations
export async function upsertDraft(
  userId: string,
  step: number,
  formValues: Record<string, unknown>
): Promise<IVenueDraft> {
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

export async function updateVenue(venueId: string, patch: UpdateVenueData): Promise<IVenue | null> {
  return VenueModel.findOneAndUpdate(
    { _id: toObjectId(venueId), deleted: false },
    { $set: patch },
    { new: true, runValidators: true }
  ).exec();
}

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

  if (newStatus !== 'Rejected') {
    patch.$unset = { rejectionReason: '' };
  }

  return VenueModel.findOneAndUpdate({ _id: toObjectId(venueId), deleted: false }, patch, {
    new: true,
    runValidators: true,
  }).exec();
}
