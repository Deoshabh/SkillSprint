import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { updateCourseStatus } from '@/lib/data-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const courseId = params.id;

    // Update course status to pending_review
    const updatedCourse = await updateCourseStatus(courseId, 'pending_review');
    
    if (!updatedCourse) {
      return NextResponse.json(
        { error: 'Course not found or not eligible for review' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      course: updatedCourse
    });
  } catch (error) {
    console.error('Error submitting course for review:', error);
    return NextResponse.json(
      { error: 'Failed to submit course for review' },
      { status: 500 }
    );
  }
}
