import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { CourseService, TypeConverter } from '@/lib/data-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sortBy') || 'lastModified';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const instructor = searchParams.get('instructor') || '';
    
    const result = await CourseService.searchCourses({
      search,
      category,
      status,
      instructor,
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc',
      page,
      limit
    });
    
    // Convert courses to legacy format
    const legacyCourses = result.courses.map(course => TypeConverter.courseToLegacyCourse(course));
    
    return NextResponse.json({
      ...result,
      courses: legacyCourses
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    const course = await CourseService.createCourse({
      ...data,
      authorId: userId
    });
    
    // Fetch the complete course with relations for the response
    const fullCourse = await CourseService.getCourseById(course.id);
    if (!fullCourse) {
      return NextResponse.json({ error: 'Course created but could not fetch details' }, { status: 500 });
    }
    
    const legacyCourse = TypeConverter.courseToLegacyCourse(fullCourse);
    return NextResponse.json(legacyCourse, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
