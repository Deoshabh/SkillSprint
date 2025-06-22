import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { CourseService, TypeConverter } from '@/lib/data-service';

export async function GET() {
  try {
    const courses = await CourseService.getVisibleCourses();
    const legacyCourses = courses.map(course => TypeConverter.courseToLegacyCourse(course));
    
    return NextResponse.json(legacyCourses);
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
    
    const legacyCourse = TypeConverter.courseToLegacyCourse(course);
    return NextResponse.json(legacyCourse, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
