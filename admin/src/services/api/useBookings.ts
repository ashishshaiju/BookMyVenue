import { useQueryClient } from "@tanstack/react-query";
import { useApiQuery, useApiMutation } from "@/hooks/useApi";
import { QUERY_KEYS } from "@/config/queryKeys";
import { API_ENDPOINTS } from "@/constants";
import type { BookingsResponse } from "@/types";

export function useOwnerBookings(venueId: string, page: number) {
  return useApiQuery<BookingsResponse>(
    QUERY_KEYS.OWNER_BOOKINGS(venueId),
    {
      method: "GET",
      url: `${API_ENDPOINTS.OWNER_VENUE_BOOKINGS}/${venueId}/bookings?page=${page}&limit=10`,
    },
    { staleTime: 0, enabled: !!venueId },
  );
}

export function useCreateOfflineBooking() {
  const queryClient = useQueryClient();
  return useApiMutation<
    unknown,
    {
      venueId: string;
      customerName: string;
      phone: string;
      date: string;
      startTime: number;
      endTime: number;
      amountPaid: number;
    }
  >(
    { method: "POST", url: API_ENDPOINTS.OWNER_OFFLINE_BOOKING },
    {
      onSuccess: (_, vars) => {
        queryClient.invalidateQueries({
          queryKey: ["owner", "bookings", vars.venueId],
        });
      },
    },
  );
}
