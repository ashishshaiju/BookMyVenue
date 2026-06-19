import { INDIA_STATES } from './india';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3003';

// Storage Keys
const STORAGE_KEYS = {
  USER_ID: 'user_id',
  USER_NAME: 'user_name',
  USER_ROLE: 'user_role',
  IS_LOGGED_IN: 'isLoggedIn',
} as const;

// API Endpoints
const API_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout',
  DASHBOARD: '/dashboard',
  PROFILE: '/user/profile',
  SEARCH: '/search',
  VENUES: '/venues',
  MY_VENUES: '/venues/my-venues',
  VENUE_BY_ID: (id: string) => `/venues/${id}`,
  VENUE_SUBMIT: (id: string) => `/venues/${id}/submit`,
  UPLOAD_SIGNATURE: '/venues/upload-signature',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
} as const;

export { INDIA_STATES, API_ENDPOINTS, STORAGE_KEYS, API_BASE_URL };
