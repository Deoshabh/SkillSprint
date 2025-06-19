import { NextRequest, NextResponse } from 'next/server';

import { validateRequest, addSecurityHeaders, auditLog } from '@/lib/auth-utils';
import { connectToDatabase } from '@/lib/mongodb';
import { withApiHandler, createApiResponse, RequestContext } from '@/lib/api-utils';
import { sessionValidationSchema } from '@/lib/validation-utils';
import { rateLimitByUser } from '@/lib/security-utils';

// Mark this route as dynamic to prevent static analysis during build
export const dynamic = 'force-dynamic';

// Mock session data - in a real app, this would come from a session store (Redis, database, etc.)
const mockSessions = [
  {
    id: 'session_1',
    device: 'MacBook Pro',
    browser: 'Chrome 120.0',
    location: 'San Francisco, CA',
    lastActive: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    current: true,
  },
  {
    id: 'session_2',
    device: 'iPhone 15',
    browser: 'Safari Mobile',
    location: 'San Francisco, CA',
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    current: false,
  },
  {
    id: 'session_3',
    device: 'Windows PC',
    browser: 'Edge 120.0',
    location: 'New York, NY',
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    current: false,
  },
];

export const GET = withApiHandler(async (context: RequestContext) => {
  const { request, user } = context;
  
  // Rate limiting
  if (user) {
    const rateLimit = rateLimitByUser(user.userId, 20, 60000); // 20 requests per minute
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many requests',
          meta: { 
            timestamp: new Date().toISOString(),
            retryAfter: new Date(rateLimit.resetTime).toISOString()
          }
        }, 
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString()
          }
        }
      );
    }
  }

  // In a real app, you would query your session store here
  // For now, we'll return mock data
  return createApiResponse(
    { sessions: mockSessions },
    'Sessions retrieved successfully'
  );
}, { requireAuth: true });

export const DELETE = withApiHandler(async (context: RequestContext) => {
  const { request, user } = context;
  
  // Parse and validate request body
  const body = await request.json();
  const { sessionId, all } = sessionValidationSchema.parse(body);

  const { db } = await connectToDatabase();

  if (all) {
    // Log out from all devices
    await auditLog(db, {
      userId: user.userId,
      action: 'logout_all_devices',
      details: { sessionCount: mockSessions.length },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    // In a real app, you would:
    // 1. Invalidate all sessions for the user in your session store
    // 2. Add the user's current session tokens to a blacklist
    // 3. Force logout on all devices
    
    return createApiResponse(
      { success: true },
      'Logged out from all devices'
    );

  } else if (sessionId) {
    // Log out from specific session
    const sessionIndex = mockSessions.findIndex(s => s.id === sessionId);
    if (sessionIndex === -1) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Session not found',
          meta: { timestamp: new Date().toISOString() }
        }, 
        { status: 404 }
      );
    }

    // Remove session (in real app, invalidate in session store)
    mockSessions.splice(sessionIndex, 1);

    await auditLog(db, {
      userId: user.userId,
      action: 'session_terminated',
      details: { sessionId },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return createApiResponse(
      { success: true },
      'Session terminated'
    );
  }

  return NextResponse.json(
    { 
      success: false, 
      error: 'Invalid request',
      meta: { timestamp: new Date().toISOString() }
    }, 
    { status: 400 }
  );
}, { requireAuth: true });
