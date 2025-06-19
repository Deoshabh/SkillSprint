/**
 * Validation Utilities - Simplified and clean validation patterns
 * 
 * Provides consistent validation patterns for data integrity,
 * security, and user input across the entire platform.
 */

import { z } from 'zod';

/**
 * Common validation patterns
 */
export const ValidationPatterns = {
  // String patterns
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s\-\(\)]{10,}$/,
  url: /^https?:\/\/.+/,
  
  // Password patterns
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/,
  
  // ID patterns
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  mongoId: /^[0-9a-fA-F]{24}$/,
  
  // Content patterns
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  username: /^[a-zA-Z0-9_]{3,20}$/,
  tag: /^[a-zA-Z0-9\s\-_]{1,30}$/,
  
  // Security patterns
  safeString: /^[a-zA-Z0-9\s\-_.,!?'"()]+$/,
  noScript: /^(?!.*<script).*$/i,
};

/**
 * Authentication and user management schemas
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(ValidationPatterns.password, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
}).refine(data => data.currentPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ["newPassword"]
});

export const profileUpdateSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email format'),
  bio: z.string().max(500).optional(),
  interests: z.array(z.string()).max(10).optional()
});

/**
 * Session management schemas
 */
export const sessionValidationSchema = z.object({
  sessionId: z.string().optional(),
  all: z.boolean().optional(),
}).refine(data => data.sessionId || data.all, {
  message: "Either sessionId or all must be provided"
});

export const sessionQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

/**
 * Course management schemas
 */
export const courseValidationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  category: z.string().min(1, 'Category is required'),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  duration: z.number().min(1, 'Duration must be at least 1 hour'),
  price: z.number().min(0, 'Price cannot be negative').optional(),
  imageUrl: z.string().url('Invalid image URL').optional(),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed').optional(),
  prerequisites: z.array(z.string()).optional(),
  learningObjectives: z.array(z.string()).min(1, 'At least one learning objective required'),
  status: z.enum(['draft', 'published', 'archived', 'deleted']).optional()
});

export const courseQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  category: z.string().optional(),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
  search: z.string().max(100).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  sortBy: z.enum(['title', 'createdAt', 'updatedAt', 'difficulty', 'duration']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

/**
 * Document management schemas
 */
export const documentValidationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(1000).optional(),
  isPublic: z.boolean().default(false),
  courseId: z.string().optional(),
  tags: z.array(z.string().max(50)).max(10, 'Maximum 10 tags allowed').optional()
});

export const documentQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  courseId: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['name', 'uploadedAt', 'size', 'type']).default('uploadedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export const fileUploadSchema = z.object({
  maxSize: z.number().default(50 * 1024 * 1024), // 50MB
  allowedTypes: z.array(z.string()).default(['.pdf', '.doc', '.docx', '.txt', '.md']),
  allowedMimeTypes: z.array(z.string()).optional()
});

/**
 * User management schemas
 */
export const userQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().max(100).optional(),
  role: z.enum(['user', 'instructor', 'admin']).optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'deleted']).optional(),
  sortBy: z.enum(['firstName', 'lastName', 'email', 'createdAt', 'lastLogin']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export const userUpdateSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(ValidationPatterns.password, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
    .optional(),
  role: z.enum(['user', 'instructor', 'admin']).default('user'),
  status: z.enum(['active', 'inactive', 'suspended']).default('active'),
  bio: z.string().max(500).optional(),
  profileImage: z.string().url().optional(),
  interests: z.array(z.string().max(30)).max(10).optional()
});

/**
 * Feedback and communication schemas
 */
export const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'improvement', 'general']),
  category: z.string().min(1, 'Category is required').max(50),
  subject: z.string().min(1, 'Subject is required').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  attachments: z.array(z.string().url()).optional(),
  metadata: z.record(z.any()).optional()
});

/**
 * Progress tracking schemas
 */
export const progressUpdateSchema = z.object({
  moduleId: z.string().min(1, 'Module ID is required'),
  courseId: z.string().min(1, 'Course ID is required'),
  completed: z.boolean(),
  timeSpent: z.number().min(0).optional(),
  score: z.number().min(0).max(100).optional(),
  notes: z.string().max(1000).optional()
});

/**
 * API response schemas
 */
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
  meta: z.object({
    timestamp: z.string(),
    requestId: z.string().optional(),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number()
    }).optional()
  }).optional()
});

/**
 * Validation helper functions
 */
export function createValidationError(message: string, field?: string) {
  const error = new Error(message);
  error.name = 'ValidationError';
  if (field) {
    (error as any).field = field;
  }
  return error;
}

export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      throw createValidationError(`Validation failed: ${messages}`);
    }
    throw error;
  }
}

export function validateSchemaAsync<T>(schema: z.ZodSchema<T>, data: unknown): Promise<T> {
  return schema.parseAsync(data);
}
