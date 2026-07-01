export const QUERY_KEYS = {
  PROFILE: ['profile'] as const,
  ADMIN_VENUES: ['admin', 'venues'] as const,
  ADMIN_BOOKINGS: ['admin', 'bookings'] as const,
  ADMIN_OWNERS: ['admin', 'owners'] as const,
  SUPER_ADMINS: ['superadmin', 'admins'] as const,
  MY_VENUES: ['owner', 'my-venues'] as const,
  OWNER_ANALYTICS: (venueId: string) => ['owner', 'analytics', venueId] as const,
  OWNER_BOOKINGS: (venueId: string) => ['owner', 'bookings', venueId] as const,
  OWNER_AVAILABILITY: (venueId: string) => ['owner', 'availability', venueId] as const,
} as const;
