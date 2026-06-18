import type { AddVenueFormValues } from "../types/venue.types";

export function mapFormToDTO(values: AddVenueFormValues, imageUrls: string[]) {
  // Common fields shared by both booking types
  const base = {
    name: values.VenueName,
    description: values.VenueDescription,
    address: values.fullAddress,
    ...(values.googleMapsLink ? { googleMapsUrl: values.googleMapsLink } : {}),

    venueType: values.venueType,
    district: values.district,
    state: values.state,
    city: values.city,
    pincode: values.pincode,
    spaceAttributes: values.spaceAttributes,
    seatingConfigurations: values.seatingConfigurations,
    ...(values.maxCapacity ? { maxCapacity: Number(values.maxCapacity) } : {}),

    bookingType: values.bookingType,
    workingDays: values.workingDays,
    amenities: values.amenities,

    contactName: values.contactName,
    contactPhone: values.contactPhone,
    cancellationPolicy: values.cancellationPolicy,
    ...(values.refundType ? { refundType: values.refundType } : {}),
    refundRules: (values.refundRules ?? [])
      .filter((r) => r.daysBefore !== "" && r.refundPercentage !== "")
      .map((r) => ({
        daysBefore: Number(r.daysBefore),
        refundPercentage: Number(r.refundPercentage),
      })),

    coverImage: imageUrls[0],
    galleryImages: imageUrls.slice(1),
  };

  // Fixed booking
  if (values.bookingType === "fixedBooking") {
    return {
      ...base,
      fixedPackages: (values.fixedPackages ?? []).map((p) => ({
        slotName: p.slotName,
        startTime: p.startTime,
        endTime: p.endTime,
        price: Number(p.price),
      })),
    };
  }

  // Flexible booking
  const flexBase = {
    ...base,
    pricingType: values.pricingType,
    workingHours: {
      open: values.workingHours.open,
      close: values.workingHours.close,
    },
    slotDuration: values.slotDuration,
    bufferTime: values.bufferTime,
    blockedTimes: (values.blockedTimes ?? []).filter(
      (b) => b.fromTime && b.toTime
    ),
  };

  if (values.pricingType === "fixedPricing") {
    return {
      ...flexBase,
      samePrice: Number(values.samePrice),
    };
  }

  // timeBasedPricing
  return {
    ...flexBase,
    pricingRules: (values.pricingRules ?? [])
      .filter((r) => r.fromTime && r.toTime && r.price)
      .map((r) => ({
        fromTime: r.fromTime,
        toTime: r.toTime,
        price: Number(r.price),
      })),
  };
}
