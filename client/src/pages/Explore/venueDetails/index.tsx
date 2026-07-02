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
import { Calendar } from '@/components/ui/calendar';
import { parseTimeToMinutes, toLocalDateString } from '@/utils/timeUtils';
import { showError, showInfo } from '@/utils/toast';
import type { AxiosError } from 'axios';

const VenueDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [selectedSlots, setSelectedSlots] = useState<Slot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [calendarVisible, setCalendarVisible] = useState<boolean>(true);

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

  const { data: bookableDatesData, isLoading: isCalendarLoading } = useApiQuery<{
    bookableDates: string[];
    disabledDates: string[];
    maxDate: string;
  }>(
    ['bookableDates', id || ''],
    {
      url: API_ENDPOINTS.GET_AVAILABILITY(id as string),
      method: 'GET',
    },
    {
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    }
  );

  const { data: availabilityResponse, isLoading: isSlotsLoading } = useApiQuery<{
    venueId: string;
    date: string;
    bookingType: string;
    slots: {
      slotId: string;
      name: string | null;
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
      staleTime: 0,
      refetchOnMount: 'always',
    }
  );

  const allSlots = availabilityResponse?.slots || [];
  const totalPrice = selectedSlots.reduce((sum, slot) => sum + slot.price, 0);
  const sortedSelection = [...selectedSlots].sort(
    (a, b) =>
      allSlots.findIndex((s) => s.slotId === a.slotId) -
      allSlots.findIndex((s) => s.slotId === b.slotId)
  );

  const finalStartTime = sortedSelection.length > 0 ? sortedSelection[0].startTime : null;
  const finalEndTime =
    sortedSelection.length > 0 ? sortedSelection[sortedSelection.length - 1].endTime : null;

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

      const startRange = Math.min(firstIdx, clickedIdx);
      const endRange = Math.max(lastIdx, clickedIdx);

      const rangeSlots = allSlots.slice(startRange, endRange + 1);

      const isRangeAvailable = rangeSlots.every((s) => s.isAvailable);

      if (isRangeAvailable) {
        return rangeSlots;
      } else {
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
        refetch();
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
      selectedSlots: sortedSelection.map((slot) => ({
        startTime: parseTimeToMinutes(slot.startTime),
        endTime: parseTimeToMinutes(slot.endTime),
      })),
      expectedPrice: totalPrice,
    });
  };

  if (isLoading) {
    return (
      <section className="max-w-8xl mx-auto mt-24 px-16 pb-12 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
          <div className="lg:col-span-9">
            <div className="mb-6">
              <Skeleton className="h-10 w-3/4 mb-4 rounded-xl" />
              <Skeleton className="h-6 w-1/2 rounded-lg" />
            </div>
            <Skeleton className="w-full h-[440px] rounded-3xl mb-10" />
            <Skeleton className="w-full h-40 rounded-3xl mb-8" />
            <Skeleton className="w-full h-64 rounded-3xl" />
          </div>
          <div className="lg:col-span-3">
            <Skeleton className="w-full h-[500px] rounded-3xl sticky top-48" />
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
    <section className="max-w-8xl mx-auto mt-24 px-16 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
        <div className="lg:col-span-9">
          <div className="w-full pr-6 z-10 font-sans">
            <div className="mb-6">
              {/* Breadcrumbs */}
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-3">
                <Link to="/explore" className="hover:text-[var(--bg-green)] transition">
                  Explore
                </Link>
                <span>/</span>
                <span className="capitalize">{venue.city.toLowerCase()}</span>
                <span>/</span>
                <span className="text-[var(--text-primary)] font-medium capitalize">
                  {venue.name.toLowerCase()}
                </span>
              </div>
              <h1 className="text-4xl font-extrabold text-[var(--text-primary)] mb-2 capitalize leading-tight">
                {venue.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-[var(--text-secondary)] mt-3">
                <p className="text-base flex items-center gap-1.5 font-medium">
                  <FiMapPin className="text-[var(--bg-green)] shrink-0 text-lg" />
                  {venue.city}, {venue.district}
                </p>
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--bg-grey)] hidden sm:block"></div>
                <span className="px-3 py-1 bg-emerald-500/10 dark:bg-emerald-500/5 text-[var(--bg-green)] border border-emerald-500/15 text-xs font-semibold rounded-full capitalize">
                  {venue.venueType}
                </span>
              </div>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-4 grid-rows-3 gap-4 h-[440px] mb-12">
                <div className="col-span-4 sm:col-span-3 row-span-3 overflow-hidden rounded-3xl border border-[var(--bg-grey)]/65 shadow-md">
                  <img
                    src={images[0]}
                    alt={`${venue.name} main`}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.03] cursor-pointer"
                  />
                </div>
                {images.length > 1 && (
                  <div className="hidden sm:block overflow-hidden rounded-2xl border border-[var(--bg-grey)]/65 shadow-sm">
                    <img
                      src={images[1]}
                      alt={`${venue.name} view 1`}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.05] cursor-pointer"
                    />
                  </div>
                )}
                {images.length > 2 && (
                  <div className="hidden sm:block overflow-hidden rounded-2xl border border-[var(--bg-grey)]/65 shadow-sm">
                    <img
                      src={images[2]}
                      alt={`${venue.name} view 2`}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.05] cursor-pointer"
                    />
                  </div>
                )}
                {images.length > 3 && (
                  <button className="hidden sm:block relative cursor-pointer overflow-hidden rounded-2xl border border-[var(--bg-grey)]/65 shadow-sm group">
                    <img
                      src={images[3]}
                      alt={`${venue.name} view 3`}
                      className="w-full h-full object-cover brightness-50 group-hover:scale-110 transition duration-500"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/40 transition duration-300 group-hover:bg-black/50">
                      <span className="text-2xl font-black">+ {images.length - 3}</span>
                      <span className="text-[10px] tracking-wider uppercase font-semibold mt-1">
                        Photos
                      </span>
                    </div>
                  </button>
                )}
              </div>
            )}

            <div className="bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-3xl p-8 mb-10 shadow-sm hover:shadow-md transition-all duration-300">
              <h2 className="text-2xl font-black text-[var(--text-primary)] mb-5 flex items-center gap-2">
                <span>About Venue</span>
                <span className="w-8 h-[2px] bg-emerald-500"></span>
              </h2>
              <p className="text-[var(--text-secondary)] leading-8 text-lg whitespace-pre-wrap">
                {venue.description}
              </p>
            </div>

            {amenities.length > 0 && (
              <div className="mb-10">
                <h2 className="text-2xl font-black text-[var(--text-primary)] mb-5 flex items-center gap-2">
                  <span>Amenities</span>
                  <span className="w-8 h-[2px] bg-emerald-500"></span>
                </h2>
                <div className="flex flex-wrap gap-3">
                  {amenities.slice(0, 8).map((item, index) => (
                    <div
                      key={index}
                      className="px-5 py-3 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 text-[var(--bg-green)] border border-emerald-500/15 font-semibold text-sm shadow-sm hover:scale-[1.03] hover:bg-emerald-500/10 transition duration-200"
                    >
                      {item}
                    </div>
                  ))}
                  {amenities.length > 8 && (
                    <button className="px-5 py-3 rounded-2xl bg-[var(--bg-green)] text-white font-semibold text-sm cursor-pointer shadow-md hover:bg-green-600 transition hover:scale-[1.03] active:scale-95">
                      +{amenities.length - 8} More
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="mb-10">
              <h2 className="text-2xl font-black text-[var(--text-primary)] mb-6 flex items-center gap-2">
                <span>Venue Details</span>
                <span className="w-8 h-[2px] bg-emerald-500"></span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-emerald-500/20 transition-all duration-300 group">
                  <div className="flex items-center gap-4">
                    <div className="bg-emerald-500/10 dark:bg-emerald-500/5 p-3.5 rounded-2xl group-hover:scale-110 transition duration-300">
                      <MdOutlineMeetingRoom className="text-[var(--bg-green)] text-2xl" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
                        Venue Type
                      </p>
                      <h3 className="font-bold text-[var(--text-primary)] text-lg capitalize mt-0.5">
                        {venue.venueType}
                      </h3>
                    </div>
                  </div>
                </div>

                {venue.maxCapacity && (
                  <div className="bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-emerald-500/20 transition-all duration-300 group">
                    <div className="flex items-center gap-4">
                      <div className="bg-emerald-500/10 dark:bg-emerald-500/5 p-3.5 rounded-2xl group-hover:scale-110 transition duration-300">
                        <FiUsers className="text-[var(--bg-green)] text-2xl" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
                          Capacity
                        </p>
                        <h3 className="font-bold text-[var(--text-primary)] text-lg mt-0.5">
                          Up to {venue.maxCapacity} Guests
                        </h3>
                      </div>
                    </div>
                  </div>
                )}

                {venue.spaceAttributes && venue.spaceAttributes.length > 0 && (
                  <div className="bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-emerald-500/20 transition-all duration-300 group">
                    <div className="flex items-center gap-4">
                      <div className="bg-emerald-500/10 dark:bg-emerald-500/5 p-3.5 rounded-2xl group-hover:scale-110 transition duration-300">
                        <TbBuildingEstate className="text-[var(--bg-green)] text-2xl" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
                          Space Type
                        </p>
                        <h3 className="font-bold text-[var(--text-primary)] text-lg mt-0.5">
                          {venue.spaceAttributes.join(', ')}
                        </h3>
                      </div>
                    </div>
                  </div>
                )}

                {venue.seatingConfigurations && venue.seatingConfigurations.length > 0 && (
                  <div className="bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-emerald-500/20 transition-all duration-300 group">
                    <div className="flex items-center gap-4">
                      <div className="bg-emerald-500/10 dark:bg-emerald-500/5 p-3.5 rounded-2xl group-hover:scale-110 transition duration-300">
                        <GiTable className="text-[var(--bg-green)] text-2xl" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
                          Seating
                        </p>
                        <h3 className="font-bold text-[var(--text-primary)] text-lg mt-0.5">
                          {venue.seatingConfigurations.join(', ')}
                        </h3>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-3xl p-8 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-emerald-500/10 dark:bg-emerald-500/5 p-3.5 rounded-2xl">
                  <FiMapPin className="text-[var(--bg-green)] text-2xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)]">Location</h2>
                  <p className="text-[var(--text-secondary)] mt-1 font-medium">
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
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px]">
                    <div className="bg-[var(--bg-green)] px-6 py-3 rounded-2xl font-semibold text-white shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                      Open in Google Maps
                    </div>
                  </div>
                </a>
              )}
            </div>

            {/* Cancellation & Refund Policy */}
            <div className="bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-3xl p-8 shadow-sm hover:shadow-md transition-all duration-300 mt-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-emerald-500/10 dark:bg-emerald-500/5 p-3.5 rounded-2xl">
                  <TbReceiptRefund className="text-[var(--bg-green)] text-2xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                    Cancellation & Refund Policy
                  </h2>
                  <p className="text-[var(--text-secondary)] mt-1 font-medium">
                    Please review the refund terms for this venue
                  </p>
                </div>
              </div>

              {venue.cancellation?.policy === 'nonRefundable' && (
                <div className="bg-red-500/5 dark:bg-red-950/10 border border-red-500/15 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
                  <div className="bg-red-500/10 p-2.5 rounded-xl text-red-600 dark:text-red-400 shrink-0">
                    <TbShieldOff size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-red-800 dark:text-red-400 text-lg mb-1">
                      Non-Refundable Policy
                    </h3>
                    <p className="text-red-700/80 dark:text-red-300/80 leading-relaxed text-sm">
                      This venue operates under a strict non-refundable policy. Cancelled bookings
                      are not eligible for any refund.
                    </p>
                  </div>
                </div>
              )}

              {venue.cancellation?.policy === 'refundable' &&
                venue.cancellation?.refundType === 'fullRefund' && (
                  <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/15 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
                    <div className="bg-emerald-500/10 p-2.5 rounded-xl text-[var(--bg-green)] shrink-0">
                      <TbShieldCheck size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-emerald-800 dark:text-emerald-400 text-lg mb-1">
                        Full Refund Policy
                      </h3>
                      <p className="text-emerald-700/80 dark:text-emerald-300/80 leading-relaxed text-sm">
                        Bookings cancelled prior to the event are eligible for a 100% full refund of
                        the booking amount.
                      </p>
                    </div>
                  </div>
                )}

              {venue.cancellation?.policy === 'refundable' &&
                venue.cancellation?.refundType === 'timeBasedRefund' && (
                  <div>
                    <div className="bg-blue-500/5 dark:bg-blue-950/10 border border-blue-500/15 rounded-2xl p-5 flex items-start gap-4 mb-6 shadow-sm">
                      <div className="bg-blue-500/10 p-2.5 rounded-xl text-blue-600 dark:text-blue-400 shrink-0">
                        <TbShieldCheck size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-blue-800 dark:text-blue-400 text-lg mb-1">
                          Time-based Refund Policy
                        </h3>
                        <p className="text-blue-700/80 dark:text-blue-300/80 leading-relaxed text-sm">
                          Refunds are calculated dynamically based on the number of days remaining
                          until the scheduled event start date.
                        </p>
                      </div>
                    </div>

                    {venue.cancellation.refundRules && venue.cancellation.refundRules.length > 0 ? (
                      <div className="overflow-hidden border border-[var(--bg-grey)]/80 rounded-2xl shadow-sm">
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

        <div className="lg:col-span-3">
          <div className="sticky top-48 bg-[var(--bg-tertiary)] border border-[var(--bg-grey)]/85 backdrop-blur-md rounded-3xl p-6 shadow-xl relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400/10 to-teal-500/10"></div>

            <h2 className="text-2xl font-extrabold text-[var(--text-primary)] leading-tight">
              Book Venue
            </h2>
            <p className="text-[var(--text-secondary)] text-xs mt-1.5 font-medium">
              Select a date and secure your spot
            </p>

            {/* Calendar & Date Selection */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Select Date
                </label>
                {!calendarVisible && selectedDate && (
                  <button
                    onClick={() => setCalendarVisible(true)}
                    className="text-[10px] px-2 py-0.5 bg-[var(--bg-grey)]/50 hover:bg-[var(--bg-grey)] text-[var(--text-primary)] rounded-full font-bold transition-colors cursor-pointer"
                  >
                    Change Date
                  </button>
                )}
              </div>

              {/* Collapsible Calendar wrapper */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  calendarVisible ? 'opacity-100 max-h-[400px]' : 'opacity-0 max-h-0'
                }`}
              >
                {isCalendarLoading ? (
                  <div className="flex justify-center items-center h-[320px] bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-2xl">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                  </div>
                ) : (
                  <div className="bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-2xl p-2 flex justify-center shadow-inner">
                    <Calendar
                      mode="single"
                      selected={selectedDate ? new Date(selectedDate + 'T00:00:00') : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const formatted = toLocalDateString(date);
                          setSelectedDate(formatted);
                          setSelectedSlots([]);
                          setCalendarVisible(false);
                        }
                      }}
                      disabled={(date) => {
                        if (!bookableDatesData) return true;
                        
                        const dateStr = toLocalDateString(date);
                        if (bookableDatesData.disabledDates.includes(dateStr)) {
                          return true;
                        }

                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const tomorrow = new Date(today);
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        const maxDate = new Date(today);
                        maxDate.setDate(maxDate.getDate() + 90);
                        return date < tomorrow || date > maxDate;
                      }}
                      startMonth={new Date()}
                      endMonth={
                        bookableDatesData?.maxDate
                          ? new Date(bookableDatesData.maxDate + 'T00:00:00')
                          : undefined
                      }
                      className="rounded-xl w-full flex justify-center"
                    />
                  </div>
                )}
              </div>

              {/* Selected Date Pill */}
              {!calendarVisible && selectedDate && (
                <div className="w-full border border-[var(--bg-green)]/30 bg-emerald-500/5 rounded-2xl px-4 py-3 flex items-center justify-between mt-2 shadow-sm">
                  <span className="text-[var(--text-secondary)] text-sm font-semibold">
                    Date:
                  </span>
                  <span className="text-[var(--text-primary)] text-sm font-bold">
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-[var(--text-primary)] text-sm uppercase tracking-wider">
                  Available Slots
                </h3>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 dark:bg-emerald-500/5 text-[var(--bg-green)] border border-emerald-500/15 rounded-full font-bold">
                  {bookingTypeLabel}
                </span>
              </div>

              {isSlotsLoading ? (
                <div className="mt-8 flex flex-col items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                  <p className="text-xs text-[var(--text-secondary)] font-medium animate-pulse">
                    Calculating availability...
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5 max-h-[350px] overflow-y-auto pr-1.5 custom-scrollbar">
                  {!availabilityResponse?.slots || availabilityResponse.slots.length === 0 ? (
                    <div className="text-center py-10 text-xs font-semibold text-[var(--text-secondary)] bg-[var(--bg-grey)]/20 rounded-2xl border border-dashed border-[var(--bg-grey)] px-4">
                      {selectedDate
                        ? 'No slots available for the selected date.'
                        : 'Please pick a date to check slots availability.'}
                    </div>
                  ) : (
                    availabilityResponse.slots.map((slot) => {
                      const isSelected = selectedSlots.some((s) => s.slotId === slot.slotId);
                      return (
                        <button
                          key={slot.slotId}
                          disabled={!slot.isAvailable}
                          onClick={() => handleSlotSelect(slot)}
                          className={`w-full text-left border rounded-2xl p-4 transition-all duration-200 active:scale-[0.98]
                            ${!slot.isAvailable ? 'opacity-40 cursor-not-allowed bg-[var(--bg-grey)]/50 border-[var(--bg-grey)]' : 'cursor-pointer'}
                            ${
                              isSelected && slot.isAvailable
                                ? 'border-[var(--bg-green)] bg-gradient-to-br from-emerald-500/10 to-teal-500/10 ring-1 ring-[var(--bg-green)]'
                                : slot.isAvailable
                                  ? 'border-[var(--bg-grey)] hover:border-gray-300 hover:bg-[var(--bg-grey)]/10 dark:hover:bg-[var(--bg-grey)]/5'
                                  : ''
                            }
                          `}
                        >
                          <div className="flex justify-between items-center gap-3">
                            <div>
                              <h4 className="font-bold text-[var(--text-primary)] text-sm sm:text-[15px]">
                                {slot.startTime} - {slot.endTime}
                                {!slot.isAvailable && (
                                  <span className="text-rose-600 text-[10px] ml-1 uppercase">
                                    {slot.reason ? `(${slot.reason})` : '(Booked)'}
                                  </span>
                                )}
                              </h4>
                              {slot.name && (
                                <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 font-semibold tracking-wide">
                                  {slot.name}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <span
                                className={`font-black text-base ${!slot.isAvailable ? 'text-[var(--text-secondary)]' : 'text-[var(--bg-green)]'}`}
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
                <span className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider block">
                  Total Price
                </span>
                {selectedSlots.length > 0 && (
                  <span className="text-[10px] text-[var(--bg-green)] font-bold mt-1 block">
                    {selectedSlots.length} {selectedSlots.length === 1 ? 'Slot' : 'Slots'} Selected
                  </span>
                )}
              </div>
              <span className="font-black text-2xl text-[var(--text-primary)]">₹{totalPrice}</span>
            </div>

            <button
              onClick={handleProceedToBook}
              disabled={isBlocking || selectedSlots.length === 0}
              className={`w-full mt-6 py-4 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all duration-300 shadow-md flex items-center justify-center gap-2
                ${
                  selectedSlots.length > 0
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 hover:shadow-lg transform hover:-translate-y-0.5 cursor-pointer'
                    : 'bg-[var(--bg-grey)] text-[var(--text-secondary)] cursor-not-allowed'
                }
              `}
            >
              {isBlocking && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {isBlocking ? 'Locking Slot...' : 'Proceed to Book'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VenueDetails;
