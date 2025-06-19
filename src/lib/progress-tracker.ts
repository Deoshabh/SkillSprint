/**
 * Progress tracking utilities for real-time course progress monitoring
 */

import { useState } from 'react';

export interface ProgressStats {
  totalModulesCompleted: number;
  totalCoursesEnrolled: number;
  totalPointsEarned: number;
  totalBadgesEarned: number;
  totalVideosAdded: number;
  totalAIVideosFound: number;
  lastActivity: Date;
  joinedDate: Date;
}

export interface EnrichedProgressData {
  completedModules: { [courseId: string]: string[] };
  userModuleVideos: { [key: string]: any[] };
  userAIVideos: { [key: string]: any[] };
  userAISearchUsage: { [key: string]: number };
  points: number;
  earnedBadges: any[];
  enrolledCourses: string[];
  dailyPlans: { [date: string]: any[] };
  stats: ProgressStats;
}

export interface CourseProgressDetail {
  courseId: string;
  courseTitle: string;
  completedModules: string[];
  totalModules: number;
  progressPercentage: number;
  status: 'not-started' | 'in-progress' | 'completed';
  lastActivity?: Date;
  pointsEarned: number;
}

export class ProgressTracker {
  /**
   * Calculate detailed progress for all enrolled courses
   */
  static calculateCourseProgress(
    progressData: EnrichedProgressData,
    courses: any[]
  ): CourseProgressDetail[] {
    return progressData.enrolledCourses.map(courseId => {
      const course = courses.find(c => c._id === courseId || c.id === courseId);
      const completedModules = progressData.completedModules[courseId] || [];
      const totalModules = course?.modules?.length || 0;
      const progressPercentage = totalModules > 0 ? (completedModules.length / totalModules) * 100 : 0;
      
      let status: 'not-started' | 'in-progress' | 'completed' = 'not-started';
      if (progressPercentage === 100) status = 'completed';
      else if (progressPercentage > 0) status = 'in-progress';
      
      return {
        courseId,
        courseTitle: course?.title || 'Unknown Course',
        completedModules,
        totalModules,
        progressPercentage,
        status,
        pointsEarned: completedModules.length * 100 // Assuming 100 points per module
      };
    });
  }

  /**
   * Calculate overall learning statistics
   */
  static calculateOverallStats(courseProgress: CourseProgressDetail[]): {
    overallProgress: number;
    totalPointsPossible: number;
    coursesCompleted: number;
    coursesInProgress: number;
    coursesNotStarted: number;
    averageProgressPerCourse: number;
  } {
    const totalCourses = courseProgress.length;
    
    if (totalCourses === 0) {
      return {
        overallProgress: 0,
        totalPointsPossible: 0,
        coursesCompleted: 0,
        coursesInProgress: 0,
        coursesNotStarted: 0,
        averageProgressPerCourse: 0
      };
    }

    const overallProgress = courseProgress.reduce((sum, cp) => sum + cp.progressPercentage, 0) / totalCourses;
    const totalPointsPossible = courseProgress.reduce((sum, cp) => sum + (cp.totalModules * 100), 0);
    const coursesCompleted = courseProgress.filter(cp => cp.status === 'completed').length;
    const coursesInProgress = courseProgress.filter(cp => cp.status === 'in-progress').length;
    const coursesNotStarted = courseProgress.filter(cp => cp.status === 'not-started').length;

    return {
      overallProgress,
      totalPointsPossible,
      coursesCompleted,
      coursesInProgress,
      coursesNotStarted,
      averageProgressPerCourse: overallProgress
    };
  }

