import type { AddVenueFormValues } from '@/types/venue.types';

export function mapFormToDTO(values: AddVenueFormValues, imageUrls: string[]) {
  const base = {
    name: values.VenueName,
    description: values.VenueDescription,
    address: values.fullAddress,
    ...(values.googleMapsLink ? { googleMapsUrl: values.googleMapsLink } : {}),
    ...(values.coordinates && {
      coordinates: [Number(values.coordinates.lng), Number(values.coordinates.lat)],
    }),

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

    contact: {
      name: values.contact.name,
      phone: values.contact.phone,
      ...(values.contact.email ? { email: values.contact.email } : {}),
    },

    cancellation: {
      policy: values.cancellation.policy,
      ...(values.cancellation.refundType ? { refundType: values.cancellation.refundType } : {}),
      refundRules: (values.cancellation.refundRules ?? [])
        .filter((r) => r.daysBefore !== '' && r.refundPercentage !== '')
        .map((r) => ({
          daysBefore: Number(r.daysBefore),
          refundPercentage: Number(r.refundPercentage),
        })),
    },

    coverImage: imageUrls[0],
    galleryImages: imageUrls.slice(1),
  };

  // Fixed booking
  if (values.bookingType === 'fixedBooking') {
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
  const pricingRules = (values.pricing.pricingRules ?? [])
    .filter((r) => r.fromTime && r.toTime && r.price !== '' && r.price !== undefined)
    .map((r) => ({
      fromTime: r.fromTime,
      toTime: r.toTime,
      price: Number(r.price),
    }));

  const pricingType = values.pricingType;
  const basePrice =
    pricingType === 'fixedPricing'
      ? Number(values.samePrice ?? 0)
      : Number(values.pricing.basePrice ?? 0);

  return {
    ...base,
    workingHours: {
      open: values.workingHours.open,
      close: values.workingHours.close,
    },
    flexibleBooking: {
      slotDuration:
        values.flexibleBooking.slotDuration === '' ||
        values.flexibleBooking.slotDuration === undefined
          ? 60
          : Number(values.flexibleBooking.slotDuration),
      bufferTime:
        values.flexibleBooking.bufferTime === '' || values.flexibleBooking.bufferTime === undefined
          ? 0
          : Number(values.flexibleBooking.bufferTime),
    },
    pricing: {
      pricingType,
      basePrice,
      pricingRules: pricingType === 'timeBasedPricing' ? pricingRules : [],
    },
    blockedTimes: (values.blockedTimes ?? []).filter((b) => b.fromTime && b.toTime),
  };
}
