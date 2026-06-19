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
