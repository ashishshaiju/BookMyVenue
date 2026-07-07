import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { FiMapPin, FiUsers } from 'react-icons/fi';
import { MdOutlineMeetingRoom } from 'react-icons/md';
import { GiTable } from 'react-icons/gi';
import { FiArrowRight, FiCalendar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  TbBuildingEstate,
  TbBuildingOff,
  TbReceiptRefund,
  TbShieldCheck,
  TbShieldOff,
} from 'react-icons/tb';
import { useApiQuery, useApiMutation } from '@/hooks/useApi';
import { useVenueReviews } from '@/hooks/useVenueReviews';
import { useAuth } from '@/hooks/useAuth';
import { API_ENDPOINTS } from '@/constants';
import type { VenueDetail } from '@/types/venue.types';
import type { Slot } from '@/types/booking.types';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import ReviewModal from '@/components/common/ReviewModal';
import { parseTimeToMinutes, toLocalDateString } from '@/utils/timeUtils';
import { showError, showInfo } from '@/utils/toast';
import type { AxiosError } from 'axios';

const VenueDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [selectedSlots, setSelectedSlots] = useState<Slot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [calendarVisible, setCalendarVisible] = useState<boolean>(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [showFab, setShowFab] = useState(false);
  const [isReviewsExpanded, setIsReviewsExpanded] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { reviews, pagination, isLoading: isReviewsLoading, fetchReviews } = useVenueReviews();

  useEffect(() => {
    if (id) {
      fetchReviews(id);
    }
  }, [id, fetchReviews]);

  useEffect(() => {
    const t = setTimeout(() => {
      setShowFab(true);
    }, 250);

    return () => clearTimeout(t);
  }, []);

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

  const submitReviewMutation = useApiMutation<unknown, { rating?: number; comment?: string }>(
    {
      url: `/reviews/venue/${id}`,
      method: 'POST',
    },
    {
      onSuccess: () => {
        toast.success('Review submitted successfully');
        setShowReviewModal(false);
        fetchReviews(id || '');
      },
      onError: (error: Error) => {
        const axiosErr = error as AxiosError<{ message: string }>;
        toast.error(axiosErr?.response?.data?.message || 'Failed to submit review');
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

  // Gallery handlers
  const handleOpenGallery = (index: number) => {
    setCurrentImageIndex(index);
    setGalleryOpen(true);
  };

  const handlePrevImage = () => {
    const allImages = venue?.coverImage
      ? [venue.coverImage, ...(venue.galleryImages || [])]
      : [];
    setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    const allImages = venue?.coverImage
      ? [venue.coverImage, ...(venue.galleryImages || [])]
      : [];
    setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  const renderGalleryModal = () => {
    const allImages = venue?.coverImage
      ? [venue.coverImage, ...(venue.galleryImages || [])]
      : [];

    if (allImages.length === 0) return null;

    return (
      <div
        className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm transition-all duration-300 ${
          galleryOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setGalleryOpen(false)}
      >
        {/* Container */}
        <div
          className="flex flex-col items-center justify-center w-full h-full px-4 py-4 sm:py-6 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={() => setGalleryOpen(false)}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close gallery"
          >
            <X size={24} />
          </button>

          {/* Main Image Container */}
          <div className="flex-1 flex items-center justify-center max-w-4xl max-h-[calc(100vh-160px)] w-full">
            <img
              src={allImages[currentImageIndex]}
              alt={`Gallery view ${currentImageIndex + 1}`}
              className="w-full h-full object-contain rounded-2xl"
            />
          </div>

          {/* Image Counter */}
          <div className="mt-4 text-center text-white text-sm font-semibold">
            {currentImageIndex + 1} / {allImages.length}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-4 mt-6 sm:mt-8">
            {/* Previous Button */}
            <button
              onClick={handlePrevImage}
              className="p-2 sm:p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft size={24} />
            </button>

            {/* Thumbnail Navigation */}
            <div className="flex gap-2 overflow-x-auto max-w-[calc(100vw-200px)] sm:max-w-none px-2 py-2">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`h-12 w-12 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                    idx === currentImageIndex
                      ? 'border-white/80 scale-110'
                      : 'border-white/20 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>

            {/* Next Button */}
            <button
              onClick={handleNextImage}
              className="p-2 sm:p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Next image"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderBookingContent = () => (
    <div className="flex flex-col gap-2">
      <div className="mb-5">
        <span className="text-[11px] uppercase tracking-[0.25em] text-[var(--bg-green)] font-bold">
          Booking
        </span>

        <h2 className="text-3xl font-black text-[var(--text-primary)] mt-1">Reserve your venue</h2>

        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Pick a date, choose your slots and continue to payment.
        </p>
      </div>

      {/* Calendar & Date Selection */}
      <div className="mt-1">
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
          <div className="mt-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <FiCalendar className="text-emerald-600" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Date
              </span>
            </div>
            <h3 className="font-bold text-sm text-[var(--text-primary)]">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </h3>
          </div>
        )}
      </div>

      <div className="mt-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-[var(--text-primary)] text-sm uppercase tracking-wider">
            Available Slots
          </h3>
          <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 dark:bg-emerald-500/5 text-[var(--bg-green)] border border-emerald-500/15 rounded-full font-bold">
            {venue?.bookingType === 'fixedBooking' ? 'Fixed' : 'Flexible'}
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
          <div className="max-h-[350px] overflow-y-auto pr-1.5 custom-scrollbar">
            {!availabilityResponse?.slots || availabilityResponse.slots.length === 0 ? (
              <div className="text-center py-10 text-xs font-semibold text-[var(--text-secondary)] bg-[var(--bg-grey)]/20 rounded-2xl border border-dashed border-[var(--bg-grey)] px-4">
                {selectedDate
                  ? 'No slots available for the selected date.'
                  : 'Please pick a date to check slots availability.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 p-2.5 rounded-2xl border border-dashed border-[var(--bg-grey)] bg-[var(--bg-grey)]/5">
                {availabilityResponse.slots.map((slot) => {
                  const isSelected = selectedSlots.some((s) => s.slotId === slot.slotId);
                  return (
                    <button
                      key={slot.slotId}
                      disabled={!slot.isAvailable}
                      onClick={() => handleSlotSelect(slot)}
                      className={`w-full text-left border rounded-xl p-4 transition-all duration-200 active:scale-[0.98]
                        ${!slot.isAvailable ? 'opacity-40 cursor-not-allowed bg-[var(--bg-grey)]/50 border-[var(--bg-grey)]' : 'cursor-pointer'}
                        ${
                          isSelected && slot.isAvailable
                            ? 'border-[var(--bg-green)] bg-gradient-to-br from-emerald-500/10 to-teal-500/10 ring-1 ring-[var(--bg-green)]'
                            : slot.isAvailable
                              ? 'bg-[var(--bg-primary)] border-[var(--bg-grey)] hover:border-emerald-500/40 hover:shadow-md hover:-translate-y-[2px]'
                              : ''
                        }
                      `}
                    >
                      <div className="flex justify-between items-center gap-3">
                        <div>
                          <h4 className="font-bold text-[var(--text-primary)] text-sm sm:text-[15px]">
                            {slot.startTime} → {slot.endTime}
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
                        <div className="text-right shrink-0">
                          <span
                            className={`font-black text-base ${!slot.isAvailable ? 'text-[var(--text-secondary)]' : 'text-[var(--bg-green)]'}`}
                          >
                            ₹{slot.price}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="sticky rounded-2xl bg-[var(--bg-grey)]/20 border border-[var(--bg-grey)] p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">Total</p>

            <h2 className="text-3xl font-black text-[var(--text-primary)]">₹{totalPrice}</h2>
          </div>

          <div className="text-right">
            <p className="text-sm font-semibold text-[var(--bg-green)]">
              {selectedSlots.length} {selectedSlots.length === 1 ? 'Slot' : 'Slots'}
            </p>

            {finalStartTime && finalEndTime && (
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                {finalStartTime} → {finalEndTime}
              </p>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={handleProceedToBook}
        disabled={isBlocking || selectedSlots.length === 0}
        className={`w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all duration-300 shadow-md flex items-center justify-center gap-2
          ${
            selectedSlots.length > 0
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
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
  );

  const renderReviewsList = () => (
    <>
      {isReviewsLoading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--bg-green)]"></div>
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-base text-[var(--text-secondary)] py-4">
          No reviews yet. Be the first to drop some genuine review in!
        </p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review._id}
              className="p-3 bg-[var(--bg-primary)] rounded-xl border border-[var(--bg-grey)]"
            >
              <div className="grid grid-cols-[2rem_1fr] gap-x-2">
                {/* Row 1: reviewer avatar + connector down to reply (if any) */}
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-[var(--bg-green)] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {review.user.userName.charAt(0).toUpperCase()}
                  </div>
                  {review.ownerReply && <div className="w-0.5 flex-1 bg-[var(--bg-grey)] mt-1" />}
                </div>

                {/* Row 1: reviewer header + comment */}
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <p className="font-bold text-sm text-[var(--text-primary)] truncate">
                        {review.user.userName}
                      </p>
                      {review.user.isVerified && (
                        <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-[10px] font-semibold rounded-full shrink-0">
                          Verified Customer
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {review.rating !== undefined && (
                        <span className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-sm ${i < (review.rating || 0) ? 'text-yellow-500' : 'text-gray-300'}`}
                            >
                              ★
                            </span>
                          ))}
                        </span>
                      )}
                      <span className="text-xs text-[var(--text-secondary)]">
                        {new Date(review.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-[var(--text-primary)] mt-1 leading-relaxed">
                      {review.comment}
                    </p>
                  )}
                </div>

                {review.ownerReply && (
                  <>
                    {/* Row 2: corner connector, picks up from the vertical line above */}
                    <div className="relative w-full h-full">
                      <div className="absolute top-0 left-1/2 w-[calc(50%+0.5rem)] h-[14px] border-l-2 border-b-2 border-[var(--bg-grey)] rounded-bl-xl -translate-x-[1px]" />
                    </div>

                    {/* Row 2: owner avatar + reply */}
                    <div className="min-w-0">
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          O
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-semibold rounded-full">
                              Owner
                            </span>
                            <span className="text-xs text-[var(--text-secondary)] shrink-0">
                              {new Date(review.ownerReply.repliedAt).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                            {review.ownerReply.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex gap-2 justify-center mt-6">
              {[...Array(pagination.totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => fetchReviews(id || '', i + 1)}
                  className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                    pagination.page === i + 1
                      ? 'bg-[var(--bg-green)] text-white'
                      : 'bg-[var(--bg-grey)] text-[var(--text-secondary)] hover:bg-[var(--text-primary)]'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );

  if (isLoading) {
    return (
      <section className="max-w-8xl mx-auto mt-24 px-16 pb-12 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:p-6 lg:p-8 relative">
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

  const getStartingPrice = () => {
    if (venue.bookingType === 'flexibleBooking' && venue.pricing) {
      return `₹${venue.pricing.basePrice}/${venue.pricing.pricingType === 'fixedPricing' ? 'slot' : 'hr'}`;
    }
    if (venue.bookingType === 'fixedBooking' && venue.fixedPackages?.length > 0) {
      const minPrice = Math.min(...venue.fixedPackages.map((p) => p.price));
      return `₹${minPrice}`;
    }
    return '--';
  };

  // Client-side guard: only allow known Google Maps embed URLs in the iframe
  const getSafeGoogleMapsEmbedUrl = (url: string | undefined): string | null => {
    if (!url) return null;
    try {
      const { protocol, hostname, pathname } = new URL(url);
      const ALLOWED_HOSTS = ['maps.google.com', 'www.google.com', 'google.com'];
      if (protocol !== 'https:') return null;
      if (!ALLOWED_HOSTS.includes(hostname)) return null;
      // Must be a proper embed or output=embed URL
      const isEmbedPath = pathname.startsWith('/maps/embed');
      const isEmbedQuery = url.includes('output=embed');
      if (!isEmbedPath && !isEmbedQuery) return null;
      return url;
    } catch {
      return null;
    }
  };

  const safeMapUrl = getSafeGoogleMapsEmbedUrl(venue.googleMapsUrl);

  return (
    <section
      className="max-w-8xl mx-auto mt-20 lg:mt-24 px-4 sm:px-6 lg:px-16 pb-2 lg:pb-12
"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:p-4 lg:p-6 relative">
        <div className="lg:col-span-9">
          <div className="w-full lg:pr-6 z-10 font-sans">
            <div className="mb-6">
              {/* Breadcrumbs */}
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-3">
                <Link to="/explore" className="hover:text-[var(--bg-green)] transition">
                  Explore
                </Link>
                <span>/</span>
                <span className="capitalize">{venue.city?.toLowerCase() || 'Unknown City'}</span>
                <span>/</span>
                <span className="text-[var(--text-primary)] font-medium capitalize">
                  {venue.name?.toLowerCase() || 'Unknown Venue'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--text-primary)] mb-2 capitalize leading-tight">
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
              <div className="grid grid-cols-1 sm:grid-cols-4 grid-rows-3 gap-4 h-[240px] sm:h-[340px] lg:h-[440px] mb-12">
                <button
                  onClick={() => handleOpenGallery(0)}
                  className="col-span-4 sm:col-span-3 row-span-3 overflow-hidden rounded-3xl border border-[var(--bg-grey)]/65 shadow-md cursor-pointer group"
                >
                  <img
                    src={images[0]}
                    alt={`${venue.name} main`}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </button>
                {images.length > 1 && (
                  <button
                    onClick={() => handleOpenGallery(1)}
                    className="hidden sm:block overflow-hidden rounded-2xl border border-[var(--bg-grey)]/65 shadow-sm cursor-pointer group"
                  >
                    <img
                      src={images[1]}
                      alt={`${venue.name} view 1`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                    />
                  </button>
                )}
                {images.length > 2 && (
                  <button
                    onClick={() => handleOpenGallery(2)}
                    className="hidden sm:block overflow-hidden rounded-2xl border border-[var(--bg-grey)]/65 shadow-sm cursor-pointer group"
                  >
                    <img
                      src={images[2]}
                      alt={`${venue.name} view 2`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                    />
                  </button>
                )}
                {images.length > 3 && (
                  <button
                    onClick={() => handleOpenGallery(3)}
                    className="hidden sm:block relative cursor-pointer overflow-hidden rounded-2xl border border-[var(--bg-grey)]/65 shadow-sm group"
                  >
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

            <div className="bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-3xl p-5 sm:p-4 sm:p-5 lg:p-6 lg:p-5 sm:p-6 lg:p-8 mb-10 shadow-sm hover:shadow-md transition-all duration-300">
              <h2 className="text-2xl font-black text-[var(--text-primary)] mb-5 flex items-center gap-2">
                <span>About Venue</span>
                <span className="w-8 h-[2px] bg-emerald-500"></span>
              </h2>
              <div className="relative">
                <p
                  className={`text-[var(--text-secondary)] leading-relaxed text-sm whitespace-pre-wrap ${!isDescriptionExpanded ? 'line-clamp-3' : ''}`}
                >
                  {venue.description}
                </p>
                {venue.description && venue.description.length > 150 && (
                  <button
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="text-[var(--bg-green)] font-bold text-sm mt-2 hover:underline cursor-pointer"
                  >
                    {isDescriptionExpanded ? 'Read Less' : 'Read More'}
                  </button>
                )}
              </div>
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
                <div className="bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-3xl p-4 sm:p-5 lg:p-4 sm:p-5 lg:p-6 shadow-sm hover:shadow-md hover:border-emerald-500/20 transition-all duration-300 group">
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
                  <div className="bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-3xl p-4 sm:p-5 lg:p-6 shadow-sm hover:shadow-md hover:border-emerald-500/20 transition-all duration-300 group">
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
                  <div className="bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-3xl p-4 sm:p-5 lg:p-6 shadow-sm hover:shadow-md hover:border-emerald-500/20 transition-all duration-300 group">
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
                  <div className="bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-3xl p-4 sm:p-5 lg:p-6 shadow-sm hover:shadow-md hover:border-emerald-500/20 transition-all duration-300 group">
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

            <div className="bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-3xl p-5 sm:p-6 lg:p-8 shadow-sm hover:shadow-md transition-all duration-300">
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
              {venue.googleMapsUrl &&
                (safeMapUrl ? (
                  <div className="relative rounded-3xl overflow-hidden border border-[var(--bg-grey)] h-[300px] shadow-inner">
                    <iframe
                      src={safeMapUrl}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      sandbox="allow-scripts allow-same-origin"
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Google Maps Location"
                    ></iframe>
                  </div>
                ) : (
                  <a
                    href={venue.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500/10 text-[var(--bg-green)] border border-emerald-500/20 font-semibold text-sm hover:bg-emerald-500/20 transition"
                  >
                    <FiMapPin className="text-base" />
                    Open in Google Maps
                  </a>
                ))}
            </div>

            {/* Cancellation & Refund Policy */}
            <div className="bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-3xl p-5 sm:p-6 lg:p-8 shadow-sm hover:shadow-md transition-all duration-300 mt-8">
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

            {/* Mobile Reviews Section (Inline Expandable) */}
            <div className="lg:hidden bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-3xl p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-emerald-500/20 transition-all duration-300 mt-8 mb-10 overflow-hidden">
              <div
                className="flex items-center justify-between group cursor-pointer active:scale-[0.99]"
                onClick={() => setIsReviewsExpanded(!isReviewsExpanded)}
              >
                <div>
                  <h2 className="text-xl font-extrabold text-[var(--text-primary)] mb-1 flex items-center gap-2">
                    Reviews & Ratings
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-lg text-yellow-500">
                      {venue?.avgRating ? venue.avgRating.toFixed(1) : 'New'} ★
                    </span>
                    <span className="text-[var(--text-secondary)] font-medium">
                      ({pagination?.total ?? venue?.reviewCount ?? 0} reviews)
                    </span>
                  </div>
                </div>
                <div className="bg-[var(--bg-grey)]/40 text-[var(--text-primary)] px-4 py-2 rounded-full group-hover:bg-emerald-500/10 group-hover:text-[var(--bg-green)] transition-colors font-bold text-sm">
                  {isReviewsExpanded ? 'Hide' : 'View all'}
                </div>
              </div>

              {isReviewsExpanded && (
                <div className="mt-6 pt-6 border-t border-[var(--bg-grey)] animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-[var(--text-primary)] text-lg">All Reviews</h3>
                    {user && (
                      <Button
                        onClick={() => setShowReviewModal(true)}
                        className="bg-[var(--bg-green)] text-white hover:bg-green-600 font-semibold px-4 py-2 rounded-lg text-xs"
                      >
                        Add Review
                      </Button>
                    )}
                  </div>
                  {renderReviewsList()}
                </div>
              )}
            </div>

            {/* Desktop Reviews Section (Inline) */}
            <div className="hidden lg:block bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-3xl p-5 sm:p-6 lg:p-8 shadow-sm hover:shadow-md transition-all duration-300 mt-8 mb-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-[var(--text-primary)] text-2xl">
                    Reviews & Ratings
                  </h3>
                  {venue?.avgRating && (
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500 text-lg">★</span>
                      <span className="font-bold text-[var(--text-primary)] text-lg">
                        {venue.avgRating.toFixed(1)}
                      </span>
                      <span className="text-sm text-[var(--text-secondary)]">
                        ({pagination?.total ?? venue.reviewCount ?? 0} reviews)
                      </span>
                    </div>
                  )}
                </div>
                {user && (
                  <Button
                    onClick={() => setShowReviewModal(true)}
                    className="bg-[var(--bg-green)] text-white hover:bg-green-600 font-semibold px-4 py-2 rounded-lg"
                  >
                    Add Review
                  </Button>
                )}
              </div>
              {renderReviewsList()}
            </div>
          </div>
        </div>

        <div className="hidden lg:block lg:col-span-3">
          <div className="sticky top-42 lg:mb-12 bg-[var(--bg-tertiary)] border border-[var(--bg-grey)]/85 backdrop-blur-md rounded-3xl p-4 sm:p-5 lg:p-4 sm:p-5 lg:p-6 shadow-xl relative overflow-hidden transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)]">
            {renderBookingContent()}
          </div>
        </div>
      </div>

      {/* Mobile Sticky Booking Bar */}
      <div
        className={`fixed lg:hidden bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${
          showFab && !bookingOpen
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-8 pointer-events-none'
        }`}
      >
        <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-4 rounded-full px-5 py-3 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/20 shadow-[0_15px_40px_rgba(0,0,0,.18)] transition-all duration-500 hover:scale-[1.03] active:scale-95">
              <div className="text-left">
                <p className="text-[10px] uppercase text-gray-500">
                  {selectedSlots.length ? 'Total' : 'Starting'}
                </p>

                <p className="font-bold">
                  {selectedSlots.length ? `₹${totalPrice}` : getStartingPrice()}
                </p>
              </div>

              <div className="w-11 h-11 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl">
                <FiArrowRight size={20} />
              </div>
            </button>
          </DialogTrigger>

          <DialogContent
            className="
            w-[95vw]
            max-w-md
            rounded-3xl
            max-h-[92dvh]
            overflow-auto
            p-5
            "
          >
            {renderBookingContent()}
          </DialogContent>
        </Dialog>
      </div>

      {/* Review Modal */}
      <ReviewModal
        open={showReviewModal}
        onOpenChange={setShowReviewModal}
        venueName={venue?.name || 'Venue'}
        onSubmit={async (rating: number, comment: string) => {
          await submitReviewMutation.mutateAsync({ rating, comment });
        }}
      />

      {/* Image Gallery Modal */}
      {renderGalleryModal()}
    </section>
  );
};

export default VenueDetails;
