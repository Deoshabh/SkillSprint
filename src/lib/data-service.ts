import { db } from '@/lib/db';
import type { 
  User, Course, Module, Enrollment, UserProgress, ModuleProgress,
  Badge, UserBadge, TextNote, Sketch, DailyPlan, Feedback, VideoLink,
  UserRole, CourseStatus, CourseVisibility, ContentType, FeedbackType, FeedbackStatus
} from '@prisma/client';
import type { 
  UserProfile, Course as CourseType, Module as ModuleType, 
  VideoLink as VideoLinkType, FeedbackItem, Badge as BadgeType,
  TextNote as TextNoteType, Sketch as SketchType, DailyTask
} from '@/lib/types';

// Type definitions for API responses
export type CourseWithModules = Course & {
  modules: (Module & { videoLinks: VideoLink[] })[];
  author: User;
  enrollments: Enrollment[];
  userProgress: UserProgress[];
};

export type UserWithBadges = User & {
  earnedBadges: (UserBadge & { badge: Badge })[];
};

// User Management
export class UserService {
  static async findByClerkId(clerkId: string): Promise<User | null> {
    try {
      // Use simple query without complex includes to avoid transaction requirements
      return await db.user.findUnique({
        where: { clerkId }
      });
    } catch (error) {
      console.error('Error finding user by Clerk ID:', error);
      return null;
    }
  }

  static async findByClerkIdWithRelations(clerkId: string): Promise<User | null> {
    try {
      return await db.user.findUnique({
        where: { clerkId },
        include: {
          earnedBadges: {
            include: { badge: true }
          },
          enrollments: true,
          userProgress: {
            include: {
              moduleProgress: true
            }
          }
        }
      });
    } catch (error) {
      console.error('Error finding user with relations:', error);
      return null;
    }
  }
  static async createUser(data: {
    clerkId: string;
    email: string;
    name?: string;
    avatarUrl?: string;
    role?: UserRole;
  }): Promise<User> {
    // Temporarily return a mock user to avoid MongoDB replica set requirement
    // TODO: Enable when MongoDB is configured as replica set
    console.log('Skipping user creation due to MongoDB replica set requirement');
    return {
      id: `mock_${data.clerkId}`,
      clerkId: data.clerkId,
      email: data.email,
      name: data.name || null,
      avatarUrl: data.avatarUrl || null,
      role: data.role || 'LEARNER',
      points: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      learningTracks: [],
      language: 'English',
      profileSetupComplete: false
    };
    
    /* Original implementation - enable when replica set is available
    return await db.user.create({
      data: {
        clerkId: data.clerkId,
        email: data.email,
        name: data.name || null,
        avatarUrl: data.avatarUrl || null,
        role: data.role || 'LEARNER',
        points: 0
      }
    });
    */
  }

