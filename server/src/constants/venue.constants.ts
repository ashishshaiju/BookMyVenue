import type { IVenue } from "../modules/venue/venue.types"; 

export const VenueStatusEnum = [
  'Draft',
  'PendingReview',
  'Approved',
  'Rejected',
  'Suspended',
] as const;

export const VenueFields = [
  'name',
  'description',
  'venueType',
  'address',
  'city',
  'district',
  'state',
  'country',
  'pincode',
  'googleMapsUrl',
  'spaceAttributes',
  'seatingConfigurations',
  'maxCapacity',
  'bookingType',
  'pricingType',
  'fixedPackages',
  'workingHours',
  'slotDuration',
  'bufferTime',
  'samePrice',
  'pricingRules',
  'blockedTimes',
  'amenities',
  'coverImage',
  'galleryImages',
  'contactName',
  'contactPhone',
  'contactEmail',
  'cancellationPolicy',
  'refundType',
  'refundRules',
] as const;

// Required Fields for Submission

export const SUBMISSION_REQUIRED_FIELDS: (keyof IVenue)[] = [
  'name',
  'description',
  'venueType',
  'address',
  'city',
  'district',
  'state',
  'country',
  'pincode',
  'bookingType',
  'pricingType',
  'cancellationPolicy',
  'contactName',
  'contactPhone',
  'coverImage',
];