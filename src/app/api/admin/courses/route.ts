import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

// Mark this route as dynamic to prevent static analysis during build
export const dynamic = 'force-dynamic';

interface Course {
  _id: any;
  title: string;
  description: string;
  instructor: string;
  category: string;
  modules?: any[];
  documents?: any[];
  duration: number;
  rating: number;
  enrollmentCount: number;
  authorId: string;
  authorName?: string;
  visibility: string;
  status: string;
  difficulty: string;
  estimatedHours: number;
  tags: string[];
  createdAt: Date;
  updatedAt?: Date;
  submittedDate?: Date;
  lastModified: Date;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    const { db } = await connectToDatabase();
    
    // Build query based on status filter
    const query: any = {};
    if (status !== 'all') {
      query.status = status;
    }

    const courses = await db
      .collection('courses')
      .find(query)
      .sort({ submittedDate: -1, createdAt: -1 })
      .toArray();

    // Enrich with additional data
    interface EnrichedCourse {
        id: string;
        title: string;
        description: string;
        instructor: string;
        category: string;
        modules: any[];
        documents: any[];
        duration: number;
        rating: number;
        enrollmentCount: number;
        authorId: string;
        authorName: string;
        visibility: string;
        status: string;
        difficulty: string;
        estimatedHours: number;
        tags: string[];
        createdAt: Date;
        updatedAt?: Date;
        submittedDate?: Date;
        lastModified: Date;
        modulesCount: number;
        documentsCount: number;
    }

            const enrichedCourses: EnrichedCourse[] = courses.map((course: Course): EnrichedCourse => ({
                id: course._id.toString(),
                title: course.title,
                description: course.description,
                instructor: course.instructor,
                category: course.category,
                modules: course.modules || [],
                documents: course.documents || [],
                duration: course.duration,
                rating: course.rating,
                enrollmentCount: course.enrollmentCount,
                authorId: course.authorId,
                authorName: course.authorName || 'Unknown User',
                visibility: course.visibility,
                status: course.status,
                difficulty: course.difficulty,
                estimatedHours: course.estimatedHours,
                tags: course.tags,
                createdAt: course.createdAt,
                updatedAt: course.updatedAt,
                submittedDate: course.submittedDate,
                lastModified: course.lastModified,
                modulesCount: (course.modules || []).length,
                documentsCount: (course.documents || []).length
            }));

    return NextResponse.json({
      success: true,
      courses: enrichedCourses
    });

  } catch (error) {
    console.error('Admin courses fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}
