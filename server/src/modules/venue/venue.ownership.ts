import type { IVenue } from './venue.types';
import { ForbiddenError, NotFoundError } from '../../utils/errors';
import { findVenueById } from './venue.repository';

/**
 * Ownership Validation — Venue Module
 *
 * RBAC and Ownership are strictly separated concerns:
 *   • RBAC  → does the user's *role* permit the action? (handled by requirePermission middleware)
 *   • Ownership → does this specific *resource* belong to the requesting user?
 *                 (handled here, called from the service layer)
 */

/**
 * Assert that a venue document belongs to the given user.
 *
 * @throws {ForbiddenError} if the userId does not match ownerUserId
 */
export function assertVenueOwner(venue: IVenue, userId: string): void {
  if (venue.ownerUserId.toString() !== userId) {
    throw new ForbiddenError('You do not have permission to modify this venue');
  }
}

/**
 * Convenience helper: fetch a venue by ID then verify ownership in one call.
 *
 * @throws {NotFoundError}  if the venue does not exist or is deleted
 * @throws {ForbiddenError} if the user is not the owner
 */
export async function requireOwnVenue(venueId: string, userId: string): Promise<IVenue> {
  const venue = await findVenueById(venueId);

  if (!venue) {
    throw new NotFoundError('Venue not found');
  }

  assertVenueOwner(venue, userId);

  return venue;
}
