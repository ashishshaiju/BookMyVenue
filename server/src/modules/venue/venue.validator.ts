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

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

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

export const refundRuleSchema = z.object({
  daysBefore: z.number().int().min(0, 'Days before must be positive'),
  refundPercentage: z.number().min(0).max(100, 'Percentage must be between 0 and 100'),
});

// ─── Venue Creation Validation ───────────────────────────────────────────────

// Full Venue Creation Validation (Phase 3)
export const createVenueSchema = z
  .object({
    // Basic Info
    name: z.string().trim().min(3, 'Name must be at least 3 characters').max(100),
    description: z.string().trim().min(10, 'Description must be at least 10 characters'),
    venueType: z.string().trim().min(1, 'Venue type is required'),

    // Location
    address: z.string().trim().min(5, 'Address must be at least 5 characters'),
    city: z.string().trim().min(2).max(100),
    district: z.string().trim().min(2).max(100),
    state: z.string().trim().min(2).max(100),
    pincode: z.string().trim().min(4).max(20),
    coordinates: coordinatesSchema.optional(),
    googleMapsUrl: urlSchema.optional(),

    // Space & Capacity
    spaceAttributes: z.array(z.string()).default([]),
    seatingConfigurations: z.array(z.string()).default([]),
    maxCapacity: z.coerce.number().int().positive().optional(),

    // Booking & Pricing Config
    bookingType: z.enum(['fixedBooking', 'flexibleBooking']),
    pricingType: z.enum(['fixedPricing', 'timeBasedPricing']),

    // Fixed booking fields
    fixedPackages: z.array(fixedPackageSchema).default([]),

    // Both booking types
    workingDays: z
      .array(z.enum(DAYS_OF_WEEK))
      .min(1, 'At least one working day is required'),

    // Flexible booking fields
    workingHours: z
      .object({
        open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
        close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
      })
      .optional(),
    slotDuration: z.string().optional(),
    bufferTime: z.string().optional(),
    samePrice: z.coerce.number().min(0).optional(),
    pricingRules: z.array(pricingRuleSchema).default([]),
    blockedTimes: z.array(blockedTimeSchema).default([]),

    // Amenities
    amenities: z.array(z.string()).min(1, 'At least one amenity is required'),

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
  })
  .superRefine((data, ctx) => {
    // Helper: HH:MM → minutes since midnight
    const toMin = (t: string): number => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    // Fixed booking: must have at least one package
    if (data.bookingType === 'fixedBooking') {
      if (data.fixedPackages.length === 0) {
        ctx.addIssue({
          code: 'custom',
          message: 'At least one fixed package is required for fixed booking',
          path: ['fixedPackages'],
        });
      }
    }

    // Flexible booking: requires workingHours, slotDuration, bufferTime, pricingType
    if (data.bookingType === 'flexibleBooking') {
      if (!data.workingHours) {
        ctx.addIssue({
          code: 'custom',
          message: 'Working hours are required for flexible booking',
          path: ['workingHours'],
        });
      } else {
        if (!data.workingHours.open) {
          ctx.addIssue({
            code: 'custom',
            message: 'Open time is required for flexible booking',
            path: ['workingHours', 'open'],
          });
        }
        if (!data.workingHours.close) {
          ctx.addIssue({
            code: 'custom',
            message: 'Close time is required for flexible booking',
            path: ['workingHours', 'close'],
          });
        }
        // close must be after open
        if (data.workingHours.open && data.workingHours.close) {
          if (toMin(data.workingHours.close) <= toMin(data.workingHours.open)) {
            ctx.addIssue({
              code: 'custom',
              message: 'Close time must be after open time',
              path: ['workingHours', 'close'],
            });
          }
        }
      }

      if (!data.slotDuration) {
        ctx.addIssue({
          code: 'custom',
          message: 'Slot duration is required for flexible booking',
          path: ['slotDuration'],
        });
      }
      if (data.bufferTime === undefined || data.bufferTime === '') {
        ctx.addIssue({
          code: 'custom',
          message: 'Buffer time is required for flexible booking',
          path: ['bufferTime'],
        });
      }

      // Time-based pricing: must have at least one pricing rule
      if (data.pricingType === 'timeBasedPricing' && data.pricingRules.length === 0) {
        ctx.addIssue({
          code: 'custom',
          message: 'At least one pricing rule is required for time-based pricing',
          path: ['pricingRules'],
        });
      }

      // Same price pricing: must have samePrice
      if (data.pricingType === 'fixedPricing' && data.samePrice === undefined) {
        ctx.addIssue({
          code: 'custom',
          message: 'Price per slot is required for fixed pricing',
          path: ['samePrice'],
        });
      }

      // Working-hours boundary checks
      const wh = data.workingHours;
      const openMin  = wh?.open  ? toMin(wh.open)  : null;
      const closeMin = wh?.close ? toMin(wh.close) : null;

      if (openMin !== null && closeMin !== null && wh) {
        data.pricingRules.forEach((rule, i) => {
          if (rule.fromTime) {
            const from = toMin(rule.fromTime);
            if (from < openMin) {
              ctx.addIssue({
                code: 'custom',
                message: `From time must be on or after open time (${wh.open})`,
                path: ['pricingRules', i, 'fromTime'],
              });
            }
          }
          if (rule.toTime) {
            const to = toMin(rule.toTime);
            if (to > closeMin) {
              ctx.addIssue({
                code: 'custom',
                message: `To time must be on or before close time (${wh.close})`,
                path: ['pricingRules', i, 'toTime'],
              });
            }
          }
          if (rule.fromTime && rule.toTime && toMin(rule.toTime) <= toMin(rule.fromTime)) {
            ctx.addIssue({
              code: 'custom',
              message: 'To time must be after from time',
              path: ['pricingRules', i, 'toTime'],
            });
          }
        });

        // Validate blockedTimes stay within working hours
        data.blockedTimes.forEach((block, i) => {
          if (block.fromTime) {
            const from = toMin(block.fromTime);
            if (from < openMin) {
              ctx.addIssue({
                code: 'custom',
                message: `From time must be on or after open time (${wh.open})`,
                path: ['blockedTimes', i, 'fromTime'],
              });
            }
          }
          if (block.toTime) {
            const to = toMin(block.toTime);
            if (to > closeMin) {
              ctx.addIssue({
                code: 'custom',
                message: `To time must be on or before close time (${wh.close})`,
                path: ['blockedTimes', i, 'toTime'],
              });
            }
          }
          if (block.fromTime && block.toTime && toMin(block.toTime) <= toMin(block.fromTime)) {
            ctx.addIssue({
              code: 'custom',
              message: 'To time must be after from time',
              path: ['blockedTimes', i, 'toTime'],
            });
          }
        });
      }
    }

    // Refundable policy: must have refund rules
    if (data.cancellationPolicy === 'refundable' && data.refundRules.length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'At least one refund rule is required for refundable policy',
        path: ['refundRules'],
      });
    }
  });

