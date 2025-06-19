/**
 * 
 * 
 * Security Utilities - Enhanced security patterns and middleware
 * 
 * Provides comprehensive security features including:
 * - Input sanitization and validation
 * - CSRF protection
 * - Rate limiting
 * - Security headers
 * - Content Security Policy
 * - XSS protection
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAppError, ErrorType } from '@/lib/error-handling';

/**
 * Security configuration
 */
export const SECURITY_CONFIG = {
  // Rate limiting
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100,
  RATE_LIMIT_LOGIN_MAX: 5,
  
  // Content Security Policy
  CSP_DIRECTIVES: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://www.youtube.com', 'https://cdn.jsdelivr.net'],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'img-src': ["'self'", 'data:', 'https:', 'blob:'],
    'media-src': ["'self'", 'https://www.youtube.com', 'https://youtube.com'],
    'frame-src': ["'self'", 'https://www.youtube.com', 'https://youtube-nocookie.com'],
    'connect-src': ["'self'", 'https://api.github.com', 'wss:', 'ws:'],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
  },
  
  // File upload security
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_IMAGE_TYPES: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
  ALLOWED_DOCUMENT_TYPES: ['.pdf', '.doc', '.docx', '.txt', '.md', '.xlsx', '.xls'],
  ALLOWED_VIDEO_TYPES: ['.mp4', '.webm', '.ogg'],
  
  // Input validation
  MAX_STRING_LENGTH: 10000,
  MAX_ARRAY_LENGTH: 1000,
  MAX_OBJECT_DEPTH: 10,
};

/**
 * Rate limiting storage (in production, use Redis or database)
 */
interface RateLimitEntry {
  count: number;
  lastReset: number;
  resetTime: number;
  blocked?: boolean;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// ...existing rate limiting code...

/**
 * Rate limiting by user ID
 */
export function rateLimitByUser(
  userId: string, 
  maxRequests: number = SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS,
  windowMs: number = SECURITY_CONFIG.RATE_LIMIT_WINDOW
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = `user:${userId}`;
  const current = rateLimitStore.get(key);
    if (!current || now - current.lastReset > windowMs) {
    // Reset window
    const resetTime = now + windowMs;
    rateLimitStore.set(key, { count: 1, lastReset: now, resetTime });
    return { 
      allowed: true, 
      remaining: maxRequests - 1, 
      resetTime 
    };
  }
  
  if (current.count >= maxRequests) {
    return { 
      allowed: false, 
      remaining: 0, 
      resetTime: current.lastReset + windowMs 
    };
  }
  
  current.count++;
  rateLimitStore.set(key, current);
  
  return { 
    allowed: true, 
    remaining: maxRequests - current.count, 
    resetTime: current.lastReset + windowMs 
  };
}

/**
 * Rate limiting by IP address
 */
export function rateLimitByIP(
  ip: string, 
  maxRequests: number = SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS,
  windowMs: number = SECURITY_CONFIG.RATE_LIMIT_WINDOW
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = `ip:${ip}`;
  const current = rateLimitStore.get(key);
    if (!current || now - current.lastReset > windowMs) {
    const resetTime = now + windowMs;
    rateLimitStore.set(key, { count: 1, lastReset: now, resetTime });
    return { 
      allowed: true, 
      remaining: maxRequests - 1, 
      resetTime 
    };
  }
  
  if (current.count >= maxRequests) {
    return { 
      allowed: false, 
      remaining: 0, 
      resetTime: current.lastReset + windowMs 
    };
  }
  
  current.count++;
  rateLimitStore.set(key, current);
  
  return { 
    allowed: true, 
    remaining: maxRequests - current.count, 
    resetTime: current.lastReset + windowMs 
  };
}

/**
 * Rate limiting middleware
 */
export function rateLimit(options: {
  windowMs?: number;
  max?: number;
  keyGenerator?: (req: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
}) {
  const {
    windowMs = SECURITY_CONFIG.RATE_LIMIT_WINDOW,
    max = SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS,
    keyGenerator = (req) => req.headers.get('x-forwarded-for') || 'unknown',
    skipSuccessfulRequests = false,
  } = options;

  return (req: NextRequest): { allowed: boolean; retryAfter?: number } => {
    const key = keyGenerator(req);
    const now = Date.now();
    const entry = rateLimitStore.get(key);    if (!entry || now > entry.resetTime) {
      // Reset window
      rateLimitStore.set(key, {
        count: 1,
        lastReset: now,
        resetTime: now + windowMs,
        blocked: false,
      });
      return { allowed: true };
    }

    if (entry.count >= max) {
      entry.blocked = true;
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      return { allowed: false, retryAfter };
    }

    entry.count++;
    rateLimitStore.set(key, entry);
    return { allowed: true };
  };
}

/**
 * Enhanced security headers
 */
export function addEnhancedSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy
  const cspValue = Object.entries(SECURITY_CONFIG.CSP_DIRECTIVES)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
  
  response.headers.set('Content-Security-Policy', cspValue);
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  
  // HSTS (only in production with HTTPS)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // CORS headers
  response.headers.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || 'http://localhost:3000');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  
  return response;
}

