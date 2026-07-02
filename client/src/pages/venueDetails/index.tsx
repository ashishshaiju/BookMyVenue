import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { FiMapPin, FiUsers } from 'react-icons/fi';
import { MdOutlineMeetingRoom } from 'react-icons/md';
import { GiTable } from 'react-icons/gi';
import {
  TbBuildingEstate,
  TbBuildingOff,
  TbReceiptRefund,
  TbShieldCheck,
  TbShieldOff,
} from 'react-icons/tb';
import map from '@/assets/map.jpg';
import { useApiQuery, useApiMutation } from '@/hooks/useApi';
import { API_ENDPOINTS } from '@/constants';
import type { VenueDetail } from '@/types/venue.types';
import type { Slot } from '@/types/booking.types';
import { Skeleton } from '@/components/ui/skeleton';
import { parseTimeToMinutes } from '@/utils/timeUtils';
import { showError, showInfo } from '@/utils/toast';
import type { AxiosError } from 'axios';

const VenueDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // 1. Unified array state for both Fixed (single) and Flexible (multi) selections
  const [selectedSlots, setSelectedSlots] = useState<Slot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');

  const {
    data: venue,
    isLoading,
    isError,
    refetch,
  } = useApiQuery<VenueDetail>(
    ['venue', id || ''],
    {
      url: API_ENDPOINTS.VENUE_BY_ID(id as string),
      method: 'GET',
    },
    {
      enabled: !!id,
    }
  );

  const { data: availabilityResponse, isLoading: isSlotsLoading } = useApiQuery<{
    venueId: string;
    date: string;
    bookingType: string;
    slots: {
      slotId: string;
      startTime: string;
      endTime: string;
      price: number;
      isAvailable: boolean;
      reason: string | null;
    }[];
  }>(
    ['availability', id || '', selectedDate],
    {
      url: API_ENDPOINTS.GET_AVAILABILITY(id as string),
      method: 'GET',
      params: { date: selectedDate },
    },
    {
      enabled: !!id && !!selectedDate,
    }
  );

  const allSlots = availabilityResponse?.slots || [];

  // 2. Computed values for multi-selection
  const totalPrice = selectedSlots.reduce((sum, slot) => sum + slot.price, 0);
  const sortedSelection = [...selectedSlots].sort(
    (a, b) =>
      allSlots.findIndex((s) => s.slotId === a.slotId) -
      allSlots.findIndex((s) => s.slotId === b.slotId)
  );

  const finalStartTime = sortedSelection.length > 0 ? sortedSelection[0].startTime : null;
  const finalEndTime =
    sortedSelection.length > 0 ? sortedSelection[sortedSelection.length - 1].endTime : null;

  // 3. Array-Index Based Slot Selection
  const handleSlotSelect = (slot: Slot) => {
    if (venue?.bookingType === 'fixedBooking') {
      setSelectedSlots((prev) => (prev[0]?.slotId === slot.slotId ? [] : [slot]));
      return;
    }

    const clickedIdx = allSlots.findIndex((s) => s.slotId === slot.slotId);

    setSelectedSlots((prev) => {
      const isSelected = prev.some((s) => s.slotId === slot.slotId);

      const sortedPrev = [...prev].sort(
        (a, b) =>
          allSlots.findIndex((s) => s.slotId === a.slotId) -
          allSlots.findIndex((s) => s.slotId === b.slotId)
      );

      if (isSelected) {
        if (sortedPrev.length === 1) return [];

        const selIdx = sortedPrev.findIndex((s) => s.slotId === slot.slotId);

        // Smart deselect: shrink from the ends, or truncate if middle clicked
        if (selIdx === 0) {
          return sortedPrev.slice(1);
        } else if (selIdx === sortedPrev.length - 1) {
          return sortedPrev.slice(0, -1);
        } else {
          return sortedPrev.slice(0, selIdx);
        }
      }

      if (sortedPrev.length === 0) return [slot];

      const firstIdx = allSlots.findIndex((s) => s.slotId === sortedPrev[0].slotId);
      const lastIdx = allSlots.findIndex(
        (s) => s.slotId === sortedPrev[sortedPrev.length - 1].slotId
      );

      // Determine the proposed range spanning the existing selection and the newly clicked slot
      const startRange = Math.min(firstIdx, clickedIdx);
      const endRange = Math.max(lastIdx, clickedIdx);

      // Extract the slots within this range
      const rangeSlots = allSlots.slice(startRange, endRange + 1);

      // Verify that EVERY slot in the proposed range is available
      const isRangeAvailable = rangeSlots.every((s) => s.isAvailable);

      if (isRangeAvailable) {
        return rangeSlots;
      } else {
        // Range spans over an unavailable slot, so we reset the selection to just the clicked slot
        setTimeout(
          () =>
            showInfo(
              'Cannot select a range containing unavailable slots. Started a new selection.'
            ),
          0
        );
        return [slot];
      }
    });
  };

  const { mutate: blockSlot, isPending: isBlocking } = useApiMutation(
    {
      url: API_ENDPOINTS.BLOCK_SLOT(id as string),
      method: 'POST',
    },
    {
      onSuccess: (data) => {
        navigate('/booking/summary', {
          state: {
            lockData: data,
            venueName: venue?.name,
            date: selectedDate,
            slotTime: finalStartTime ? `${finalStartTime} - ${finalEndTime}` : '',
            slotPrice: totalPrice,
          },
        });
      },
      onError: (error: AxiosError<{ message: string }> | Error) => {
        const errorMessage =
          (error as AxiosError<{ message: string }>).response?.data?.message ||
          'Failed to secure slots. Someone may have just booked one.';
        showError(errorMessage);
        setSelectedSlots([]);
        refetch(); // Refresh to immediately show the newly blocked slot
      },
    }
  );

  const handleProceedToBook = () => {
    if (!selectedDate) {
      showError('Please select a date first');
      return;
    }
    if (selectedSlots.length === 0 || !finalStartTime || !finalEndTime) {
      showError('Please select at least one time slot');
      return;
    }

    blockSlot({
      date: selectedDate,
      startTime: parseTimeToMinutes(finalStartTime),
      endTime: parseTimeToMinutes(finalEndTime),
      expectedPrice: totalPrice,
    });
  };

  if (isLoading) {
    return (
      <section className="max-w-8xl mx-auto mt-24 px-4 pb-12 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
          <div className="lg:col-span-8">
            <div className="mb-6">
              <Skeleton className="h-10 w-3/4 mb-4 rounded-xl" />
              <Skeleton className="h-6 w-1/2 rounded-lg" />
            </div>
            <Skeleton className="w-full h-[400px] rounded-3xl mb-10" />
            <Skeleton className="w-full h-40 rounded-3xl mb-8" />
            <Skeleton className="w-full h-64 rounded-3xl" />
          </div>
          <div className="lg:col-span-4">
            <Skeleton className="w-full h-[500px] rounded-3xl sticky top-28" />
          </div>
        </div>
      </section>
    );
  }

  if (isError || !venue) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <div className="bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-3xl p-10 max-w-md w-full text-center shadow-lg">
          <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <TbBuildingOff size={40} />
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-3">Venue Not Found</h2>
          <p className="text-[var(--text-secondary)] mb-8">
            The venue you're looking for doesn't exist or may have been removed.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => refetch()}
              className="px-6 py-3 rounded-xl border border-[var(--bg-grey)] font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-grey)] transition cursor-pointer"
            >
              ↺ Try Again
            </button>
            <Link
              to="/explore"
              className="px-6 py-3 rounded-xl bg-[var(--bg-green)] font-semibold text-white hover:bg-green-600 transition"
            >
              ← Go to Explore
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const images = venue.coverImage ? [venue.coverImage, ...(venue.galleryImages || [])] : [];
  const amenities = venue.amenities || [];

  const bookingTypeLabel =
    venue.bookingType === 'fixedBooking' ? 'Fixed Package' : 'Flexible Booking';

  return (
    <section className="max-w-8xl mx-auto mt-24 px-4 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
        <div className="lg:col-span-8">
          <div className="w-full z-10 font-sans">
            <div className="mb-6">
              <h1 className="text-4xl font-extrabold text-[var(--text-primary)] mb-2 capitalize">
                {venue.name}
              </h1>
              <p className="text-lg text-[var(--text-secondary)] flex items-center gap-2">
                <FiMapPin className="text-[var(--bg-green)] shrink-0" />
                {venue.city}, {venue.district}
              </p>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-4 grid-rows-3 gap-3 h-[400px] mb-10">
                <div className="col-span-4 sm:col-span-3 row-span-3">
                  <img
                    src={images[0]}
                    alt={`${venue.name} main`}
                    className="w-full h-full object-cover rounded-3xl shadow-sm"
                  />
                </div>
                {images.length > 1 && (
                  <div className="hidden sm:block">
                    <img
                      src={images[1]}
                      alt={`${venue.name} view 1`}
                      className="w-full h-full object-cover rounded-2xl shadow-sm"
                    />
                  </div>
                )}
                {images.length > 2 && (
                  <div className="hidden sm:block">
                    <img
                      src={images[2]}
                      alt={`${venue.name} view 2`}
                      className="w-full h-full object-cover rounded-2xl shadow-sm"
                    />
                  </div>
                )}
                {images.length > 3 && (
                  <button className="hidden sm:block relative cursor-pointer group overflow-hidden rounded-2xl shadow-sm">
                    <img
                      src={images[3]}
                      alt={`${venue.name} view 3`}
                      className="w-full h-full object-cover rounded-2xl brightness-50 group-hover:scale-110 transition duration-300"
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-white text-2xl font-bold bg-black/40">
                      + {images.length - 3}
                    </div>
                  </button>
                )}
              </div>
            )}

            <div className="bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-3xl p-8 mb-8 shadow-sm">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">About Venue</h2>
              <p className="text-[var(--text-secondary)] leading-8 text-lg whitespace-pre-wrap">
                {venue.description}
              </p>
            </div>

            {amenities.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Amenities</h2>
                <div className="flex flex-wrap gap-3">
                  {amenities.slice(0, 8).map((item, index) => (
                    <div
                      key={index}
                      className="px-5 py-2.5 rounded-full bg-[var(--bg-grey)] text-[var(--bg-green)] font-medium shadow-sm"
                    >
                      {item}
                    </div>
                  ))}
                  {amenities.length > 8 && (
                    <button className="px-5 py-2.5 rounded-full bg-[var(--bg-green)] text-white font-medium cursor-pointer shadow-sm hover:bg-green-600 transition">
                      +{amenities.length - 8} More
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-5">Venue Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-3xl p-5 shadow-sm hover:shadow-md transition">
                  <div className="flex items-center gap-4">
                    <div className="bg-[var(--bg-grey)] p-3.5 rounded-2xl">
                      <MdOutlineMeetingRoom className="text-[var(--bg-green)] text-2xl" />
                    </div>
                    <div>
                      <p className="text-sm text-[var(--text-secondary)]">Venue Type</p>
                      <h3 className="font-semibold text-[var(--text-primary)] text-lg capitalize">
                        {venue.venueType}
                      </h3>
                    </div>
                  </div>
                </div>

                {venue.maxCapacity && (
                  <div className="bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-3xl p-5 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center gap-4">
                      <div className="bg-[var(--bg-grey)] p-3.5 rounded-2xl">
                        <FiUsers className="text-[var(--bg-green)] text-2xl" />
                      </div>
                      <div>
                        <p className="text-sm text-[var(--text-secondary)]">Capacity</p>
                        <h3 className="font-semibold text-[var(--text-primary)] text-lg">
                          Up to {venue.maxCapacity} Guests
                        </h3>
                      </div>
                    </div>
                  </div>
                )}

                {venue.spaceAttributes?.length > 0 && (
                  <div className="bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-3xl p-5 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center gap-4">
                      <div className="bg-[var(--bg-grey)] p-3.5 rounded-2xl">
                        <TbBuildingEstate className="text-[var(--bg-green)] text-2xl" />
                      </div>
                      <div>
                        <p className="text-sm text-[var(--text-secondary)]">Space Type</p>
                        <h3 className="font-semibold text-[var(--text-primary)] text-lg">
                          {venue.spaceAttributes.join(', ')}
                        </h3>
                      </div>
                    </div>
                  </div>
                )}

                {venue.seatingConfigurations?.length > 0 && (
                  <div className="bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-3xl p-5 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center gap-4">
                      <div className="bg-[var(--bg-grey)] p-3.5 rounded-2xl">
                        <GiTable className="text-[var(--bg-green)] text-2xl" />
                      </div>
                      <div>
                        <p className="text-sm text-[var(--text-secondary)]">Seating</p>
                        <h3 className="font-semibold text-[var(--text-primary)] text-lg">
                          {venue.seatingConfigurations.join(', ')}
                        </h3>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-3xl p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-[var(--bg-grey)] p-3.5 rounded-2xl">
                  <FiMapPin className="text-[var(--bg-green)] text-2xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)]">Location</h2>
                  <p className="text-[var(--text-secondary)] mt-1">
                    {venue.city}, {venue.district}
                  </p>
                </div>
              </div>
              <p className="text-[var(--text-primary)] text-lg mb-6 leading-relaxed">
                {venue.address}, {venue.pincode}
              </p>
              {venue.googleMapsUrl && (
                <a
                  href={venue.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block relative rounded-3xl overflow-hidden border border-[var(--bg-grey)] h-[250px] group shadow-inner"
                >
                  <img
                    src={map}
                    alt="map"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-[var(--bg-green)] px-6 py-3 rounded-2xl font-semibold text-white shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all">
                      Open in Google Maps
                    </div>
                  </div>
                </a>
              )}
            </div>

            {/* Cancellation & Refund Policy */}
            <div className="bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-3xl p-8 shadow-sm mt-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-[var(--bg-grey)] p-3.5 rounded-2xl">
                  <TbReceiptRefund className="text-[var(--bg-green)] text-2xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                    Cancellation & Refund Policy
                  </h2>
                  <p className="text-[var(--text-secondary)] mt-1">
                    Please review the refund terms for this venue
                  </p>
                </div>
              </div>

              {venue.cancellation?.policy === 'nonRefundable' && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl p-5 flex items-start gap-4">
                  <div className="bg-red-100 dark:bg-red-900/50 p-2 rounded-xl text-red-600 dark:text-red-400 shrink-0">
                    <TbShieldOff size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-red-800 dark:text-red-400 text-lg mb-1">
                      Non-Refundable Policy
                    </h3>
                    <p className="text-red-700 dark:text-red-300 leading-relaxed">
                      This venue operates under a strict non-refundable policy. Cancelled bookings
                      are not eligible for any refund.
                    </p>
                  </div>
                </div>
              )}

              {venue.cancellation?.policy === 'refundable' &&
                venue.cancellation?.refundType === 'fullRefund' && (
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 rounded-2xl p-5 flex items-start gap-4">
                    <div className="bg-green-100 dark:bg-green-900/50 p-2 rounded-xl text-green-600 dark:text-green-400 shrink-0">
                      <TbShieldCheck size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-green-800 dark:text-green-400 text-lg mb-1">
                        Full Refund Policy
                      </h3>
                      <p className="text-green-700 dark:text-green-300 leading-relaxed">
                        Bookings cancelled prior to the event are eligible for a 100% full refund of
                        the booking amount.
                      </p>
                    </div>
                  </div>
                )}

              {venue.cancellation?.policy === 'refundable' &&
                venue.cancellation?.refundType === 'timeBasedRefund' && (
                  <div>
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 rounded-2xl p-5 flex items-start gap-4 mb-6">
                      <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-xl text-blue-600 dark:text-blue-400 shrink-0">
                        <TbShieldCheck size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-blue-800 dark:text-blue-400 text-lg mb-1">
                          Time-based Refund Policy
                        </h3>
                        <p className="text-blue-700 dark:text-blue-300 leading-relaxed">
                          Refunds are calculated dynamically based on the number of days remaining
                          until the scheduled event start date.
                        </p>
                      </div>
                    </div>

                    {venue.cancellation.refundRules && venue.cancellation.refundRules.length > 0 ? (
                      <div className="overflow-hidden border border-[var(--bg-grey)] rounded-2xl">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-[var(--bg-grey)] text-[var(--text-primary)]">
                              <th className="py-4 px-6 font-semibold border-b border-[var(--bg-grey)] text-base">
                                Timeline
                              </th>
                              <th className="py-4 px-6 font-semibold border-b border-[var(--bg-grey)] text-base text-right">
                                Refund Percentage
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...venue.cancellation.refundRules]
                              .sort((a, b) => b.daysBefore - a.daysBefore)
                              .map((rule, idx) => (
                                <tr
                                  key={idx}
                                  className="hover:bg-[var(--bg-grey)]/20 transition-colors border-b border-[var(--bg-grey)] last:border-b-0"
                                >
                                  <td className="py-4 px-6 text-[var(--text-primary)] font-medium text-base">
                                    {rule.daysBefore} or more days before event
                                  </td>
                                  <td className="py-4 px-6 text-right font-bold text-base text-[var(--bg-green)]">
                                    {rule.refundPercentage}%
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-[var(--text-secondary)] italic">
                        No refund rules configured.
                      </p>
                    )}
                  </div>
                )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="sticky top-28 bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-3xl p-6 shadow-md">
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Book Venue</h2>
            <p className="text-[var(--text-secondary)] text-sm mt-1">Check availability and book</p>

            {/* Date Input - Clears selection on date change */}
            <div className="mt-6">
              <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlots([]);
                }}
                className="w-full border border-[var(--bg-grey)] rounded-2xl px-4 py-3.5 outline-none focus:border-[var(--bg-green)] focus:ring-1 focus:ring-[var(--bg-green)] transition-all bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
              />
            </div>

            <div className="mt-8">
              <div className="flex justify-between items-end mb-4">
                <h3 className="font-semibold text-[var(--text-primary)] text-lg">
                  Available Slots
                </h3>
                <span className="text-xs px-2.5 py-1 bg-[var(--bg-grey)] text-[var(--bg-green)] rounded-full font-medium">
                  {bookingTypeLabel}
                </span>
              </div>

              {isSlotsLoading ? (
                <div className="text-center py-8">
                  <p className="text-[var(--text-secondary)] animate-pulse">
                    Calculating availability...
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {!availabilityResponse?.slots || availabilityResponse.slots.length === 0 ? (
                    <div className="text-center py-8 text-[var(--text-secondary)]">
                      {selectedDate
                        ? 'No slots available for the selected date.'
                        : 'Select a date to see available time slots.'}
                    </div>
                  ) : (
                    availabilityResponse.slots.map((slot) => {
                      const isSelected = selectedSlots.some((s) => s.slotId === slot.slotId);
                      return (
                        <button
                          key={slot.slotId}
                          disabled={!slot.isAvailable}
                          onClick={() => handleSlotSelect(slot)}
                          className={`w-full text-left border rounded-2xl p-4 transition-all hover:shadow-md
                            ${!slot.isAvailable ? 'opacity-50 cursor-not-allowed bg-[var(--bg-grey)] border-[var(--bg-grey)]' : 'cursor-pointer'}
                            ${
                              isSelected && slot.isAvailable
                                ? 'border-[var(--bg-green)] bg-[#e6f4ea] dark:bg-[var(--bg-green)]/10 ring-1 ring-[var(--bg-green)]'
                                : slot.isAvailable
                                  ? 'border-[var(--bg-grey)] hover:border-gray-300'
                                  : ''
                            }
                          `}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-semibold text-[var(--text-primary)]">
                                {slot.startTime} - {slot.endTime}
                                {!slot.isAvailable && (
                                  <span className="text-red-500 text-xs ml-2">(Unavailable)</span>
                                )}
                              </h4>
                            </div>
                            <div className="text-right">
                              <span
                                className={`font-bold text-lg ${!slot.isAvailable ? 'text-[var(--text-secondary)]' : 'text-[var(--bg-green)]'}`}
                              >
                                ₹{slot.price}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--bg-grey)] flex justify-between items-center">
              <div>
                <span className="text-[var(--text-secondary)] font-medium block">Total Amount</span>
                {selectedSlots.length > 0 && (
                  <span className="text-xs text-[var(--bg-green)] font-semibold mt-1 block">
                    {selectedSlots.length} {selectedSlots.length === 1 ? 'slot' : 'slots'} (
                    {finalStartTime} - {finalEndTime})
                  </span>
                )}
              </div>
              <span className="font-bold text-2xl text-[var(--text-primary)]">₹{totalPrice}</span>
            </div>

            <button
              onClick={handleProceedToBook}
              disabled={isBlocking || selectedSlots.length === 0}
              className={`w-full mt-6 py-4 rounded-2xl font-bold text-lg transition-all shadow-md flex items-center justify-center
                ${
                  selectedSlots.length > 0
                    ? 'bg-[var(--bg-green)] text-white hover:bg-green-600 hover:shadow-lg transform hover:-translate-y-0.5 cursor-pointer'
                    : 'bg-[var(--bg-grey)] text-[var(--text-secondary)] cursor-not-allowed'
                }
              `}
            >
              {isBlocking ? 'Locking Slot...' : 'Proceed to Book'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VenueDetails;
