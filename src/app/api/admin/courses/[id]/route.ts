import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Mark this route as dynamic to prevent static analysis during build
export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = await connectToDatabase();
    
    // Get course details before deletion for logging
    const course = await db
      .collection('courses')
      .findOne({ _id: new ObjectId(params.id) });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Delete the course
    await db
      .collection('courses')
      .deleteOne({ _id: new ObjectId(params.id) });

    // Also delete related documents if they exist
    if (course.documents && course.documents.length > 0) {
      const documentIds = course.documents.map((doc: any) => new ObjectId(doc.id));
      await db
        .collection('documents')
        .deleteMany({ _id: { $in: documentIds } });
    }

    // Log the admin action
    await db.collection('admin_actions').insertOne({
      type: 'course_deletion',
      courseId: params.id,
      courseTitle: course.title,
      adminId: 'system', // You might want to pass this from the request
      timestamp: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Course deleted successfully'
    });

  } catch (error) {
    console.error('Course deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    );
  }
}
