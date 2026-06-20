import type mongoose from 'mongoose';
import type { Document } from 'mongoose';
import type { VenueStatusEnum, VenueFields } from '../../constants/venue.constants';

export type VenueStatus = (typeof VenueStatusEnum)[number];

export type VenueKey = (typeof VenueFields)[number];

export interface IGeoPoint {
  type: 'Point';
  /** [longitude, latitude] — GeoJSON order */
  coordinates: [number, number];
}

export interface IFixedPackage {
  slotName: string;
  startTime: string; // 09:00
  endTime: string; // 13:00
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

// Main Interface

export interface IVenue extends Document {
  // Basic Info
  name: string;
  description: string;
  venueType: string;

  // Location
  address: string;
  city: string;
  district: string;
  pincode: string;
  location: IGeoPoint; // $geoNear / 2dsphere queries - future usecase
  googleMapsUrl?: string;

  // Space & Capacity
  spaceAttributes: string[];
  seatingConfigurations: string[];
  maxCapacity?: number;

  // Booking & Pricing Config
  bookingType: 'fixedBooking' | 'flexibleBooking';
  pricingType: 'fixedPricing' | 'timeBasedPricing';
  fixedPackages: IFixedPackage[];
  workingDays: string[];
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
  refundType?: 'fullRefund' | 'timeBasedRefund';
  refundRules: IRefundRule[];

  // Operational
  status: VenueStatus;
  ownerUserId: mongoose.Types.ObjectId;
  rejectionReason?: string;

  // Audit
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Soft delete
  active: boolean;
  deleted: boolean;
}

export type CreateVenueData = Omit<
  IVenue,
  | keyof mongoose.Document
  | 'status'
  | 'createdAt'
  | 'updatedAt'
  | 'active'
  | 'deleted'
  | 'rejectionReason'
>;

export type UpdateVenueData = Partial<
  Omit<CreateVenueData, 'createdBy' | 'ownerUserId' | 'updatedBy'>
> & {
  updatedBy: string;
};

export interface AdminVenueFilters {
  status?: VenueStatus;
  city?: string;
  page: number;
  limit: number;
}

export interface PublicVenueFilters {
  searchTerm?: string;
  minPrice?: number;
  maxPrice?: number;
  venueType?: string[];
  district?: string;
  capacity?: number;
  spaceAttributes?: string[];
  seatingConfigurations?: string[];
  amenities?: string[];
  sortBy?: 'price-low' | 'price-high' | 'rating';
}
