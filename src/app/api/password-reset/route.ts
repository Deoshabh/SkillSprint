import { NextRequest, NextResponse } from 'next/server';

import { initiatePasswordReset, validateResetToken, completePasswordReset } from '@/lib/password-reset';
import { addSecurityHeaders } from '@/lib/auth-utils';

// Force dynamic rendering to prevent static analysis during build
export const dynamic = 'force-dynamic';

/**
 * POST /api/password-reset
 * Initiate password reset by sending email with reset link
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Validate input
    if (!email) {
      const response = NextResponse.json({ 
        error: 'Email address is required' 
      }, { status: 400 });
      return addSecurityHeaders(response);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const response = NextResponse.json({ 
        error: 'Invalid email format' 
      }, { status: 400 });
      return addSecurityHeaders(response);
    }

    // Initiate password reset
    const result = await initiatePasswordReset(email.toLowerCase().trim(), request);

    const response = NextResponse.json({
      success: result.success,
      message: result.message
    }, { status: result.success ? 200 : 400 });

    return addSecurityHeaders(response);
    
  } catch (error) {
    console.error('Password reset initiation error:', error);
    
    const response = NextResponse.json({ 
      error: 'Password reset service temporarily unavailable' 
    }, { status: 500 });
    
    return addSecurityHeaders(response);
  }
}

/**
 * GET /api/password-reset?token=xyz
 * Validate a password reset token
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      const response = NextResponse.json({ 
        error: 'Reset token is required' 
      }, { status: 400 });
      return addSecurityHeaders(response);
    }

    // Validate token
    const validation = validateResetToken(token);

    const response = NextResponse.json({
      isValid: validation.isValid,
      email: validation.email,
      error: validation.error
    }, { status: validation.isValid ? 200 : 400 });

    return addSecurityHeaders(response);
    
  } catch (error) {
    console.error('Token validation error:', error);
    
    const response = NextResponse.json({ 
      error: 'Token validation service temporarily unavailable' 
    }, { status: 500 });
    
    return addSecurityHeaders(response);
  }
}

/**
 * PUT /api/password-reset
 * Complete password reset with new password
 */
export async function PUT(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    // Validate input
    if (!token || !password) {
      const response = NextResponse.json({ 
        error: 'Reset token and new password are required' 
      }, { status: 400 });
      return addSecurityHeaders(response);
    }

    // Complete password reset
    const result = await completePasswordReset(token, password, request);

    const response = NextResponse.json({
      success: result.success,
      message: result.message
    }, { status: result.success ? 200 : 400 });

    return addSecurityHeaders(response);
    
  } catch (error) {
    console.error('Password reset completion error:', error);
    
    const response = NextResponse.json({ 
      error: 'Password reset service temporarily unavailable' 
    }, { status: 500 });
    
    return addSecurityHeaders(response);
  }
}
