import { NextRequest, NextResponse } from 'next/server';

import { initiateEmailVerification, completeEmailVerification } from '@/lib/password-reset';
import { addSecurityHeaders } from '@/lib/auth-utils';

/**
 * POST /api/email-verify
 * Resend email verification
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

    // Initiate email verification
    const result = await initiateEmailVerification(email.toLowerCase().trim(), request);

    const response = NextResponse.json({
      success: result.success,
      message: result.message
    }, { status: result.success ? 200 : 400 });

    return addSecurityHeaders(response);
    
  } catch (error) {
    console.error('Email verification initiation error:', error);
    
    const response = NextResponse.json({ 
      error: 'Email verification service temporarily unavailable' 
    }, { status: 500 });
    
    return addSecurityHeaders(response);
  }
}

/**
 * PUT /api/email-verify
 * Complete email verification with token
 */
export async function PUT(request: NextRequest) {
  try {
    const { token } = await request.json();

    // Validate input
    if (!token) {
      const response = NextResponse.json({ 
        error: 'Verification token is required' 
      }, { status: 400 });
      return addSecurityHeaders(response);
    }

    // Complete email verification
    const result = await completeEmailVerification(token, request);

    const response = NextResponse.json({
      success: result.success,
      message: result.message
    }, { status: result.success ? 200 : 400 });

    return addSecurityHeaders(response);
    
  } catch (error) {
    console.error('Email verification completion error:', error);
    
    const response = NextResponse.json({ 
      error: 'Email verification service temporarily unavailable' 
    }, { status: 500 });
    
    return addSecurityHeaders(response);
  }
}
