// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3005/api';

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
    PROFILE: '/auth/profile',
    LOGOUT: '/auth/logout',
    DASHBOARD: '/dashboard',
    VENUES: '/venues',
    SEARCH: '/search',
} as const;
