export interface IFixedPackage {
  slotName: string;
  startTime: string;
  endTime: string;
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
  reason: string;
}

export interface IPricing {
  pricingType: 'fixedPricing' | 'timeBasedPricing';
  basePrice: number;
  pricingRules: IPricingRule[];
}

export interface IRefundRule {
  daysBefore: number;
  refundPercentage: number;
}

export interface IContact {
  name: string;
  phone: string;
  email?: string | null;
}

export interface ICancellation {
  policy: 'refundable' | 'nonRefundable';
  refundType?: 'fullRefund' | 'timeBasedRefund';
  refundRules: IRefundRule[];
}

// ─── Form-only types (pre-coercion, values may be strings) ──────────────────

export interface IAddVenueFixedPackage {
  slotName: string;
  startTime: string;
  endTime: string;
  price: number | string;
}

export interface IAddVenuePricingRule {
  fromTime: string;
  toTime: string;
  price: number | string;
}

export interface IAddVenueRefundRule {
  daysBefore: number | string;
  refundPercentage: number | string;
}

export interface AddVenueFormValues {
  VenueName: string;
  VenueDescription: string;
  venueType: string;
  district: string;
  state: string;
  city: string;
  pincode: string;
  fullAddress: string;
  googleMapsLink: string;
  spaceAttributes: string[];
  seatingConfigurations: string[];
  maxCapacity: string;
  bookingType: string;
  fixedPackages: IAddVenueFixedPackage[];
  workingDays: string[];
  workingHours: {
    open: string;
    close: string;
  };

  flexibleBooking: {
    slotDuration: number | string;
    bufferTime: number | string;
  };

  pricing: {
    pricingType: string;
    basePrice: number | string;
    pricingRules: IAddVenuePricingRule[];
  };
  blockedTimes: IBlockedTime[];
  pricingType?: string;
  samePrice?: number | string;
  amenities: string[];
  venuePhotos: File[];

  contact: {
    name: string;
    phone: string;
    email?: string;
  };

  cancellation: {
    policy: string;
    refundType: string;
    refundRules: IAddVenueRefundRule[];
  };
}

export type VenueStatus = 'Draft' | 'PendingReview' | 'Approved' | 'Rejected' | 'Suspended';

export interface MyVenue {
  _id: string;
  name: string;
  city: string;
  state: string;
  venueType: string;
  coverImage: string;
  status: VenueStatus;
  rejectionReason?: string;
  createdAt: string;
}

export interface VenueDetail {
  _id: string;
  name: string;
  description: string;
  venueType: string;
  address: string;
  city: string;
  district: string;
  pincode: string;
  googleMapsUrl?: string;
  spaceAttributes: string[];
  seatingConfigurations: string[];
  maxCapacity?: number;
  bookingType: 'fixedBooking' | 'flexibleBooking';
  fixedPackages: IFixedPackage[];
  workingDays: string[];
  workingHours: {
    open: string;
    close: string;
  };
  flexibleBooking?: {
    slotDuration: number;
    bufferTime: number;
  };
  pricing: IPricing;
  amenities: string[];
  coverImage: string;
  galleryImages: string[];
  contact: IContact;
  cancellation: ICancellation;
  status: VenueStatus;
  createdAt: string;
}

export interface PublicVenue {
  _id: string;
  name: string;
  description: string;
  venueType: string;
  city: string;
  district: string;
  coverImage: string;
  maxCapacity: number;
  flexibleBooking?: {
    slotDuration: number;
    bufferTime: number;
  };
  amenities?: string[];
  bookingType?: 'fixedBooking' | 'flexibleBooking';
  pricing?: IPricing;
  fixedPackages?: { price: number }[];
}

export interface VenueFilters {
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

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  skip: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedVenuesResponse {
  venues: PublicVenue[];
  pagination: PaginationMeta;
}
