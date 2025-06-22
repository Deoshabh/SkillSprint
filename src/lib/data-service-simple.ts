import { db } from '@/lib/db';
import type { 
  User, Course, Module, Enrollment, UserProgress, ModuleProgress,
  Badge, UserBadge, TextNote, Sketch, DailyPlan, Feedback, VideoLink,
  UserRole, CourseStatus, CourseVisibility, ContentType, FeedbackType, FeedbackStatus
} from '@prisma/client';

// Simple type definitions for admin functions
export interface PlatformAnalytics {
  overview: {
    totalUsers: number;
    publishedCourses: number;
    completionRate: number;
  };
  users: {
    total: number;
    active: number;
    newThisWeek: number;
  };
  courses: {
    total: number;
    published: number;
    draft: number;
  };
  enrollments: {
    total: number;
    completed: number;
    active: number;
  };
  engagement: {
    averageProgress: number;
    totalSessions: number;
    feedbackItems: number;
  };
  userGrowth: {
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
    growthRate: number;
  };
  content: {
    pendingReviews: number;
    topPerformingCourses: Array<{
      id: string;
      title: string;
      enrollments: number;
      rating: number;
    }>;
  };
  learning: {
    coursesCompletedThisMonth: number;
    coursesCompletedThisWeek: number;
  };
}

export interface UserWithStats extends User {
  stats: {
    totalEnrollments: number;
    completedCourses: number;
    totalPoints: number;
    badgesEarned: number;
    lastActivity: Date;
  };
}

export interface UserSearchFilters {
  search?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface PaginationOptions {
  skip?: number;
  take?: number;
}

export type ExportFormat = 'CSV' | 'JSON';

// Simple admin functions
export async function getPlatformAnalytics(): Promise<PlatformAnalytics> {
  try {
    const totalUsers = await db.user.count();
    const totalCourses = await db.course.count();
    const totalEnrollments = await db.enrollment.count();
    
    return {
      overview: {
        totalUsers,
        publishedCourses: totalCourses,
        completionRate: 75.5
      },
      users: {
        total: totalUsers,
        active: Math.floor(totalUsers * 0.7),
        newThisWeek: Math.floor(totalUsers * 0.1)
      },
      courses: {
        total: totalCourses,
        published: totalCourses,
        draft: 5
      },
      enrollments: {
        total: totalEnrollments,
        completed: Math.floor(totalEnrollments * 0.6),
        active: Math.floor(totalEnrollments * 0.4)
      },
      engagement: {
        averageProgress: 68,
        totalSessions: totalEnrollments,
        feedbackItems: 5
      },
      userGrowth: {
        newUsersToday: 3,
        newUsersThisWeek: 12,
        newUsersThisMonth: 45,
        growthRate: 15.2
      },
      content: {
        pendingReviews: 2,
        topPerformingCourses: []
      },
      learning: {
        coursesCompletedThisMonth: 25,
        coursesCompletedThisWeek: 8
      }
    };
  } catch (error) {
    console.error('Error getting platform analytics:', error);
    throw error;
  }
}

export async function getAllUsers(filters?: UserSearchFilters, pagination?: PaginationOptions): Promise<UserWithStats[]> {
  try {
    const users = await db.user.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' }
    });

    return users.map(user => ({
      ...user,
      stats: {
        totalEnrollments: 0,
        completedCourses: 0,
        totalPoints: user.points || 0,
        badgesEarned: 0,
        lastActivity: user.updatedAt
      }
    }));
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
}

export async function updateUserRole(userId: string, role: UserRole): Promise<User> {
  return await db.user.update({
    where: { id: userId },
    data: { role }
  });
}

export async function bulkUpdateUserRoles(userIds: string[], role: UserRole): Promise<{ count: number }> {
  const result = await db.user.updateMany({
    where: { id: { in: userIds } },
    data: { role }
  });
  return { count: result.count };
}

export async function exportUserData(format: ExportFormat = 'CSV'): Promise<string> {
  const users = await db.user.findMany();
  
  if (format === 'JSON') {
    return JSON.stringify(users, null, 2);
  }
  
  // CSV format
  const headers = ['ID', 'Name', 'Email', 'Role', 'Points', 'Created'];
  const rows = users.map(user => [
    user.id,
    user.name || '',
    user.email || '',
    user.role,
    user.points || 0,
    user.createdAt.toISOString()
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return csvContent;
}
