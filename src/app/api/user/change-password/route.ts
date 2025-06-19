import { NextRequest, NextResponse } from 'next/server';

import bcrypt from 'bcryptjs';
import { validateRequest, auditLog, addSecurityHeaders } from '@/lib/auth-utils';
import { connectToDatabase } from '@/lib/mongodb';
import { withApiHandler, createApiResponse, RequestContext } from '@/lib/api-utils';
import { changePasswordSchema } from '@/lib/validation-utils';
import { rateLimitByUser } from '@/lib/security-utils';

export const POST = withApiHandler(async (context: RequestContext) => {
  const { request, user } = context;
  
  // Rate limiting for password changes - stricter limit
  const rateLimit = rateLimitByUser(user.userId, 5, 900000); // 5 attempts per 15 minutes
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Too many password change attempts',
        meta: { 
          timestamp: new Date().toISOString(),
          retryAfter: new Date(rateLimit.resetTime).toISOString()
        }
      }, 
      { status: 429 }
    );
  }
  
  // Parse and validate request body
  const body = await request.json();
  const { currentPassword, newPassword } = changePasswordSchema.parse(body);

  const { db } = await connectToDatabase();
  
  // Get current user data
  const userData = await db.collection('users').findOne({ email: user.email });
  if (!userData) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'User not found',
        meta: { timestamp: new Date().toISOString() }
      }, 
      { status: 404 }
    );
  }

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userData.password);
  if (!isCurrentPasswordValid) {
    // Log failed password change attempt
    await auditLog(db, {
      userId: userData._id?.toString() || user.email,
      action: 'password_change_failed',
      details: { reason: 'incorrect_current_password' },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json(
      { 
        success: false, 
        error: 'Current password is incorrect',
        meta: { timestamp: new Date().toISOString() }
      }, 
      { status: 401 }
    );
  }

  // Hash new password
  const saltRounds = 12;
  const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

  // Update password in database
  await db.collection('users').updateOne(
    { email: user.email },
    { 
      $set: { 
        password: hashedNewPassword,
        passwordChangedAt: new Date()
      }
    }
  );

  // Log successful password change
  await auditLog(db, {
    userId: userData._id?.toString() || user.email,
    action: 'password_changed',
    details: { success: true },
    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown'
  });

  return createApiResponse(
    { success: true },
    'Password changed successfully'
  );
}, { requireAuth: true });
