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
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new ApiError(response.status, `API Error: ${response.statusText}`);
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

// Config API (Admin)
export const configApi = {
  getConfig: async (): Promise<Record<string, any>> => {
    return apiFetch<Record<string, any>>(API_ENDPOINTS.ADMIN.CONFIG);
  },
  
  updateConfig: async (data: Record<string, any>): Promise<any> => {
    return apiFetch(API_ENDPOINTS.ADMIN.CONFIG, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Subscription API (placeholder for now)
export const subscriptionApi = {
  subscribe: async (email: string, categories: string[]): Promise<any> => {
    // TODO: Replace with actual endpoint when backend is ready
    return apiFetch('/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email, categories }),
    });
  },
};

