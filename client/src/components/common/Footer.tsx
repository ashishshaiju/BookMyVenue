import { Link } from 'react-router';

const Footer = () => {
  return (
    <div>
      <footer className="z-50 bg-[var(--bg-tertiary)] border-t border-[var(--bg-grey)] px-6 py-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between gap-8">
          {/* Brand */}
          <div className="max-w-sm">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">BookMyVenue</h2>

            <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
              Find and book the perfect venue for your events.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Quick Links</h3>

            <div className="flex flex-col gap-2 text-sm text-[var(--text-secondary)]">
              <Link to="/explore" className="hover:text-[var(--bg-green)] transition-colors">
                Explore Venues
              </Link>

              <Link to="/my-bookings" className="hover:text-[var(--bg-green)] transition-colors">
                My Bookings
              </Link>

              <Link to="/list-venue" className="hover:text-[var(--bg-green)] transition-colors">
                List Your Venue
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Legal</h3>

            <div className="flex flex-col gap-2 text-sm text-[var(--text-secondary)]">
              <Link to="/privacy" className="hover:text-[var(--bg-green)] transition-colors">
                Privacy Policy
              </Link>

              <Link to="/terms" className="hover:text-[var(--bg-green)] transition-colors">
                Terms & Conditions
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--bg-grey)] mt-8 pt-5 text-center text-sm text-[var(--bg-green)]">
          © 2026 BookMyVenue. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Footer;
