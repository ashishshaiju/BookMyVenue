import { useNavigate } from 'react-router';
import { useState } from 'react';
import { Link } from 'react-router';
import { featuredVenues } from './featuredVenues';
import { IoLocationOutline, IoSearch } from 'react-icons/io5';
import { TiStar } from 'react-icons/ti';
import heroImage from '@/assets/hero.png';

const HomePage = () => {
  const [search, setSearch] = useState('');

  const navigate = useNavigate();

  const handleSearch = () => {
    const trimmedSearch = search.trim();

    if (trimmedSearch) {
      navigate(`/explore?search=${encodeURIComponent(trimmedSearch)}`);
    } else {
      navigate('/explore');
    }
  };
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
            {featuredVenues.map((venue) => (
              <div
                key={venue.id}
                className="bg-[var(--bg-tertiary)] rounded-2xl overflow-hidden border border-[var(--bg-grey)] hover:shadow-lg transition duration-300"
              >
                <img src={venue.image} alt={venue.name} className="w-full h-56 object-cover" />

                <div className="p-5">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">{venue.name}</h3>
                  <div className="flex justify-between">
                    <p className="text-sm text-[var(--text-secondary)] mt-2 flex items-center gap-1">
                      <IoLocationOutline /> {venue.place} , {venue.district}
                    </p>
                    <p className="flex items-center">
                      <TiStar color="#a8dc55" /> {venue.rating}
                    </p>
                  </div>

                  <p className="text-sm text-[var(--text-secondary)] mt-2">Upto {venue.guests}</p>

                  <Link
                    to={`/venue/${venue.id}`}
                    className="mt-5 inline-block w-full text-center bg-[var(--bg-green)] text-white py-3 rounded-xl font-medium hover:opacity-90 transition"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
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
