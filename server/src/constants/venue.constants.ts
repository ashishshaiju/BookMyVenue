import type { IVenue } from '../modules/venue/venue.types';

export const VenueStatusEnum = [
  'Draft',
  'PendingReview',
  'Approved',
  'Rejected',
  'Suspended',
] as const;

export const KERALA_DISTRICTS = [
  'Thiruvananthapuram',
  'Kollam',
  'Pathanamthitta',
  'Alappuzha',
  'Kottayam',
  'Idukki',
  'Ernakulam',
  'Thrissur',
  'Palakkad',
  'Malappuram',
  'Kozhikode',
  'Wayanad',
  'Kannur',
  'Kasaragod',
] as const;

export const VenueFields = [
  'name',
  'description',
  'venueType',
  'address',
  'city',
  'district',
  'pincode',
  'googleMapsUrl',
  'spaceAttributes',
  'seatingConfigurations',
  'maxCapacity',
  'bookingType',
  'fixedPackages',
  'workingDays',
  'workingHours',
  'flexibleBooking',
  'pricing',
  'blockedTimes',
  'blockedDates',
  'amenities',
  'coverImage',
  'galleryImages',
  'contact',
  'cancellation',
] as const;

// Required Fields for Submission

export const SUBMISSION_REQUIRED_FIELDS: (keyof IVenue)[] = [
  'name',
  'description',
  'venueType',
  'address',
  'city',
  'district',
  'pincode',
  'bookingType',
  'cancellation',
  'contact',
  'coverImage',
];
