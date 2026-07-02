// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3003';

// Storage Keys
export const STORAGE_KEYS = {
    USER_ID: 'user_id',
    USER_NAME: 'user_name',
    USER_ROLE: 'user_role',
    IS_LOGGED_IN: 'isLoggedIn',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    PROFILE: '/user/profile',
    DASHBOARD: '/dashboard',
    VENUES: '/venues',
    SEARCH: '/search',
    ADMIN_VENUES: '/venues/all',
    ADMIN_BOOKINGS: '/bookings/all',
    ADMIN_USERS: '/user/all',
    RBAC_ADMINS: '/role/admins',
    RBAC_PROMOTE: '/role/promote',
    RBAC_DEMOTE: '/role/demote',
    MY_VENUES: '/venues/my-venues',
    OWNER_ANALYTICS: '/owner/analytics',
    OWNER_BLOCK_DATES: '/owner',
    OWNER_VENUE_BOOKINGS: '/owner/venue',
    OWNER_OFFLINE_BOOKING: '/owner/bookings/offline',
} as const;
