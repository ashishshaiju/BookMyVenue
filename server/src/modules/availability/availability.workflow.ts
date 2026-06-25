import type { IVenue } from '../venue/venue.types';
import { timeStringToMinutes, minutesToTimeString, checkOverlap } from '../../utils/timeUtils';

interface AvailabilitySlot {
  slotId: string;
  name: string | null;
  startTime: string;
  endTime: string;
  price: number;
  isAvailable: boolean;
  reason: string | null;
}

interface AvailabilityResponse {
  venueId: unknown;
  date: string;
  bookingType: 'fixedBooking' | 'flexibleBooking';
  slots: AvailabilitySlot[];
}

export const generateAvailability = (
  venue: IVenue,
  date: string,
  externalConflicts: { start: number; end: number }[]
): AvailabilityResponse => {
  // Merge venue blocked times/breaks with external conflicts
  const internalConflicts = venue.blockedTimes.map((bt) => ({
    start: timeStringToMinutes(bt.fromTime),
    end: timeStringToMinutes(bt.toTime),
  }));
  const allConflicts = [...externalConflicts, ...internalConflicts];

  const slots: AvailabilitySlot[] = [];

  // Fixed bookings branch
  if (venue.bookingType === 'fixedBooking') {
    for (const pkg of venue.fixedPackages) {
      const startMin = timeStringToMinutes(pkg.startTime);
      const endMin = timeStringToMinutes(pkg.endTime);

      const isBlocked = checkOverlap(startMin, endMin, allConflicts);

      slots.push({
        slotId: pkg.slotName.replace(/\s+/g, '_').toLowerCase(),
        name: pkg.slotName,
        startTime: pkg.startTime,
        endTime: pkg.endTime,
        price: pkg.price,
        isAvailable: !isBlocked,
        reason: isBlocked ? 'UNAVAILABLE' : null,
      });
    }
    return { venueId: venue._id, date, bookingType: 'fixedBooking', slots };
  }

  // Flexible bookings branch
  const openMin = timeStringToMinutes(venue.workingHours.open);
  const closeMin = timeStringToMinutes(venue.workingHours.close);
  const duration = venue.flexibleBooking.slotDuration;
  const buffer = venue.flexibleBooking.bufferTime;

  let currentStart = openMin;

  while (currentStart + duration <= closeMin) {
    const currentEnd = currentStart + duration;
    const isBlocked = checkOverlap(currentStart, currentEnd, allConflicts);

    // Determine pricing based on base price or rules
    let appliedPrice = venue.pricing.basePrice;
    if (venue.pricing.pricingType === 'timeBasedPricing') {
      for (const rule of venue.pricing.pricingRules) {
        const ruleStart = timeStringToMinutes(rule.fromTime);
        const ruleEnd = timeStringToMinutes(rule.toTime);
        if (currentStart >= ruleStart && currentStart < ruleEnd) {
          appliedPrice = rule.price;
          break;
        }
      }
    }

    slots.push({
      slotId: `${currentStart.toString()}-${currentEnd.toString()}`,
      name: null,
      startTime: minutesToTimeString(currentStart),
      endTime: minutesToTimeString(currentEnd),
      price: appliedPrice,
      isAvailable: !isBlocked,
      reason: isBlocked ? 'UNAVAILABLE' : null,
    });

    // Advance loop adding slot duration and buffer
    currentStart = currentEnd + buffer;
  }

  return { venueId: venue._id, date, bookingType: 'flexibleBooking', slots };
};
