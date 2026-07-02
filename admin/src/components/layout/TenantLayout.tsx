import { useEffect } from 'react';
import { Outlet, useParams } from 'react-router';
import { useAppStore } from '../../store/useAppStore';
import { useApiQuery } from '../../hooks/useApi';
import { QUERY_KEYS } from '../../config/queryKeys';
import { API_ENDPOINTS } from '../../constants';

// Type from backend
interface MyVenue {
  _id: string;
  name: string;
  city: string;
  venueType: string;
  coverImage: string;
  status: 'Draft' | 'PendingReview' | 'Approved' | 'Rejected';
  rejectionReason?: string;
}

interface MyVenuesResponse {
  count: number;
  venues: MyVenue[];
}

export function TenantLayout() {
  const { venueId } = useParams<{ venueId: string }>();
  const { activeVenueId, activeVenueName, setActiveVenue } = useAppStore();

  useEffect(() => {
    if (venueId && venueId !== activeVenueId) {
      setActiveVenue(venueId, null);
    }
  }, [venueId, activeVenueId, setActiveVenue]);

  const { data: myVenues } = useApiQuery<MyVenuesResponse>(
    QUERY_KEYS.MY_VENUES,
    { method: 'GET', url: API_ENDPOINTS.MY_VENUES },
    { staleTime: 5 * 60 * 1000 }
  );

  useEffect(() => {
    if (venueId && myVenues) {
      const venue = myVenues.venues.find((v) => v._id === venueId);
      if (venue && venue.name !== activeVenueName) {
        setActiveVenue(venueId, venue.name);
      }
    }
  }, [venueId, myVenues, activeVenueName, setActiveVenue]);

  return <Outlet />;
}
