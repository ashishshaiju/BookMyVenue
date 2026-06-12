import type { IVenue } from './venue.model';
import * as repo from './venue.repository';
import type { CreateVenueData, UpdateVenueData, AdminVenueFilters } from './venue.repository';
import { requireOwnVenue } from './venue.ownership';
import * as workflow from './venue.workflow';
import { NotFoundError, ConflictError } from '../../utils/errors';
import type { CreateVenueDTO, UpdateVenueDTO, RejectVenueDTO, AdminVenueFiltersDTO } from './venue.validator';

/**
 * Venue Service
 *
 * Orchestrates the repository, ownership validation, and workflow state machine.
 */

// ── Owner Operations ──────────────────────────────────────────────────────────

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
  // @ts-expect-error DTO vs Model type mapping for coordinates
  delete data.coordinates;

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

  const patch = {
    updatedBy: userId,
    ...(dto.name !== undefined && { name: dto.name }),
    ...(dto.description !== undefined && { description: dto.description }),
    ...(dto.venueType !== undefined && { venueType: dto.venueType }),
    ...(dto.address !== undefined && { address: dto.address }),
    ...(dto.city !== undefined && { city: dto.city }),
    ...(dto.district !== undefined && { district: dto.district }),
    ...(dto.state !== undefined && { state: dto.state }),
    ...(dto.country !== undefined && { country: dto.country }),
    ...(dto.pincode !== undefined && { pincode: dto.pincode }),
    ...(dto.coordinates !== undefined && { location: { type: 'Point', coordinates: dto.coordinates } }),
    ...(dto.googleMapsUrl !== undefined && { googleMapsUrl: dto.googleMapsUrl }),
    ...(dto.spaceAttributes !== undefined && { spaceAttributes: dto.spaceAttributes }),
    ...(dto.seatingConfigurations !== undefined && { seatingConfigurations: dto.seatingConfigurations }),
    ...(dto.maxCapacity !== undefined && { maxCapacity: dto.maxCapacity }),
    ...(dto.bookingType !== undefined && { bookingType: dto.bookingType }),
    ...(dto.pricingType !== undefined && { pricingType: dto.pricingType }),
    ...(dto.fixedPackages !== undefined && { fixedPackages: dto.fixedPackages }),
    ...(dto.workingHours !== undefined && { workingHours: dto.workingHours }),
    ...(dto.slotDuration !== undefined && { slotDuration: dto.slotDuration }),
    ...(dto.bufferTime !== undefined && { bufferTime: dto.bufferTime }),
    ...(dto.samePrice !== undefined && { samePrice: dto.samePrice }),
    ...(dto.pricingRules !== undefined && { pricingRules: dto.pricingRules }),
    ...(dto.blockedTimes !== undefined && { blockedTimes: dto.blockedTimes }),
    ...(dto.amenities !== undefined && { amenities: dto.amenities }),
    ...(dto.coverImage !== undefined && { coverImage: dto.coverImage }),
    ...(dto.galleryImages !== undefined && { galleryImages: dto.galleryImages }),
    ...(dto.contactName !== undefined && { contactName: dto.contactName }),
    ...(dto.contactPhone !== undefined && { contactPhone: dto.contactPhone }),
    ...(dto.contactEmail !== undefined && { contactEmail: dto.contactEmail }),
    ...(dto.cancellationPolicy !== undefined && { cancellationPolicy: dto.cancellationPolicy }),
    ...(dto.refundType !== undefined && { refundType: dto.refundType }),
    ...(dto.refundRules !== undefined && { refundRules: dto.refundRules }),
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

// ── Admin Operations ──────────────────────────────────────────────────────────

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
