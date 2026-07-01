import * as repo from './venue.repository';
import type { PaginationParams, PaginatedResponse } from '../../types/pagination.types';
import type {
  CreateVenueData,
  UpdateVenueData,
  AdminVenueFilters,
  IVenue,
  VenueKey,
  PublicVenueFilters,
} from './venue.types';
import type { IVenueDraft } from "./venueDraft.model";
import { requireOwnVenue } from './venue.ownership';
import * as workflow from './venue.workflow';
import { NotFoundError, ConflictError } from '../../utils/errors';
import type {
  CreateVenueDTO,
  UpdateVenueDTO,
  RejectVenueDTO,
  SuspendVenueDTO,
  AdminVenueFiltersDTO,
} from './venue.validator';
import { VenueFields } from '../../constants/venue.constants';
import { RoleModel } from '../../models/role.model';
import { UserModel } from '../user/user.models';
import * as authRepo from '../auth/auth.repository';
import { getUserRole } from '../../services/roles.service';
import { emailService } from '../../services/email.service';
import mongoose from 'mongoose';
import { logError } from '../../utils/logger';

export function sanitizeVenueDto<T extends CreateVenueDTO | UpdateVenueDTO>(dto: T, currentBookingType?: 'fixedBooking' | 'flexibleBooking'): T {
  const bookingType = dto.bookingType ?? currentBookingType;
  if (!bookingType) return dto;

  if (bookingType === 'fixedBooking') {
    const { 
      flexibleBooking: _fb, 
      workingHours: _wh, 
      pricing: _pr, 
      blockedTimes: _bt, 
      ...rest 
    } = dto as Record<string, unknown>;
    return rest as T;
  }
  
  const { fixedPackages: _fp, ...rest } = dto as Record<string, unknown>;
  return rest as T;
}

async function assignOwnerRoleIfNeeded(userId: string): Promise<void> {
  const current = await getUserRole(userId);

  if (current && ['owner', 'admin', 'superAdmin'].includes(current.roleName)) {
    return; 
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

  const sanitizedDto = sanitizeVenueDto(dto);

  const data = {
    ...sanitizedDto,
    galleryImages: sanitizedDto.galleryImages ?? [],
    ...(sanitizedDto.coordinates && {
      location: { type: 'Point' as const, coordinates: sanitizedDto.coordinates },
    }),
    ownerUserId: userId,
    createdBy: userId,
    updatedBy: userId,
    status: 'PendingReview',
  } as unknown as CreateVenueData;
  if (!dto.coordinates) delete (data as unknown as Record<string, unknown>).location;
  delete (data as unknown as Record<string, unknown>).coordinates;

  const venue = await repo.createVenue(data);

  await assignOwnerRoleIfNeeded(userId);
  await repo.deleteDraft(userId);

  return venue;
}

export async function getActiveVenues(): Promise<IVenue[]> {
  return repo.findActiveVenues();
}

export async function getPaginatedActiveVenues(
  pagination: PaginationParams,
  filters?: PublicVenueFilters
): Promise<PaginatedResponse<IVenue, 'venues'>> {
  return repo.findPaginatedActiveVenues(pagination, filters);
}

export async function upsertDraft(userId: string, step: number, formValues: Record<string, unknown>): Promise<IVenueDraft> {
  return repo.upsertDraft(userId, step, formValues);
}

export async function getDraft(userId: string): Promise<IVenueDraft | null> {
  return repo.getDraft(userId);
}

export async function getMyVenues(userId: string): Promise<Pick<IVenue, "_id" | "name" | "city" | "venueType" | "coverImage" | "status" | "rejectionReason" | "createdAt">[]> {
  return repo.findMyVenuesProjected(userId);
}

export async function getVenueById(
  venueId: string,
  // userId: string,
  // isAdmin: boolean
): Promise<IVenue> {
  const venue = await repo.findVenueById(venueId);

  if (!venue) {
    throw new NotFoundError('Venue not found');
  }

  // if (!isAdmin && venue.ownerUserId.toString() !== userId) {
  //   throw new NotFoundError('Venue not found');
  // }

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

  const sanitizedDto = sanitizeVenueDto(dto, venue.bookingType);

  const patch: UpdateVenueData = {
    updatedBy: userId,
    ...(Object.fromEntries(
      VenueFields.filter((key) => sanitizedDto[key] !== undefined).map((key) => [key, sanitizedDto[key]])
    ) as Pick<UpdateVenueData, VenueKey>),
    ...(sanitizedDto.coordinates !== undefined && {
      location: { type: 'Point', coordinates: sanitizedDto.coordinates },
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

export async function getAllVenues(filters: AdminVenueFiltersDTO): Promise<
  PaginatedResponse<IVenue, 'venues'>
> {
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

  const owner = await UserModel.findById(venue.ownerUserId).lean();
  if (owner?.email) {
    void emailService.sendVenueApprovedEmail(owner.email, venue.name);
  }

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

  const owner = await UserModel.findById(venue.ownerUserId).lean();
  if (owner?.email && dto.rejectionReason) {
    void emailService.sendVenueRejectedEmail(owner.email, venue.name, dto.rejectionReason);
  }

  return updated;
}

export async function suspendVenue(venueId: string, adminId: string, dto: SuspendVenueDTO): Promise<IVenue> {
  const venue = await repo.findVenueById(venueId);
  if (!venue) throw new NotFoundError('Venue not found');

  workflow.canDeactivate(venue);

  const extra = { suspensionReason: dto.suspensionReason };
  const updated = await repo.updateVenueStatus(venueId, 'Suspended', adminId, extra);
  if (!updated) throw new NotFoundError('Venue not found');

  const owner = await UserModel.findById(venue.ownerUserId).lean();
  if (owner?.email) {
    void emailService.sendVenueSuspendedEmail(owner.email, venue.name, dto.suspensionReason);
  }

  return updated;
}

export async function unsuspendVenue(venueId: string, adminId: string): Promise<IVenue> {
  const venue = await repo.findVenueById(venueId);
  if (!venue) throw new NotFoundError('Venue not found');

  workflow.canActivate(venue);

  const updated = await repo.updateVenueStatus(venueId, 'Approved', adminId);
  if (!updated) throw new NotFoundError('Venue not found');

  const owner = await UserModel.findById(venue.ownerUserId).lean();
  if (owner?.email) {
    void emailService.sendVenueUnsuspendedEmail(owner.email, venue.name);
  }

  return updated;
}

export async function featureVenue(venueId: string, durationDays: number | null): Promise<void> {
  const venue = await repo.findVenueById(venueId);
  if (!venue) throw new NotFoundError('Venue not found');
  
  if (venue.status !== 'Approved') {
    throw new ConflictError('Only approved venues can be featured');
  }

  await repo.upsertFeaturedVenue(venueId, durationDays);
}
