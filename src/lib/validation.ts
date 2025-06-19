/**
 * 
 * 
 * Enhanced TypeScript Utilities and Validation Schemas
 * 
 * Provides type-safe utilities, validation schemas, and helper functions
 * to improve type safety and reduce boilerplate code across the application.
 */

import { z } from 'zod';
import type { 
  UserProfile, 
  Course, 
  Module, 
  VideoLink, 
  FeedbackItem, 
  CourseDocument,
  DailyTask,
  Badge,
} from './types';

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Make specific properties optional while keeping others required
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific properties required while keeping others optional
 */
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Extract the keys of an object that are of a specific type
 */
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

/**
 * Create a type with only the specified keys from the original type
 */
export type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

/**
 * API response wrapper type
 */
export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  timestamp: string;
};

/**
 * Paginated response type
 */
export type PaginatedResponse<T> = ApiResponse<{
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}>;

/**
 * Filter options for lists
 */
export type FilterOptions<T> = {
  [K in keyof T]?: T[K] | T[K][] | { min?: T[K]; max?: T[K] };
} & {
  search?: string;
  sortBy?: keyof T;
  sortOrder?: 'asc' | 'desc';
};

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Common validation schemas
 */
export const commonSchemas = {
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .regex(/^(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .regex(/^(?=.*\d)/, 'Password must contain at least one number')
    .regex(/^(?=.*[!@#$%^&*(),.?":{}|<>])/, 'Password must contain at least one special character'),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters'),
  id: z.string().min(1, 'ID is required'),
  url: z.string().url('Invalid URL format'),
  positiveNumber: z.number().positive('Must be a positive number'),
  nonNegativeNumber: z.number().min(0, 'Must be non-negative'),
  phoneNumber: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format'),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
};

/**
 * User validation schemas
 */
export const userSchemas = {
  register: z.object({
    name: commonSchemas.name,
    email: commonSchemas.email,
    password: commonSchemas.password,
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }),

  login: z.object({
    email: commonSchemas.email,
    password: z.string().min(1, 'Password is required'),
  }),

  updateProfile: z.object({
    name: commonSchemas.name.optional(),
    avatarUrl: commonSchemas.url.optional(),
    learningPreferences: z.object({
      tracks: z.array(z.string()).optional(),
      language: z.string().optional(),
    }).optional(),
  }),

  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: commonSchemas.password,
    confirmPassword: z.string(),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }),
};

/**
 * Course validation schemas
 */
export const courseSchemas = {
  create: z.object({
    title: z.string()
      .min(3, 'Title must be at least 3 characters')
      .max(100, 'Title must not exceed 100 characters'),
    description: z.string()
      .min(10, 'Description must be at least 10 characters')
      .max(1000, 'Description must not exceed 1000 characters'),
    category: z.string().min(1, 'Category is required'),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    estimatedHours: commonSchemas.nonNegativeNumber.optional(),
    tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed').optional(),
    imageUrl: commonSchemas.url.optional(),
  }),

  update: z.object({
    title: z.string()
      .min(3, 'Title must be at least 3 characters')
      .max(100, 'Title must not exceed 100 characters')
      .optional(),
    description: z.string()
      .min(10, 'Description must be at least 10 characters')
      .max(1000, 'Description must not exceed 1000 characters')
      .optional(),
    category: z.string().min(1, 'Category is required').optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    estimatedHours: commonSchemas.nonNegativeNumber.optional(),
    tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed').optional(),
    imageUrl: commonSchemas.url.optional(),
    status: z.enum(['draft', 'pending', 'published', 'rejected', 'archived']).optional(),
  }),

  module: z.object({
    title: z.string()
      .min(3, 'Module title must be at least 3 characters')
      .max(100, 'Module title must not exceed 100 characters'),
    description: z.string().max(500, 'Description must not exceed 500 characters').optional(),
    contentType: z.enum(['video', 'markdown', 'pdf', 'quiz', 'assignment', 'text']),
    contentUrl: commonSchemas.url.optional(),
    contentData: z.string().optional(),
    estimatedTime: z.string().min(1, 'Estimated time is required'),
    subtopics: z.array(z.string()).optional(),
    practiceTask: z.string().optional(),
  }),
};

/**
 * Video link validation schema
 */
export const videoLinkSchema = z.object({
  langCode: z.string().min(2, 'Language code must be at least 2 characters'),
  langName: z.string().min(2, 'Language name must be at least 2 characters'),
  youtubeEmbedUrl: commonSchemas.url,
  title: z.string().min(1, 'Title is required'),
  creator: z.string().optional(),
  notes: z.string().optional(),
  isPlaylist: z.boolean().optional(),
});

/**
 * Feedback validation schema
 */
export const feedbackSchema = z.object({
  type: z.enum(['general', 'course', 'bug', 'feature_request']),
  subject: z.string()
    .min(5, 'Subject must be at least 5 characters')
    .max(100, 'Subject must not exceed 100 characters'),
  message: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must not exceed 2000 characters'),
  courseId: z.string().optional(),
});

/**
 * Daily task validation schema
 */
export const dailyTaskSchema = z.object({
  title: z.string()
    .min(3, 'Task title must be at least 3 characters')
    .max(100, 'Task title must not exceed 100 characters'),
  description: z.string().max(300, 'Description must not exceed 300 characters').optional(),
  courseId: commonSchemas.id.optional(),
  moduleId: commonSchemas.id.optional(),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  type: z.enum(['coursework', 'quiz', 'review', 'break', 'meeting', 'personal']),
  icon: z.string().optional(),
});

/**
 * File upload validation schema
 */
export const fileUploadSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number().max(10 * 1024 * 1024, 'File size must not exceed 10MB'), // 10MB limit
  fileType: z.string().min(1, 'File type is required'),
  uploadType: z.enum(['avatar', 'course', 'content', 'general']),
});

// ============================================================================
// TYPE GUARDS AND UTILITIES
// ============================================================================

/**
 * Type guard to check if a value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard to check if a value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Type guard to check if a value is a valid email
 */
export function isValidEmail(value: unknown): value is string {
  return typeof value === 'string' && commonSchemas.email.safeParse(value).success;
}

/**
 * Type guard to check if a value is a valid URL
 */
export function isValidUrl(value: unknown): value is string {
  return typeof value === 'string' && commonSchemas.url.safeParse(value).success;
}

/**
 * Type guard to check if an object has a specific property
 */
export function hasProperty<T extends object, K extends string>(
  obj: T,
  prop: K
): obj is T & Record<K, unknown> {
  return prop in obj;
}

/**
 * Safe property access utility
 */
export function safeGet<T, K extends keyof T>(obj: T | null | undefined, key: K): T[K] | undefined {
  return obj?.[key];
}

/**
 * Deep clone utility for objects
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  if (typeof obj === 'object') {
    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
  return obj;
}

/**
 * Remove undefined values from an object
 */
export function removeUndefined<T extends object>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Create a debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Create a throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Generate a random ID
 */
export function generateId(prefix?: string): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substr(2, 9);
  return prefix ? `${prefix}_${timestamp}_${randomPart}` : `${timestamp}_${randomPart}`;
}

