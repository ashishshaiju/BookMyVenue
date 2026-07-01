import * as repo from './owner.repository';
import * as service from './owner.service';
import type { IBooking } from '../booking/booking.types';

export async function getVenueAvailabilityCalendarWorkflow(venueId: string): Promise<{ bookedDates: string[]; blockedDates: string[]; workingDays: unknown } | null> {
  const venue = await repo.getVenueBlockedDatesAndWorkingDays(venueId);
  if (!venue) {
    return null;
  }

  const dateThreshold = service.getDateThreshold(30);

  const bookings = await repo.getConfirmedBookingsAfterDate(venueId, dateThreshold);

  const bookedDates = [...new Set(bookings.map((b: IBooking) => b.date))];

  // Blocked dates - YYYY-MM-DD strings
  const blockedDates = venue.blockedDates.map(
    (d: Date) => new Date(d).toISOString().split('T')[0]
  );

  return {
    bookedDates,
    blockedDates,
    workingDays: venue.workingDays
  };
}
