import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, Course } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import jwt from 'jsonwebtoken';

// Force dynamic rendering to prevent static analysis during build
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ courseId: string }> }
) {
  try {
    const params = await paramsPromise;
    await connectToDatabase();
    
    const course = await Course.findOne({ id: params.courseId });
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      course
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ courseId: string }> }
) {
  try {
    const params = await paramsPromise;
    
    // Check authentication - try NextAuth session first, then JWT fallback
    let userId = null;
    let userRole = 'user';

    // Try NextAuth session first
    const session = await getServerSession(authOptions);
    if (session?.user) {
      userId = session.user.id;
      userRole = session.user.role || 'user';
    } else {
      // Fallback to JWT token
      const token = request.cookies.get('auth-token')?.value;
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
          userId = decoded.userId;
          userRole = decoded.role || 'user';
        } catch (jwtError) {
          return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    await connectToDatabase();
    
    // Find course and check ownership or admin rights
    const course = await Course.findOne({ id: params.courseId });
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    if (course.authorId !== userId && userRole !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Delete course
    await Course.findOneAndDelete({ id: params.courseId });
    
    return NextResponse.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ courseId: string }> }
) {
  try {
    const params = await paramsPromise;
    
    // Check authentication - try NextAuth session first, then JWT fallback
    let userId = null;
    let userRole = 'user';

    // Try NextAuth session first
    const session = await getServerSession(authOptions);
    if (session?.user) {
      userId = session.user.id;
      userRole = session.user.role || 'user';
    } else {
      // Fallback to JWT token
      const token = request.cookies.get('auth-token')?.value;
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
          userId = decoded.userId;
          userRole = decoded.role || 'user';
        } catch (jwtError) {
          return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const updateData = await request.json();
    
    await connectToDatabase();
    
    // Find course and check ownership or admin rights
    const course = await Course.findOne({ id: params.courseId });
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    if (course.authorId !== userId && userRole !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Update course
    const updatedCourse = await Course.findOneAndUpdate(
      { id: params.courseId },
      { $set: { ...updateData, updatedAt: new Date() } },
      { new: true }
    );
    
    return NextResponse.json({
      success: true,
      message: 'Course updated successfully',
      course: updatedCourse
    });
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
  }
}