/**
 * Validate and parse JSON safely
 */
export function safeJsonParse<T = any>(jsonString: string): { success: boolean; data?: T; error?: string } {
  try {
    const data = JSON.parse(jsonString);
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Invalid JSON' 
    };
  }
}

/**
 * Create a type-safe event emitter
 */
export class TypedEventEmitter<T extends Record<string, any[]>> {
  private listeners: { [K in keyof T]?: Array<(...args: T[K]) => void> } = {};

  on<K extends keyof T>(event: K, listener: (...args: T[K]) => void): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(listener);
  }

  off<K extends keyof T>(event: K, listener: (...args: T[K]) => void): void {
    if (!this.listeners[event]) return;
    const index = this.listeners[event]!.indexOf(listener);
    if (index !== -1) {
      this.listeners[event]!.splice(index, 1);
    }
  }

  emit<K extends keyof T>(event: K, ...args: T[K]): void {
    if (!this.listeners[event]) return;
    this.listeners[event]!.forEach(listener => listener(...args));
  }
}

/**
 * Async retry utility with exponential backoff
 */
export async function retry<T>(
  operation: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delay?: number;
    backoffFactor?: number;
    maxDelay?: number;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoffFactor = 2,
    maxDelay = 10000,
  } = options;

  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      const currentDelay = Math.min(delay * Math.pow(backoffFactor, attempt - 1), maxDelay);
      await new Promise(resolve => setTimeout(resolve, currentDelay));
    }
  }
  
  throw lastError!;
}

/**
 * Create a cancelable promise
 */
export function createCancelablePromise<T>(
  promise: Promise<T>
): { promise: Promise<T>; cancel: () => void } {
  let isCanceled = false;
  
  const cancelablePromise = new Promise<T>((resolve, reject) => {
    promise
      .then(value => {
        if (!isCanceled) {
          resolve(value);
        }
      })
      .catch(error => {
        if (!isCanceled) {
          reject(error);
        }
      });
  });
  
  return {
    promise: cancelablePromise,
    cancel: () => {
      isCanceled = true;
    },
  };
}
