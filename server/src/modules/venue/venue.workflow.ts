import type { IVenue, VenueStatus } from './venue.types';
import { SUBMISSION_REQUIRED_FIELDS } from '../../constants/venue.constants';
import { WorkflowError, ValidationError } from '../../utils/errors';

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

  if (!venue.coverImage) {
    throw new ValidationError('Cannot submit: a cover image is required');
  }

  // Dependent field validation
  if (venue.bookingType === 'fixedBooking' && venue.fixedPackages.length === 0) {
    throw new ValidationError('Cannot submit: at least one fixed package is required for fixed booking type');
  }

  if (venue.bookingType === 'flexibleBooking') {
    if (!venue.workingHours.open || !venue.workingHours.close) {
      throw new ValidationError('Cannot submit: working hours are required for flexible booking type');
    }
    if (venue.pricingType === 'timeBasedPricing' && venue.pricingRules.length === 0) {
      throw new ValidationError('Cannot submit: pricing rules are required for time-based pricing');
    }
  }

  if (venue.cancellationPolicy === 'refundable' && venue.refundRules.length === 0) {
    throw new ValidationError('Cannot submit: refund rules are required for refundable policies');
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
    throw new WorkflowError(
      venue.status,
      'edit — only Draft or Rejected venues can be edited'
    );
  }
}

export function canDelete(venue: IVenue): void {
  const deletableStatuses: VenueStatus[] = ['Draft', 'Rejected'];
  if (!deletableStatuses.includes(venue.status)) {
    throw new WorkflowError(
      venue.status,
      'delete — only Draft or Rejected venues can be deleted'
    );
  }
}
