import type { IVenue } from './venue.types';
import { ForbiddenError, NotFoundError } from '../../utils/errors';
import { findVenueById } from './venue.repository';

export function assertVenueOwner(venue: IVenue, userId: string): void {
  if (venue.ownerUserId.toString() !== userId) {
    throw new ForbiddenError('You do not have permission to modify this venue');
  }
}
 
export async function requireOwnVenue(venueId: string, userId: string): Promise<IVenue> {
  const venue = await findVenueById(venueId);

  if (!venue) {
    throw new NotFoundError('Venue not found');
  }

  assertVenueOwner(venue, userId);

  return venue;
}
