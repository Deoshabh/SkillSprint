/**
 * Centralized Error Handling System for SkillSprint
 * 
 * Provides standardized error handling patterns, logging, and user-friendly error messages
 * for consistent error management across the entire application.
 */

import { NextResponse } from 'next/server';

/**
 * Standard error types used throughout the application
 */
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  DATABASE = 'DATABASE_ERROR',
  EXTERNAL_API = 'EXTERNAL_API_ERROR',
  NETWORK = 'NETWORK_ERROR',
  INTERNAL = 'INTERNAL_ERROR',
  USER_INPUT = 'USER_INPUT_ERROR',
  FILE_UPLOAD = 'FILE_UPLOAD_ERROR',
  PERMISSION = 'PERMISSION_ERROR',
}

/**
 * Error severity levels for logging and alerting
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Standard application error interface
 */
export interface AppError extends Error {
  type: ErrorType;
  code?: string;
  statusCode?: number;
  severity: ErrorSeverity;
  context?: Record<string, any>;
  userMessage?: string;
  originalError?: Error;
  timestamp: Date;
  userId?: string;
  requestId?: string;
}

/**
 * Creates a standardized application error
 */
export function createAppError(
  type: ErrorType,
  message: string,
  options?: {
    code?: string;
    statusCode?: number;
    severity?: ErrorSeverity;
    context?: Record<string, any>;
    userMessage?: string;
    originalError?: Error;
    userId?: string;
    requestId?: string;
  }
): AppError {
  const error = new Error(message) as AppError;
  
  error.type = type;
  error.code = options?.code;
  error.statusCode = options?.statusCode || getDefaultStatusCode(type);
  error.severity = options?.severity || getDefaultSeverity(type);
  error.context = options?.context;
  error.userMessage = options?.userMessage || getUserFriendlyMessage(type, message);
  error.originalError = options?.originalError;
  error.timestamp = new Date();
  error.userId = options?.userId;
  error.requestId = options?.requestId;
  
  return error;
}

/**
 * Get default HTTP status code for error type
 */
function getDefaultStatusCode(type: ErrorType): number {
  switch (type) {
    case ErrorType.VALIDATION:
    case ErrorType.USER_INPUT:
      return 400;
    case ErrorType.AUTHENTICATION:
      return 401;
    case ErrorType.AUTHORIZATION:
    case ErrorType.PERMISSION:
      return 403;
    case ErrorType.NOT_FOUND:
      return 404;
    case ErrorType.RATE_LIMIT:
      return 429;
    case ErrorType.DATABASE:
    case ErrorType.INTERNAL:
      return 500;
    case ErrorType.EXTERNAL_API:
    case ErrorType.NETWORK:
      return 502;
    case ErrorType.FILE_UPLOAD:
      return 413;
    default:
      return 500;
  }
}

/**
 * Get default severity for error type
 */
function getDefaultSeverity(type: ErrorType): ErrorSeverity {
  switch (type) {
    case ErrorType.VALIDATION:
    case ErrorType.USER_INPUT:
    case ErrorType.NOT_FOUND:
      return ErrorSeverity.LOW;
    case ErrorType.AUTHENTICATION:
    case ErrorType.AUTHORIZATION:
    case ErrorType.PERMISSION:
    case ErrorType.FILE_UPLOAD:
      return ErrorSeverity.MEDIUM;
    case ErrorType.RATE_LIMIT:
    case ErrorType.EXTERNAL_API:
    case ErrorType.NETWORK:
      return ErrorSeverity.MEDIUM;
    case ErrorType.DATABASE:
    case ErrorType.INTERNAL:
      return ErrorSeverity.HIGH;
    default:
      return ErrorSeverity.MEDIUM;
  }
}

/**
 * Generate user-friendly error messages
 */
function getUserFriendlyMessage(type: ErrorType, originalMessage: string): string {
  switch (type) {
    case ErrorType.VALIDATION:
    case ErrorType.USER_INPUT:
      return 'Please check your input and try again.';
    case ErrorType.AUTHENTICATION:
      return 'Please log in to continue.';
    case ErrorType.AUTHORIZATION:
    case ErrorType.PERMISSION:
      return 'You do not have permission to perform this action.';
    case ErrorType.NOT_FOUND:
      return 'The requested resource was not found.';
    case ErrorType.RATE_LIMIT:
      return 'Too many requests. Please wait a moment and try again.';
    case ErrorType.DATABASE:
      return 'A database error occurred. Please try again later.';
    case ErrorType.EXTERNAL_API:
      return 'An external service is temporarily unavailable. Please try again later.';
    case ErrorType.NETWORK:
      return 'Network error. Please check your connection and try again.';
    case ErrorType.FILE_UPLOAD:
      return 'File upload failed. Please check the file size and format.';
    case ErrorType.INTERNAL:
    default:
      return 'An unexpected error occurred. Please try again later.';
  }
}

/**
 * Enhanced error logging with structured data
 */
