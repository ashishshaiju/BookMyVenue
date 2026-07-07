import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { FiCalendar, FiClock, FiMapPin, FiSearch, FiChevronRight } from 'react-icons/fi';
import { useMyBookings } from '@/hooks/useMyBookings';
import ReviewModal from '@/components/common/ReviewModal';
import * as reviewService from '@/services/reviewService';
import { showSuccess, showError } from '@/utils/toast';

import type { BookingCardDTO } from '@/types/booking.types';

type TabType = 'upcoming' | 'completed' | 'cancelled';

const DEFAULT_BOOKINGS = { upcoming: [], completed: [], cancelled: [] };

const MyBookings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewModal, setReviewModal] = useState<{ open: boolean; booking: BookingCardDTO | null }>(
    {
      open: false,
      booking: null,
    }
  );

  const { data, isLoading, isError, refetch } = useMyBookings();
  const bookingsData = useMemo(() => data?.data?.bookings || DEFAULT_BOOKINGS, [data]);

  const handleReviewSubmit = async (rating: number, comment: string) => {
    if (!reviewModal.booking) {
      showError('Booking not found');
      return;
    }

    try {
      await reviewService.submitReview(reviewModal.booking.venueId, {
        rating,
        comment: comment || undefined,
      });
      showSuccess('Review submitted successfully!');
      setReviewModal({ open: false, booking: null });
      refetch();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to submit review';
      showError(errorMsg);
      throw error;
    }
  };

  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: 'upcoming', label: 'Upcoming', count: bookingsData.upcoming.length },
    { id: 'completed', label: 'Completed', count: bookingsData.completed.length },
    { id: 'cancelled', label: 'Cancelled', count: bookingsData.cancelled.length },
  ];

  const filteredBookings = useMemo(() => {
    const currentList = bookingsData[activeTab] || [];
    if (!searchQuery) return currentList;
    return currentList.filter(
      (b: BookingCardDTO) =>
        b.venueName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.bookingRef.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [bookingsData, activeTab, searchQuery]);

  const nextBooking = useMemo(() => {
    if (bookingsData.upcoming.length === 0) return null;
    return [...bookingsData.upcoming].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )[0];
  }, [bookingsData.upcoming]);

  const renderSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-3xl overflow-hidden animate-pulse"
        >
          <div className="h-48 bg-[var(--bg-grey)] w-full"></div>
          <div className="p-6">
            <div className="h-6 bg-[var(--bg-grey)] w-3/4 rounded mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-[var(--bg-grey)] w-full rounded"></div>
              <div className="h-4 bg-[var(--bg-grey)] w-5/6 rounded"></div>
            </div>
            <div className="mt-6 pt-4 border-t border-[var(--bg-grey)] flex justify-between">
              <div className="h-5 bg-[var(--bg-grey)] w-1/3 rounded"></div>
              <div className="h-5 bg-[var(--bg-grey)] w-1/4 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--text-primary)]">My Bookings</h1>
            <p className="text-[var(--text-secondary)] mt-2">
              Manage and view all your venue reservations.
            </p>
          </div>
        </div>

        {/* Next Upcoming Booking Banner */}
        {nextBooking && activeTab === 'upcoming' && !isLoading && (
          <div
            onClick={() => navigate(`/booking/${nextBooking.bookingRef}`)}
            className="mb-10 bg-gradient-to-r from-[var(--bg-green)] to-green-600 rounded-3xl p-6 text-white shadow-xl cursor-pointer hover:shadow-2xl transition-all relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
              <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden shrink-0 border-2 border-white/20">
                <img
                  src={nextBooking.coverImage}
                  alt={nextBooking.venueName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-grow">
                <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span> Next Up
                </div>
                <h2 className="text-2xl font-bold mb-2">{nextBooking.venueName}</h2>
                <div className="flex flex-wrap gap-4 text-white/80 text-sm font-medium">
                  <span className="flex items-center gap-1.5">
                    <FiCalendar /> {nextBooking.date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FiClock /> {nextBooking.timeRange}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FiMapPin /> {nextBooking.city}
                  </span>
                </div>
              </div>
              <div className="shrink-0 flex items-center justify-center w-12 h-12 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors hidden md:flex">
                <FiChevronRight className="text-2xl" />
              </div>
            </div>
          </div>
        )}

        {/* Controls: Tabs & Search */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex p-1 bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-2xl w-full md:w-auto overflow-x-auto hide-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 md:flex-none whitespace-nowrap px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-[var(--bg-green)] text-white shadow-md'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-grey)]'
                }`}
              >
                {tab.label}
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-white/20' : 'bg-[var(--bg-grey)]'}`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-2xl pl-12 pr-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--bg-green)] focus:ring-1 focus:ring-[var(--bg-green)] transition-all"
            />
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          renderSkeleton()
        ) : isError ? (
          <div className="text-center py-20 bg-[var(--bg-tertiary)] rounded-3xl border border-[var(--bg-grey)]">
            <p className="text-red-500 font-medium">Failed to load bookings. Please try again.</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-24 bg-[var(--bg-tertiary)] rounded-3xl border border-[var(--bg-grey)]">
            <div className="w-24 h-24 bg-[var(--bg-grey)] rounded-full flex items-center justify-center mx-auto mb-6">
              <FiCalendar className="text-4xl text-[var(--text-secondary)]" />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
              No {activeTab} bookings
            </h3>
            <p className="text-[var(--text-secondary)] max-w-md mx-auto">
              {searchQuery
                ? 'Try adjusting your search criteria.'
                : `You don't have any ${activeTab} bookings at the moment. Explore venues to make a reservation.`}
            </p>
            {!searchQuery && activeTab === 'upcoming' && (
              <button
                onClick={() => navigate('/')}
                className="mt-6 px-6 py-3 bg-[var(--bg-green)] text-white font-bold rounded-xl hover:bg-green-600 transition"
              >
                Explore Venues
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBookings.map((booking: BookingCardDTO) => (
              <div
                key={booking._id}
                onClick={() => navigate(`/booking/${booking.bookingRef}`)}
                className="group bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:border-[var(--bg-green)] cursor-pointer flex flex-col"
              >
                <div className="h-48 overflow-hidden relative">
                  <img
                    src={booking.coverImage}
                    alt={booking.venueName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-800 shadow-sm">
                    {booking.bookingRef}
                  </div>
                  {activeTab === 'cancelled' && (
                    <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center backdrop-blur-[2px]">
                      <span className="bg-red-500 text-white px-4 py-1.5 rounded-full font-bold text-sm">
                        CANCELLED
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-6 flex-grow flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-[var(--text-primary)] line-clamp-1">
                      {booking.venueName}
                    </h3>
                  </div>
                  <p className="text-[var(--text-secondary)] text-sm mb-4 flex items-center gap-1.5">
                    <FiMapPin className="text-[var(--bg-green)]" /> {booking.city},{' '}
                    {booking.district}
                  </p>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-3 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-primary)] px-3 py-2 rounded-lg">
                      <FiCalendar className="text-[var(--bg-green)]" /> {booking.date}
                    </div>
                    <div className="flex items-center gap-3 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-primary)] px-3 py-2 rounded-lg">
                      <FiClock className="text-[var(--bg-green)]" /> {booking.timeRange}
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-[var(--bg-grey)] space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[var(--text-secondary)] font-medium">
                        Total Paid
                      </span>
                      <span className="font-bold text-[var(--text-primary)]">
                        ₹{booking.totalPrice}
                      </span>
                    </div>
                    {activeTab === 'completed' && !booking.hasReview && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setReviewModal({ open: true, booking });
                        }}
                        className="w-full bg-[var(--bg-green)] hover:bg-emerald-600 text-white py-2 rounded-lg font-medium text-sm transition"
                      >
                        Rate this Booking
                      </button>
                    )}
                    {activeTab === 'completed' && booking.hasReview && (
                      <div className="text-center text-xs text-[var(--bg-green)] font-medium">
                        ✓ Review submitted
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      <ReviewModal
        open={reviewModal.open}
        onOpenChange={(open) => setReviewModal({ ...reviewModal, open })}
        venueName={reviewModal.booking?.venueName || ''}
        onSubmit={handleReviewSubmit}
      />
    </div>
  );
};

export default MyBookings;
