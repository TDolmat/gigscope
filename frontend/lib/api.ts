import { API_ENDPOINTS } from './config';

// Generic API error class
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Generic fetch wrapper with error handling
async function apiFetch<T>(
  url: string,
  options?: RequestInit,
  fetchFn: (input: RequestInfo, init?: RequestInit) => Promise<Response> = fetch
): Promise<T> {
  try {
    const response = await fetchFn(url, {
      ...options,
      credentials: 'include', // Include cookies (JWT) in requests
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      // Try to get error message from response body
      let errorMessage = `API Error: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        // If we can't parse JSON, use default message
      }
      
      throw new ApiError(response.status, errorMessage);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new Error('Network error: Unable to connect to the server');
  }
}

// Categories API
export const categoriesApi = {
  getCategories: async (): Promise<string[]> => {
    const data = await apiFetch<any>(API_ENDPOINTS.PUBLIC.CATEGORIES);
    
    // Handle if backend returns string representation of array
    if (typeof data === 'string') {
      try {
        // Convert Python-style list string to proper JSON
        const jsonString = data.replace(/'/g, '"');
        return JSON.parse(jsonString);
      } catch (e) {
        console.error('Failed to parse categories string:', data);
        return [];
      }
    }
    
    // If already an array, return it
    return Array.isArray(data) ? data : [];
  },
};

// Admin Dashboard API
export const adminDashboardApi = {
  // Get dashboard statistics
  getStats: async (
    authenticatedFetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>
  ): Promise<any> => {
    return apiFetch<any>(API_ENDPOINTS.ADMIN.DASHBOARD_STATS, {}, authenticatedFetch);
  },
};

// Admin Settings API
export const adminSettingsApi = {
  // Get settings
  getSettings: async (
    authenticatedFetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>
  ): Promise<any> => {
    return apiFetch<any>(API_ENDPOINTS.ADMIN.SETTINGS, {}, authenticatedFetch);
  },

  // Update settings
  updateSettings: async (
    data: {
      enabled_platforms?: string[];
      email_frequency?: string;
      email_daytime?: string;
      email_max_offers?: number;
      mail_api_key?: string;
      mail_sender_email?: string;
    },
    authenticatedFetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>
  ): Promise<any> => {
    return apiFetch(API_ENDPOINTS.ADMIN.SETTINGS, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, authenticatedFetch);
  },
};

// Admin Users API
export const adminUsersApi = {
  // Get all users
  getUsers: async (
    authenticatedFetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>
  ): Promise<any[]> => {
    return apiFetch<any[]>(API_ENDPOINTS.ADMIN.USERS, {}, authenticatedFetch);
  },

  // Update user preferences
  updatePreferences: async (
    userId: number,
    mustInclude: string[],
    canInclude: string[],
    cannotInclude: string[],
    authenticatedFetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>
  ): Promise<any> => {
    return apiFetch(API_ENDPOINTS.ADMIN.USER_PREFERENCES(userId), {
      method: 'PUT',
      body: JSON.stringify({
        must_include_keywords: mustInclude,
        can_include_keywords: canInclude,
        cannot_include_keywords: cannotInclude,
      }),
    }, authenticatedFetch);
  },

  // Set/update user subscription
  setSubscription: async (
    userId: number,
    expiresAt: string,
    authenticatedFetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>
  ): Promise<any> => {
    return apiFetch(API_ENDPOINTS.ADMIN.USER_SUBSCRIPTION(userId), {
      method: 'POST',
      body: JSON.stringify({
        expires_at: expiresAt,
      }),
    }, authenticatedFetch);
  },

  // Delete user subscription
  deleteSubscription: async (
    userId: number,
    authenticatedFetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>
  ): Promise<any> => {
    return apiFetch(API_ENDPOINTS.ADMIN.USER_SUBSCRIPTION(userId), {
      method: 'DELETE',
    }, authenticatedFetch);
  },
};

// User Subscription API
export const userApi = {
  // Subscribe to newsletter with keyword preferences
  subscribe: async (
    email: string,
    mustContain: string,
    mayContain: string,
    mustNotContain: string
  ): Promise<any> => {
    return apiFetch(API_ENDPOINTS.USER.SUBSCRIBE, {
      method: 'POST',
      body: JSON.stringify({
        email,
        mustContain,
        mayContain,
        mustNotContain,
      }),
    });
  },

  // Get user preferences by token
  getPreferences: async (token: string): Promise<any> => {
    return apiFetch(API_ENDPOINTS.USER.PREFERENCES(token), {
      method: 'GET',
    });
  },

  // Update user preferences by token
  updatePreferences: async (
    token: string,
    mustContain: string,
    mayContain: string,
    mustNotContain: string
  ): Promise<any> => {
    return apiFetch(API_ENDPOINTS.USER.PREFERENCES(token), {
      method: 'PUT',
      body: JSON.stringify({
        mustContain,
        mayContain,
        mustNotContain,
      }),
    });
  },

  // Get unsubscribe info
  getUnsubscribeInfo: async (token: string): Promise<any> => {
    return apiFetch(API_ENDPOINTS.USER.UNSUBSCRIBE(token), {
      method: 'GET',
    });
  },

  // Unsubscribe from newsletter
  unsubscribe: async (token: string): Promise<any> => {
    return apiFetch(API_ENDPOINTS.USER.UNSUBSCRIBE(token), {
      method: 'POST',
    });
  },
};