/**
 * Input sanitization functions
 */
export const sanitizers = {
  // Remove potentially dangerous characters
  sanitizeString: (input: string): string => {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .substring(0, SECURITY_CONFIG.MAX_STRING_LENGTH);
  },

  // Sanitize HTML content
  sanitizeHtml: (html: string): string => {
    // Basic HTML sanitization - in production, use DOMPurify
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  },

  // Sanitize URL
  sanitizeUrl: (url: string): string => {
    try {
      const parsedUrl = new URL(url);
      
      // Only allow http/https protocols
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
      
      return parsedUrl.toString();
    } catch {
      throw createAppError(ErrorType.VALIDATION, 'Invalid URL format');
    }
  },

  // Sanitize filename
  sanitizeFilename: (filename: string): string => {
    return filename
      .replace(/[^a-zA-Z0-9.-_]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 255);
  },

  // Deep sanitize object
  sanitizeObject: (obj: any, depth = 0): any => {
    if (depth > SECURITY_CONFIG.MAX_OBJECT_DEPTH) {
      throw createAppError(ErrorType.VALIDATION, 'Object nesting too deep');
    }

    if (obj === null || typeof obj !== 'object') {
      return typeof obj === 'string' ? sanitizers.sanitizeString(obj) : obj;
    }

    if (Array.isArray(obj)) {
      if (obj.length > SECURITY_CONFIG.MAX_ARRAY_LENGTH) {
        throw createAppError(ErrorType.VALIDATION, 'Array too large');
      }
      return obj.map(item => sanitizers.sanitizeObject(item, depth + 1));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = sanitizers.sanitizeString(key);
      sanitized[sanitizedKey] = sanitizers.sanitizeObject(value, depth + 1);
    }

    return sanitized;
  },
};

/**
 * File validation and security
 */
export const fileValidators = {
  // Validate file type by content, not just extension
  validateFileType: async (file: File, allowedTypes: string[]): Promise<boolean> => {
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer.slice(0, 4));
    
    // File signature checking (magic numbers)
    const signatures = {
      '.jpg': [0xFF, 0xD8, 0xFF],
      '.jpeg': [0xFF, 0xD8, 0xFF],
      '.png': [0x89, 0x50, 0x4E, 0x47],
      '.gif': [0x47, 0x49, 0x46],
      '.pdf': [0x25, 0x50, 0x44, 0x46],
    };

    const fileExtension = file.name.toLowerCase().split('.').pop();
    if (!fileExtension || !allowedTypes.includes(`.${fileExtension}`)) {
      return false;
    }

    const expectedSignature = signatures[`.${fileExtension}` as keyof typeof signatures];
    if (expectedSignature) {
      return expectedSignature.every((byte, index) => uint8Array[index] === byte);
    }

    return true; // For file types without signature checking
  },

  // Scan for malicious content in text files
  scanTextFile: async (file: File): Promise<{ safe: boolean; threats: string[] }> => {
    const text = await file.text();
    const threats: string[] = [];

    // Check for suspicious patterns
    const dangerousPatterns = [
      { pattern: /<script/i, threat: 'JavaScript code detected' },
      { pattern: /eval\s*\(/i, threat: 'Code evaluation detected' },
      { pattern: /document\.write/i, threat: 'DOM manipulation detected' },
      { pattern: /window\.location/i, threat: 'Navigation hijacking detected' },
      { pattern: /\.exe\b/i, threat: 'Executable reference detected' },
    ];

    for (const { pattern, threat } of dangerousPatterns) {
      if (pattern.test(text)) {
        threats.push(threat);
      }
    }

    return { safe: threats.length === 0, threats };
  },

  // Validate file upload
  validateFileUpload(
    file: File, 
    options: {
      maxSize?: number;
      allowedTypes?: string[];
      allowedMimeTypes?: string[];
    } = {}
  ): { valid: boolean; error?: string } {
    const {
      maxSize = SECURITY_CONFIG.MAX_FILE_SIZE,
      allowedTypes = SECURITY_CONFIG.ALLOWED_DOCUMENT_TYPES,
      allowedMimeTypes = []
    } = options;
    
    // Check file size
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`
      };
    }
    
    // Check file extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(extension)) {
      return {
        valid: false,
        error: `File type ${extension} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
      };
    }
    
    // Check MIME type if specified
    if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(file.type)) {
      return {
        valid: false,
        error: `MIME type ${file.type} is not allowed`
      };
    }
    
    return { valid: true };
  },

  // Sanitize filename for safe storage
  sanitizeFileName(fileName: string): string {
    // Remove or replace dangerous characters
    return fileName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '')
      .toLowerCase()
      .substring(0, 100); // Limit length
  },
};

