import * as repo from './venue.repository';
import type {
  CreateVenueData,
  UpdateVenueData,
  AdminVenueFilters,
  IVenue,
  VenueKey,
} from './venue.types';
import type { IVenueDraft } from "./venueDraft.model";
import { requireOwnVenue } from './venue.ownership';
import * as workflow from './venue.workflow';
import { NotFoundError, ConflictError } from '../../utils/errors';
import type {
  CreateVenueDTO,
  UpdateVenueDTO,
  RejectVenueDTO,
  AdminVenueFiltersDTO,
} from './venue.validator';
import { VenueFields } from '../../constants/venue.constants';
import { RoleModel } from '../../models/role.model';
import * as authRepo from '../auth/auth.repository';
import { getUserRole } from '../../services/roles.service';
import mongoose from 'mongoose';
import { logError } from '../../utils/logger';

// Owner Operations

/**
 * Promote a user from 'user' role to 'owner' role if they are not already
 * an owner, admin, or superAdmin. Uses the existing assignRoleToUser upsert —
 * safe to call multiple times.
 *
 * Fails silently (logs error) if the owner role is not seeded — avoids
 * crashing the entire venue creation flow due to a configuration issue.
 */
async function assignOwnerRoleIfNeeded(userId: string): Promise<void> {
  const current = await getUserRole(userId);

  if (current && ['owner', 'admin', 'superAdmin'].includes(current.roleName)) {
    return; // already elevated — nothing to do
  }

  const ownerRole = await RoleModel
    .findOne({ name: 'owner', active: true, deleted: false })
    .lean()
    .exec();

  if (!ownerRole) {
    logError('assignOwnerRoleIfNeeded: owner role not found in DB — user not promoted', {
      module: 'venue.service.ts/assignOwnerRoleIfNeeded',
      userId,
    });
    return;
  }

  await authRepo.assignRoleToUser(
    new mongoose.Types.ObjectId(userId),
    ownerRole._id
  );
}

export async function createVenue(userId: string, dto: CreateVenueDTO): Promise<IVenue> {
  const nameExists = await repo.existsByOwnerAndName(userId, dto.name);
  if (nameExists) {
    throw new ConflictError(`You already have a venue named "${dto.name}"`);
  }

  const data = {
    ...dto,
    galleryImages: dto.galleryImages ?? [],
    ...(dto.coordinates && {
      location: { type: 'Point' as const, coordinates: dto.coordinates },
    }),
    ownerUserId: userId,
    createdBy: userId,
    updatedBy: userId,
    status: 'PendingReview', // Skip Draft state entirely
  } as unknown as CreateVenueData;
  if (!dto.coordinates) delete (data as unknown as Record<string, unknown>).location;
  delete (data as unknown as Record<string, unknown>).coordinates;

  const venue = await repo.createVenue(data);

  // Promote user and cleanup draft UX state
  await assignOwnerRoleIfNeeded(userId);
  await repo.deleteDraft(userId);

  return venue;
}

export async function upsertDraft(userId: string, step: number, formValues: Record<string, unknown>): Promise<IVenueDraft> {
  return repo.upsertDraft(userId, step, formValues);
}

export async function getDraft(userId: string): Promise<IVenueDraft | null> {
  return repo.getDraft(userId);
}

export async function getMyVenues(userId: string): Promise<Pick<IVenue, "_id" | "name" | "city" | "state" | "venueType" | "coverImage" | "status" | "rejectionReason" | "createdAt">[]> {
  return repo.findMyVenuesProjected(userId);
}

export async function getVenueById(
  venueId: string,
  userId: string,
  isAdmin: boolean
): Promise<IVenue> {
  const venue = await repo.findVenueById(venueId);

  if (!venue) {
    throw new NotFoundError('Venue not found');
  }

  if (!isAdmin && venue.ownerUserId.toString() !== userId) {
    throw new NotFoundError('Venue not found');
  }

  return venue;
}

export async function updateVenue(
  venueId: string,
  userId: string,
  dto: UpdateVenueDTO
): Promise<IVenue> {
  const venue = await requireOwnVenue(venueId, userId);

  workflow.canEdit(venue);

  if (dto.name && dto.name !== venue.name) {
    const nameExists = await repo.existsByOwnerAndName(userId, dto.name, venueId);
    if (nameExists) {
      throw new ConflictError(`You already have a venue named "${dto.name}"`);
    }
  }

  const patch: UpdateVenueData = {
    updatedBy: userId,
    ...(Object.fromEntries(
      VenueFields.filter((key) => dto[key] !== undefined).map((key) => [key, dto[key]])
    ) as Pick<UpdateVenueData, VenueKey>),
    ...(dto.coordinates !== undefined && {
      location: { type: 'Point', coordinates: dto.coordinates },
    }),
  };

  const updated = await repo.updateVenue(venueId, patch);
  if (!updated) throw new NotFoundError('Venue not found');
  return updated;
}

export async function deleteVenue(venueId: string, userId: string): Promise<void> {
  const venue = await requireOwnVenue(venueId, userId);
  workflow.canDelete(venue);
  await repo.softDeleteVenue(venueId, userId);
}

export async function submitVenue(venueId: string, userId: string): Promise<IVenue> {
  const venue = await requireOwnVenue(venueId, userId);
  workflow.canSubmit(venue);

  const updated = await repo.updateVenueStatus(venueId, 'PendingReview', userId);
  if (!updated) throw new NotFoundError('Venue not found');
  return updated;
}

// Admin Operations

export async function getPendingVenues(): Promise<IVenue[]> {
  return repo.findPendingVenues();
}

export async function getAllVenues(filters: AdminVenueFiltersDTO): Promise<{
  venues: IVenue[];
  total: number;
  page: number;
  limit: number;
}> {
  const repoFilters: AdminVenueFilters = {
    status: filters.status,
    city: filters.city,
    page: filters.page,
    limit: filters.limit,
  };
  return repo.findAllVenues(repoFilters);
}

export async function approveVenue(venueId: string, adminId: string): Promise<IVenue> {
  const venue = await repo.findVenueById(venueId);
  if (!venue) throw new NotFoundError('Venue not found');

  workflow.canApprove(venue);

  const updated = await repo.updateVenueStatus(venueId, 'Approved', adminId);
  if (!updated) throw new NotFoundError('Venue not found');
  return updated;
}

export async function rejectVenue(
  venueId: string,
  adminId: string,
  dto: RejectVenueDTO
): Promise<IVenue> {
  const venue = await repo.findVenueById(venueId);
  if (!venue) throw new NotFoundError('Venue not found');

  workflow.canReject(venue);

  const extra = dto.rejectionReason ? { rejectionReason: dto.rejectionReason } : undefined;
  const updated = await repo.updateVenueStatus(venueId, 'Rejected', adminId, extra);
  if (!updated) throw new NotFoundError('Venue not found');
  return updated;
}

export async function deactivateVenue(venueId: string, adminId: string): Promise<IVenue> {
  const venue = await repo.findVenueById(venueId);
  if (!venue) throw new NotFoundError('Venue not found');

  workflow.canDeactivate(venue);

  const updated = await repo.updateVenueStatus(venueId, 'Suspended', adminId);
  if (!updated) throw new NotFoundError('Venue not found');
  return updated;
}

export async function activateVenue(venueId: string, adminId: string): Promise<IVenue> {
  const venue = await repo.findVenueById(venueId);
  if (!venue) throw new NotFoundError('Venue not found');

  workflow.canActivate(venue);

  const updated = await repo.updateVenueStatus(venueId, 'Approved', adminId);
  if (!updated) throw new NotFoundError('Venue not found');
  return updated;
}
