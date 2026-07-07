import { useNavigate } from 'react-router';
import { useState, useCallback } from 'react';
import { Link } from 'react-router';
import { IoLocationOutline, IoSearch } from 'react-icons/io5';
import heroImage from '@/assets/hero.png';
import { useApiQuery } from '@/hooks/useApi';
import { API_ENDPOINTS } from '@/constants';
import { CompactVenueCard } from '@/components/CompactVenueCard';
import { useToggleWishlist, useWishlistSync } from '@/hooks/useWishlist';
import type { PublicVenue } from '@/types/venue.types';
import { Skeleton } from '@/components/ui/skeleton';

const HomePage = () => {
  const [search, setSearch] = useState('');
  const [togglingVenues, setTogglingVenues] = useState<Set<string>>(new Set());

  const navigate = useNavigate();
  
  const { toggleWishlist: toggleWishlistFn } = useToggleWishlist();
  useWishlistSync();

  const handleSearch = () => {
    const trimmedSearch = search.trim();

    if (trimmedSearch) {
      navigate(`/explore?search=${encodeURIComponent(trimmedSearch)}`);
    } else {
      navigate('/explore');
    }
  };

  const { data: featuredVenues = [], isLoading } = useApiQuery<PublicVenue[]>(
    ['featured-venues'],
    { method: 'GET', url: API_ENDPOINTS.FEATURED_VENUES }
  );

  const handleToggleWishlist = useCallback(
    async (venueId: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setTogglingVenues((prev) => new Set([...prev, venueId]));

      try {
        return await toggleWishlistFn(venueId);
      } finally {
        setTogglingVenues((prev) => {
          const next = new Set(prev);
          next.delete(venueId);
          return next;
        });
      }
    },
    [toggleWishlistFn]
  );

  return (
    <div>
      <section className="relative h-[550px] md:h-[620px] w-full overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-black/75 z-10" />

        <img
          src={heroImage}
          alt="Venue Hero"
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="relative z-20 px-6 w-full max-w-6xl text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
            Find the Perfect Venue
            <br />
            for Every Occasion
          </h1>

          <p className="text-gray-200 mt-4 max-w-2xl mx-auto text-sm md:text-lg">
            Curated spaces for corporate events, weddings, and private gatherings.
          </p>

          <div className="mt-10 max-w-3xl mx-auto bg-white rounded-2xl p-2 shadow-xl flex flex-col md:flex-row items-center gap-2">
            <div className="flex items-center gap-3 w-full px-4 py-3">
              <IoLocationOutline className="text-[var(--text-secondary)] text-xl" />

              <input
                type="text"
                placeholder="Search venue, city, or event type"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full outline-none bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
              />
            </div>

            {/* search Button */}
            <button
              onClick={handleSearch}
              className="w-full md:w-auto px-8 py-4 bg-[var(--bg-green)] text-white rounded-xl font-medium hover:opacity-90 transition flex items-center justify-center gap-2"
            >
              <IoSearch />
              Search
            </button>
          </div>
        </div>
      </section>
      <section className="px-6 py-16 bg-[var(--bg-primary)]">
        <div className="max-w-7xl mx-auto">
          {/* header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-semibold text-[var(--text-primary)]">Featured Venues</h2>

              <p className="text-[var(--text-secondary)] mt-2">
                Explore some of our popular event spaces.
              </p>
            </div>

            <Link
              to="/explore"
              className="hidden md:block text-[var(--bg-green)] font-medium hover:underline"
            >
              View All →
            </Link>
          </div>

          {/* cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col h-[380px] rounded-2xl border border-[var(--bg-grey)] bg-[var(--bg-tertiary)] overflow-hidden"
                >
                  <Skeleton className="w-full h-48 shrink-0" />
                  <div className="flex-1 p-5 flex flex-col justify-between">
                    <div>
                      <Skeleton className="h-6 w-3/4 mb-3" />
                      <Skeleton className="h-4 w-1/2 mb-2" />
                      <Skeleton className="h-4 w-1/3" />
                    </div>
                  </div>
                </div>
              ))
            ) : featuredVenues.length > 0 ? (
              featuredVenues.map((venue: PublicVenue) => (
                <CompactVenueCard
                  key={venue._id}
                  venue={venue}
                  onToggleWishlist={handleToggleWishlist}
                  isLoadingWishlist={togglingVenues.has(venue._id)}
                />
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-[var(--text-secondary)]">
                No featured venues currently available.
              </div>
            )}
          </div>

          {/* Mobile View All */}
          <div className="mt-8 md:hidden text-center">
            <Link to="/explore" className="text-[var(--bg-green)] font-medium">
              View All Venues →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
