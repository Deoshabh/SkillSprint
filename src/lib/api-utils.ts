/**
 * API Utilities - Standardized patterns for API development
 * 
 * Provides consistent patterns for request handling, validation, 
 * error management, and response formatting across all API routes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { 
  createAppError, 
  createValidationError, 
  createAuthError, 
  createPermissionError,
  createNotFoundError,
  handleApiError,
  ErrorType 
} from '@/lib/error-handling';
import { addSecurityHeaders, validateRequest } from '@/lib/auth-utils';
import { z } from 'zod';

/**
 * Standard API response interface
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    timestamp: string;
    requestId?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

/**
 * API handler configuration
 */
export interface ApiHandlerConfig {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  rateLimited?: boolean;
  validateSchema?: z.ZodSchema;
  requestId?: string;
}

/**
 * Enhanced request context
 */
export interface RequestContext {
  request: NextRequest;
  session?: any;
  user?: any;
  body?: any;
  params?: Record<string, string>;
  query?: Record<string, string>;
  requestId: string;
  sessionId?: string;
}

/**
 * Generate unique request ID for tracking
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extract query parameters from request URL
 */
export function extractQueryParams(request: NextRequest): Record<string, string> {
  const url = new URL(request.url);
  const params: Record<string, string> = {};
  
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  
  return params;
}

/**
 * Parse and validate request body with schema
 */
export async function parseRequestBody<T>(
  request: NextRequest,
  schema?: z.ZodSchema<T>
): Promise<T> {
  try {
    const contentType = request.headers.get('content-type') || '';
    let body: any;

    if (contentType.includes('application/json')) {
      body = await request.json();
    } else if (contentType.includes('multipart/form-data')) {
      body = await request.formData();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries());
    } else {
      throw createValidationError('Unsupported content type');
    }

    if (schema) {
      const validation = schema.safeParse(body);
      if (!validation.success) {
        const errors = validation.error.errors
          .map(err => `${err.path.join('.')}: ${err.message}`)
          .join(', ');
        throw createValidationError(`Validation failed: ${errors}`);
      }
      return validation.data;
    }

    return body;
  } catch (error) {
    if (error instanceof Error && error.name === 'AppError') {
      throw error;
    }
    throw createValidationError('Invalid request body format');
  }
}

/**
 * Create standardized API response
 */
export function createApiResponse<T>(
  data?: T,
  message?: string,
  meta?: Partial<ApiResponse<T>['meta']>,
  preventCache: boolean = false
): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    ...(data !== undefined && { data }),
    ...(message && { message }),
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };

  return addSecurityHeaders(NextResponse.json(response), preventCache);
}

/**
 * Create paginated API response
 */
export function createPaginatedResponse<T>(
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
  },
  message?: string
): NextResponse {
  const totalPages = Math.ceil(pagination.total / pagination.limit);
  
  return createApiResponse(data, message, {
    pagination: {
      ...pagination,
      totalPages,
    },
  });
}

/**
 * Enhanced API handler wrapper with consistent patterns
 */
export function withApiHandler<T = any>(
  handler: (context: RequestContext) => Promise<NextResponse>,
  config: ApiHandlerConfig = {}
) {
  return async (request: NextRequest, params?: any): Promise<NextResponse> => {
    const requestId = generateRequestId();
    const startTime = Date.now();
    
    try {
      // Create request context
      const context: RequestContext = {
        request,
        params: params?.params || {},
        query: extractQueryParams(request),
        requestId,
      };

      // Authentication check
      if (config.requireAuth || config.requireAdmin) {
        const authResult = await validateRequest(request);
        
        if (!authResult.isAuthenticated || !authResult.user) {
          throw createAuthError();
        }
          context.sessionId = authResult.sessionId;
        context.user = authResult.user;
        
        // Admin check
        if (config.requireAdmin && authResult.user.role !== 'admin') {
          throw createPermissionError('admin access');
        }
      }

      // Parse request body if needed
      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        context.body = await parseRequestBody(request, config.validateSchema);
      }

      // Execute handler
      const response = await handler(context);
      
      // Log successful request
      const duration = Date.now() - startTime;
      console.log(`[API] ${request.method} ${request.url} - ${response.status} (${duration}ms) [${requestId}]`);
      
      return response;
      
    } catch (error) {
      // Log error
      const duration = Date.now() - startTime;
      console.error(`[API] ${request.method} ${request.url} - ERROR (${duration}ms) [${requestId}]:`, error);
      
      // Handle error with standardized response
      return handleApiError(error, { 
        requestId, 
        method: request.method, 
        url: request.url,
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      });
    }
  };
}

/**
 * Validation schemas for common use cases
 */
export const commonSchemas = {
  // Pagination
  pagination: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  }),

  // User identification
  userId: z.object({
    userId: z.string().min(1, 'User ID is required'),
  }),

  // Course identification
  courseId: z.object({
    courseId: z.string().min(1, 'Course ID is required'),
  }),

  // Email validation
  email: z.object({
    email: z.string().email('Invalid email format'),
  }),

  // Feedback submission
  feedback: z.object({
    type: z.enum(['bug', 'feature', 'general', 'course']),
    subject: z.string().min(1, 'Subject is required').max(200),
    message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
    courseId: z.string().optional(),
  }),

  // Password change
  passwordChange: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/, 
        'Password must contain uppercase, lowercase, number, and special character'),
  }),

  // Course creation/update
  course: z.object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().min(1, 'Description is required').max(2000),
    category: z.string().min(1, 'Category is required'),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    duration: z.number().min(1, 'Duration must be positive'),
    visibility: z.enum(['public', 'private', 'shared']).default('public'),
    tags: z.array(z.string()).default([]),
  }),
};

/**
 * Helper for handling file uploads
 */
export async function handleFileUpload(
  request: NextRequest,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
    required?: boolean;
  } = {}
): Promise<File | null> {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    if (options.required) {
      throw createValidationError('File is required');
    }
    return null;
  }

  // Check file size
  if (options.maxSize && file.size > options.maxSize) {
    throw createValidationError(
      `File too large. Maximum size: ${(options.maxSize / 1024 / 1024).toFixed(1)}MB`
    );
  }

  // Check file type
  if (options.allowedTypes) {
    const fileExtension = file.name.toLowerCase().split('.').pop();
    if (!fileExtension || !options.allowedTypes.includes(`.${fileExtension}`)) {
      throw createValidationError(
        `Invalid file type. Allowed: ${options.allowedTypes.join(', ')}`
      );
    }
  }

  return file;
}

/**
 * Helper for database operations with error handling
 */
export async function withDatabase<T>(
  operation: () => Promise<T>,
  errorMessage: string = 'Database operation failed'
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error(`Database error: ${errorMessage}`, error);
    throw createAppError(
      ErrorType.DATABASE,
      errorMessage,
      {
        originalError: error instanceof Error ? error : new Error(String(error)),
      }
    );
  }
}
