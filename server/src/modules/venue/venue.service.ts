import * as repo from './venue.repository';
import type {
  CreateVenueData,
  UpdateVenueData,
  AdminVenueFilters,
  IVenue,
  VenueKey,
} from './venue.types';
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

// Owner Operations

export async function createVenue(userId: string, dto: CreateVenueDTO): Promise<IVenue> {
  const nameExists = await repo.existsByOwnerAndName(userId, dto.name);
  if (nameExists) {
    throw new ConflictError(`You already have a venue named "${dto.name}"`);
  }

  const data = {
    ...dto,
    galleryImages: dto.galleryImages ?? [],
    location: { type: 'Point' as const, coordinates: dto.coordinates },
    ownerUserId: userId,
    createdBy: userId,
    updatedBy: userId,
  } as unknown as CreateVenueData;
  delete (data as unknown as Record<string, unknown>).coordinates;

  return repo.createVenue(data);
}

export async function getMyVenues(userId: string): Promise<IVenue[]> {
  return repo.findVenuesByOwner(userId);
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
