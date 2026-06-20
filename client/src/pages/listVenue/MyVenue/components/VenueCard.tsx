import { Link } from 'react-router';
import { Button } from '../../../../components/ui/button';
import { DASHBOARD_URL } from '../../../../constants';
import type { MyVenue } from '../../../../types/venue.types';
import { MdOutlineLocationOn } from 'react-icons/md';

interface VenueCardProps {
  venue: MyVenue;
}

const getStatusBadge = (status: MyVenue['status']) => {
  switch (status) {
    case 'Draft':
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
          Draft
        </span>
      );
    case 'PendingReview':
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
          Under Review
        </span>
      );
    case 'Approved':
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
          Approved
        </span>
      );
    case 'Rejected':
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
          Rejected
        </span>
      );
    case 'Suspended':
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
          Suspended
        </span>
      );
    default:
      return null;
  }
};

const VenueCard = ({ venue }: VenueCardProps) => {
  return (
    <div className="bg-white rounded-2xl border border-[var(--bg-grey)] overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
      <div className="relative h-48 w-full bg-gray-100">
        {venue.coverImage ? (
          <img src={venue.coverImage} alt={venue.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}
        <div className="absolute top-3 right-3">{getStatusBadge(venue.status)}</div>
        <div className="absolute top-3 left-3">
          <span className="px-2 py-1 rounded-md text-xs font-medium bg-black/60 text-white backdrop-blur-sm">
            {venue.venueType || 'Venue'}
          </span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1 truncate">{venue.name}</h3>

        <div className="flex items-center text-[var(--text-secondary)] text-sm mb-4">
          <MdOutlineLocationOn className="mr-1 text-lg" />
          <span className="truncate">
            {venue.city}, {venue.state}
          </span>
        </div>

        {venue.status === 'Rejected' && venue.rejectionReason && (
          <div className="mt-2 mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-800">
            <span className="font-semibold block mb-0.5">Reason for rejection:</span>
            {venue.rejectionReason}
          </div>
        )}

        <div className="mt-auto pt-4 flex gap-3">
          <Button variant="outline" className="flex-1" asChild>
            <Link to={`/venue/${venue._id}`}>View Details</Link>
          </Button>

          {venue.status === 'Approved' && (
            <Button
              className="flex-1 bg-[var(--bg-green)] text-white hover:bg-[var(--bg-green)]/90"
              asChild
            >
              <a href={`${DASHBOARD_URL}/login`} target="_blank" rel="noopener noreferrer">
                Open Dashboard
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VenueCard;
