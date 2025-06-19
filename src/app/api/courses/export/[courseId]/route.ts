import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Course } from '@/lib/mongodb';

// Force dynamic rendering to prevent static analysis during build
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ courseId: string }> }
) {
  try {
    const params = await paramsPromise;
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const includeUserData = searchParams.get('includeUserData') === 'true';
    const format = searchParams.get('format') || 'json';
      // Find the course - check both _id and id fields
    const course = await Course.findOne({
      $or: [
        { _id: params.courseId },
        { id: params.courseId }
      ]
    }).lean();
    
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    
    // Prepare export data
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: 'admin', // TODO: Get from session
        version: '1.0.0',
        platform: 'SkillSprint',
        includeUserData
      },
      course: {
        ...course,
        // Remove MongoDB-specific fields
        _id: undefined,
        __v: undefined,
        // Generate new ID for import
        originalId: (course as any)._id.toString(),
        // Clean up user data if not included
        ...(includeUserData ? {} : {
          enrolledStudents: [],
          ratings: [],
          enrollmentCount: 0
        })
      }
    };
    
    // Set appropriate headers for download
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Content-Disposition', `attachment; filename="${(course as any).title.replace(/[^a-zA-Z0-9]/g, '_')}_export.json"`);
    
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers
    });
    
  } catch (error) {
    console.error('Course export error:', error);
    return NextResponse.json(
      { error: 'Failed to export course' },
      { status: 500 }
    );
  }
}
