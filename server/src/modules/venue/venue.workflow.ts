import type { IVenue, VenueStatus } from './venue.types';
import { SUBMISSION_REQUIRED_FIELDS } from '../../constants/venue.constants';
import { WorkflowError, ValidationError } from '../../utils/errors';
import { timeStringToMinutes } from '../../utils/timeUtils';

/**
 * Venue Status State Machine
 *
 * Legal transitions:
 *
 *   Draft          → PendingReview   (owner submits)
 *   PendingReview  → Approved        (admin approves)
 *   PendingReview  → Rejected        (admin rejects)
 *   Approved       → Suspended       (admin deactivates)
 *   Rejected       → PendingReview   (owner re-submits after editing)
 *   Suspended      → Approved        (admin reactivates)
 */

type TransitionMap = Partial<Record<VenueStatus, VenueStatus[]>>;

const ALLOWED_TRANSITIONS: TransitionMap = {
  Draft: ['PendingReview'],
  PendingReview: ['Approved', 'Rejected'],
  Approved: ['Suspended'],
  Rejected: ['PendingReview'],
  Suspended: ['Approved'],
};

// Core Guard
export function assertTransition(venue: IVenue, targetStatus: VenueStatus): void {
  const allowed = ALLOWED_TRANSITIONS[venue.status] ?? [];
  if (!allowed.includes(targetStatus)) {
    throw new WorkflowError(venue.status, `transition to '${targetStatus}'`);
  }
}

// Named Transition Guards
export function canSubmit(venue: IVenue): void {
  assertTransition(venue, 'PendingReview');

  const missingFields = SUBMISSION_REQUIRED_FIELDS.filter((field) => {
    const value = venue[field];
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    return false;
  });

  if (missingFields.length > 0) {
    throw new ValidationError(
      `Cannot submit: the following required fields are missing or empty — ${missingFields.join(', ')}`
    );
  }
  
  if (venue.workingDays.length === 0) {
    throw new ValidationError('Cannot submit: at least one working day must be selected');
  }

  if (venue.amenities.length === 0) {
    throw new ValidationError('Cannot submit: at least one amenity is required');
  }

  // Fixed booking checks
  if (venue.bookingType === 'fixedBooking') {
    if (!venue.fixedPackages || venue.fixedPackages.length === 0) {
      throw new ValidationError(
        'Cannot submit: at least one fixed package is required for fixed booking type'
      );
    }
    venue.fixedPackages.forEach((pkg) => {
      if (timeStringToMinutes(pkg.endTime) <= timeStringToMinutes(pkg.startTime)) {
        throw new ValidationError(
          `Cannot submit: fixed package "${pkg.slotName}" must have endTime after startTime`
        );
      }
    });
  }

  // Flexible booking checks
  if (venue.bookingType === 'flexibleBooking') {
    if (!venue.workingHours?.open || !venue.workingHours.close) {
      throw new ValidationError(
        'Cannot submit: working hours (open & close) are required for flexible booking type'
      );
    }
    if (!venue.flexibleBooking?.slotDuration) {
      throw new ValidationError(
        'Cannot submit: slot duration is required for flexible booking type'
      );
    }

    // Pricing checks inside flexible booking
    if (!venue.pricing) {
      throw new ValidationError('Cannot submit: pricing is required for flexible booking type');
    }
    if (venue.pricing.pricingType === 'timeBasedPricing' && venue.pricing.pricingRules.length === 0) {
      throw new ValidationError(
        'Cannot submit: at least one pricing rule is required for time-based pricing'
      );
    }

    const openMin = timeStringToMinutes(venue.workingHours.open);
    const closeMin = timeStringToMinutes(venue.workingHours.close);

    venue.pricing.pricingRules.forEach((rule) => {
      const from = timeStringToMinutes(rule.fromTime);
      const to = timeStringToMinutes(rule.toTime);
      if (to <= from) {
        throw new ValidationError('Cannot submit: pricing rule toTime must be after fromTime');
      }
      if (from < openMin || to > closeMin) {
        throw new ValidationError(
          'Cannot submit: pricing rule times must be within working hours'
        );
      }
    });

    (venue.blockedTimes ?? []).forEach((block) => {
      const from = timeStringToMinutes(block.fromTime);
      const to = timeStringToMinutes(block.toTime);
      if (to <= from) {
        throw new ValidationError('Cannot submit: blocked time toTime must be after fromTime');
      }
      if (from < openMin || to > closeMin) {
        throw new ValidationError(
          'Cannot submit: blocked time must be within working hours'
        );
      }
    });
  }

  // Refund policy checks
  if (venue.cancellation.policy === 'refundable') {
    if (!venue.cancellation.refundType) {
      throw new ValidationError(
        'Cannot submit: refund type is required for refundable cancellation policy'
      );
    }
    if (venue.cancellation.refundType === 'timeBasedRefund' && venue.cancellation.refundRules.length === 0) {
      throw new ValidationError(
        'Cannot submit: at least one refund rule is required for time-based refund policy'
      );
    }
  }
}

export function canApprove(venue: IVenue): void {
  assertTransition(venue, 'Approved');
}

export function canReject(venue: IVenue): void {
  assertTransition(venue, 'Rejected');
}

export function canDeactivate(venue: IVenue): void {
  assertTransition(venue, 'Suspended');
}

export function canActivate(venue: IVenue): void {
  assertTransition(venue, 'Approved');
}

export function canEdit(venue: IVenue): void {
  const editableStatuses: VenueStatus[] = ['Draft', 'Rejected'];
  if (!editableStatuses.includes(venue.status)) {
    throw new WorkflowError(venue.status, 'edit — only Draft or Rejected venues can be edited');
  }
}

export function canDelete(venue: IVenue): void {
  const deletableStatuses: VenueStatus[] = ['Draft', 'Rejected'];
  if (!deletableStatuses.includes(venue.status)) {
    throw new WorkflowError(venue.status, 'delete — only Draft or Rejected venues can be deleted');
  }
}