  static async updateUser(clerkId: string, data: {
    name?: string;
    email?: string;
    avatarUrl?: string;
    points?: number;
    role?: UserRole;
  }): Promise<User | null> {
    try {
      return await db.user.update({
        where: { clerkId },
        data
      });
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }

  static async updateUserProfile(clerkId: string, data: {
    name?: string;
    email?: string;
    avatarUrl?: string;
    learningTracks?: string[];
    language?: string;
    profileSetupComplete?: boolean;
  }): Promise<User | null> {
    try {
      return await db.user.update({
        where: { clerkId },
        data
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      return null;
    }
  }

  static async deleteUser(clerkId: string): Promise<void> {
    await db.user.delete({
      where: { clerkId }
    });
  }

  static async getAllUsers(): Promise<User[]> {
    return await db.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }
}

// Course Management
export class CourseService {  static async createCourse(data: {
    title: string;
    description: string;
    instructor: string;
    category: string;
    icon: string;
    authorId: string;
    status?: CourseStatus;
    visibility?: CourseVisibility;
    imageUrl?: string;
    dataAiHint?: string;
    suggestedSchedule?: string;
    duration?: string;
    modules?: Array<{
      id?: string;
      title: string;
      description: string;
      contentType?: ContentType;
      contentUrl?: string;
      estimatedTime?: string;
      videoLinks?: Array<{
        title: string;
        url: string;
        language?: string;
        creator?: string;
        notes?: string;
        isPlaylist?: boolean;
      }>;
    }>;
  }): Promise<Course> {
    try {
      const { modules, ...courseData } = data;
      
      // Create course without transaction for now
      const course = await db.course.create({
        data: {
          ...courseData,
          status: courseData.status || 'DRAFT',
          visibility: courseData.visibility || 'PRIVATE',
          lastModified: new Date()
        }
      });

      // Create modules separately if provided
      if (modules && modules.length > 0) {
        for (let i = 0; i < modules.length; i++) {
          const module = modules[i];
          const { videoLinks, ...moduleData } = module;
          
          try {
            const createdModule = await db.module.create({
              data: {
                ...moduleData,
                courseId: course.id,
                contentType: moduleData.contentType || 'VIDEO',
                estimatedTime: moduleData.estimatedTime || '1 hour',
                order: i + 1
              }
            });

            // Create video links separately if provided
            if (videoLinks && videoLinks.length > 0) {
              for (const vl of videoLinks) {
                try {
                  await db.videoLink.create({
                    data: {
                      moduleId: createdModule.id,
                      title: vl.title,
                      url: vl.url,
                      language: vl.language || 'English',
                      creator: vl.creator || '',
                      notes: vl.notes || '',
                      isPlaylist: vl.isPlaylist || false
                    }
                  });
                } catch (vlError) {
                  console.error('Error creating video link:', vlError);
                }
              }
            }
          } catch (moduleError) {
            console.error('Error creating module:', moduleError);
          }
        }
      }      return course;
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  }

  static async updateCourse(id: string, data: {
    title?: string;
    description?: string;
    instructor?: string;
    category?: string;
    icon?: string;
    status?: CourseStatus;
    visibility?: CourseVisibility;
    imageUrl?: string;
    dataAiHint?: string;
    suggestedSchedule?: string;
    duration?: string;
    modules?: Array<{
      id?: string;
      title: string;
      description: string;
      contentType?: ContentType;
      contentUrl?: string;
      estimatedTime?: string;
      videoLinks?: Array<{
        title: string;
        url: string;
        language?: string;
        creator?: string;
        notes?: string;
        isPlaylist?: boolean;
      }>;
    }>;  }): Promise<Course | null> {
    try {
      const { modules, ...courseData } = data;
      
      // Update course without transaction for now
      const course = await db.course.update({
        where: { id },
        data: {
          ...courseData,
          lastModified: new Date()
        }
      });

      // If modules are provided, replace all modules (simplified approach)
      if (modules) {
        try {
          // Delete existing modules first
          await db.module.deleteMany({
            where: { courseId: id }
          });

          // Create new modules
          for (let i = 0; i < modules.length; i++) {
            const module = modules[i];
            const { videoLinks, ...moduleData } = module;
            
            try {
              const createdModule = await db.module.create({
                data: {
                  ...moduleData,
                  courseId: id,
                  contentType: moduleData.contentType || 'VIDEO',
                  estimatedTime: moduleData.estimatedTime || '1 hour',
                  order: i + 1
                }
              });

              if (videoLinks && videoLinks.length > 0) {
                for (const vl of videoLinks) {
                  try {
                    await db.videoLink.create({
                      data: {
                        moduleId: createdModule.id,
                        title: vl.title,
                        url: vl.url,
                        language: vl.language || 'English',
                        creator: vl.creator || '',
                        notes: vl.notes || '',
                        isPlaylist: vl.isPlaylist || false
                      }
                    });
                  } catch (vlError) {
                    console.error('Error creating video link:', vlError);
                  }
                }
              }
            } catch (moduleError) {
              console.error('Error creating module:', moduleError);
            }
          }
        } catch (moduleDeleteError) {
          console.error('Error managing modules:', moduleDeleteError);
        }
      }

      return course;
    } catch (error) {
      console.error('Error updating course:', error);
      return null;
    }
  }

  static async deleteCourse(id: string): Promise<void> {
    await db.course.delete({
      where: { id }
    });
  }

  static async getCourseById(id: string): Promise<CourseWithModules | null> {
    return await db.course.findUnique({
      where: { id },
      include: {
        modules: {
          include: { videoLinks: true },
          orderBy: { order: 'asc' }
        },
        author: true,
        enrollments: true,
        userProgress: true
      }
    });
  }

  static async getAllCourses(): Promise<CourseWithModules[]> {
    return await db.course.findMany({
      include: {
        modules: {
          include: { videoLinks: true },
          orderBy: { order: 'asc' }
        },
        author: true,
        enrollments: true,
        userProgress: true
      },
      orderBy: { lastModified: 'desc' }
    });
  }

  static async getCoursesByAuthor(authorId: string): Promise<CourseWithModules[]> {
    return await db.course.findMany({
      where: { authorId },
      include: {
        modules: {
          include: { videoLinks: true },
          orderBy: { order: 'asc' }
        },
        author: true,
        enrollments: true,
        userProgress: true
      },
      orderBy: { lastModified: 'desc' }
    });
  }

  static async getPublishedCourses(): Promise<CourseWithModules[]> {
    return await db.course.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        modules: {
          include: { videoLinks: true },
          orderBy: { order: 'asc' }
        },
        author: true,
        enrollments: true,
        userProgress: true
      },
      orderBy: { lastModified: 'desc' }
    });
  }

  static async getVisibleCourses(): Promise<CourseWithModules[]> {
    return await db.course.findMany({
      where: {
        OR: [
          { status: 'PUBLISHED' },
          { visibility: 'PUBLIC' },
          { visibility: 'SHARED' }
        ]
      },
      include: {
        modules: {
          include: { videoLinks: true },
          orderBy: { order: 'asc' }
        },
        author: true,
        enrollments: true,
        userProgress: true
      },
      orderBy: { lastModified: 'desc' }
    });
  }

  static async updateCourseStatus(courseId: string, status: CourseStatus): Promise<Course | null> {
    try {
      return await db.course.update({
        where: { id: courseId },
        data: { 
          status,
          submittedDate: status === 'PENDING_REVIEW' ? new Date() : undefined,
          lastModified: new Date()
        }
      });
    } catch (error) {
      console.error('Error updating course status:', error);
      return null;
    }
  }
}

// Progress Management
export class ProgressService {
  static async getOrCreateUserProgress(userId: string, courseId: string): Promise<UserProgress> {
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: { modules: true }
    });

