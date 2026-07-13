import { NavLink, useNavigate } from "react-router";
import {
  CalendarCheck,
  Calendar,
  BarChart2,
  Building2,
  Users,
  Shield,
  UserCog,
  AlertTriangle,
  LogOut,
  Star,
  ActivitySquare,
} from "lucide-react";
import { useApiQuery } from "../../hooks/useApi";
import { QUERY_KEYS } from "../../config/queryKeys";
import { API_ENDPOINTS } from "../../constants";
import type { UserProfile } from "../guards/AuthGuard";
import { cn } from "../../lib/utils";
import { axiosInstance } from "../../config/axios";
import { queryClient } from "../../config/queryClient";
import { Button } from "../ui/button";
import { useAppStore } from "../../store/useAppStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

type NavItem = {
  label: string;
  path: string | ((venueId: string | null) => string);
  icon: React.ElementType;
  roles: UserProfile["role"][];
};

interface MyVenue {
  _id: string;
  name: string;
  status: string;
}

interface MyVenuesResponse {
  count: number;
  venues: MyVenue[];
}

const NAV_CONFIG: NavItem[] = [
  // owner
  {
    label: "Bookings",
    path: (venueId) => `/dashboard/venue/${venueId}/bookings`,
    icon: CalendarCheck,
    roles: ["owner"],
  },
  {
    label: "Reviews",
    path: (venueId) => `/dashboard/venue/${venueId}/reviews`,
    icon: Star,
    roles: ["owner"],
  },
  {
    label: "Calendar",
    path: (venueId) => `/dashboard/venue/${venueId}/calendar`,
    icon: Calendar,
    roles: ["owner"],
  },
  {
    label: "Reports",
    path: (venueId) => `/dashboard/venue/${venueId}/reports`,
    icon: BarChart2,
    roles: ["owner"],
  },
  // admin
  {
    label: "Global Bookings",
    path: "/dashboard/bookings",
    icon: CalendarCheck,
    roles: ["admin", "superAdmin"],
  },
  {
    label: "Global Venues",
    path: "/dashboard/venues",
    icon: Building2,
    roles: ["admin", "superAdmin"],
  },
  {
    label: "Global Owners",
    path: "/dashboard/owners",
    icon: Users,
    roles: ["admin", "superAdmin"],
  },
  {
    label: "Moderation",
    path: "/dashboard/moderation",
    icon: AlertTriangle,
    roles: ["admin", "superAdmin"],
  },
  // superAdmin only
  {
    label: "Team",
    path: "/dashboard/team",
    icon: Shield,
    roles: ["superAdmin"],
  },
  {
    label: "Users",
    path: "/dashboard/users",
    icon: UserCog,
    roles: ["superAdmin"],
  },
  {
    label: "Activity Logs",
    path: "/dashboard/logs",
    icon: ActivitySquare,
    roles: ["superAdmin"],
  },
];

export function Sidebar() {
  const navigate = useNavigate();
  const { activeVenueId, setActiveVenue } = useAppStore();

  const { data: profile } = useApiQuery<UserProfile>(
    QUERY_KEYS.PROFILE,
    { method: "GET", url: API_ENDPOINTS.PROFILE },
    { staleTime: 5 * 60 * 1000 },
  );

  const { data: myVenuesData } = useApiQuery<MyVenuesResponse>(
    QUERY_KEYS.MY_VENUES,
    { method: "GET", url: API_ENDPOINTS.MY_VENUES },
    {
      staleTime: 5 * 60 * 1000,
      enabled: profile?.role === "owner",
    },
  );

  const handleSignOut = async () => {
    try {
      await axiosInstance.post(API_ENDPOINTS.LOGOUT);
    } catch {
      // ignore logout errors on client
    } finally {
      queryClient.clear();
      navigate("/login");
    }
  };

  const navItems = NAV_CONFIG.filter(
    (item) => profile && item.roles.includes(profile.role),
  );

  const venues = myVenuesData?.venues || [];

  return (
    <div className="flex h-screen w-64 flex-col bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] text-[var(--sidebar-text)]">
      {/* Brand */}
      <div className="flex h-20 items-center px-6">
        <h1 className="text-xl font-bold text-white tracking-tight">
          BookMyVenue
        </h1>
        <span className="ml-2 rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-300">
          Admin
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 px-4 py-4">
        {navItems.map((item) => {
          const isOwner = profile?.role === "owner";
          const isDisabled = isOwner && !activeVenueId;
          const toPath =
            typeof item.path === "function"
              ? item.path(activeVenueId)
              : item.path;

          return (
            <NavLink
              key={item.label}
              to={isDisabled ? "#" : toPath}
              className={({ isActive }) =>
                cn(
                  "group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive && !isDisabled
                    ? "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-text-active)]"
                    : "hover:bg-zinc-800 hover:text-white",
                  isDisabled &&
                    "opacity-50 cursor-not-allowed pointer-events-none",
                )
              }
            >
              <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Venue Switcher (Only for owners) */}
      {profile?.role === "owner" && (
        <div className="px-4 py-4">
          <Select
            value={activeVenueId || undefined}
            onValueChange={(newId) => {
              const venue = venues.find((v) => v._id === newId);
              if (venue) {
                setActiveVenue(newId, venue.name);
                navigate(`/dashboard/venue/${newId}/reports`);
              }
            }}
          >
            <SelectTrigger className="w-full bg-zinc-900/50 border-zinc-800 text-zinc-300">
              <SelectValue placeholder="Select Venue..." />
            </SelectTrigger>
            <SelectContent>
              {venues.map((venue) => (
                <SelectItem
                  key={venue._id}
                  value={venue._id}
                  disabled={venue.status !== "Approved"}
                >
                  {venue.name}{" "}
                  {venue.status !== "Approved" ? `(${venue.status})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* User Footer */}
      <div className="border-t border-[var(--sidebar-border)] p-4">
        <div className="flex items-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-sm font-medium text-white">
            {profile?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="ml-3 flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-white">
              {profile?.name}
            </p>
            <p className="truncate text-xs text-zinc-400 capitalize">
              {profile?.role}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
