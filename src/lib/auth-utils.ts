/**
 * Enhanced Authentication Utilities for SkillSprint
 * 
 * Provides comprehensive authentication features:
 * - Password strength validation
 * - Rate limiting for login attempts
 * - Session management
 * - Security headers
 * - Audit logging
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectToDatabase, User } from './mongodb';

// Rate limiting store (in production, use Redis)
interface RateLimitEntry {
  attempts: number;
  lastAttempt: number;
  blockedUntil?: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Security constants
export const SECURITY_CONFIG = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REQUIRE_UPPERCASE: true,
  PASSWORD_REQUIRE_LOWERCASE: true,
  PASSWORD_REQUIRE_NUMBER: true,
  PASSWORD_REQUIRE_SPECIAL: true,
  SESSION_TIMEOUT: 30 * 24 * 60 * 60, // 30 days
  REFRESH_THRESHOLD: 24 * 60 * 60, // 24 hours
} as const;

/**
 * Password strength validation
 */
export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0-100
  errors: string[];
  suggestions: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  const suggestions: string[] = [];
  let score = 0;

  // Length check
  if (password.length < SECURITY_CONFIG.PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${SECURITY_CONFIG.PASSWORD_MIN_LENGTH} characters long`);
  } else {
    score += 25;
  }

  // Complexity checks
  if (SECURITY_CONFIG.PASSWORD_REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
    suggestions.push('Add uppercase letters (A-Z)');
  } else {
    score += 20;
  }

  if (SECURITY_CONFIG.PASSWORD_REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
    suggestions.push('Add lowercase letters (a-z)');
  } else {
    score += 20;
  }

  if (SECURITY_CONFIG.PASSWORD_REQUIRE_NUMBER && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
    suggestions.push('Add numbers (0-9)');
  } else {
    score += 20;
  }

  if (SECURITY_CONFIG.PASSWORD_REQUIRE_SPECIAL && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
    suggestions.push('Add special characters (!@#$%^&*)');
  } else {
    score += 15;
  }

  // Common password checks
  const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    errors.push('Password contains common patterns');
    suggestions.push('Avoid common passwords and patterns');
    score -= 30;
  }

  // Length bonus
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;

  return {
    isValid: errors.length === 0,
    score: Math.max(0, Math.min(100, score)),
    errors,
    suggestions,
  };
}

/**
 * Rate limiting for login attempts
 */
export function checkRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry) {
    rateLimitStore.set(identifier, { attempts: 1, lastAttempt: now });
    return { allowed: true };
  }

  // Check if still blocked
  if (entry.blockedUntil && now < entry.blockedUntil) {
    return { allowed: false, retryAfter: Math.ceil((entry.blockedUntil - now) / 1000) };
  }

  // Reset if enough time has passed
  if (now - entry.lastAttempt > SECURITY_CONFIG.LOCKOUT_DURATION) {
    rateLimitStore.set(identifier, { attempts: 1, lastAttempt: now });
    return { allowed: true };
  }

  // Increment attempts
  entry.attempts += 1;
  entry.lastAttempt = now;

  if (entry.attempts >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
    entry.blockedUntil = now + SECURITY_CONFIG.LOCKOUT_DURATION;
    return { allowed: false, retryAfter: SECURITY_CONFIG.LOCKOUT_DURATION / 1000 };
  }

  rateLimitStore.set(identifier, entry);
  return { allowed: true };
}

/**
 * Reset rate limit on successful login
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Enhanced password hashing with configurable rounds
 */
export async function hashPassword(password: string, rounds: number = 12): Promise<string> {
  return bcrypt.hash(password, rounds);
}

/**
 * Secure password comparison
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate secure JWT token with additional claims
 */
export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  sessionId?: string;
  deviceInfo?: string;
}

export function generateToken(payload: TokenPayload, expiresIn: string = '30d'): string {
  const tokenPayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    jti: `${payload.userId}-${Date.now()}`, // JWT ID for token tracking
  };
  
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  return jwt.sign(tokenPayload, secret, { expiresIn } as jwt.SignOptions);
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      sessionId: decoded.sessionId,
      deviceInfo: decoded.deviceInfo,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Extract device information from request
 */
export function getDeviceInfo(request: NextRequest): string {
  const userAgent = request.headers.get('user-agent') || 'Unknown';
  const ip = request.headers.get('x-forwarded-for') || 'Unknown';
  
  return `${ip}-${userAgent.substring(0, 50)}`;
}

/**
 * Security headers for authentication responses
 */
export function addSecurityHeaders(response: NextResponse, preventCache: boolean = false): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  if (preventCache) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }
  
  return response;
}

/**
 * Audit logging for authentication events
 */
export interface AuditEvent {
  type: 'login_success' | 'login_failure' | 'logout' | 'register' | 'password_change' | 'account_locked';
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  details?: any;
  timestamp: Date;
}

const auditLogMemory: AuditEvent[] = [];

export function logAuditEvent(event: Omit<AuditEvent, 'timestamp'>): void {
  const auditEvent: AuditEvent = {
    ...event,
    timestamp: new Date(),
  };
  
  auditLogMemory.push(auditEvent);
  
  // In production, save to database or external logging service
  console.log('[AUDIT]', JSON.stringify(auditEvent));
  
  // Keep only last 1000 events in memory
  if (auditLogMemory.length > 1000) {
    auditLogMemory.shift();
  }
}

/**
 * Database audit logging function - saves to database
 */
export async function auditLog(db: any, event: {
  userId: string;
  action: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    await db.collection('audit_logs').insertOne({
      ...event,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Failed to save audit log:', error);    // Fallback to memory logging
    logAuditEvent({
      type: 'login_failure',
      userId: event.userId,
      details: { action: event.action, ...event.details },
      ip: event.ipAddress,
      userAgent: event.userAgent,
    });
  }
}

/**
 * Get audit logs (for admin use)
 */
export function getAuditLogs(limit: number = 100): AuditEvent[] {
  return auditLogMemory.slice(-limit);
}

/**
 * Session management utilities
 */
export interface SessionInfo {
  id: string;
  userId: string;
  deviceInfo: string;
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
}

const activeSessions = new Map<string, SessionInfo>();

export function createSession(userId: string, deviceInfo: string): string {
  const sessionId = `session-${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const session: SessionInfo = {
    id: sessionId,
    userId,
    deviceInfo,
    createdAt: new Date(),
    lastActivity: new Date(),
    isActive: true,
  };
  
  activeSessions.set(sessionId, session);
  return sessionId;
}

export function updateSessionActivity(sessionId: string): boolean {
  const session = activeSessions.get(sessionId);
  if (session) {
    session.lastActivity = new Date();
    return true;
  }
  return false;
}

export function invalidateSession(sessionId: string): boolean {
  const session = activeSessions.get(sessionId);
  if (session) {
    session.isActive = false;
    activeSessions.delete(sessionId);
    return true;
  }
  return false;
}

export function getUserSessions(userId: string): SessionInfo[] {
  return Array.from(activeSessions.values()).filter(session => 
    session.userId === userId && session.isActive
  );
}

/**
 * Clean up expired sessions
 */
export function cleanupExpiredSessions(): number {
  const now = Date.now();
  const expiredThreshold = SECURITY_CONFIG.SESSION_TIMEOUT * 1000;
  let cleaned = 0;
  
  for (const [sessionId, session] of activeSessions.entries()) {
    if (now - session.lastActivity.getTime() > expiredThreshold) {
      activeSessions.delete(sessionId);
      cleaned++;
    }
  }
  
  return cleaned;
}

/**
 * Enhanced user authentication with all security features
 */
export async function authenticateUser(
  email: string, 
  password: string, 
  request: NextRequest
): Promise<{
  success: boolean;
  user?: any;
  token?: string;
  sessionId?: string;
  error?: string;
  retryAfter?: number;
}> {
  const identifier = getDeviceInfo(request);
    // Check rate limiting
  const rateLimitResult = checkRateLimit(identifier);
  if (!rateLimitResult.allowed) {
    logAuditEvent({
      type: 'login_failure',
      email,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || undefined,
      details: { reason: 'rate_limited', retryAfter: rateLimitResult.retryAfter },
    });
    
    return {
      success: false,
      error: 'Too many login attempts. Please try again later.',
      retryAfter: rateLimitResult.retryAfter,
    };
  }

  try {
    await connectToDatabase();
    const user = await User.findOne({ email }).select('+password');
      if (!user || !(await verifyPassword(password, user.password))) {
      logAuditEvent({
        type: 'login_failure',
        email,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || undefined,
        details: { reason: 'invalid_credentials' },
      });
      
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }

    // Reset rate limit on successful authentication
    resetRateLimit(identifier);
    
    // Create session
    const sessionId = createSession(user._id.toString(), identifier);
    
    // Generate token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      sessionId,
      deviceInfo: identifier,
    });
      // Log successful login
    logAuditEvent({
      type: 'login_success',
      userId: user._id.toString(),
      email: user.email,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || undefined,
      details: { sessionId },
    });
    
    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    
    return {
      success: true,
      user: userResponse,
      token,
      sessionId,
    };
      } catch (error) {
    console.error('Authentication error:', error);
    
    logAuditEvent({
      type: 'login_failure',
      email,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || undefined,
      details: { reason: 'system_error', error: error instanceof Error ? error.message : String(error) },
    });
    
    return {
      success: false,
      error: 'Authentication service temporarily unavailable',
    };
  }
}