    if (!course) {
      throw new Error('Course not found');
    }

    return await db.userProgress.upsert({
      where: {
        userId_courseId: { userId, courseId }
      },
      update: {
        lastActivity: new Date()
      },
      create: {
        userId,
        courseId,
        totalModules: course.modules.length,
        completedModules: [],
        currentModuleId: course.modules[0]?.id || null,
        lastActivity: new Date()
      }
    });
  }
  static async markModuleComplete(userId: string, courseId: string, moduleId: string): Promise<void> {
    try {
      const userProgress = await db.userProgress.findUnique({
        where: { userId_courseId: { userId, courseId } }
      });

      if (!userProgress) return;

      const completedModules = [...userProgress.completedModules];
      if (!completedModules.includes(moduleId)) {
        completedModules.push(moduleId);
      }

      await db.userProgress.update({
        where: { userId_courseId: { userId, courseId } },
        data: {
          completedModules,
          lastActivity: new Date()
        }
      });

      await db.moduleProgress.upsert({
        where: {
          userId_courseId_moduleId: { userId, courseId, moduleId }
        },
        update: {
          completedAt: new Date()
        },
        create: {
          userId,
          courseId,
          moduleId,
          completedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error marking module complete:', error);
    }
  }

  static async markCourseStarted(userId: string, courseId: string): Promise<UserProgress> {
    const userProgress = await this.getOrCreateUserProgress(userId, courseId);
    
    // Enroll user if not already enrolled
    await db.enrollment.upsert({
      where: {
        userId_courseId: { userId, courseId }
      },
      update: {},
      create: { userId, courseId }
    });

    return userProgress;
  }

  static async getUserProgressForCourse(userId: string, courseId: string): Promise<(UserProgress & { moduleProgress: ModuleProgress[] }) | null> {
    return await db.userProgress.findUnique({
      where: {
        userId_courseId: { userId, courseId }
      },
      include: { moduleProgress: true }
    });
  }
  static async getUserProgress(userId: string): Promise<UserProgress[]> {
    return await db.userProgress.findMany({
      where: { userId },
      include: { moduleProgress: true },
      orderBy: { createdAt: 'desc' }
    });
  }
}

// Badge Management
export class BadgeService {
  static async getAllBadges(): Promise<Badge[]> {
    return await db.badge.findMany({
      orderBy: { name: 'asc' }
    });
  }

  static async awardBadgeToUser(userId: string, badgeId: string): Promise<UserBadge> {
    const existing = await db.userBadge.findUnique({
      where: { userId_badgeId: { userId, badgeId } }
    });

    if (existing) {
      return existing;
    }

    return await db.userBadge.create({
      data: { userId, badgeId }
    });
  }

  static async getUserBadges(userId: string): Promise<(UserBadge & { badge: Badge })[]> {
    return await db.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' }
    });
  }
}

