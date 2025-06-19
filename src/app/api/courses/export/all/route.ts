import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Course } from '@/lib/mongodb';

// Force dynamic rendering to prevent static analysis during build
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { includeUserData, format } = await request.json();
    
    // Find all courses
    const courses = await Course.find({}).lean();
    
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
        courseCount: courses.length,
        exportType: 'all_courses'
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
    headers.set('Content-Disposition', `attachment; filename="skillsprint_all_courses_export_${Date.now()}.json"`);
    
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers
    });
    
  } catch (error) {
    console.error('All courses export error:', error);
    return NextResponse.json(
      { error: 'Failed to export all courses' },
      { status: 500 }
    );
  }
}
