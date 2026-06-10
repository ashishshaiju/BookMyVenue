import { Link } from "react-router";
import { FiLogOut, FiUser } from "react-icons/fi";
import { LuCalendarDays } from "react-icons/lu";
import { MdOutlineMeetingRoom } from "react-icons/md";

type ProfileDropdownProps = {
  onClose: () => void;
};

const ProfileDropdown = ({
  onClose,
}: ProfileDropdownProps) => {
  return (
    <div className="absolute right-0 top-14 z-[999] w-64 rounded-2xl border border-[var(--bg-grey)] bg-[var(--bg-tertiary)] shadow-xl">
      <div className="px-5 py-4 border-b border-[var(--bg-grey)]">
        <h3 className="font-semibold text-[var(--text-primary)]">
          user
        </h3>

        <p className="text-sm text-[var(--text-secondary)]">
          User@gmail.com
        </p>
      </div>

      <div className="py-2">

        <Link
          to="/"
          onClick={onClose}
          className="flex items-center gap-3 px-5 py-3 hover:bg-[var(--bg-primary)] transition"
        >
          <FiUser />
          Profile
        </Link>

        <Link
          to="/"
          onClick={onClose}
          className="flex items-center gap-3 px-5 py-3 hover:bg-[var(--bg-primary)] transition"
        >
          <LuCalendarDays />
          My Bookings
        </Link>

        <Link
          to="/"
          onClick={onClose}
          className="flex items-center gap-3 px-5 py-3 hover:bg-[var(--bg-primary)] transition"
        >
          <MdOutlineMeetingRoom />
          My Venues
        </Link>

        <div className="mt-2 border-t border-[var(--bg-grey)] pt-2">
          <button
            type="button"
            className="w-full flex items-center gap-3 px-5 py-3 text-left text-red-500 hover:bg-red-50 transition"
          >
            <FiLogOut />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileDropdown;