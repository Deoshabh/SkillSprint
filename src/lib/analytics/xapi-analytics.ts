// src/lib/analytics/xapi-analytics.ts
import { getXAPIClient, type XAPIActor, XAPI_VERBS, XAPI_ACTIVITY_TYPES } from '@/lib/xapi';

export interface UserProgressSummary {
  userId: string;
  userName: string;
  userEmail: string;
  coursesStarted: number;
  coursesCompleted: number;
  modulesCompleted: number;
  quizzesAttempted: number;
  quizzesPassed: number;
  videosWatched: number;
  totalLearningTime: number; // in seconds
  lastActivity: string;
}

export interface CourseAnalytics {
  courseId: string;
  courseName: string;
  totalEnrollments: number;
  totalCompletions: number;
  completionRate: number;
  averageScore: number;
  moduleCompletions: { [moduleId: string]: number };
  mostWatchedVideos: Array<{ videoId: string; videoTitle: string; watchCount: number }>;
  quizPerformance: Array<{ quizId: string; quizName: string; averageScore: number; attemptCount: number }>;
}

export interface ModuleAnalytics {
  moduleId: string;
  moduleName: string;
  courseId: string;
  completionCount: number;
  averageTimeSpent: number;
  videoEngagement: Array<{ videoId: string; watchCount: number; averageWatchTime: number }>;
  quizResults: Array<{ quizId: string; averageScore: number; passRate: number }>;
}

export class XAPIAnalytics {
  private xapiClient = getXAPIClient();

  /**
   * Get comprehensive progress summary for a specific user
   */
  async getUserProgressSummary(userEmail: string): Promise<UserProgressSummary | null> {
    try {      const userActor = {
        objectType: 'Agent' as const,
        name: 'User', // We'll get the actual name from the statements
        mbox: `mailto:${userEmail}`
      };

      const statements = await this.xapiClient.getStatements({
        agent: userActor,
        limit: 1000
      });

      if (!statements?.statements) {
        return null;
      }

      const statementsArray = statements.statements;
      const coursesStarted = new Set<string>();
      const coursesCompleted = new Set<string>();
      const modulesCompleted = new Set<string>();
      const quizzesAttempted = new Set<string>();
      const quizzesPassed = new Set<string>();
      const videosWatched = new Set<string>();
      let totalLearningTime = 0;
      let lastActivity = '';

      statementsArray.forEach((statement: any) => {
        const verbId = statement.verb?.id;
        const activityType = statement.object?.definition?.type;
        const activityId = statement.object?.id;
        const timestamp = statement.timestamp;

        // Track last activity
        if (!lastActivity || timestamp > lastActivity) {
          lastActivity = timestamp;
        }

        // Parse duration if available
        if (statement.result?.duration) {
          const duration = this.parseDuration(statement.result.duration);
          totalLearningTime += duration;
        }

        // Courses
        if (activityType === XAPI_ACTIVITY_TYPES.COURSE) {
          if (verbId === XAPI_VERBS.EXPERIENCED.id) {
            coursesStarted.add(activityId);
          } else if (verbId === XAPI_VERBS.COMPLETED.id) {
            coursesCompleted.add(activityId);
          }
        }

        // Modules
        if (activityType === XAPI_ACTIVITY_TYPES.MODULE && verbId === XAPI_VERBS.COMPLETED.id) {
          modulesCompleted.add(activityId);
        }

        // Quizzes
        if (activityType === XAPI_ACTIVITY_TYPES.QUIZ) {
          if (verbId === XAPI_VERBS.ATTEMPTED.id) {
            quizzesAttempted.add(activityId);
          } else if (verbId === XAPI_VERBS.PASSED.id) {
            quizzesPassed.add(activityId);
          }
        }

        // Videos
        if (activityType === XAPI_ACTIVITY_TYPES.VIDEO && verbId === XAPI_VERBS.WATCHED.id) {
          videosWatched.add(activityId);
        }
      });

      return {
        userId: userEmail,
        userName: statementsArray[0]?.actor?.name || 'Unknown',
        userEmail,
        coursesStarted: coursesStarted.size,
        coursesCompleted: coursesCompleted.size,
        modulesCompleted: modulesCompleted.size,
        quizzesAttempted: quizzesAttempted.size,
        quizzesPassed: quizzesPassed.size,
        videosWatched: videosWatched.size,
        totalLearningTime,
        lastActivity
      };
    } catch (error) {
      console.error('Error getting user progress summary:', error);
      return null;
    }
  }

