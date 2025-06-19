import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';
import { validateRequest, logAuditEvent } from '@/lib/auth-utils';

// Helper function to get client IP
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIp) {
    return realIp.trim();
  }
  return 'unknown';
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public access to specific routes
  const publicRoutes = [
    '/',                    // Homepage
    '/login',               // Login page  
    '/signup',              // Signup page
    '/reset-password',      // Password reset page
    '/verify-email',        // Email verification page
    '/api/auth',            // Auth API routes
    '/api/password-reset',  // Password reset API
    '/api/email-verify',    // Email verification API
    '/favicon.ico',         // Static files
    '/_next',               // Next.js static files
    '/manifest.json',       // PWA manifest
    '/sw.js',               // Service worker
    '/robots.txt',          // SEO files
    '/sitemap.xml',         // SEO files
    '/icons',               // Icon files
    '/images',              // Image files
    '/logo',                // Logo files
  ];
  
  // Check if the current path is public
  const isPublicRoute = publicRoutes.some(route => {
    if (route === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(route);
  });
  
  // If not a public route, require authentication
  if (!isPublicRoute) {
    const authResult = await validateRequest(request);

    if (!authResult.isAuthenticated) {
      // Log unauthorized access attempt
      logAuditEvent({
        type: 'login_failure',
        ip: getClientIP(request),
        userAgent: request.headers.get('user-agent') || undefined,
        details: { 
          reason: 'unauthorized_access', 
          path: pathname,
          method: request.method 
        },
      });

      console.log(`Protected route ${pathname} accessed without valid authentication, redirecting to login`);
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check for expired sessions and refresh if needed
    if (authResult.sessionId) {
      // Session is being updated in validateRequest
      console.log(`Session activity updated for ${authResult.user?.email} on ${pathname}`);
    }
  }
  
  // Protect admin routes with additional role check
  if (pathname.startsWith('/admin')) {
    const authResult = await validateRequest(request);

    if (!authResult.isAuthenticated) {
      console.log('No authentication found for admin route, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check if user is admin
    if (authResult.user?.role !== 'admin') {
      logAuditEvent({
        type: 'login_failure',
        userId: authResult.user?.userId,
        email: authResult.user?.email,
        ip: getClientIP(request),
        userAgent: request.headers.get('user-agent') || undefined,
        details: { 
          reason: 'insufficient_privileges', 
          path: pathname,
          userRole: authResult.user?.role 
        },
      });

      console.log(`Non-admin user ${authResult.user?.email} attempted to access admin route, redirecting to dashboard`);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Log admin access
    logAuditEvent({
      type: 'login_success',
      userId: authResult.user?.userId,
      email: authResult.user?.email,
      ip: getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined,
      details: { 
        action: 'admin_access', 
        path: pathname 
      },
    });
  }

  // Add security headers to all responses
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // HSTS for production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest)
     * - sw.js (service worker)
     * - robots.txt (SEO files)
     * - sitemap.xml (SEO files)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.json|sw.js|robots.txt|sitemap.xml).*)',
  ],
};
