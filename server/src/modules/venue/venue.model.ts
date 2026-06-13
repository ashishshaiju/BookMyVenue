import mongoose, { Schema } from 'mongoose';
import { VenueStatusEnum } from '../../constants/venue.constants';
import type {
  IGeoPoint,
  IFixedPackage,
  IPricingRule,
  IBlockedTime,
  IRefundRule,
  IVenue,
} from './venue.types';

const GeoPointSchema = new Schema<IGeoPoint>(
  {
    type: { type: String, enum: ['Point'], required: true, default: 'Point' },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: (v: number[]): boolean => v.length === 2,
        message: 'coordinates must be [longitude, latitude]',
      },
    },
  },
  { _id: false }
);

const FixedPackageSchema = new Schema<IFixedPackage>(
  {
    slotName: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const PricingRuleSchema = new Schema<IPricingRule>(
  {
    fromTime: { type: String, required: true },
    toTime: { type: String, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const BlockedTimeSchema = new Schema<IBlockedTime>(
  {
    fromTime: { type: String, required: true },
    toTime: { type: String, required: true },
  },
  { _id: false }
);

const RefundRuleSchema = new Schema<IRefundRule>(
  {
    daysBefore: { type: Number, required: true },
    refundPercentage: { type: Number, required: true },
  },
  { _id: false }
);

const VenueSchema = new Schema<IVenue>(
  {
    // Basic Info
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true },
    venueType: { type: String, required: true },

    // Location
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    location: { type: GeoPointSchema, required: true },
    googleMapsUrl: { type: String, trim: true, default: null },

    // Space & Capacity
    spaceAttributes: { type: [String], default: [] },
    seatingConfigurations: { type: [String], default: [] },
    maxCapacity: { type: Number },

    // Booking & Pricing Config
    bookingType: { type: String, enum: ['fixedBooking', 'flexibleBooking'], required: true },
    pricingType: { type: String, enum: ['fixedPricing', 'timeBasedPricing'], required: true },
    fixedPackages: { type: [FixedPackageSchema], default: [] },
    workingHours: {
      open: { type: String, required: true },
      close: { type: String, required: true },
    },
    slotDuration: { type: String },
    bufferTime: { type: String },
    samePrice: { type: Number },
    pricingRules: { type: [PricingRuleSchema], default: [] },
    blockedTimes: { type: [BlockedTimeSchema], default: [] },

    // Amenities
    amenities: { type: [String], default: [] },

    // Media
    coverImage: { type: String, required: true, trim: true },
    galleryImages: { type: [String], default: [] },

    // Contact
    contactName: { type: String, required: true, trim: true },
    contactPhone: { type: String, required: true, trim: true },
    contactEmail: { type: String, trim: true, default: null },

    // Policies
    cancellationPolicy: { type: String, enum: ['refundable', 'nonRefundable'], required: true },
    refundType: { type: String, enum: ['fullRefund', 'timeBasedRefund'] },
    refundRules: { type: [RefundRuleSchema], default: [] },

    // Operational
    status: {
      type: String,
      enum: VenueStatusEnum as unknown as string[],
      required: true,
      default: 'Draft',
    },
    ownerUserId: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
    rejectionReason: { type: String },

    // Audit
    createdBy: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'Users', required: true },

    // Soft delete
    active: { type: Boolean, default: true },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes
VenueSchema.index(
  { ownerUserId: 1, name: 1 },
  {
    unique: true,
    partialFilterExpression: { deleted: false },
    name: 'idx_owner_name_unique',
  }
);

// Admin: fetch all pending venues
VenueSchema.index({ status: 1, deleted: 1 }, { name: 'idx_status' });

// Owner: list own venues
VenueSchema.index({ ownerUserId: 1, status: 1, deleted: 1 }, { name: 'idx_owner_status' });

// Future geo-search readiness (2dsphere on the nested GeoJSON Point)
VenueSchema.index({ location: '2dsphere' }, { name: 'idx_location_geo' });

export const VenueModel = mongoose.model<IVenue>('Venues', VenueSchema, 'Venues');
