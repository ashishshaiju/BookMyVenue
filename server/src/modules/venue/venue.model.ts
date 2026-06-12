import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

// ── Status Enum ───────────────────────────────────────────────────────────────

export const VenueStatusEnum = [
  'Draft',
  'PendingReview',
  'Approved',
  'Rejected',
  'Suspended',
] as const;

export type VenueStatus = (typeof VenueStatusEnum)[number];

// ── Shared Types ──────────────────────────────────────────────────────────────

export interface IGeoPoint {
  type: 'Point';
  /** [longitude, latitude] — GeoJSON order */
  coordinates: [number, number];
}

// ── Sub-Documents for Pricing and Policies ───────────────────────────────────

export interface IFixedPackage {
  slotName: string;
  startTime: string; // e.g., '09:00'
  endTime: string;   // e.g., '13:00'
  price: number;
}

export interface IPricingRule {
  fromTime: string;
  toTime: string;
  price: number;
}

export interface IBlockedTime {
  fromTime: string;
  toTime: string;
}

export interface IRefundRule {
  daysBefore: number;
  refundPercentage: number;
}

// ── Main Interface ────────────────────────────────────────────────────────────

export interface IVenue extends Document {
  // Basic Info
  name: string;
  description: string;
  venueType: string;

  // Location
  address: string;
  city: string;
  district: string;
  state: string;
  country: string;
  pincode: string;
  location: IGeoPoint; // enables $geoNear / 2dsphere queries
  googleMapsUrl?: string;

  // Space & Capacity
  spaceAttributes: string[];
  seatingConfigurations: string[];
  maxCapacity?: number;

  // Booking & Pricing Config
  bookingType: 'fixed' | 'flexible';
  pricingType: 'same' | 'timeBased';
  fixedPackages: IFixedPackage[];
  workingHours: {
    open: string;
    close: string;
  };
  slotDuration?: string;
  bufferTime?: string;
  samePrice?: number;
  pricingRules: IPricingRule[];
  blockedTimes: IBlockedTime[];

  // Amenities
  amenities: string[];

  // Media
  coverImage: string;
  galleryImages: string[];

  // Contact
  contactName: string;
  contactPhone: string;
  contactEmail?: string;

  // Policies
  cancellationPolicy: 'refundable' | 'nonRefundable';
  refundType?: 'full' | 'timeBased';
  refundRules: IRefundRule[];

  // Operational
  status: VenueStatus;
  ownerUserId: mongoose.Types.ObjectId;
  rejectionReason?: string; // Set when admin rejects

  // Audit
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Soft delete
  active: boolean;
  deleted: boolean;
}

// ── Schemas ───────────────────────────────────────────────────────────────────

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

const FixedPackageSchema = new Schema<IFixedPackage>({
  slotName: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  price: { type: Number, required: true },
}, { _id: false });

const PricingRuleSchema = new Schema<IPricingRule>({
  fromTime: { type: String, required: true },
  toTime: { type: String, required: true },
  price: { type: Number, required: true },
}, { _id: false });

const BlockedTimeSchema = new Schema<IBlockedTime>({
  fromTime: { type: String, required: true },
  toTime: { type: String, required: true },
}, { _id: false });

const RefundRuleSchema = new Schema<IRefundRule>({
  daysBefore: { type: Number, required: true },
  refundPercentage: { type: Number, required: true },
}, { _id: false });

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
    bookingType: { type: String, enum: ['fixed', 'flexible'], required: true },
    pricingType: { type: String, enum: ['same', 'timeBased'], required: true },
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
    refundType: { type: String, enum: ['full', 'timeBased'] },
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

// ── Indexes ───────────────────────────────────────────────────────────────────

// Unique name per owner (soft-delete aware)
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

// ── Model ─────────────────────────────────────────────────────────────────────

export const VenueModel = mongoose.model<IVenue>('Venues', VenueSchema, 'Venues');