// Notes Management
export class NotesService {
  static async createNote(userId: string, data: {
    courseId: string;
    moduleId?: string;
    content: string;
    title?: string;
  }): Promise<TextNote> {
    return await db.textNote.create({
      data: { ...data, userId }
    });
  }

  static async updateNote(id: string, data: {
    content?: string;
    title?: string;
  }): Promise<TextNote> {
    return await db.textNote.update({
      where: { id },
      data
    });
  }

  static async deleteNote(id: string): Promise<void> {
    await db.textNote.delete({
      where: { id }
    });
  }

  static async getUserNotes(userId: string): Promise<TextNote[]> {
    return await db.textNote.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getCourseNotes(userId: string, courseId: string): Promise<TextNote[]> {
    return await db.textNote.findMany({
      where: { userId, courseId },
      orderBy: { createdAt: 'desc' }
    });
  }
}

// Sketches Management
export class SketchesService {
  static async createSketch(userId: string, data: {
    courseId: string;
    moduleId?: string;
    sketchData: string;
    title?: string;
  }): Promise<Sketch> {
    return await db.sketch.create({
      data: { ...data, userId }
    });
  }

  static async updateSketch(id: string, data: {
    sketchData?: string;
    title?: string;
  }): Promise<Sketch> {
    return await db.sketch.update({
      where: { id },
      data
    });
  }

  static async deleteSketch(id: string): Promise<void> {
    await db.sketch.delete({
      where: { id }
    });
  }

  static async getUserSketches(userId: string): Promise<Sketch[]> {
    return await db.sketch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getCourseSketches(userId: string, courseId: string): Promise<Sketch[]> {
    return await db.sketch.findMany({
      where: { userId, courseId },
      orderBy: { createdAt: 'desc' }
    });
  }
}

// Daily Plans Management
export class DailyPlansService {
  static async createDailyPlan(userId: string, data: {
    title: string;
    description?: string;
    dueDate?: Date;
    estimatedTime?: string;
    courseId?: string;
    moduleId?: string;
    completed?: boolean;
  }): Promise<DailyPlan> {
    return await db.dailyPlan.create({
      data: { ...data, userId }
    });
  }

  static async updateDailyPlan(id: string, data: {
    title?: string;
    description?: string;
    dueDate?: Date;
    estimatedTime?: string;
    completed?: boolean;
  }): Promise<DailyPlan> {
    return await db.dailyPlan.update({
      where: { id },
      data
    });
  }

  static async deleteDailyPlan(id: string): Promise<void> {
    await db.dailyPlan.delete({
      where: { id }
    });
  }
  static async getUserDailyPlans(userId: string): Promise<DailyPlan[]> {
    return await db.dailyPlan.findMany({
      where: { userId },
      orderBy: { date: 'asc' }
    });
  }
}

// Feedback Management
export class FeedbackService {
  static async createFeedback(userId: string, data: {
    type: FeedbackType;
    subject: string;
    message: string;
    courseId?: string;
  }): Promise<Feedback> {
    return await db.feedback.create({
      data: { ...data, userId }
    });
  }

  static async updateFeedbackStatus(id: string, data: {
    status: FeedbackStatus;
    adminNotes?: string;
  }): Promise<Feedback> {
    return await db.feedback.update({
      where: { id },
      data
    });
  }