export type CreateVenueDTO = z.infer<typeof createVenueSchema>;

// Update

// PUT /venues/:id
export const updateVenueSchema = z
  .object({
    name: z.string().trim().min(3, 'Name must be at least 3 characters').max(100),
    description: z.string().trim().min(10, 'Description must be at least 10 characters'),
    venueType: z.string().trim().min(1, 'Venue type is required'),
    address: z.string().trim().min(5, 'Address must be at least 5 characters'),
    city: z.string().trim().min(2).max(100),
    district: z.string().trim().min(2).max(100),
    state: z.string().trim().min(2).max(100),
    pincode: z.string().trim().min(4).max(20),
    coordinates: coordinatesSchema.optional(),
    googleMapsUrl: urlSchema.optional(),
    spaceAttributes: z.array(z.string()),
    seatingConfigurations: z.array(z.string()),
    maxCapacity: z.coerce.number().int().positive().optional(),
    bookingType: z.enum(['fixedBooking', 'flexibleBooking']),
    pricingType: z.enum(['fixedPricing', 'timeBasedPricing']),
    fixedPackages: z.array(fixedPackageSchema),
    workingDays: z.array(z.enum(DAYS_OF_WEEK)).min(1, 'At least one working day is required'),
    workingHours: z.object({
      open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    }),
    slotDuration: z.string().optional(),
    bufferTime: z.string().optional(),
    samePrice: z.coerce.number().min(0).optional(),
    pricingRules: z.array(pricingRuleSchema),
    blockedTimes: z.array(blockedTimeSchema),
    amenities: z.array(z.string()),
    coverImage: urlSchema,
    galleryImages: z.array(urlSchema).max(20).optional(),
    contactName: z.string().trim().min(2).max(100),
    contactPhone: phoneSchema,
    contactEmail: z
      .string()
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Must be a valid email')
      .optional(),
    cancellationPolicy: z.enum(['refundable', 'nonRefundable']),
    refundType: z.enum(['fullRefund', 'timeBasedRefund']).optional(),
    refundRules: z.array(refundRuleSchema),
  })
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