  /**
   * Generate progress achievements based on milestones
   */
  static generateAchievements(progressData: EnrichedProgressData, courseProgress: CourseProgressDetail[]): {
    id: string;
    name: string;
    description: string;
    icon: string;
    earnedDate: Date;
    type: 'points' | 'courses' | 'modules' | 'videos' | 'consistency';
  }[] {
    const achievements = [];
    const stats = progressData.stats;

    // Points-based achievements
    if (stats.totalPointsEarned >= 1000) {
      achievements.push({
        id: 'points-1000',
        name: 'Point Collector',
        description: 'Earned 1,000 points',
        icon: '🏆',
        earnedDate: new Date(),
        type: 'points' as const
      });
    }

    if (stats.totalPointsEarned >= 5000) {
      achievements.push({
        id: 'points-5000',
        name: 'Point Master',
        description: 'Earned 5,000 points',
        icon: '🥇',
        earnedDate: new Date(),
        type: 'points' as const
      });
    }

    // Course completion achievements
    const completedCourses = courseProgress.filter(cp => cp.status === 'completed').length;
    if (completedCourses >= 1) {
      achievements.push({
        id: 'course-complete-1',
        name: 'Course Finisher',
        description: 'Completed your first course',
        icon: '📚',
        earnedDate: new Date(),
        type: 'courses' as const
      });
    }

    if (completedCourses >= 5) {
      achievements.push({
        id: 'course-complete-5',
        name: 'Learning Champion',
        description: 'Completed 5 courses',
        icon: '🎓',
        earnedDate: new Date(),
        type: 'courses' as const
      });
    }

    // Module completion achievements
    if (stats.totalModulesCompleted >= 10) {
      achievements.push({
        id: 'modules-10',
        name: 'Module Master',
        description: 'Completed 10 modules',
        icon: '📖',
        earnedDate: new Date(),
        type: 'modules' as const
      });
    }

    // Video learning achievements
    if (stats.totalVideosAdded >= 5) {
      achievements.push({
        id: 'videos-5',
        name: 'Video Curator',
        description: 'Added 5 learning videos',
        icon: '🎬',
        earnedDate: new Date(),
        type: 'videos' as const
      });
    }

    return achievements;
  }

  /**
   * Calculate learning streak and consistency metrics
   */
  static calculateLearningStreak(dailyPlans: { [date: string]: any[] }): {
    currentStreak: number;
    longestStreak: number;
    totalActiveDays: number;
    lastActivityDate: Date | null;
  } {
    const activeDates = Object.keys(dailyPlans)
      .filter(date => dailyPlans[date].some((task: any) => task.isCompleted))
      .sort();

    if (activeDates.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalActiveDays: 0,
        lastActivityDate: null
      };
    }

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    // Calculate streaks
    for (let i = 1; i < activeDates.length; i++) {
      const currentDate = new Date(activeDates[i]);
      const previousDate = new Date(activeDates[i - 1]);
      const diffDays = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    // Calculate current streak (from most recent activity)
    const today = new Date();
    const lastActivityDate = new Date(activeDates[activeDates.length - 1]);
    const daysSinceLastActivity = Math.floor((today.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceLastActivity <= 1) {
      // Find current streak counting backwards from today
      currentStreak = 1;
      for (let i = activeDates.length - 2; i >= 0; i--) {
        const currentDate = new Date(activeDates[i + 1]);
        const previousDate = new Date(activeDates[i]);
        const diffDays = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    return {
      currentStreak,
      longestStreak,
      totalActiveDays: activeDates.length,
      lastActivityDate: lastActivityDate
    };
  }
}

/**
 * Hook for real-time progress tracking
 */
export function useProgressTracking() {
  const [isTracking, setIsTracking] = useState(false);

  const trackModuleCompletion = async (courseId: string, moduleId: string) => {
    setIsTracking(true);
    try {
      const response = await fetch('/api/user/progress/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          moduleId,
          action: 'complete_module',
          pointsAwarded: 100,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        // Emit progress update event for real-time UI updates
        window.dispatchEvent(new CustomEvent('progressUpdate', {
          detail: { courseId, moduleId, type: 'module_completed' }
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error tracking module completion:', error);
      return false;
    } finally {
      setIsTracking(false);
    }
  };

  const trackVideoActivity = async (courseId: string, moduleId: string, videoId: string, action: 'added' | 'watched') => {
    try {
      window.dispatchEvent(new CustomEvent('progressUpdate', {
        detail: { courseId, moduleId, videoId, type: `video_${action}` }
      }));
    } catch (error) {
      console.error('Error tracking video activity:', error);
    }
  };

  return {
    isTracking,
    trackModuleCompletion,
    trackVideoActivity
  };
}
