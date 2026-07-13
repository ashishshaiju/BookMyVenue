import { useEffect, useRef } from "react";
import { Outlet, useNavigate, useParams } from "react-router";
import { Loader2 } from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { useAppStore } from "../../store/useAppStore";
import { useApiQuery } from "../../hooks/useApi";
import { QUERY_KEYS } from "../../config/queryKeys";
import { API_ENDPOINTS } from "../../constants";

interface MyVenue {
  _id: string;
  name: string;
  city: string;
  venueType: string;
  coverImage: string;
  status: "Draft" | "PendingReview" | "Approved" | "Rejected" | "Suspended";
  rejectionReason?: string;
}

interface MyVenuesResponse {
  count: number;
  venues: MyVenue[];
}

export function TenantLayout() {
  const { venueId } = useParams<{ venueId: string }>();
  const navigate = useNavigate();
  const { setActiveVenue } = useAppStore();
  const handledFailRef = useRef<string | null>(null);
  const { error } = useToast();

  const {
    data: myVenues,
    isLoading,
    isError,
  } = useApiQuery<MyVenuesResponse>(
    QUERY_KEYS.MY_VENUES,
    { method: "GET", url: API_ENDPOINTS.MY_VENUES },
    { staleTime: 5 * 60 * 1000 },
  );

  const venue =
    venueId && myVenues
      ? myVenues.venues.find((v) => v._id === venueId)
      : undefined;

  const isAccessDenied =
    !isLoading &&
    !isError &&
    !!myVenues &&
    !!venueId &&
    (!venue || venue.status !== "Approved");

  useEffect(() => {
    if (!venueId || isLoading || isError || !myVenues) return;

    if (!venue || venue.status !== "Approved") {
      // Avoid toast/navigate spam on re-renders for the same venueId
      if (handledFailRef.current === venueId) return;
      handledFailRef.current = venueId;

      if (!venue) {
        error("Venue not found or you don't have access.");
      } else {
        error("This venue is not available for dashboard access.");
      }
      navigate("/dashboard/select-venue", { replace: true });
      return;
    }

    handledFailRef.current = null;
    setActiveVenue(venueId, venue.name);
  }, [venueId, venue, myVenues, isLoading, isError, navigate, setActiveVenue]);

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <p className="text-muted-foreground">
          Failed to load venues. Please try again.
        </p>
      </div>
    );
  }

  if (isAccessDenied) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return <Outlet />;
}
