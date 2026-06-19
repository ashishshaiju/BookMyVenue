import { useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router';
import { MapPin, Phone, Mail, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { bookings } from '../myBooking/bookingsData';
import ReviewModal from '@/components/common/ReviewModal';

const BookingDetailsPage = () => {
  const { bookingId } = useParams();
  const [searchParams] = useSearchParams();

  const [reviewOpen, setReviewOpen] = useState(false);

  const booking = bookings.find((booking) => booking.id === Number(bookingId));

  const section = searchParams.get('section');

  if (!booking) {
    return (
      <section className="mt-24 px-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Booking Not Found</h1>
      </section>
    );
  }

  return (
    <section className="mx-auto mt-24 mb-20 max-w-7xl px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Booking Details</h1>

        <p className="text-sm text-[var(--text-secondary)]">
          View complete information about your booking.
        </p>
      </div>

      {/* Main Card */}
      <div className="overflow-hidden rounded-[32px] border border-[var(--bg-grey)] bg-[var(--bg-tertiary)]">
        <div className="grid lg:grid-cols-[320px_1fr]">
          {/* Image */}
          <div className="relative">
            <img
              src={booking.image}
              alt={booking.venue}
              className="h-[240px] w-full object-cover lg:h-full"
            />

            {/* Status */}
            <div
              className="absolute left-4 top-4 rounded-full px-3 py-1.5 text-xs font-semibold text-white capitalize"
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

            {/* Price */}
            <div className="absolute right-4 top-4 rounded-full bg-[var(--bg-green)] px-3 py-1.5 text-xs font-semibold text-white shadow-md">
              ₹{booking.price}
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            {/* Top */}
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">{booking.venue}</h2>

                <p className="mt-1 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <MapPin className="size-4" />
                  {booking.place}, {booking.district}
                </p>
              </div>

              <div className="rounded-2xl bg-[var(--bg-primary)] px-4 py-3">
                <p className="text-xs text-[var(--text-secondary)]">Booking ID</p>

                <p className="font-semibold text-[var(--text-primary)]">BMV-{booking.id}</p>
              </div>
            </div>

            {/* Booking Info */}
            <div className="mb-5">
              <h3 className="mb-3 text-lg font-semibold text-[var(--text-primary)]">
                Booking Information
              </h3>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-[var(--bg-primary)] p-3">
                  <p className="mb-1 text-xs text-[var(--text-secondary)]">Event Date</p>

                  <p className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                    <Calendar className="size-4" />
                    {booking.date}
                  </p>
                </div>

                <div className="rounded-2xl bg-[var(--bg-primary)] p-3">
                  <p className="mb-1 text-xs text-[var(--text-secondary)]">Event Time</p>

                  <p className="text-sm font-medium text-[var(--text-primary)]">{booking.time}</p>
                </div>

                <div className="rounded-2xl bg-[var(--bg-primary)] p-3">
                  <p className="mb-1 text-xs text-[var(--text-secondary)]">Guests</p>

                  <p className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                    <Users className="size-4" />
                    {booking.guests}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="mb-5">
              <h3 className="mb-3 text-lg font-semibold text-[var(--text-primary)]">
                Payment Details
              </h3>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-[var(--bg-primary)] p-3">
                  <p className="text-xs text-[var(--text-secondary)]">Amount Paid</p>

                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    ₹{booking.price}
                  </p>
                </div>

                <div className="rounded-2xl bg-[var(--bg-primary)] p-3">
                  <p className="text-xs text-[var(--text-secondary)]">Payment Method</p>

                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {booking.paymentMethod}
                  </p>
                </div>

                <div className="rounded-2xl bg-[var(--bg-primary)] p-3">
                  <p className="text-xs text-[var(--text-secondary)]">Payment Status</p>

                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {booking.paymentStatus}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="mb-5">
              <h3 className="mb-3 text-lg font-semibold text-[var(--text-primary)]">
                Contact Details
              </h3>

              <div
                className={`grid gap-3 md:grid-cols-3 ${
                  section === 'contact' ? 'rounded-[24px] ring-2 ring-[var(--bg-green)] p-2' : ''
                }`}
              >
                <div className="rounded-2xl bg-[var(--bg-primary)] p-3">
                  <p className="mb-1 text-xs text-[var(--text-secondary)]">Phone</p>

                  <p className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                    <Phone className="size-4" />
                    {booking.phone}
                  </p>
                </div>

                <div className="rounded-2xl bg-[var(--bg-primary)] p-3">
                  <p className="mb-1 text-xs text-[var(--text-secondary)]">Email</p>

                  <p className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                    <Mail className="size-4" />
                    {booking.email}
                  </p>
                </div>

                <div className="rounded-2xl bg-[var(--bg-primary)] p-3">
                  <p className="mb-1 text-xs text-[var(--text-secondary)]">Address</p>

                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {booking.address}
                  </p>
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div className="mb-5">
              <h3 className="mb-3 text-lg font-semibold text-[var(--text-primary)]">
                Included Amenities
              </h3>

              <div className="flex flex-wrap gap-2">
                {booking.amenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="rounded-full bg-[var(--bg-primary)] px-3 py-1.5 text-xs text-[var(--text-primary)]"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>

            {/* Cancellation */}
            {booking.status === 'upcoming' && (
              <div className="mb-5 rounded-[24px] border border-[var(--bg-grey)] bg-[var(--bg-primary)] p-4">
                <h3 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">
                  Cancellation Policy
                </h3>

                <p className="text-sm text-[var(--text-secondary)]">{booking.cancellationPolicy}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              {booking.status === 'upcoming' && (
                <Button className="rounded-xl bg-red-500 hover:bg-red-600 cursor-pointer">
                  Cancel Booking
                </Button>
              )}

              {booking.status === 'ongoing' && (
                <a
                  href={booking.mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--bg-grey)] bg-[var(--bg-tertiary)] px-5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
                >
                  Get Directions
                </a>
              )}

              {booking.status === 'past' && (
                <>
                  <Link
                    to={`/venue/${booking.venueId}`}
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-[var(--bg-green)] px-5 text-sm text-white hover:opacity-90"
                  >
                    Book Again
                  </Link>

                  <Button
                    onClick={() => setReviewOpen(true)}
                    variant="outline"
                    className="h-10 rounded-xl cursor-pointer"
                  >
                    Add Review
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <ReviewModal open={reviewOpen} onOpenChange={setReviewOpen} venueName={booking.venue} />
    </section>
  );
};

export default BookingDetailsPage;
