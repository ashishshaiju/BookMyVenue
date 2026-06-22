import mongoose, { Schema } from 'mongoose';
import { VenueStatusEnum } from '../../constants/venue.constants';
import type {
  IGeoPoint,
  IFixedPackage,
  IPricingRule,
  IPricing,
  IBlockedTime,
  IRefundRule,
  IContact,
  ICancellation,
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

const PricingSchema = new Schema<IPricing>(
  {
    pricingType: { type: String, enum: ['fixedPricing', 'timeBasedPricing'], required: true },
    basePrice: { type: Number, required: true, min: 0 },
    pricingRules: { type: [PricingRuleSchema], default: [] },
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

const ContactSchema = new Schema<IContact>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: null },
  },
  { _id: false }
);

const CancellationSchema = new Schema<ICancellation>(
  {
    policy: { type: String, enum: ['refundable', 'nonRefundable'], required: true },
    refundType: { type: String, enum: ['fullRefund', 'timeBasedRefund'] },
    refundRules: { type: [RefundRuleSchema], default: [] },
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
    pincode: { type: String, required: true, trim: true },
    location: { type: GeoPointSchema, required: false },
    googleMapsUrl: { type: String, trim: true, default: null },

    // Space & Capacity
    spaceAttributes: { type: [String], default: [] },
    seatingConfigurations: { type: [String], default: [] },
    maxCapacity: { type: Number },

    // Booking Config
    bookingType: { type: String, enum: ['fixedBooking', 'flexibleBooking'], required: true },
    fixedPackages: { type: [FixedPackageSchema], default: [] },
    workingDays: { type: [String], default: [] },
    workingHours: {
      open: { type: String, required: true },
      close: { type: String, required: true },
    },
    blockedTimes: { type: [BlockedTimeSchema], default: [] },
    blockedDates: { type: [Date], default: [] },
    flexibleBooking: {
      slotDuration: { type: Number, default: 60 },
      bufferTime: { type: Number, default: 0 },
    },

    // Pricing
    pricing: { type: PricingSchema, required: true },

    // Amenities
    amenities: { type: [String], default: [] },

    // Media
    coverImage: { type: String, required: true, trim: true },
    galleryImages: { type: [String], default: [] },

    // Contact
    contact: { type: ContactSchema, required: true },

    // Cancellation & Refund
    cancellation: { type: CancellationSchema, required: true },

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
