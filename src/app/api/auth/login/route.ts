import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, getSecureCookieOptions, addSecurityHeaders } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ 
        error: 'Email and password are required' 
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        error: 'Invalid email format' 
      }, { status: 400 });
    }

    // Authenticate user with enhanced security
    const authResult = await authenticateUser(email, password, request);

    if (!authResult.success) {
      let response;
      
      if (authResult.retryAfter) {
        response = NextResponse.json({ 
          error: authResult.error,
          retryAfter: authResult.retryAfter 
        }, { status: 429 });
        
        response.headers.set('Retry-After', authResult.retryAfter.toString());
      } else {
        response = NextResponse.json({ 
          error: authResult.error 
        }, { status: 401 });
      }
      
      return addSecurityHeaders(response);
    }

    // Create successful response
    const response = NextResponse.json({ 
      success: true,
      message: 'Login successful',
      user: authResult.user 
    });
    
    // Set secure authentication cookie
    response.cookies.set('auth-token', authResult.token!, getSecureCookieOptions());

    return addSecurityHeaders(response);
    
  } catch (error) {
    console.error('Login API error:', error);
    
    const response = NextResponse.json({ 
      error: 'Authentication service temporarily unavailable' 
    }, { status: 500 });
    
    return addSecurityHeaders(response);
  }
}
