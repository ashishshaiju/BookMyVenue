import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Link } from 'react-router';
import ReviewModal from '../../components/common/ReviewModal';
import { bookings } from './bookingsData';

const MyBookingsPage = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState('');

  const filteredBookings = bookings.filter((booking) => booking.status === activeTab);

  return (
    <section className="mt-24 px-8 mb-20 mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[var(--text-primary)]"> My Bookings </h1>
        <p className="text-[var(--text-secondary)]">
          {' '}
          Manage your venue bookings and track upcoming events.{' '}
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] size-5" />
        <Input
          placeholder="Search booking or venue..."
          className="h-13 rounded-2xl border-[var(--bg-grey)] bg-[var(--bg-tertiary)] pl-12"
        />
      </div>

      {/* Tabs */}
      <div className="mb-8 flex flex-wrap gap-3">
        {['upcoming', 'ongoing', 'past'].map((tab) => (
          <Button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-2xl px-5 capitalize cursor-pointer ${
              activeTab === tab
                ? 'bg-[var(--bg-green)] text-white hover:bg-[var(--bg-green)]'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--bg-grey)] hover:bg-[var(--bg-primary)]'
            }`}
          >
            {tab}
          </Button>
        ))}
      </div>

      {/* Cards */}
      <div className="space-y-5">
        {filteredBookings.map((booking) => (
          <div
            key={booking.id}
            className="flex flex-col md:flex-row overflow-hidden rounded-[28px] border border-[var(--bg-grey)] bg-[var(--bg-tertiary)] shadow-sm"
          >
            {/* image */}
            <div className="relative md:w-[300px] shrink-0">
              <img
                src={booking.image}
                alt={booking.venue}
                className="h-[220px] w-full object-cover md:h-full"
              />
              {/* status */}
              <div
                className="absolute left-4 top-4 rounded-full px-4 py-2 text-xs font-semibold text-white capitalize"
                style={{
                  background:
                    booking.status === 'upcoming'
                      ? 'var(--status-upcoming)'
                      : booking.status === 'ongoing'
                        ? 'var(--status-ongoing)'
                        : 'var(--status-past)',
                }}
              >
                {booking.status}
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col justify-between p-5">
              <div>
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                      {' '}
                      {booking.venue}{' '}
                    </h2>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {' '}
                      {booking.place}, {booking.district}{' '}
                    </p>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {' '}
                    Booking ID: BMV-{booking.id}{' '}
                  </p>
                </div>
                {/* Details */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-[var(--bg-primary)] p-3">
                    <p className="text-xs text-[var(--text-secondary)]"> Date </p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {' '}
                      {booking.date}{' '}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[var(--bg-primary)] p-3">
                    <p className="text-xs text-[var(--text-secondary)]"> Time </p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {' '}
                      {booking.time}{' '}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[var(--bg-primary)] p-3">
                    <p className="text-xs text-[var(--text-secondary)]"> Guests </p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {' '}
                      {booking.guests}{' '}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[var(--bg-primary)] p-3">
                    <p className="text-xs text-[var(--text-secondary)]"> Amount </p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {' '}
                      ₹{booking.price}{' '}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom */}
              <div className="mt-5 flex items-center justify-between border-t border-[var(--bg-grey)] pt-4">
                {/* Left Buttons */}
                <div className="flex flex-wrap gap-3">
                  <Link
                    to={`/my-bookings/${booking.id}`}
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-[var(--bg-green)] px-5 text-sm font-medium text-white transition hover:opacity-90"
                  >
                    View Details
                  </Link>

                  {booking.status === 'upcoming' && (
                    <Link
                      to={`/my-bookings/${booking.id}?section=cancel`}
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--bg-grey)] bg-[var(--bg-tertiary)] px-5 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--bg-primary)]"
                    >
                      Cancel Booking
                    </Link>
                  )}

                  {booking.status === 'ongoing' && (
                    <Link
                      to={`/my-bookings/${booking.id}?section=contact`}
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--bg-grey)] bg-[var(--bg-tertiary)] px-5 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--bg-primary)]"
                    >
                      Contact Venue
                    </Link>
                  )}

                  {booking.status === 'past' && (
                    <Link
                      to={`/venue/${booking.id}`}
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--bg-grey)] bg-[var(--bg-tertiary)] px-5 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--bg-primary)]"
                    >
                      Book Again
                    </Link>
                  )}
                </div>

                {/* right Side */}
                {booking.status === 'past' && (
                  <Button
                    onClick={() => {
                      setSelectedVenue(booking.venue);
                      setReviewOpen(true);
                    }}
                    className="rounded-xl bg-[var(--bg-green)] px-5 cursor-pointer hover:opacity-90"
                  >
                    Add Review
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
        <ReviewModal open={reviewOpen} onOpenChange={setReviewOpen} venueName={selectedVenue} />
      </div>
    </section>
  );
};

export default MyBookingsPage;