/**
 * Enhanced middleware authentication check
 */
export async function validateRequest(request: NextRequest): Promise<{
  isAuthenticated: boolean;
  user?: any;
  sessionId?: string;
}> {
  try {
    // First try NextAuth session
    const { getServerSession } = await import('next-auth/next');
    const { authOptions } = await import('@/lib/auth-config');
    
    const session = await getServerSession(authOptions);
    
    if (session?.user) {
      return {
        isAuthenticated: true,        user: {
          userId: session.user.id,
          email: session.user.email,
          name: session.user.name,
          ...session.user,
          role: session.user.role || 'user',
        },
        sessionId: session.user.id,
      };
    }

    // Fallback to auth-token cookie for backward compatibility
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return { isAuthenticated: false };
    }
    
    const payload = verifyToken(token);
    if (!payload) {
      return { isAuthenticated: false };
    }
    
    // Check if session is still active
    if (payload.sessionId) {
      const sessionValid = updateSessionActivity(payload.sessionId);
      if (!sessionValid) {
        return { isAuthenticated: false };
      }
    }
    
    return {
      isAuthenticated: true,
      user: payload,
      sessionId: payload.sessionId,
    };
  } catch (error) {
    console.error('Authentication validation error:', error);
    return { isAuthenticated: false };
  }
}

/**
 * Secure cookie settings
 */
export function getSecureCookieOptions(isProduction: boolean = process.env.NODE_ENV === 'production') {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SECURITY_CONFIG.SESSION_TIMEOUT,
  };
}

// Cleanup expired sessions every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);
