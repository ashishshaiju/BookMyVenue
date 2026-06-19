import { Link } from 'react-router';
import { MdOutlineMeetingRoom } from 'react-icons/md';
import { IoAddCircleOutline } from 'react-icons/io5';

const ListSidebar = () => {
  return (
    <aside className=" fixed left-0 top-0 h-screen w-72 min-h-screen border-r border-[var(--bg-grey)] bg-[var(--bg-tertiary)] p-6">
      <Link to="/" className="text-xl font-bold text-[var(--text-primary)] mb-10">
        BookMyVenue
      </Link>

      <nav className="flex flex-col gap-3">
        <Link
          to="/list-venue/add-venue"
          className="flex items-center mt-10 gap-3 rounded-xl px-4 py-3 text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition"
        >
          <IoAddCircleOutline />
          Add Venue
        </Link>

        <Link
          to="/list-venue/my-venues"
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition"
        >
          <MdOutlineMeetingRoom />
          My Venues
        </Link>
      </nav>
    </aside>
  );
};

export default ListSidebar;
