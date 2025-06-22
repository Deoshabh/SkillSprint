import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { updateCourseStatus } from '@/lib/data-service';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add admin check here
    // For now, we'll assume only authenticated users can access this

    const { status } = await request.json();
    const courseId = params.id;

    const updatedCourse = await updateCourseStatus(courseId, status);
    
    if (!updatedCourse) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      course: updatedCourse
    });
  } catch (error) {
    console.error('Error updating course status:', error);
    return NextResponse.json(
      { error: 'Failed to update course status' },
      { status: 500 }
    );
  }
}
