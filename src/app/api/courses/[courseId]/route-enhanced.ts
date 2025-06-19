import { NextRequest, NextResponse } from 'next/server';

import { connectToDatabase, Course } from '@/lib/mongodb';
import { withApiHandler, createApiResponse, RequestContext } from '@/lib/api-utils';
import { rateLimitByUser, rateLimitByIP } from '@/lib/security-utils';
import { courseValidationSchema } from '@/lib/validation-utils';

export const GET = withApiHandler(async (context: RequestContext) => {
  const { request, params } = context;
  
  if (!params?.courseId) {
    return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
  }
  
  const { courseId } = params;
  
  // Rate limiting - higher limit for course viewing
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const rateLimit = rateLimitByIP(ip, 100, 60000); // 100 requests per minute per IP
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
      { status: 429 }
    );
  }
  
  await connectToDatabase();
  
  const course = await Course.findOne({ id: courseId });
  
  if (!course) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Course not found',
        meta: { timestamp: new Date().toISOString() }
      }, 
      { status: 404 }
    );
  }
  
  return createApiResponse(
    { course },
    'Course retrieved successfully'
  );
});

export const PUT = withApiHandler(async (context: RequestContext) => {
  const { request, user, params } = context;
  
  if (!params?.courseId) {
    return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
  }
  
  const { courseId } = params;
  
  // Only allow admins and instructors to update courses
  if (!user || !['admin', 'instructor'].includes(user.role)) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Insufficient permissions',
        meta: { timestamp: new Date().toISOString() }
      }, 
      { status: 403 }
    );
  }
  
  // Rate limiting for course updates
  const rateLimit = rateLimitByUser(user.userId, 10, 60000); // 10 updates per minute
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
      { status: 429 }
    );
  }
  
  const body = await request.json();
  const validatedData = courseValidationSchema.parse(body);
  
  await connectToDatabase();
  
  const course = await Course.findOne({ id: courseId });
  if (!course) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Course not found',
        meta: { timestamp: new Date().toISOString() }
      }, 
      { status: 404 }
    );
  }
  
  // Update course
  const updatedCourse = await Course.findOneAndUpdate(
    { id: courseId },
    { 
      ...validatedData,
      updatedAt: new Date(),
      updatedBy: user.userId
    },
    { new: true }
  );
  
  return createApiResponse(
    { course: updatedCourse },
    'Course updated successfully'
  );
}, { requireAuth: true });

export const DELETE = withApiHandler(async (context: RequestContext) => {
  const { user, params } = context;
  
  if (!params?.courseId) {
    return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
  }
  
  const { courseId } = params;
  
  // Only allow admins to delete courses
  if (!user || user.role !== 'admin') {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Insufficient permissions',
        meta: { timestamp: new Date().toISOString() }
      }, 
      { status: 403 }
    );
  }
  
  // Rate limiting for course deletion
  const rateLimit = rateLimitByUser(user.userId, 5, 300000); // 5 deletions per 5 minutes
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
      { status: 429 }
    );
  }
  
  await connectToDatabase();
  
  const course = await Course.findOne({ id: courseId });
  if (!course) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Course not found',
        meta: { timestamp: new Date().toISOString() }
      }, 
      { status: 404 }
    );
  }
  
  // Soft delete - mark as deleted instead of removing
  await Course.findOneAndUpdate(
    { id: courseId },
    { 
      status: 'deleted',
      deletedAt: new Date(),
      deletedBy: user.userId
    }
  );
  
  return createApiResponse(
    { success: true },
    'Course deleted successfully'
  );
}, { requireAuth: true, requireAdmin: true });
