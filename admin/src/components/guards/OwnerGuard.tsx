import { Navigate, Outlet, useLocation } from "react-router";
import { useApiQuery } from "../../hooks/useApi";
import { QUERY_KEYS } from "../../config/queryKeys";
import { API_ENDPOINTS } from "../../constants";
import type { UserProfile } from "./AuthGuard";

export function OwnerGuard() {
  const location = useLocation();
  const { data: profile } = useApiQuery<UserProfile>(
    QUERY_KEYS.PROFILE,
    { method: "GET", url: API_ENDPOINTS.PROFILE },
    { staleTime: 5 * 60 * 1000 },
  );

  if (profile?.role === "owner" && location.pathname === "/dashboard") {
    return <Navigate to="/dashboard/select-venue" replace />;
  }

  return <Outlet />;
}
