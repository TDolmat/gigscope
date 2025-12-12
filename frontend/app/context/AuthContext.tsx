// context/AuthContext.tsx
"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { API_ENDPOINTS, API_CONFIG } from "@/lib/config";

// localStorage key for remember me
const REMEMBER_ME_KEY = "admin_remember_me";
const AUTH_STATE_KEY = "admin_auth_state";

type AuthContextType = {
  accessToken: string | null;
  initializing: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  authenticatedFetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// CSRF TOKEN HANDLING
// ============================================================================
// Automatically enabled in production (controlled by API_CONFIG.CSRF_ENABLED)
// Requires backend: JWT_COOKIE_CSRF_PROTECT = True (automatic in production)
// ============================================================================

// Extract CSRF tokens from response headers
const extractCsrfToken = (response: Response): string | null => {
  return response.headers.get("X-CSRF-TOKEN") || 
         response.headers.get("X-CSRF-ACCESS-TOKEN") ||
         response.headers.get("X-CSRF-REFRESH-TOKEN");
};

// Store CSRF token in memory (only used when CSRF_ENABLED=true)
let csrfToken: string | null = null;

// Add CSRF header to requests (only in production)
const addCsrfHeader = (headers: Headers): Headers => {
  if (API_CONFIG.CSRF_ENABLED && csrfToken) {
    headers.set("X-CSRF-TOKEN", csrfToken);
  }
  return headers;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  // Check if user is authenticated
  const isAuthenticated = accessToken !== null;

  // Helper to safely access localStorage
  const getStoredAuthState = (): boolean => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(AUTH_STATE_KEY) === "true";
    } catch {
      return false;
    }
  };

  const setStoredAuthState = (value: boolean): void => {
    if (typeof window === "undefined") return;
    try {
      if (value) {
        localStorage.setItem(AUTH_STATE_KEY, "true");
      } else {
        localStorage.removeItem(AUTH_STATE_KEY);
      }
    } catch {
      // Ignore localStorage errors
    }
  };

  const getRememberMe = (): boolean => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(REMEMBER_ME_KEY) === "true";
    } catch {
      return false;
    }
  };

  const setRememberMe = (value: boolean): void => {
    if (typeof window === "undefined") return;
    try {
      if (value) {
        localStorage.setItem(REMEMBER_ME_KEY, "true");
      } else {
        localStorage.removeItem(REMEMBER_ME_KEY);
      }
    } catch {
      // Ignore localStorage errors
    }
  };

  // 1) Run once on app load: try to refresh using the cookie
  useEffect(() => {
    (async () => {
      // Always try to refresh - cookies handle persistence
      // localStorage is only for immediate UI feedback
      try {
        const headers = new Headers();
        addCsrfHeader(headers);
        
        const res = await fetch(API_ENDPOINTS.AUTH.REFRESH, {
          method: "POST",
          credentials: "include", // sends refresh cookie
          headers,
        });

        if (res.ok) {
          const data = await res.json();
          setAccessToken(data.access_token);
          setStoredAuthState(true);
          
          // Extract and store CSRF token (only matters in production)
          if (API_CONFIG.CSRF_ENABLED) {
            const token = extractCsrfToken(res);
            if (token) csrfToken = token;
          }
        } else {
          // Clear stored state if refresh failed
          setStoredAuthState(false);
          setRememberMe(false);
        }
      } catch (err) {
        // ignore, user is just not logged in
        setStoredAuthState(false);
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string, rememberMe: boolean = true) => {
    const headers = new Headers({ "Content-Type": "application/json" });
    addCsrfHeader(headers);
    
    const res = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify({ 
        email, 
        password,
        remember_me: rememberMe  // Tell backend whether to set persistent or session cookie
      }),
    });

    if (!res.ok) {
      throw new Error("Login failed");
    }

    const data = await res.json();
    setAccessToken(data.access_token);
    
    // Store remember me preference and auth state
    setRememberMe(rememberMe);
    setStoredAuthState(true);
    
    // Extract and store CSRF token (only matters in production)
    if (API_CONFIG.CSRF_ENABLED) {
      const token = extractCsrfToken(res);
      if (token) csrfToken = token;
    }
  }, []);

  const refreshToken = useCallback(async () => {
    const headers = new Headers();
    addCsrfHeader(headers);
    
    const res = await fetch(API_ENDPOINTS.AUTH.REFRESH, {
      method: "POST",
      credentials: "include",
      headers,
    });

    if (!res.ok) {
      throw new Error("Token refresh failed");
    }

    const data = await res.json();
    setAccessToken(data.access_token);
    
    // Extract and store CSRF token (only matters in production)
    if (API_CONFIG.CSRF_ENABLED) {
      const token = extractCsrfToken(res);
      if (token) csrfToken = token;
    }
    
    return data.access_token as string;
  }, []);

  const authenticatedFetch = useCallback(
    async (input: RequestInfo, init: RequestInit = {}) => {
      let token = accessToken;

      const doRequest = async (tok: string | null) => {
        const headers = new Headers(init.headers || {});
        if (tok) headers.set("Authorization", `Bearer ${tok}`);
        
        // Add CSRF token in production
        addCsrfHeader(headers);
        
        return fetch(input, { ...init, headers, credentials: "include" });
      };

      let res = await doRequest(token);

      if (res.status === 401) {
        try {
          token = await refreshToken();
          res = await doRequest(token);
        } catch (err) {
          setAccessToken(null);
          // Clear CSRF token on auth failure
          if (API_CONFIG.CSRF_ENABLED) {
            csrfToken = null;
          }
        }
      }

      return res;
    },
    [accessToken, refreshToken]
  );

  const logout = useCallback(async () => {
    const headers = new Headers();
    addCsrfHeader(headers);
    
    await fetch(API_ENDPOINTS.AUTH.LOGOUT, {
      method: "POST",
      credentials: "include",
      headers,
    });
    
    setAccessToken(null);
    
    // Clear localStorage auth state
    setStoredAuthState(false);
    setRememberMe(false);
    
    // Clear CSRF token on logout
    if (API_CONFIG.CSRF_ENABLED) {
      csrfToken = null;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ accessToken, initializing, isAuthenticated, login, logout, authenticatedFetch }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
