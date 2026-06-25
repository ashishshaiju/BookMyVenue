import { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router';
import { TbShieldCheck } from 'react-icons/tb';

const BookingConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as {
    paymentId?: string;
    venueName?: string;
    date?: string;
    slotTime?: string;
  } | null;

  useEffect(() => {
    // If user accesses this page directly without state, redirect
    if (!state?.paymentId) {
      navigate('/explore');
    }
  }, [state, navigate]);

  if (!state?.paymentId) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 mt-20">
      <div className="bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-3xl p-10 max-w-lg w-full text-center shadow-lg">
        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <TbShieldCheck size={50} />
        </div>
        <h2 className="text-3xl font-extrabold text-[var(--text-primary)] mb-3">
          Booking Confirmed! 🎉
        </h2>
        <p className="text-[var(--text-secondary)] mb-8 text-lg">
          Your payment was successful and the slot has been securely booked.
        </p>

        <div className="bg-[var(--bg-grey)] rounded-2xl p-6 text-left mb-8 border border-[var(--bg-grey)]">
          <div className="mb-4">
            <p className="text-sm text-[var(--text-secondary)]">Payment ID</p>
            <p className="font-mono text-[var(--text-primary)] font-medium break-all">
              {state.paymentId}
            </p>
          </div>
          <div className="mb-4">
            <p className="text-sm text-[var(--text-secondary)]">Venue</p>
            <p className="text-[var(--text-primary)] font-semibold">{state.venueName}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Date</p>
              <p className="text-[var(--text-primary)] font-semibold">{state.date}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Time Slot</p>
              <p className="text-[var(--text-primary)] font-semibold">{state.slotTime}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/my-bookings"
            className="px-6 py-4 rounded-xl border border-[var(--bg-grey)] font-bold text-[var(--text-primary)] hover:bg-[var(--bg-grey)] transition"
          >
            View Bookings
          </Link>
          <Link
            to="/explore"
            className="px-6 py-4 rounded-xl bg-[var(--bg-green)] font-bold text-white hover:bg-green-600 transition shadow-md"
          >
            Explore More Venues
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
