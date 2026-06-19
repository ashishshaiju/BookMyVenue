import { Outlet } from 'react-router';
import ListSidebar from '../components/common/ListSidebar';

const ListVenueLayout = () => {
  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)]">
      {/* Sidebar */}
      <ListSidebar />

      {/* Right Content */}
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default ListVenueLayout;