/**
 * CSRF protection
 */
export class CSRFProtection {
  private static tokens = new Map<string, { token: string; expires: number }>();

  static generateToken(sessionId: string): string {
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expires = Date.now() + (60 * 60 * 1000); // 1 hour
    
    this.tokens.set(sessionId, { token, expires });
    return token;
  }

  static validateToken(sessionId: string, token: string): boolean {
    const entry = this.tokens.get(sessionId);
    
    if (!entry || entry.expires < Date.now()) {
      this.tokens.delete(sessionId);
      return false;
    }

    return entry.token === token;
  }

  static cleanup(): void {
    const now = Date.now();
    for (const [sessionId, entry] of this.tokens.entries()) {
      if (entry.expires < now) {
        this.tokens.delete(sessionId);
      }
    }
  }
}

/**
 * Security middleware factory
 */
export function createSecurityMiddleware(options: {
  rateLimit?: boolean;
  csrfProtection?: boolean;
  inputSanitization?: boolean;
  fileValidation?: boolean;
} = {}) {
  const {
    rateLimit: enableRateLimit = true,
    csrfProtection = false,
    inputSanitization = true,
    fileValidation = true,
  } = options;

  const rateLimitFn = enableRateLimit ? rateLimit({}) : null;

  return async (request: NextRequest): Promise<{
    allowed: boolean;
    response?: NextResponse;
    sanitizedBody?: any;
  }> => {
    // Rate limiting
    if (rateLimitFn) {
      const rateLimitResult = rateLimitFn(request);
      if (!rateLimitResult.allowed) {
        const response = NextResponse.json(
          { error: 'Too many requests' },
          { status: 429 }
        );
        if (rateLimitResult.retryAfter) {
          response.headers.set('Retry-After', rateLimitResult.retryAfter.toString());
        }
        return { allowed: false, response: addEnhancedSecurityHeaders(response) };
      }
    }

    // Input sanitization
    let sanitizedBody;
    if (inputSanitization && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      try {
        const body = await request.json();
        sanitizedBody = sanitizers.sanitizeObject(body);
      } catch {
        // Not JSON or already consumed
      }
    }

    // CSRF protection (for state-changing requests)
    if (csrfProtection && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      const csrfToken = request.headers.get('X-CSRF-Token');
      const sessionId = request.headers.get('X-Session-ID') || 'anonymous';
      
      if (!csrfToken || !CSRFProtection.validateToken(sessionId, csrfToken)) {
        const response = NextResponse.json(
          { error: 'Invalid CSRF token' },
          { status: 403 }
        );
        return { allowed: false, response: addEnhancedSecurityHeaders(response) };
      }
    }

    return { allowed: true, sanitizedBody };
  };
}

/**
 * Security monitoring and alerting
 */
export const securityMonitor = {
  // Log security events
  logSecurityEvent: (event: {
    type: 'rate_limit' | 'csrf_failure' | 'file_scan' | 'input_validation' | 'suspicious_activity';
    severity: 'low' | 'medium' | 'high' | 'critical';
    details: Record<string, any>;
    request: NextRequest;
  }) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: event.type,
      severity: event.severity,
      ip: event.request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: event.request.headers.get('user-agent') || 'unknown',
      url: event.request.url,
      method: event.request.method,
      details: event.details,
    };

    console.warn('[SECURITY]', JSON.stringify(logEntry));

    // In production, send to security monitoring service
    if (event.severity === 'critical') {
      // Alert administrators immediately
    }
  },

  // Detect suspicious patterns
  detectSuspiciousActivity: (request: NextRequest): {
    suspicious: boolean;
    reasons: string[];
  } => {
    const reasons: string[] = [];
    const userAgent = request.headers.get('user-agent') || '';
    const referer = request.headers.get('referer') || '';

    // Check for bot patterns
    const botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
    ];

    if (botPatterns.some(pattern => pattern.test(userAgent))) {
      reasons.push('Bot-like user agent');
    }

    // Check for missing expected headers
    if (!userAgent) {
      reasons.push('Missing user agent');
    }

    // Check for suspicious referers
    if (referer && !referer.startsWith(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')) {
      reasons.push('External referer');
    }

    return {
      suspicious: reasons.length > 0,
      reasons,
    };
  },
};

// Cleanup expired entries periodically
setInterval(() => {
  CSRFProtection.cleanup();
  
  // Cleanup rate limit store
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 60 * 1000); // Every hour
