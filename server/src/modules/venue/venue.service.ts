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
import { findUserEmailById } from '../user/user.repository';
import * as authRepo from '../auth/auth.repository';
import { getUserRole } from '../../services/roles.service';
import { emailService } from '../../services/email.service';
import mongoose from 'mongoose';
import { logError } from '../../utils/logger';

// ─── Google Maps URL Resolution & Transformation ─────────────────────────────

const SHORT_LINK_HOSTS = new Set(['goo.gl', 'maps.app.goo.gl']);

const GOOGLE_MAPS_EMBED_HOSTS = new Set(['maps.google.com', 'www.google.com', 'google.com']);

/**
 * Attempts to convert any Google Maps share/short URL into a valid embed URL.
 * Returns the embed URL string, or null if the URL cannot be resolved or transformed.
 */
export async function resolveAndTransformGoogleMapsUrl(
  inputUrl: string | undefined | null,
): Promise<string | null> {
  if (!inputUrl) return null;

  try {
    let workingUrl = inputUrl;

    // Step 1: Resolve short links (goo.gl, maps.app.goo.gl) via HEAD request
    const parsed = new URL(workingUrl);
    if (SHORT_LINK_HOSTS.has(parsed.hostname)) {
      const response = await fetch(workingUrl, {
        method: 'HEAD',
        redirect: 'follow',
        signal: AbortSignal.timeout(5_000),
      });
      workingUrl = response.url;
    }

    const resolved = new URL(workingUrl);

    // Step 2: Must be https and a known Google Maps domain
    if (resolved.protocol !== 'https:' || !GOOGLE_MAPS_EMBED_HOSTS.has(resolved.hostname)) {
      return null;
    }

    // Step 3: Already an embed URL — return as-is
    if (resolved.pathname.startsWith('/maps/embed')) {
      return workingUrl;
    }

    // Step 4: Extract a place search query from common share URL patterns
    // Pattern: /maps/place/<name>/@lat,lng,...  or  /maps?q=...
    const qParam = resolved.searchParams.get('q');
    const placeMatch = /\/maps\/place\/([^/]+)/.exec(resolved.pathname);
    const coordMatch = /@(-?\d+\.\d+),(-?\d+\.\d+)/.exec(resolved.pathname);

    if (coordMatch) {
      const lat = coordMatch[1];
      const lng = coordMatch[2];
      return `https://maps.google.com/maps?q=${lat},${lng}&output=embed&z=15`;
    }

    if (qParam) {
      return `https://maps.google.com/maps?q=${encodeURIComponent(qParam)}&output=embed&z=15`;
    }

    if (placeMatch) {
      const placeName = decodeURIComponent(placeMatch[1]);
      return `https://maps.google.com/maps?q=${encodeURIComponent(placeName)}&output=embed&z=15`;
    }

    return null;
  } catch {
    return null;
  }
}

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
  // Guard: Check for venue creation ban
  const { isBannedForScope } = await import('../moderation/bannedUser.service');
  const isBanned = await isBannedForScope(userId, 'venue_creation');
  if (isBanned) {
    throw new ConflictError('You are currently banned from creating new venues.');
  }

  const nameExists = await repo.existsByOwnerAndName(userId, dto.name);
  if (nameExists) {
    throw new ConflictError(`You already have a venue named "${dto.name}"`);
  }

  const sanitizedDto = sanitizeVenueDto(dto);

  // Resolve and transform the Google Maps URL to a safe embed URL
  const resolvedMapsUrl = await resolveAndTransformGoogleMapsUrl(sanitizedDto.googleMapsUrl);

  const data = {
    ...sanitizedDto,
    googleMapsUrl: resolvedMapsUrl,
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

export async function getVenuePins(bbox?: {
  swLng: number;
  swLat: number;
  neLng: number;
  neLat: number;
}): Promise<{ _id: string; name: string; location: { coordinates: [number, number] }; coverImage: string; avgRating: number }[]> {
  return repo.findVenuePinsInBounds(bbox);
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
  requesterId?: string,
  isPrivileged?: boolean
): Promise<IVenue> {
  const venue = await repo.findVenueById(venueId);

  if (!venue) {
    throw new NotFoundError('Venue not found');
  }

  const isOwner = requesterId !== undefined && venue.ownerUserId.toString() === requesterId;
  if (venue.status !== 'Approved' && !isPrivileged && !isOwner) {
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

  const sanitizedDto = sanitizeVenueDto(dto, venue.bookingType);

  // Resolve and transform the Google Maps URL to a safe embed URL if provided
  if (sanitizedDto.googleMapsUrl !== undefined) {
    sanitizedDto.googleMapsUrl = (await resolveAndTransformGoogleMapsUrl(sanitizedDto.googleMapsUrl)) ?? undefined;
  }

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

  const ownerEmail = await findUserEmailById(venue.ownerUserId.toString());
  if (ownerEmail) {
    void emailService.sendVenueApprovedEmail(ownerEmail, venue.name);
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

  const ownerEmail = await findUserEmailById(venue.ownerUserId.toString());
  if (ownerEmail && dto.rejectionReason) {
    void emailService.sendVenueRejectedEmail(ownerEmail, venue.name, dto.rejectionReason);
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

  const ownerEmail = await findUserEmailById(venue.ownerUserId.toString());
  if (ownerEmail) {
    void emailService.sendVenueSuspendedEmail(ownerEmail, venue.name, dto.suspensionReason);
  }

  // Log activity
  const { logModerationAction } = await import('../moderation/moderationActivity.service');
  await logModerationAction(adminId, 'suspend_venue', venueId, 'venue', dto.suspensionReason);

  return updated;
}

export async function unsuspendVenue(venueId: string, adminId: string): Promise<IVenue> {
  const venue = await repo.findVenueById(venueId);
  if (!venue) throw new NotFoundError('Venue not found');

  workflow.canActivate(venue);

  const updated = await repo.updateVenueStatus(venueId, 'Approved', adminId);
  if (!updated) throw new NotFoundError('Venue not found');

  const ownerEmail = await findUserEmailById(venue.ownerUserId.toString());
  if (ownerEmail) {
    void emailService.sendVenueUnsuspendedEmail(ownerEmail, venue.name);
  }

  // Log activity
  const { logModerationAction } = await import('../moderation/moderationActivity.service');
  await logModerationAction(adminId, 'unsuspend_venue', venueId, 'venue');

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

export async function getFeaturedVenues(): Promise<(IVenue & { featuredExpiresAt?: Date | null })[]> {
  return repo.getFeaturedVenues();
}

export async function unfeatureVenue(venueId: string): Promise<void> {
  const venue = await repo.findVenueById(venueId);
  if (!venue) throw new NotFoundError('Venue not found');

  await repo.removeFeaturedVenue(venueId);
}
