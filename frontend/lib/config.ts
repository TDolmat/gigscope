/**
 * Application Configuration
 * Centralized place for all app constants and environment variables
 */

// Base API URL
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// API Configuration
export const API_CONFIG = {
  BASE_URL,
  TIMEOUT: 30000, // 30 seconds
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
    CONFIG: `${BASE_URL}/admin/config`,
    TEST: `${BASE_URL}/admin/test`,
  },
  
  // Public endpoints
  PUBLIC: {
    CATEGORIES: `${BASE_URL}/api/categories`,
    TEST: `${BASE_URL}/api/test`,
  },
} as const;

// App Routes (frontend)
export const APP_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  ADMIN: '/admin',
} as const;

// Export for convenience
export const config = {
  api: API_CONFIG,
  endpoints: API_ENDPOINTS,
  routes: APP_ROUTES,
} as const;

export default config;