  /**
   * Get analytics for a specific course
   */
  async getCourseAnalytics(courseId: string): Promise<CourseAnalytics | null> {
    try {
      const courseActivityId = `https://skillsprint.app/course/${courseId}`;
      
      const statements = await this.xapiClient.getStatements({
        activity: courseActivityId,
        limit: 1000
      });

      if (!statements?.statements) {
        return null;
      }

      const statementsArray = statements.statements;
      const enrollments = new Set<string>();
      const completions = new Set<string>();
      const scores: number[] = [];
      const moduleCompletions: { [moduleId: string]: number } = {};
      const videoViews: { [videoId: string]: { title: string; count: number } } = {};
      const quizPerformance: { [quizId: string]: { name: string; scores: number[]; attempts: number } } = {};

      statementsArray.forEach((statement: any) => {
        const verbId = statement.verb?.id;
        const userEmail = statement.actor?.mbox?.replace('mailto:', '');
        const activityType = statement.object?.definition?.type;

        if (activityType === XAPI_ACTIVITY_TYPES.COURSE) {
          if (verbId === XAPI_VERBS.EXPERIENCED.id) {
            enrollments.add(userEmail);
          } else if (verbId === XAPI_VERBS.COMPLETED.id) {
            completions.add(userEmail);
            if (statement.result?.score?.scaled) {
              scores.push(statement.result.score.scaled);
            }
          }
        }

        // Analyze related module completions, video views, and quiz performance
        // This would require additional queries for child activities
      });

      const totalEnrollments = enrollments.size;
      const totalCompletions = completions.size;
      const completionRate = totalEnrollments > 0 ? totalCompletions / totalEnrollments : 0;
      const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

      return {
        courseId,
        courseName: statementsArray[0]?.object?.definition?.name?.['en-US'] || 'Unknown Course',
        totalEnrollments,
        totalCompletions,
        completionRate,
        averageScore,
        moduleCompletions,
        mostWatchedVideos: Object.entries(videoViews)
          .map(([videoId, data]) => ({ videoId, videoTitle: data.title, watchCount: data.count }))
          .sort((a, b) => b.watchCount - a.watchCount)
          .slice(0, 10),
        quizPerformance: Object.entries(quizPerformance)
          .map(([quizId, data]) => ({
            quizId,
            quizName: data.name,
            averageScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length || 0,
            attemptCount: data.attempts
          }))
      };
    } catch (error) {
      console.error('Error getting course analytics:', error);
      return null;
    }
  }

  /**
   * Get leaderboard data for a course
   */
  async getCourseLeaderboard(courseId: string, limit: number = 10): Promise<Array<{
    userName: string;
    userEmail: string;
    completionPercentage: number;
    totalScore: number;
    completedModules: number;
    lastActivity: string;
  }>> {
    try {
      const courseActivityId = `https://skillsprint.app/course/${courseId}`;
      
      const statements = await this.xapiClient.getStatements({
        activity: courseActivityId,
        limit: 1000
      });

      if (!statements?.statements) {
        return [];
      }

      const userProgress: { [email: string]: any } = {};

      statements.statements.forEach((statement: any) => {
        const userEmail = statement.actor?.mbox?.replace('mailto:', '');
        const userName = statement.actor?.name;
        
        if (!userProgress[userEmail]) {
          userProgress[userEmail] = {
            userName,
            userEmail,
            completionPercentage: 0,
            totalScore: 0,
            completedModules: 0,
            lastActivity: statement.timestamp
          };
        }

        // Update based on statement type and verb
        if (statement.verb?.id === XAPI_VERBS.COMPLETED.id) {
          if (statement.object?.definition?.type === XAPI_ACTIVITY_TYPES.MODULE) {
            userProgress[userEmail].completedModules++;
          } else if (statement.object?.definition?.type === XAPI_ACTIVITY_TYPES.COURSE) {
            userProgress[userEmail].completionPercentage = 100;
          }
        }

        if (statement.result?.score?.scaled) {
          userProgress[userEmail].totalScore += statement.result.score.scaled;
        }

        if (statement.timestamp > userProgress[userEmail].lastActivity) {
          userProgress[userEmail].lastActivity = statement.timestamp;
        }
      });

      return Object.values(userProgress)
        .sort((a: any, b: any) => b.completionPercentage - a.completionPercentage || b.totalScore - a.totalScore)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting course leaderboard:', error);
      return [];
    }
  }

