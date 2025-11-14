// context/AuthContext.tsx
"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { API_ENDPOINTS, APP_ROUTES } from "@/lib/config";

type AuthContextType = {
  accessToken: string | null;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  authenticatedFetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// PRODUCTION CSRF TOKEN HANDLING (Currently disabled for development)
// ============================================================================
// To enable CSRF protection for production:
// 1. In backend/app.py, set: app.config["JWT_COOKIE_CSRF_PROTECT"] = True
// 2. Uncomment all the CSRF-related code blocks below (marked with PRODUCTION)
// 3. Remove the development versions of login/refresh functions
// ============================================================================

// PRODUCTION: Uncomment this function to extract CSRF tokens from response headers
// const extractCsrfToken = (response: Response): string | null => {
//   return response.headers.get("X-CSRF-TOKEN") || 
//          response.headers.get("X-CSRF-ACCESS-TOKEN") ||
//          response.headers.get("X-CSRF-REFRESH-TOKEN");
// };

// PRODUCTION: Uncomment this to store CSRF token in memory
// let csrfToken: string | null = null;

// PRODUCTION: Uncomment this helper to add CSRF header to requests
// const addCsrfHeader = (headers: Headers): Headers => {
//   if (csrfToken) {
//     headers.set("X-CSRF-TOKEN", csrfToken);
//   }
//   return headers;
// };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  // 1) Run once on app load: try to refresh using the cookie
  useEffect(() => {
    (async () => {
      try {
        // DEVELOPMENT VERSION (current)
        const res = await fetch(API_ENDPOINTS.AUTH.REFRESH, {
          method: "POST",
          credentials: "include", // sends refresh cookie
        });

        // PRODUCTION VERSION (uncomment and replace above when enabling CSRF):
        // const headers = new Headers();
        // addCsrfHeader(headers);
        // const res = await fetch(API_ENDPOINTS.AUTH.REFRESH, {
        //   method: "POST",
        //   credentials: "include",
        //   headers,
        // });

        if (res.ok) {
          const data = await res.json();
          setAccessToken(data.access_token);
          
          // PRODUCTION: Uncomment to extract and store CSRF token
          // const token = extractCsrfToken(res);
          // if (token) csrfToken = token;
        }
      } catch (err) {
        // ignore, user is just not logged in
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    // DEVELOPMENT VERSION (current)
    const res = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    // PRODUCTION VERSION (uncomment and replace above when enabling CSRF):
    // const headers = new Headers({ "Content-Type": "application/json" });
    // addCsrfHeader(headers);
    // const res = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
    //   method: "POST",
    //   headers,
    //   credentials: "include",
    //   body: JSON.stringify({ email, password }),
    // });

    if (!res.ok) {
      throw new Error("Login failed");
    }

    const data = await res.json();
    setAccessToken(data.access_token);
    
    // PRODUCTION: Uncomment to extract and store CSRF token
    // const token = extractCsrfToken(res);
    // if (token) csrfToken = token;
  }, []);

  const refreshToken = useCallback(async () => {
    // DEVELOPMENT VERSION (current)
    const res = await fetch(API_ENDPOINTS.AUTH.REFRESH, {
      method: "POST",
      credentials: "include",
    });

    // PRODUCTION VERSION (uncomment and replace above when enabling CSRF):
    // const headers = new Headers();
    // addCsrfHeader(headers);
    // const res = await fetch(API_ENDPOINTS.AUTH.REFRESH, {
    //   method: "POST",
    //   credentials: "include",
    //   headers,
    // });

    if (!res.ok) {
      throw new Error("Token refresh failed");
    }

    const data = await res.json();
    setAccessToken(data.access_token);
    
    // PRODUCTION: Uncomment to extract and store CSRF token
    // const token = extractCsrfToken(res);
    // if (token) csrfToken = token;
    
    return data.access_token as string;
  }, []);

  const authenticatedFetch = useCallback(
    async (input: RequestInfo, init: RequestInit = {}) => {
      let token = accessToken;

      const doRequest = async (tok: string | null) => {
        const headers = new Headers(init.headers || {});
        if (tok) headers.set("Authorization", `Bearer ${tok}`);
        
        // PRODUCTION: Uncomment to add CSRF token to authenticated requests
        // addCsrfHeader(headers);
        
        return fetch(input, { ...init, headers, credentials: "include" });
      };

      let res = await doRequest(token);

      if (res.status === 401) {
        try {
          token = await refreshToken();
          res = await doRequest(token);
        } catch (err) {
          setAccessToken(null);
          // PRODUCTION: Uncomment to clear CSRF token on auth failure
          // csrfToken = null;
        }
      }

      return res;
    },
    [accessToken, refreshToken]
  );

  const logout = useCallback(async () => {
    // DEVELOPMENT VERSION (current)
    await fetch(API_ENDPOINTS.AUTH.LOGOUT, {
      method: "POST",
      credentials: "include",
    });
    
    // PRODUCTION VERSION (uncomment and replace above when enabling CSRF):
    // const headers = new Headers();
    // addCsrfHeader(headers);
    // await fetch(API_ENDPOINTS.AUTH.LOGOUT, {
    //   method: "POST",
    //   credentials: "include",
    //   headers,
    // });
    
    setAccessToken(null);
    
    // PRODUCTION: Uncomment to clear CSRF token on logout
    // csrfToken = null;
  }, []);

  return (
    <AuthContext.Provider
      value={{ accessToken, initializing, login, logout, authenticatedFetch }}
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
