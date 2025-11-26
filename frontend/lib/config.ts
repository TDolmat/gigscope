/**
 * Application Configuration
 * Centralized place for all app constants and environment variables
 */

// Base API URL
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// Environment detection
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// External links
export const EXTERNAL_LINKS = {
  BEFREE_CLUB: 'https://befreeclub.pl',
} as const;

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
    LOGIN: `${BASE_URL}/api/auth/login`,
    LOGOUT: `${BASE_URL}/api/auth/logout`,
    REFRESH: `${BASE_URL}/api/auth/refresh`,
  },
  
  // Admin endpoints
  ADMIN: {
    DASHBOARD_STATS: `${BASE_URL}/api/admin/dashboard/stats`,
    SETTINGS: `${BASE_URL}/api/admin/settings`,
    SETTINGS_APIFY_KEY: `${BASE_URL}/api/admin/settings/apify-key`,
    TEST: `${BASE_URL}/api/admin/test`,
    USERS: `${BASE_URL}/api/admin/users`,
    USER_PREFERENCES: (userId: number) => `${BASE_URL}/api/admin/users/${userId}/preferences`,
    USER_SUBSCRIPTION: (userId: number) => `${BASE_URL}/api/admin/users/${userId}/subscription`,
    SCRAPE: `${BASE_URL}/api/admin/scrape`,
    MAIL_TEST: `${BASE_URL}/api/admin/mail/test`,
    MAIL_SEND_OFFERS: `${BASE_URL}/api/admin/mail/send-offers`,
    MAIL_PREVIEW: `${BASE_URL}/api/admin/mail/preview`,
    MAIL_SEND_TEMPLATE: `${BASE_URL}/api/admin/mail/send-template`,
    // Manual runs
    MANUAL_SCRAPE_ALL: `${BASE_URL}/api/admin/manual-runs/scrape-all`,
    MANUAL_SEND_EMAILS: `${BASE_URL}/api/admin/manual-runs/send-emails`,
    MANUAL_SCRAPE_AND_SEND: `${BASE_URL}/api/admin/manual-runs/scrape-and-send`,
    // Logs
    LOGS: `${BASE_URL}/api/admin/logs`,
    LOGS_SCRAPE: `${BASE_URL}/api/admin/logs/scrape`,
    LOGS_MAIL: `${BASE_URL}/api/admin/logs/mail`,
  },

  // User endpoints
  USER: {
    SUBSCRIBE: `${BASE_URL}/api/user/subscribe`,
    PREFERENCES: (token: string) => `${BASE_URL}/api/user/preferences/${token}`,
    UNSUBSCRIBE: (token: string) => `${BASE_URL}/api/user/unsubscribe/${token}`,
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
  externalLinks: EXTERNAL_LINKS,
} as const;

export default config;