  /**
   * Get overall platform analytics
   */
  async getPlatformAnalytics(): Promise<{
    totalUsers: number;
    totalCourses: number;
    totalModules: number;
    totalQuizzes: number;
    totalVideos: number;
    avgCompletionRate: number;
    avgQuizScore: number;
    totalLearningTime: number;
  }> {
    try {
      const statements = await this.xapiClient.getStatements({
        limit: 5000 // Adjust based on your needs
      });

      if (!statements?.statements) {
        return this.getEmptyPlatformAnalytics();
      }

      const users = new Set<string>();
      const courses = new Set<string>();
      const modules = new Set<string>();
      const quizzes = new Set<string>();
      const videos = new Set<string>();
      const completions: number[] = [];
      const quizScores: number[] = [];
      let totalLearningTime = 0;

      statements.statements.forEach((statement: any) => {
        const userEmail = statement.actor?.mbox?.replace('mailto:', '');
        const activityType = statement.object?.definition?.type;
        const activityId = statement.object?.id;

        users.add(userEmail);

        if (activityType === XAPI_ACTIVITY_TYPES.COURSE) {
          courses.add(activityId);
          if (statement.verb?.id === XAPI_VERBS.COMPLETED.id && statement.result?.score?.scaled) {
            completions.push(statement.result.score.scaled);
          }
        } else if (activityType === XAPI_ACTIVITY_TYPES.MODULE) {
          modules.add(activityId);
        } else if (activityType === XAPI_ACTIVITY_TYPES.QUIZ) {
          quizzes.add(activityId);
          if (statement.result?.score?.scaled) {
            quizScores.push(statement.result.score.scaled);
          }
        } else if (activityType === XAPI_ACTIVITY_TYPES.VIDEO) {
          videos.add(activityId);
        }

        if (statement.result?.duration) {
          totalLearningTime += this.parseDuration(statement.result.duration);
        }
      });

      return {
        totalUsers: users.size,
        totalCourses: courses.size,
        totalModules: modules.size,
        totalQuizzes: quizzes.size,
        totalVideos: videos.size,
        avgCompletionRate: completions.length > 0 ? completions.reduce((a, b) => a + b, 0) / completions.length : 0,
        avgQuizScore: quizScores.length > 0 ? quizScores.reduce((a, b) => a + b, 0) / quizScores.length : 0,
        totalLearningTime
      };
    } catch (error) {
      console.error('Error getting platform analytics:', error);
      return this.getEmptyPlatformAnalytics();
    }
  }

  private getEmptyPlatformAnalytics() {
    return {
      totalUsers: 0,
      totalCourses: 0,
      totalModules: 0,
      totalQuizzes: 0,
      totalVideos: 0,
      avgCompletionRate: 0,
      avgQuizScore: 0,
      totalLearningTime: 0
    };
  }

  /**
   * Parse ISO 8601 duration string to seconds
   */
  private parseDuration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);
    
    return hours * 3600 + minutes * 60 + seconds;
  }
}

// Singleton instance
export const xapiAnalytics = new XAPIAnalytics();
