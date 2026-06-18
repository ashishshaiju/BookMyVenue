import { z } from 'zod';

// Shared sub-schemas

/** [longitude, latitude] */
const coordinatesSchema = z
  .tuple([
    z.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
    z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
  ])
  .describe('[longitude, latitude]');

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[\d\s\-().]{7,20}$/, 'Contact phone must be a valid phone number (7-20 characters)');

const urlSchema = z.string().regex(/^https?:\/\/.+/, 'Must be a valid URL');

const venueIdSchema = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, 'Invalid venue ID');

const fixedPackageSchema = z.object({
  slotName: z.string().trim().min(1, 'Slot name is required'),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
});

const pricingRuleSchema = z.object({
  fromTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  toTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
});

const blockedTimeSchema = z.object({
  fromTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  toTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
});

const refundRuleSchema = z.object({
  daysBefore: z.coerce.number().int().min(0),
  refundPercentage: z.coerce.number().min(0).max(100),
});

// Create

// POST /venues
export const createVenueSchema = z.object({
  // Basic Info
  name: z.string().trim().min(3, 'Name must be at least 3 characters').max(100),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  venueType: z.string().trim().min(1, 'Venue type is required'),

  // Location
  address: z.string().trim().min(5, 'Address must be at least 5 characters'),
  city: z.string().trim().min(2).max(100),
  district: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  country: z.string().trim().min(2).max(100),
  pincode: z.string().trim().min(4).max(20),
  coordinates: coordinatesSchema,
  googleMapsUrl: urlSchema.optional(),

  // Space & Capacity
  spaceAttributes: z.array(z.string()).default([]),
  seatingConfigurations: z.array(z.string()).default([]),
  maxCapacity: z.coerce.number().int().positive().optional(),

  // Booking & Pricing Config
  bookingType: z.enum(['fixedBooking', 'flexibleBooking']),
  pricingType: z.enum(['fixedPricing', 'timeBasedPricing']),
  fixedPackages: z.array(fixedPackageSchema).default([]),
  workingHours: z.object({
    open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  }),
  slotDuration: z.string().optional(),
  bufferTime: z.string().optional(),
  samePrice: z.coerce.number().min(0).optional(),
  pricingRules: z.array(pricingRuleSchema).default([]),
  blockedTimes: z.array(blockedTimeSchema).default([]),

  // Amenities
  amenities: z.array(z.string()).default([]),

  // Media
  coverImage: urlSchema,
  galleryImages: z.array(urlSchema).max(20).optional(),

  // Contact
  contactName: z.string().trim().min(2).max(100),
  contactPhone: phoneSchema,
  contactEmail: z
    .string()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Must be a valid email')
    .optional(),

  // Policies
  cancellationPolicy: z.enum(['refundable', 'nonRefundable']),
  refundType: z.enum(['fullRefund', 'timeBasedRefund']).optional(),
  refundRules: z.array(refundRuleSchema).default([]),
});

export type CreateVenueDTO = z.infer<typeof createVenueSchema>;

// Update

// PUT /venues/:id
export const updateVenueSchema = createVenueSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export type UpdateVenueDTO = z.infer<typeof updateVenueSchema>;

// Admin review

export const rejectVenueSchema = z.object({
  rejectionReason: z
    .string()
    .trim()
    .max(500, 'Rejection reason must be under 500 characters')
    .optional(),
});

export type RejectVenueDTO = z.infer<typeof rejectVenueSchema>;

// Admin list filters

export const adminVenueFiltersSchema = z.object({
  status: z.enum(['Draft', 'PendingReview', 'Approved', 'Rejected', 'Suspended']).optional(),
  city: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type AdminVenueFiltersDTO = z.infer<typeof adminVenueFiltersSchema>;

// Route param

export const venueIdParamSchema = z.object({
  id: venueIdSchema,
});

export type VenueIdParamDTO = z.infer<typeof venueIdParamSchema>;
