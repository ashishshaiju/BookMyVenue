import { useState } from "react";

import { Link  } from "react-router";
import ProfileDropdown from "./ProfileDropdown";
import { useAuth } from "../../hooks/useAuth";
import { FiUser } from "react-icons/fi";


const Navbar = () => {
  const [openProfile, setOpenProfile] = useState(false);
  const { isAuthenticated, loading } = useAuth();

  return (
    <header className="fixed top-0 left-0 z-50 w-full border-b bg-[var(--bg-primary)] shadow-sm ">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        
        {/* left - logo */}
        <Link to="/" className="text-2xl font-bold text-[var(--text-primary)]">
          BookMyVenue
        </Link>

        {/* center nav */}
        <nav className="hidden md:flex items-center gap-8 font-medium">
          <Link
            to="/explore"
            className="relative after:absolute after:left-0 after:-bottom-1 
            after:h-[2px] after:w-0 after:bg-[var(--bg-green)] 
            after:transition-all after:duration-300 
            hover:after:w-full"
          >
            Explore
          </Link>

          <Link
            to="/list-venue"
            className="relative after:absolute after:left-0 after:-bottom-1 
            after:h-[2px] after:w-0 after:bg-[var(--bg-green)] 
            after:transition-all after:duration-300 
            hover:after:w-full"
          >
            List Your Venue
          </Link>

          <Link
            to="/my-bookings"
            className="relative after:absolute after:left-0 after:-bottom-1 
            after:h-[2px] after:w-0 after:bg-[var(--bg-green)] 
            after:transition-all after:duration-300 
            hover:after:w-full"
          >
            My Bookings
          </Link>


        </nav>

        {/* profile / login */}
        {!loading && (
          isAuthenticated ? (
            <div className="relative">
              <button  
                type="button"
                onClick={() => setOpenProfile(!openProfile)}
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-[var(--bg-grey)] bg-[var(--bg-grey)] flex items-center justify-center hover:scale-105 transition cursor-pointer text-[var(--text-secondary)]">
                <FiUser className="text-lg" />
              </button>
              {openProfile && (
                <ProfileDropdown
                  onClose={() => setOpenProfile(false)}
                />
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="px-5 py-2 rounded-xl bg-[var(--bg-secondary)] border-2 border-transparent hover:bg-[var(--bg-primary)] hover:border hover:text-[var(--text-primary)] hover:border-[var(--bg-secondary)] transition-all font-medium text-white text-sm"
            >
              Login
            </Link>
          )
        )}
      </div>
    </header>
  );
};

export default Navbar;