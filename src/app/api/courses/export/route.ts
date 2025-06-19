import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Course } from '@/lib/mongodb';

// Force dynamic rendering to prevent static analysis during build
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { courseIds, includeUserData, format } = await request.json();
    
    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json(
        { error: 'Course IDs are required' },
        { status: 400 }
      );
    }
      // Find all requested courses - check both _id and id fields
    const courses = await Course.find({
      $or: [
        { _id: { $in: courseIds } },
        { id: { $in: courseIds } }
      ]
    }).lean();
    
    if (courses.length === 0) {
      return NextResponse.json(
        { error: 'No courses found' },
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
        includeUserData,
        courseCount: courses.length
      },
      courses: courses.map(course => ({
        ...course,
        // Remove MongoDB-specific fields
        _id: undefined,
        __v: undefined,
        // Generate new ID for import
        originalId: (course._id as any).toString(),
        // Clean up user data if not included
        ...(includeUserData ? {} : {
          enrolledStudents: [],
          ratings: [],
          enrollmentCount: 0
        })
      }))
    };
    
    // Set appropriate headers for download
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Content-Disposition', `attachment; filename="skillsprint_courses_export_${Date.now()}.json"`);
    
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers
    });
    
  } catch (error) {
    console.error('Bulk course export error:', error);
    return NextResponse.json(
      { error: 'Failed to export courses' },
      { status: 500 }
    );
  }
}