  static async getAllFeedback(): Promise<Feedback[]> {
    return await db.feedback.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }
}

// Enrollment Management
export class EnrollmentService {
  static async enrollUserInCourse(userId: string, courseId: string): Promise<Enrollment> {
    const existing = await db.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } }
    });

    if (existing) {
      return existing;
    }

    return await db.enrollment.create({
      data: { userId, courseId }
    });
  }

  static async getUserEnrollments(userId: string): Promise<Enrollment[]> {
    return await db.enrollment.findMany({
      where: { userId },
      include: { course: true },
      orderBy: { enrolledAt: 'desc' }
    });
  }

  static async unenrollUserFromCourse(userId: string, courseId: string): Promise<void> {
    await db.enrollment.delete({
      where: { userId_courseId: { userId, courseId } }
    });
  }
}

// Helper Functions
export class DatabaseHelpers {
  static async getMongoUserIdFromClerkId(clerkId: string): Promise<string | null> {
    try {
      const user = await db.user.findUnique({
        where: { clerkId },
        select: { id: true }
      });
      return user?.id || null;
    } catch (error) {
      console.error('Error finding user by Clerk ID:', error);
      return null;
    }
  }

  static async ensureUserExists(clerkId: string, userData?: {
    email: string;
    name?: string;
    avatarUrl?: string;
  }): Promise<string | null> {
    try {
      let user = await db.user.findUnique({
        where: { clerkId },
        select: { id: true }
      });

      if (!user && userData) {
        // Create user if it doesn't exist
        user = await db.user.create({
          data: {
            clerkId,
            email: userData.email,
            name: userData.name || null,
            avatarUrl: userData.avatarUrl || null,
            role: 'LEARNER',
            points: 0
          },
          select: { id: true }
        });
      }

      return user?.id || null;
    } catch (error) {
      console.error('Error ensuring user exists:', error);
      return null;
    }
  }
}

// Type Converters for API responses
export class TypeConverter {  static userToUserProfile(user: UserWithBadges): UserProfile {
    return {
      id: user.id,
      name: user.name || '',
      email: user.email,
      avatarUrl: user.avatarUrl || undefined,
      points: user.points,
      earnedBadges: user.earnedBadges.map((ub: any) => ({
        id: ub.badge.id,
        name: ub.badge.name,
        description: ub.badge.description,
        icon: ub.badge.icon,
        color: ub.badge.color
      })),
      enrolledCourses: [],
      role: user.role.toLowerCase() as 'learner' | 'educator' | 'admin',
      learningPreferences: {
        tracks: [],
        language: 'English'
      },
      profileSetupComplete: true
    };
  }

  static courseToApiCourse(course: CourseWithModules): CourseType {
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      instructor: course.instructor,
      category: course.category,
      icon: course.icon,
      modules: course.modules.map((module: any) => ({
        id: module.id,
        title: module.title,
        description: module.description,
        contentType: module.contentType.toLowerCase() as any,
        contentUrl: module.contentUrl || undefined,
        estimatedTime: module.estimatedTime,
        order: module.order,
        videoLinks: module.videoLinks.map((vl: any) => ({
          id: vl.id,
          title: vl.title,
          url: vl.url,
          language: vl.language,
          creator: vl.creator || '',
          notes: vl.notes || '',
          isPlaylist: vl.isPlaylist
        }))
      })),
      authorId: course.authorId,
      status: course.status.toLowerCase() as any,
      visibility: course.visibility.toLowerCase() as any,
      imageUrl: course.imageUrl || undefined,
      dataAiHint: course.dataAiHint || undefined,
      lastModified: course.lastModified.toISOString(),
      submittedDate: course.submittedDate?.toISOString(),
      suggestedSchedule: course.suggestedSchedule || '',
      duration: course.duration || undefined
    };
  }

  static courseToLegacyCourse(course: CourseWithModules): CourseType {
    return this.courseToApiCourse(course);
  }
}

// Function exports for convenience
export const getAllBadges = BadgeService.getAllBadges;
export const awardBadgeToUser = BadgeService.awardBadgeToUser;
export const getUserBadges = BadgeService.getUserBadges;
export const updateCourseStatus = CourseService.updateCourseStatus;
export const getUserProgress = ProgressService.getUserProgress;
export const markModuleComplete = ProgressService.markModuleComplete;
export const markCourseStarted = ProgressService.markCourseStarted;
export const getUserProgressForCourse = ProgressService.getUserProgressForCourse;
