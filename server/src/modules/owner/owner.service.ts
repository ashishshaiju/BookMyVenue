import { ConflictError } from '../../utils/errors';
import { buildPaginationMeta } from '../../utils/paginationUtils';
import * as repo from './owner.repository';
import type { offlineBookingSchema } from './owner.validator';
import type { IBooking } from '../booking/booking.types';
import type { z } from 'zod';

export function getDateThreshold(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

export async function getVenueAnalyticsService(venueId: string): Promise<{ months: Record<string, unknown>[] }> {
  const months = await repo.getVenueAnalyticsData(venueId);
  return { months };
}

export async function getVenueBookingsService(venueId: string, page: number, limit: number): Promise<{ bookings: IBooking[], pagination: unknown }> {
  const skip = (page - 1) * limit;
  
  const [bookings, totalCount] = await Promise.all([
    repo.getVenueBookingsPaginated(venueId, skip, limit),
    repo.countVenueBookings(venueId)
  ]);

  return {
    bookings,
    pagination: buildPaginationMeta(totalCount, { page, limit, skip, sort: '-date' }),
  };
}

export async function createOfflineBookingService(userId: string, dto: z.infer<typeof offlineBookingSchema>): Promise<{ bookingId: string }> {
  const booking = await repo.createOfflineBookingRecord(
    dto.venueId,
    userId,
    dto.date,
    dto.startTime,
    dto.endTime,
    dto.amountPaid,
    dto.customerName,
    dto.phone
  );
  return { bookingId: String(booking._id) };
}

export async function blockDatesService(venueId: string, dates: string[]): Promise<Date[]> {
  const conflictingBooking = await repo.findConflictingBookingForDates(venueId, dates);

  if (conflictingBooking) {
    throw new ConflictError(`Cannot block date ${conflictingBooking.date} because it has a confirmed booking.`);
  }

  const dateObjects = dates.map(d => new Date(`${d}T00:00:00Z`));
  const updatedVenue = await repo.addBlockedDatesToVenue(venueId, dateObjects);
  return updatedVenue ? updatedVenue.blockedDates : [];
}

export async function unblockDatesService(venueId: string, dates: string[]): Promise<Date[]> {
  const dateObjects = dates.map(d => new Date(`${d}T00:00:00Z`));
  const updatedVenue = await repo.removeBlockedDatesFromVenue(venueId, dateObjects);
  return updatedVenue ? updatedVenue.blockedDates : [];
}
