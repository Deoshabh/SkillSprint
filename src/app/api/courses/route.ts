import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { connectToDatabase, Course } from '@/lib/mongodb';

// Force dynamic rendering to prevent static analysis during build
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
      const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const authorId = url.searchParams.get('authorId');
    
    let query: any = {};
    
    if (status) {
      // For published status, also include draft courses if no published courses exist
      if (status === 'published') {
        // First check if any published courses exist
        const publishedCount = await Course.countDocuments({ 
          status: 'published',
          $or: [
            { visibility: { $in: ['public', 'shared'] } },
            { visibility: { $exists: false } } // backwards compatibility
          ]
        });
        
        if (publishedCount > 0) {
          query.status = 'published';
          // Only show public/shared courses for published status
          query.$or = [
            { visibility: { $in: ['public', 'shared'] } },
            { visibility: { $exists: false } } // backwards compatibility
          ];
        } else {
          // If no published courses, show draft courses that are public/shared
          query.status = { $in: ['published', 'draft'] };
          query.$or = [
            { visibility: { $in: ['public', 'shared'] } },
            { visibility: { $exists: false } } // backwards compatibility
          ];
        }
      } else {
        query.status = status;
      }
    }
    
    if (authorId) {
      query.authorId = authorId;
      // For user's own courses, show all visibility levels (including private)
    }
    
    const courses = await Course.find(query).sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      courses
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication - try NextAuth session first, then JWT fallback
    let userId = null;
    let userRole = 'user';

    // Try NextAuth session first
    const session = await getServerSession(authOptions);
    if (session?.user) {
      userId = session.user.id;
      userRole = session.user.role || 'user';
      console.log('NextAuth session found:', { userId, userRole });
    } else {
      // Fallback to JWT token
      const token = request.cookies.get('auth-token')?.value;
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
          userId = decoded.userId;
          userRole = decoded.role || 'user';
          console.log('JWT token found:', { userId, userRole });
        } catch (jwtError) {
          console.error('JWT verification failed:', jwtError);
          return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
      }
    }

    if (!userId) {
      console.error('No authentication found');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const courseData = await request.json();
    console.log('Creating course for user:', userId, 'with data:', courseData);
    
    await connectToDatabase();      // Create new course with proper status logic
    const newCourse = new Course({
      id: `course-${Date.now()}`,
      title: courseData.title,
      description: courseData.description,
      category: courseData.category || 'General', // Add default category
      authorId: userId,
      authorName: courseData.authorName || 'Anonymous',
      imageUrl: courseData.imageUrl || '',
      status: courseData.status || 'draft',
      visibility: courseData.visibility || 'private',
      difficulty: courseData.difficulty || 'beginner',
      estimatedHours: courseData.estimatedHours || 0,
      modules: courseData.modules || [],
      tags: courseData.tags || [],
      enrolledStudents: [],
      ratings: [],
      suggestedSchedule: courseData.suggestedSchedule || '',
      duration: courseData.duration || '',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('Saving new course:', newCourse);
    const savedCourse = await newCourse.save();
    console.log('Course saved successfully:', savedCourse._id);

    // Set appropriate message based on visibility
    let message = 'Course created successfully';
    if (courseData.visibility === 'public') {
      message = 'Course created successfully. Submit for review to make it publicly available.';
    } else if (courseData.visibility === 'private') {
      message = 'Course created for your personal learning.';
    } else if (courseData.visibility === 'shared') {
      message = 'Course created and can be shared via link.';
    }

    return NextResponse.json({
      success: true,
      message,
      course: savedCourse    });
  } catch (error) {
    console.error('Error creating course:', error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json({ 
      error: 'Failed to create course',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication - try NextAuth session first, then JWT fallback
    let userId = null;
    let userRole = 'user';

    // Try NextAuth session first
    const session = await getServerSession(authOptions);
    if (session?.user) {
      userId = session.user.id;
      userRole = session.user.role || 'user';
      console.log('NextAuth session found for update:', { userId, userRole });
    } else {
      // Fallback to JWT token
      const token = request.cookies.get('auth-token')?.value;
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
          userId = decoded.userId;
          userRole = decoded.role || 'user';
          console.log('JWT token found for update:', { userId, userRole });
        } catch (jwtError) {
          console.error('JWT verification failed:', jwtError);
          return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
      }
    }

    if (!userId) {
      console.error('No authentication found for update');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { courseId, ...updateData } = await request.json();
    console.log('Updating course:', courseId, 'for user:', userId, 'with data:', updateData);
    
    await connectToDatabase();
    
    // Find course and check ownership or admin rights
    const course = await Course.findOne({ id: courseId });
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    if (course.authorId !== userId && userRole !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Update course
    const updatedCourse = await Course.findOneAndUpdate(
      { id: courseId },
      { $set: updateData },
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
