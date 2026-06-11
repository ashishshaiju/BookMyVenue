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
    DASHBOARD: '/dashboard',
    PROFILE: '/user/profile',
    SEARCH: '/search',
    VENUES: '/venues',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
} as const;
