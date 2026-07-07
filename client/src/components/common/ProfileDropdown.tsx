import { useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { FiLogOut, FiUser, FiX, FiHeart } from 'react-icons/fi';
import { LuCalendarDays } from 'react-icons/lu';
import { MdOutlineMeetingRoom } from 'react-icons/md';
import { useAuth } from '@/hooks/useAuth';

type ProfileDropdownProps = {
  onClose: () => void;
};

const ProfileDropdown = ({ onClose }: ProfileDropdownProps) => {
  const { user, logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleLogout = async () => {
    await logout();
    onClose();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-[998] md:hidden transition-opacity duration-300"
        onClick={onClose}
      />
      <div
        ref={dropdownRef}
        className="fixed top-0 right-0 h-screen w-[80vw] max-w-xs z-[999] bg-[var(--bg-tertiary)] shadow-2xl flex flex-col animate-slide-in-right md:absolute md:top-full md:right-0 md:mt-2 md:h-auto md:w-72 md:rounded-2xl md:border md:border-[var(--bg-grey)] md:shadow-xl"
      >
        {/* Header */}
        <div className="px-4 pt-5 pb-4 border-b border-[var(--bg-grey)] flex items-center gap-3 bg-[var(--bg-tertiary)] rounded-t-2xl">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full border-2 border-[var(--bg-grey)] bg-[var(--bg-grey)] flex items-center justify-center text-[var(--text-secondary)] shrink-0">
            <FiUser className="text-xl" />
          </div>

          {/* User info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[var(--text-primary)] truncate">
              {user?.username || 'User'}
            </h3>
            <p className="text-sm text-[var(--text-secondary)] truncate">
              {user?.email || 'user@example.com'}
            </p>
          </div>

          {/* Close button — always visible on mobile, hidden on desktop */}
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-grey)] hover:text-[var(--text-primary)] transition cursor-pointer shrink-0 md:hidden"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        {/* Menu items */}
        <div className="py-2">
          <Link
            to="/profile"
            onClick={onClose}
            className="flex items-center gap-3 px-5 py-3 text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition"
          >
            <FiUser className="text-base" />
            Profile
          </Link>

          <Link
            to="/my-bookings"
            onClick={onClose}
            className="flex items-center gap-3 px-5 py-3 text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition"
          >
            <LuCalendarDays className="text-base" />
            My Bookings
          </Link>

          <Link
            to="/wishlist"
            onClick={onClose}
            className="flex items-center gap-3 px-5 py-3 text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition"
          >
            <FiHeart className="text-base" />
            My Wishlist
          </Link>

          <Link
            to="/my-venues"
            onClick={onClose}
            className="flex items-center gap-3 px-5 py-3 text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition"
          >
            <MdOutlineMeetingRoom className="text-base" />
            My Venues
          </Link>

          <div className="mt-1 border-t border-[var(--bg-grey)] pt-1">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-5 py-3 text-left text-red-500 hover:bg-red-50 transition cursor-pointer rounded-b-2xl"
            >
              <FiLogOut className="text-base" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileDropdown;