export function logError(error: AppError | Error, additionalContext?: Record<string, any>): void {
  const isAppError = 'type' in error;
  
  const logData = {
    timestamp: new Date().toISOString(),
    message: error.message,
    stack: error.stack,
    type: isAppError ? (error as AppError).type : 'UNKNOWN',
    severity: isAppError ? (error as AppError).severity : ErrorSeverity.MEDIUM,
    code: isAppError ? (error as AppError).code : undefined,
    statusCode: isAppError ? (error as AppError).statusCode : undefined,
    context: isAppError ? (error as AppError).context : undefined,
    userId: isAppError ? (error as AppError).userId : undefined,
    requestId: isAppError ? (error as AppError).requestId : undefined,
    additionalContext,
  };
  
  // Log to console (in production, this would go to a proper logging service)
  if (logData.severity === ErrorSeverity.CRITICAL || logData.severity === ErrorSeverity.HIGH) {
    console.error('[ERROR]', JSON.stringify(logData, null, 2));
  } else {
    console.warn('[WARN]', JSON.stringify(logData, null, 2));
  }
  
  // In production, send to monitoring service (e.g., Sentry, DataDog, etc.)
  if (process.env.NODE_ENV === 'production') {
    // Example: sendToMonitoringService(logData);
  }
}

/**
 * Error handler for API routes
 */
export function handleApiError(error: unknown, context?: Record<string, any>): NextResponse {
  let appError: AppError;
  
  if (error instanceof Error && 'type' in error) {
    appError = error as AppError;
  } else if (error instanceof Error) {
    appError = createAppError(
      ErrorType.INTERNAL,
      error.message,
      {
        originalError: error,
        context,
      }
    );
  } else {
    appError = createAppError(
      ErrorType.INTERNAL,
      'An unknown error occurred',
      {
        context: { ...context, originalError: String(error) },
      }
    );
  }
  
  // Log the error
  logError(appError, context);
  
  // Return appropriate response
  return NextResponse.json(
    {
      error: true,
      type: appError.type,
      message: appError.userMessage,
      code: appError.code,
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          originalMessage: appError.message,
          stack: appError.stack,
          context: appError.context,
        },
      }),
    },
    { status: appError.statusCode || 500 }
  );
}

/**
 * Validation error helper
 */
export function createValidationError(
  message: string,
  field?: string,
  value?: any
): AppError {
  return createAppError(
    ErrorType.VALIDATION,
    message,
    {
      code: 'VALIDATION_FAILED',
      context: { field, value },
      userMessage: `Validation failed${field ? ` for ${field}` : ''}: ${message}`,
    }
  );
}

/**
 * Authentication error helper
 */
export function createAuthError(message: string = 'Authentication required'): AppError {
  return createAppError(
    ErrorType.AUTHENTICATION,
    message,
    {
      code: 'AUTH_REQUIRED',
      userMessage: 'Please log in to continue.',
    }
  );
}

/**
 * Permission error helper
 */
export function createPermissionError(action?: string): AppError {
  return createAppError(
    ErrorType.PERMISSION,
    `Permission denied${action ? ` for action: ${action}` : ''}`,
    {
      code: 'PERMISSION_DENIED',
      context: { action },
      userMessage: 'You do not have permission to perform this action.',
    }
  );
}

/**
 * Not found error helper
 */
export function createNotFoundError(resource?: string): AppError {
  return createAppError(
    ErrorType.NOT_FOUND,
    `Resource not found${resource ? `: ${resource}` : ''}`,
    {
      code: 'NOT_FOUND',
      context: { resource },
      userMessage: 'The requested resource was not found.',
    }
  );
}

/**
 * Rate limit error helper
 */
export function createRateLimitError(retryAfter?: number): AppError {
  return createAppError(
    ErrorType.RATE_LIMIT,
    'Rate limit exceeded',
    {
      code: 'RATE_LIMIT_EXCEEDED',
      context: { retryAfter },
      userMessage: 'Too many requests. Please wait a moment and try again.',
    }
  );
}

/**
 * Database error helper
 */
export function createDatabaseError(operation: string, originalError?: Error): AppError {
  return createAppError(
    ErrorType.DATABASE,
    `Database error during ${operation}`,
    {
      code: 'DATABASE_ERROR',
      context: { operation },
      originalError,
      userMessage: 'A database error occurred. Please try again later.',
      severity: ErrorSeverity.HIGH,
    }
  );
}

/**
 * Wrapper for async operations with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: Record<string, any>
): Promise<{ data?: T; error?: AppError }> {
  try {
    const data = await operation();
    return { data };
  } catch (error) {
    const appError = error instanceof Error && 'type' in error
      ? error as AppError
      : createAppError(
          ErrorType.INTERNAL,
          error instanceof Error ? error.message : 'Unknown error',
          {
            originalError: error instanceof Error ? error : undefined,
            context,
          }
        );
    
    logError(appError, context);
    return { error: appError };
  }
}

/**
 * Error boundary error handler for React components
 */
export function handleComponentError(
  error: Error,
  errorInfo: { componentStack: string },
  userId?: string
): AppError {
  const appError = createAppError(
    ErrorType.INTERNAL,
    error.message,
    {
      code: 'COMPONENT_ERROR',
      originalError: error,
      context: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
      },
      userId,
      severity: ErrorSeverity.HIGH,
      userMessage: 'Something went wrong. Please refresh the page and try again.',
    }
  );
  
  logError(appError);
  return appError;
}

/**
 * Network error helper
 */
export function createNetworkError(message: string, originalError?: Error): AppError {
  return createAppError(
    ErrorType.NETWORK,
    message,
    {
      code: 'NETWORK_ERROR',
      originalError,
      userMessage: 'Network error. Please check your connection and try again.',
    }
  );
}

/**
 * File upload error helper
 */
export function createFileUploadError(reason: string, context?: Record<string, any>): AppError {
  return createAppError(
    ErrorType.FILE_UPLOAD,
    `File upload failed: ${reason}`,
    {
      code: 'FILE_UPLOAD_ERROR',
      context,
      userMessage: 'File upload failed. Please check the file size and format.',
    }
  );
}
