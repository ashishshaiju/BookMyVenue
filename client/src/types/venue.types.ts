export interface IFixedPackage {
  slotName: string;
  startTime: string;
  endTime: string;
  price: string;
}

export interface IPricingRule {
  fromTime: string;
  toTime: string;
  price: string;
}

export interface IBlockedTime {
  fromTime: string;
  toTime: string;
  reason: string;
}

export interface IRefundRule {
  daysBefore: string;
  refundPercentage: string;
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
  fixedPackages: IFixedPackage[];
  workingDays: string[];
  workingHours: {
    open: string;
    close: string;
  };
  slotDuration: string;
  bufferTime: string;
  pricingType: string;
  samePrice: string;
  pricingRules: IPricingRule[];
  blockedTimes: IBlockedTime[];
  amenities: string[];
  venuePhotos: File[];
  contactName: string;
  contactPhone: string;
  cancellationPolicy: string;
  refundType: string;
  refundRules: IRefundRule[];
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

export interface PublicVenue {
  _id: string;
  name: string;
  description: string;
  venueType: string;
  city: string;
  district: string;
  coverImage: string;
  maxCapacity: number;
  slotDuration: number;
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
