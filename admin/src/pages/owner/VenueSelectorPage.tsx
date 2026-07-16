import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { Loader2, Store, PlusCircle } from "lucide-react";
import { useApiQuery } from "@/hooks/useApi";
import { QUERY_KEYS } from "@/config/queryKeys";
import { API_ENDPOINTS, CLIENT_APP_URL } from "@/constants";
import { VENUE_STATUS } from "@/constants/venueStatus";
import { useAppStore } from "@/store/useAppStore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MyVenue {
  _id: string;
  name: string;
  city: string;
  venueType: string;
  coverImage: string;
  status: "Draft" | "PendingReview" | "Approved" | "Rejected" | "Suspended";
  rejectionReason?: string;
  suspensionReason?: string;
}

interface MyVenuesResponse {
  count: number;
  venues: MyVenue[];
}

export default function VenueSelectorPage() {
  const navigate = useNavigate();
  const { setActiveVenue } = useAppStore();

  const { data, isLoading } = useApiQuery<MyVenuesResponse>(
    QUERY_KEYS.MY_VENUES,
    { method: "GET", url: API_ENDPOINTS.MY_VENUES },
    { staleTime: 0 },
  );

  const venues = useMemo(() => data?.venues || [], [data?.venues]);
  const approvedVenues = useMemo(
    () => venues.filter((v) => v.status === VENUE_STATUS.APPROVED),
    [venues],
  );

  useEffect(() => {
    if (
      venues.length > 0 &&
      approvedVenues.length === 1 &&
      venues.length === 1
    ) {
      const v = approvedVenues[0];
      setActiveVenue(v._id, v.name);
      navigate(`/dashboard/venue/${v._id}/reports`, { replace: true });
    }
  }, [venues, approvedVenues, navigate, setActiveVenue]);

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (venues.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center p-6">
        <div className="max-w-md text-center space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-zinc-800">
            <Store className="h-10 w-10 text-zinc-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">No Venues Yet</h2>
            <p className="text-muted-foreground">
              You haven't registered any venues. Please use the BookMyVenue
              client application to list your first venue.
            </p>
          </div>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.open(CLIENT_APP_URL, "_blank")}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Go to Client App
          </Button>
        </div>
      </div>
    );
  }

  if (venues.length === 1 && approvedVenues.length === 1) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Select Venue</h1>
        <p className="text-muted-foreground mt-1">
          Choose a venue to manage its bookings, calendar, and reports.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {venues.map((venue) => {
          const isApproved = venue.status === VENUE_STATUS.APPROVED;

          return (
            <Card
              key={venue._id}
              onClick={() => {
                if (isApproved) {
                  setActiveVenue(venue._id, venue.name);
                  navigate(`/dashboard/venue/${venue._id}/reports`);
                }
              }}
              className={cn(
                "overflow-hidden transition-all duration-200",
                isApproved
                  ? "cursor-pointer hover:border-zinc-500 hover:shadow-md hover:-translate-y-1"
                  : "opacity-60 cursor-not-allowed border-dashed",
              )}
            >
              <div className="relative aspect-video w-full bg-zinc-900">
                <img
                  src={venue.coverImage}
                  alt={venue.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {!isApproved && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                    <Badge
                      variant={
                        venue.status === VENUE_STATUS.REJECTED
                          ? "destructive"
                          : "secondary"
                      }
                      className={cn(
                        "text-sm px-3 py-1 uppercase tracking-wider font-semibold",
                        venue.status === VENUE_STATUS.SUSPENDED &&
                          "bg-amber-500/20 text-amber-500 hover:bg-amber-500/30",
                      )}
                    >
                      {venue.status === VENUE_STATUS.PENDING_REVIEW
                        ? "Under Review"
                        : venue.status}
                    </Badge>
                  </div>
                )}
              </div>
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg line-clamp-1">
                    {venue.name}
                  </h3>
                  {isApproved && <Badge variant="default">Active</Badge>}
                </div>
                <div className="flex items-center text-sm text-muted-foreground space-x-2">
                  <span className="capitalize">{venue.venueType}</span>
                  <span>•</span>
                  <span>{venue.city}</span>
                </div>
                {venue.status === VENUE_STATUS.REJECTED &&
                  venue.rejectionReason && (
                    <p className="mt-4 text-sm text-red-400 bg-red-950/30 p-2 rounded border border-red-900/50 line-clamp-2">
                      <span className="font-semibold">Reason:</span>{" "}
                      {venue.rejectionReason}
                    </p>
                  )}
                {venue.status === VENUE_STATUS.SUSPENDED &&
                  venue.suspensionReason && (
                    <p className="mt-4 text-sm text-amber-500 bg-amber-950/30 p-2 rounded border border-amber-900/50 line-clamp-2">
                      <span className="font-semibold">Suspended:</span>{" "}
                      {venue.suspensionReason}
                    </p>
                  )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
