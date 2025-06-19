import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { unlink } from 'fs/promises';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = await connectToDatabase();
    const document = await db
      .collection('documents')
      .findOne({ _id: new ObjectId(params.id) });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document._id.toString(),
        name: document.name,
        originalName: document.originalName,
        type: document.type,
        size: document.size,
        url: document.url,
        uploadedAt: document.uploadedAt,
        userId: document.userId,
        courseId: document.courseId,
        description: document.description,
        isPublic: document.isPublic,
        status: document.status
      }
    });

  } catch (error) {
    console.error('Document fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json();
    const { db } = await connectToDatabase();

    // Only allow specific fields to be updated
    const allowedUpdates = {
      name: updates.name,
      description: updates.description,
      isPublic: updates.isPublic,
      status: updates.status,
      courseId: updates.courseId
    };

    // Remove undefined values
    Object.keys(allowedUpdates).forEach(key => {
      if (allowedUpdates[key as keyof typeof allowedUpdates] === undefined) {
        delete allowedUpdates[key as keyof typeof allowedUpdates];
      }
    });

    const result = await db
      .collection('documents')
      .updateOne(
        { _id: new ObjectId(params.id) },
        { 
          $set: {
            ...allowedUpdates,
            updatedAt: new Date()
          }
        }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Document updated successfully'
    });

  } catch (error) {
    console.error('Document update error:', error);
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = await connectToDatabase();
    
    // Get document details before deletion
    const document = await db
      .collection('documents')
      .findOne({ _id: new ObjectId(params.id) });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Delete from database
    await db
      .collection('documents')
      .deleteOne({ _id: new ObjectId(params.id) });

    // Try to delete physical file
    try {
      await unlink(document.path);
    } catch (fileError) {
      console.warn('Could not delete physical file:', fileError);
      // Continue even if file deletion fails
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Document deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
