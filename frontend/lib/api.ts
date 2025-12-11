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
      upwork_max_offers?: number;
    },
    authenticatedFetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>
  ): Promise<any> => {
    return apiFetch(API_ENDPOINTS.ADMIN.SETTINGS, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, authenticatedFetch);
  },

  // Get Apify API key (separate endpoint for security)
  getApifyKey: async (
    authenticatedFetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>
  ): Promise<any> => {
    return apiFetch<any>(API_ENDPOINTS.ADMIN.SETTINGS_APIFY_KEY, {}, authenticatedFetch);
  },

  // Update Apify API key (separate endpoint for security)
  updateApifyKey: async (
    apifyApiKey: string,
    authenticatedFetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>
  ): Promise<any> => {
    return apiFetch(API_ENDPOINTS.ADMIN.SETTINGS_APIFY_KEY, {
      method: 'PUT',
      body: JSON.stringify({
        apify_api_key: apifyApiKey,
      }),
    }, authenticatedFetch);
  },
};


// Admin Scrape API
export const adminScrapeApi = {
  // Test scrape with keywords
  testScrape: async (
    mustContain: string[],
    mayContain: string[],
    mustNotContain: string[],
    perPage: number,
    authenticatedFetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>
  ): Promise<any> => {
    return apiFetch(API_ENDPOINTS.ADMIN.SCRAPE, {
      method: 'POST',
      body: JSON.stringify({
        must_contain: mustContain,
        may_contain: mayContain,
        must_not_contain: mustNotContain,
        per_page: perPage,
      }),
    }, authenticatedFetch);
  },
};

// Admin Mail API
export const adminMailApi = {
  // Send test email
  sendTestEmail: async (
    email: string,
    authenticatedFetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>
  ): Promise<any> => {
    return apiFetch(API_ENDPOINTS.ADMIN.MAIL_TEST, {
      method: 'POST',
      body: JSON.stringify({ email }),
    }, authenticatedFetch);
  },

  // Trigger sending offer emails to all users
  sendUserOfferEmails: async (
    baseUrl?: string,
    circleUrl?: string,
    authenticatedFetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>
  ): Promise<any> => {
    return apiFetch(API_ENDPOINTS.ADMIN.MAIL_SEND_OFFERS, {
      method: 'POST',
      body: JSON.stringify({ 
        base_url: baseUrl,
        circle_url: circleUrl 
      }),
    }, authenticatedFetch);
  },

  // Get email preview
  getPreview: async (
    type: 'offers' | 'no_offers' | 'not_subscribed' | 'expired' | 'test',
    authenticatedFetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>
  ): Promise<any> => {
    return apiFetch(API_ENDPOINTS.ADMIN.MAIL_PREVIEW, {
      method: 'POST',
      body: JSON.stringify({ type }),
    }, authenticatedFetch);
  },

  // Send email with specific template
  sendTemplateEmail: async (
    type: 'offers' | 'no_offers' | 'not_subscribed' | 'expired' | 'test',
    email: string,
    authenticatedFetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>
  ): Promise<any> => {
    return apiFetch(API_ENDPOINTS.ADMIN.MAIL_SEND_TEMPLATE, {
      method: 'POST',
      body: JSON.stringify({ type, email }),
    }, authenticatedFetch);
  },
};

// Admin Logs API
export const adminLogsApi = {
  // Get all logs (scrape and mail together)
  getLogs: async (
    limit?: number,
    authenticatedFetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>
  ): Promise<any> => {
    const url = limit 
      ? `${API_ENDPOINTS.ADMIN.LOGS}?limit=${limit}` 
      : API_ENDPOINTS.ADMIN.LOGS;
    return apiFetch(url, {}, authenticatedFetch);
  },

  // Get scrape logs with pagination
  getScrapeLogs: async (
    page?: number,
    perPage?: number,
    authenticatedFetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>
  ): Promise<any> => {
    const params = new URLSearchParams();
    if (page) params.append('page', String(page));
    if (perPage) params.append('per_page', String(perPage));
    const url = `${API_ENDPOINTS.ADMIN.LOGS_SCRAPE}${params.toString() ? '?' + params.toString() : ''}`;
    return apiFetch(url, {}, authenticatedFetch);
  },

  // Get mail logs with pagination
  getMailLogs: async (
    page?: number,
    perPage?: number,
    authenticatedFetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>
  ): Promise<any> => {
    const params = new URLSearchParams();
    if (page) params.append('page', String(page));
    if (perPage) params.append('per_page', String(perPage));
    const url = `${API_ENDPOINTS.ADMIN.LOGS_MAIL}${params.toString() ? '?' + params.toString() : ''}`;
    return apiFetch(url, {}, authenticatedFetch);
  },
};

// Admin Manual Runs API
export const adminManualRunsApi = {
  // Scrape offers for all users
  scrapeAll: async (
    authenticatedFetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>
  ): Promise<any> => {
    return apiFetch(API_ENDPOINTS.ADMIN.MANUAL_SCRAPE_ALL, {
      method: 'POST',
      body: JSON.stringify({}),
    }, authenticatedFetch);
  },

  // Send emails to all users
  sendEmails: async (
    authenticatedFetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>
  ): Promise<any> => {
    return apiFetch(API_ENDPOINTS.ADMIN.MANUAL_SEND_EMAILS, {
      method: 'POST',
      body: JSON.stringify({}),
    }, authenticatedFetch);
  },

  // Scrape and send emails to all users
  scrapeAndSend: async (
    authenticatedFetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>
  ): Promise<any> => {
    return apiFetch(API_ENDPOINTS.ADMIN.MANUAL_SCRAPE_AND_SEND, {
      method: 'POST',
      body: JSON.stringify({}),
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

