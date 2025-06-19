import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Mark this route as dynamic to prevent static analysis during build
export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { action, adminId, reason } = await request.json();
    
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    
    const status = action === 'approve' ? 'published' : 'rejected';
    
    const result = await db
      .collection('courses')
      .updateOne(
        { _id: new ObjectId(params.id) },
        { 
          $set: {
            status,
            reviewedAt: new Date(),
            reviewedBy: adminId,
            reviewReason: reason || null,
            updatedAt: new Date()
          }
        }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Log the admin action
    await db.collection('admin_actions').insertOne({
      type: 'course_review',
      action,
      courseId: params.id,
      adminId,
      reason,
      timestamp: new Date()
    });

    return NextResponse.json({
      success: true,
      message: `Course ${action}d successfully`
    });

  } catch (error) {
    console.error('Course approval error:', error);
    return NextResponse.json(
      { error: 'Failed to process course approval' },
      { status: 500 }
    );
  }
}
