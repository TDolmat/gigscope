/**
 * Application Configuration
 * Centralized place for all app constants and environment variables
 */

// Base API URL
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

// Environment detection
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// External links
export const EXTERNAL_LINKS = {
  BE_FREE_CLUB: 'https://www.befreeclub.pro/',
  BE_FREE_CLUB_JOIN: 'https://www.befreeclub.pl',
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
    SCRAPE: `${BASE_URL}/admin/scrape`,
    SCRAPE_ALL: `${BASE_URL}/admin/scrape/all`,
    SCRAPE_TEST_KEYWORDS: `${BASE_URL}/admin/scrape/test-keywords`,
    SCRAPE_OPENAI_SETTINGS: `${BASE_URL}/admin/scrape/openai-settings`,
    SCRAPE_PLATFORMS: `${BASE_URL}/admin/scrape/platforms`,
    SCRAPE_PLATFORM_TOGGLE: (platformId: string) => `${BASE_URL}/admin/scrape/platforms/${platformId}/toggle`,
    MAIL_TEST: `${BASE_URL}/admin/mail/test`,
    MAIL_SEND_OFFERS: `${BASE_URL}/admin/mail/send-offers`,
    MAIL_PREVIEW: `${BASE_URL}/admin/mail/preview`,
    MAIL_SEND_TEMPLATE: `${BASE_URL}/admin/mail/send-template`,
    // Manual runs
    MANUAL_SCRAPE_ALL: `${BASE_URL}/admin/manual-runs/scrape-all`,
    MANUAL_SEND_EMAILS: `${BASE_URL}/admin/manual-runs/send-emails`,
    MANUAL_SCRAPE_AND_SEND: `${BASE_URL}/admin/manual-runs/scrape-and-send`,
    // Logs
    LOGS: `${BASE_URL}/admin/logs`,
    LOGS_SCRAPE: `${BASE_URL}/admin/logs/scrape`,
    LOGS_MAIL: `${BASE_URL}/admin/logs/mail`,
    // Mail history
    MAIL_HISTORY: `${BASE_URL}/admin/mail-history`,
    MAIL_HISTORY_DATE: (date: string) => `${BASE_URL}/admin/mail-history/${date}`,
    MAIL_HISTORY_PREVIEW: (emailId: number) => `${BASE_URL}/admin/mail-history/preview/${emailId}`,
    // Users
    USERS: `${BASE_URL}/admin/users`,
    USER: (userId: number) => `${BASE_URL}/admin/users/${userId}`,
    USER_PREFERENCES: (userId: number) => `${BASE_URL}/admin/users/${userId}/preferences`,
    USER_TOGGLE_SUBSCRIPTION: (userId: number) => `${BASE_URL}/admin/users/${userId}/toggle-subscription`,
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
  externalLinks: EXTERNAL_LINKS,
} as const;

export default config;

