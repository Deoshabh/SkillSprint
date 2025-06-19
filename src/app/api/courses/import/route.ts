import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { connectToDatabase } from '@/lib/mongodb';
import { Course } from '@/lib/mongodb';
import jwt from 'jsonwebtoken';

// Import modes
type ImportMode = 'create' | 'update' | 'createOrUpdate';

interface ImportOptions {
  mode: ImportMode;
  preserveIds: boolean;
  updateExisting: boolean;
  skipDuplicates: boolean;
  importAsSingleCourse?: boolean;
}

// Helper function to transform CourseImportPreview to Course data
function transformPreviewToCourse(preview: any, userId: string, userRole: string): any {
  return {
    id: `course-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: preview.topic || preview.title || 'Untitled Course',
    description: preview.description || `Course about ${preview.topic || 'various topics'}`,
    category: preview.category || 'General',
    authorId: userId,
    authorName: preview.authorName || 'Anonymous',
    imageUrl: preview.imageUrl || '',
    status: userRole === 'admin' ? (preview.status || 'draft') : 'draft',
    visibility: preview.visibility || 'private',
    difficulty: preview.difficulty || 'beginner',
    estimatedHours: preview.estimatedHours || 1,
    duration: preview.duration || '1 hour',
    suggestedSchedule: preview.suggestedSchedule || '',
    modules: preview.modules || createModulesFromPreview(preview),
    tags: preview.tags || [],
    enrolledStudents: [],
    ratings: [],
    enrollmentCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

// Helper function to create modules from preview data
function createModulesFromPreview(preview: any): any[] {
  const modules = [];
  
  // Create a module from the course data
  const module = {
    id: `module-${Date.now()}`,
    title: preview.topic || 'Main Module',
    description: preview.description || '',
    contentType: 'video' as const,
    videoLinks: preview.youtubeLinks || [],
    content: '',
    pdfLinks: preview.pdfLinks || [],
    docLinks: preview.docLinks || [],
    subtopics: preview.subtopics || [],
    tasks: preview.tasks || [],
    uploadedDocuments: preview.uploadedDocuments || [],
    metadata: preview.metadata || {}
  };
  
  modules.push(module);
  return modules;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication first
    const session = await getServerSession(authOptions);
    let userId = null;
    let userRole = 'user';

    console.log('=== IMPORT API DEBUG ===');
    console.log('NextAuth session:', session ? { userId: session.user?.id, email: session.user?.email, role: session.user?.role } : 'No session');

    if (session?.user) {
      userId = session.user.id;
      userRole = session.user.role || 'user';
      console.log('Using NextAuth session:', { userId, userRole });
    } else {
      // Fallback to JWT token for backward compatibility
      const token = request.cookies.get('auth-token')?.value;
      console.log('JWT token present:', !!token);
      if (!token) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        userId = decoded.userId;
        userRole = decoded.role || 'user';
        console.log('Using JWT token:', { userId, userRole });
      } catch (jwtError) {
        console.log('JWT verification failed:', jwtError);
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
    }

    if (!userId) {
      console.log('No userId found - authentication failed');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.log('Final auth result:', { userId, userRole });

    await connectToDatabase();
    
    const { importData, options }: { importData: any; options: ImportOptions } = await request.json();
    
    console.log('Import request data:', JSON.stringify({ importData, options }, null, 2));

    if (!importData) {
      return NextResponse.json(
        { error: 'Import data is required' },
        { status: 400 }
      );
    }
      // Check if it's a single course or multiple courses
    const courses = importData.course ? [importData.course] : importData.courses;
    
    if (!courses || !Array.isArray(courses)) {
      return NextResponse.json(
        { error: 'No courses found in import data' },
        { status: 400 }
      );
    }

    // Check if this is the new single-course import format with modules
    const isSingleCourseImport = options.importAsSingleCourse && courses.length === 1 && courses[0].modules;
      const results = {
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: [] as any[]
    };

    if (isSingleCourseImport) {
      // Handle single course import with modules
      try {
        const courseData = courses[0];        console.log('Processing single course import:', JSON.stringify(courseData, null, 2));
        
        // Transform the single course data
        const transformedCourse = {
          id: `course-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: courseData.title,
          description: courseData.description || `Course covering various topics`,
          category: courseData.category || 'General',
          authorId: userId,
          authorName: 'Course Author',
          imageUrl: courseData.imageUrl || '',
          status: userRole === 'admin' ? 'draft' : 'draft',
          visibility: courseData.visibility || 'private',
          difficulty: courseData.difficulty || 'beginner',
          estimatedHours: courseData.estimatedHours || courseData.modules?.length || 1,
          duration: courseData.duration || `${courseData.modules?.length || 1} hours`,
          suggestedSchedule: courseData.suggestedSchedule || '',
          modules: courseData.modules || [],
          tags: courseData.tags || [],
          enrolledStudents: [],
          ratings: [],
          enrollmentCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        console.log('Transformed single course data:', JSON.stringify(transformedCourse, null, 2));
        
        // Check if course already exists
        const existingCourse = await Course.findOne({ title: transformedCourse.title });
        
        if (existingCourse) {
          if (options.mode === 'create') {
            results.skipped++;
          } else if (options.mode === 'update' || options.mode === 'createOrUpdate') {
            const updateData = {
              description: transformedCourse.description,
              category: transformedCourse.category,
              difficulty: transformedCourse.difficulty,
              estimatedHours: transformedCourse.estimatedHours,
              duration: transformedCourse.duration,
              modules: transformedCourse.modules,
              tags: transformedCourse.tags,
              visibility: transformedCourse.visibility,
              updatedAt: new Date()
            };
            
            await Course.findByIdAndUpdate(existingCourse._id, updateData, { new: true });
            results.updated++;
            console.log('Successfully updated single course:', transformedCourse.title);
          }        } else {
          console.log('Creating new single course with data:', JSON.stringify(transformedCourse, null, 2));
          const newCourse = new Course(transformedCourse);
          const savedCourse = await newCourse.save();
          results.imported++;
          console.log('Successfully created single course:', savedCourse.title);
          console.log('Saved course ID:', savedCourse._id);
          console.log('Saved course authorId:', savedCourse.authorId);
        }
        
      } catch (courseError) {
        console.error('Error importing single course:', courseError);
        results.errors.push({
          courseTitle: courses[0].title || 'Unknown Course',
          error: courseError instanceof Error ? courseError.message : 'Unknown error'
        });
      }
    } else {
      // Handle multiple courses import (old behavior)
      for (const courseData of courses) {
      try {        // Transform the course data first to get consistent field names
        const transformedCourse = transformPreviewToCourse(courseData, userId, userRole);
        console.log('Processing course data:', JSON.stringify(courseData, null, 2));
        console.log('Transformed course data:', JSON.stringify(transformedCourse, null, 2));
        
        // Check if course already exists (by title or originalId)
        const existingCourse = await Course.findOne({
          $or: [
            { title: transformedCourse.title }, // Use the transformed title
            ...(courseData.originalId ? [{ _id: courseData.originalId }] : [])
          ]
        });
          if (existingCourse) {
          if (options.mode === 'create') {
            results.skipped++;
            continue;
          } else if (options.mode === 'update' || options.mode === 'createOrUpdate') {
            // Update existing course using transformation helper
            const transformedData = transformPreviewToCourse(courseData, userId, userRole);
            const updateData = {
              title: transformedData.title,
              description: transformedData.description,
              category: transformedData.category,
              difficulty: transformedData.difficulty,
              estimatedHours: transformedData.estimatedHours,
              duration: transformedData.duration,
              suggestedSchedule: transformedData.suggestedSchedule,
              modules: transformedData.modules,
              tags: transformedData.tags,
              imageUrl: transformedData.imageUrl,
              updatedAt: new Date()
            };
            
            console.log('Updating existing course with data:', JSON.stringify(updateData, null, 2));
            
            const updatedCourse = await Course.findByIdAndUpdate(
              existingCourse._id,
              updateData,
              { new: true }
            );
            
            if (updatedCourse) {
              results.updated++;
              console.log('Successfully updated course:', updatedCourse.title);
            }
          }        } else {
          // Create new course using the already transformed data
          console.log('Creating new course with data:', JSON.stringify(transformedCourse, null, 2));
          const newCourse = new Course(transformedCourse);
          await newCourse.save();
          results.imported++;
          console.log('Successfully created course:', newCourse.title);
        }          } catch (courseError) {
        console.error('Error importing course:', courseError);
        results.errors.push({
          courseTitle: courseData.topic || courseData.title || 'Unknown Course',
          error: courseError instanceof Error ? courseError.message : 'Unknown error'
        });
      }
    }
    } // Close the else block for multiple courses import
    
    return NextResponse.json({
      success: true,
      message: 'Import completed',
      results
    });
    
  } catch (error) {
    console.error('Course import error:', error);
    return NextResponse.json(
      { error: 'Failed to import courses' },
      { status: 500 }
    );
  }
}
