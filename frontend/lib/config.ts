/**
 * Application Configuration
 * Centralized place for all app constants and environment variables
 */

// Base API URL
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// Environment detection
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// API Configuration
export const API_CONFIG = {
  BASE_URL,
  TIMEOUT: 30000, // 30 seconds
  // CSRF protection is enabled in production (requires backend JWT_COOKIE_CSRF_PROTECT=True)
  CSRF_ENABLED: IS_PRODUCTION,
} as const;

// API Endpoints - Full URLs ready to use
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: `${BASE_URL}/auth/login`,
    LOGOUT: `${BASE_URL}/auth/logout`,
    REFRESH: `${BASE_URL}/auth/refresh`,
  },
  
  // Admin endpoints
  ADMIN: {
    DASHBOARD_STATS: `${BASE_URL}/admin/dashboard/stats`,
    SETTINGS: `${BASE_URL}/admin/settings`,
    SETTINGS_APIFY_KEY: `${BASE_URL}/admin/settings/apify-key`,
    TEST: `${BASE_URL}/admin/test`,
    USERS: `${BASE_URL}/admin/users`,
    USER_PREFERENCES: (userId: number) => `${BASE_URL}/admin/users/${userId}/preferences`,
    USER_SUBSCRIPTION: (userId: number) => `${BASE_URL}/admin/users/${userId}/subscription`,
    SCRAPE: `${BASE_URL}/admin/scrape`,
  },
  
  // Public endpoints
  PUBLIC: {
    CATEGORIES: `${BASE_URL}/api/categories`,
    TEST: `${BASE_URL}/api/test`,
  },

  // User endpoints
  USER: {
    SUBSCRIBE: `${BASE_URL}/user/subscribe`,
    PREFERENCES: (token: string) => `${BASE_URL}/user/preferences/${token}`,
    UNSUBSCRIBE: (token: string) => `${BASE_URL}/user/unsubscribe/${token}`,
  },
} as const;

// App Routes (frontend)
export const APP_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  ADMIN: '/admin',
  EMAIL_PREFERENCES: (token: string) => `/email-preferences/${token}`,
  UNSUBSCRIBE: (token: string) => `/unsubscribe/${token}`,
} as const;

// Export for convenience
export const config = {
  api: API_CONFIG,
  endpoints: API_ENDPOINTS,
  routes: APP_ROUTES,
} as const;

export default config;

