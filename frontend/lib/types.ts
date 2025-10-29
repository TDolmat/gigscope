// Type definitions for the application

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface SubscriptionFormData {
  email: string;
  categories: string[];
}

export interface ConfigData {
  CATEGORIES?: string[];
  PLATFORMS?: string[];
  [key: string]: any;
}

