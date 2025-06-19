import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, User, Course } from '@/lib/mongodb';
import { withApiHandler, createApiResponse, RequestContext } from '@/lib/api-utils';
import { rateLimitByUser } from '@/lib/security-utils';

export const GET = withApiHandler(async (context: RequestContext) => {
  const { user } = context;
  
  // Rate limiting
  const rateLimit = rateLimitByUser(user.userId, 30, 60000); // 30 requests per minute
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Too many requests',
        meta: { 
          timestamp: new Date().toISOString(),
          retryAfter: new Date(rateLimit.resetTime).toISOString()
        }
      }, 
      { status: 429 }
    );
  }
  
  await connectToDatabase();
  const userDoc = await User.findById(user.userId);

  if (!userDoc) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'User not found',
        meta: { timestamp: new Date().toISOString() }
      }, 
      { status: 404 }
    );
  }

  // Get user's enrolled courses
  const enrolledCourseIds = userDoc.enrolledCourses || [];
  const enrolledCourses = await Course.find({ id: { $in: enrolledCourseIds } });

  // Calculate dashboard stats
  const stats = {
    totalPoints: userDoc.points || 0,
    totalBadges: userDoc.earnedBadges?.length || 0,
    enrolledCoursesCount: enrolledCourses.length,
    completedModulesCount: userDoc.completedModules?.length || 0,
    totalCoursesAvailable: await Course.countDocuments({ status: 'published' }),
    currentStreak: userDoc.currentStreak || 0,
    lastActivity: userDoc.lastActivity || null,
    recentAchievements: userDoc.earnedBadges?.slice(-3) || [],
    enrolledCourses: enrolledCourses.map(course => ({
      id: course.id,
      title: course.title,
      imageUrl: course.imageUrl,
      progress: calculateCourseProgress(userDoc, course)
    }))
  };

  return createApiResponse(
    { stats },
    'Dashboard data retrieved successfully'
  );
}, { requireAuth: true });

function calculateCourseProgress(user: any, course: any): number {
  const userCompletedModules = user.completedModules || [];
  const courseModules = course.modules || [];
  
  if (courseModules.length === 0) return 0;
  
  const completedInCourse = userCompletedModules.filter((moduleId: string) => 
    courseModules.some((module: any) => module.id === moduleId)
  );
  
  return Math.round((completedInCourse.length / courseModules.length) * 100);
}
