// src/lib/learning-locker-client.ts
import axios, { AxiosInstance } from 'axios';
import { XAPIStatement, XAPIActor } from './xapi';

export interface LearningAnalytics {
  totalStatements: number;
  userProgress: {
    [userId: string]: {
      coursesStarted: number;
      coursesCompleted: number;
      modulesCompleted: number;
      videosWatched: number;
      quizzesTaken: number;
      averageQuizScore: number;
    };
  };
  courseAnalytics: {
    [courseId: string]: {
      totalEnrollments: number;
      completionRate: number;
      averageProgress: number;
      popularModules: string[];
    };
  };
}

export class LearningLockerClient {
  private client: AxiosInstance;
  private endpoint: string;
  private auth: string;

  constructor(endpoint: string, auth: string) {
    this.endpoint = endpoint.endsWith('/') ? endpoint : endpoint + '/';
    this.auth = auth;
    
    this.client = axios.create({
      baseURL: this.endpoint,
      headers: {
        'Authorization': this.auth,
        'Content-Type': 'application/json',
        'X-Experience-API-Version': '1.0.3'
      },
      timeout: 30000
    });
  }

  async getStatements(params: {
    agent?: XAPIActor;
    activity?: string;
    verb?: string;
    limit?: number;
    since?: string;
    until?: string;
  } = {}): Promise<{ statements: XAPIStatement[]; more?: string } | null> {
    try {
      const response = await this.client.get('statements', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching statements from Learning Locker:', error);
      return null;
    }
  }

  async getUserProgress(userEmail: string): Promise<any> {
    try {
      const agent = {
        objectType: 'Agent' as const,
        mbox: `mailto:${userEmail}`
      };

      const statements = await this.getStatements({ 
        agent, 
        limit: 1000 
      });

      if (!statements?.statements) {
        return null;
      }

      // Analyze statements to build progress report
      const progress = {
        coursesStarted: 0,
        coursesCompleted: 0,
        modulesCompleted: 0,
        videosWatched: 0,
        quizzesTaken: 0,
        totalQuizScore: 0,
        quizCount: 0
      };

      statements.statements.forEach(statement => {
        const verbId = statement.verb.id;
        const activityType = statement.object.definition?.type;

        if (verbId === 'http://adlnet.gov/expapi/verbs/experienced' && 
            activityType === 'http://adlnet.gov/expapi/activities/course') {
          progress.coursesStarted++;
        }

        if (verbId === 'http://adlnet.gov/expapi/verbs/completed') {
          if (activityType === 'http://adlnet.gov/expapi/activities/course') {
            progress.coursesCompleted++;
          } else if (activityType === 'http://adlnet.gov/expapi/activities/lesson') {
            progress.modulesCompleted++;
          }
        }

        if (verbId === 'https://w3id.org/xapi/video/verbs/watched') {
          progress.videosWatched++;
        }

        if ((verbId === 'http://adlnet.gov/expapi/verbs/passed' || 
             verbId === 'http://adlnet.gov/expapi/verbs/failed') &&
            activityType === 'http://adlnet.gov/expapi/activities/assessment') {
          progress.quizzesTaken++;
          if (statement.result?.score?.scaled) {
            progress.totalQuizScore += statement.result.score.scaled;
            progress.quizCount++;
          }
        }
      });

      return {
        ...progress,
        averageQuizScore: progress.quizCount > 0 ? progress.totalQuizScore / progress.quizCount : 0
      };
    } catch (error) {
      console.error('Error getting user progress:', error);
      return null;
    }
  }

  async getCourseAnalytics(courseId: string): Promise<any> {
    try {
      const courseActivity = `https://skillsprint.app/course/${courseId}`;
      
      const statements = await this.getStatements({ 
        activity: courseActivity,
        limit: 1000 
      });

      if (!statements?.statements) {
        return null;
      }

      const analytics = {
        totalEnrollments: 0,
        completions: 0,
        userProgress: new Map<string, number>()
      };

      statements.statements.forEach(statement => {
        const userEmail = statement.actor.mbox?.replace('mailto:', '') || 'unknown';
        const verbId = statement.verb.id;

        if (verbId === 'http://adlnet.gov/expapi/verbs/experienced') {
          analytics.totalEnrollments++;
        }

        if (verbId === 'http://adlnet.gov/expapi/verbs/completed') {
          analytics.completions++;
        }

        // Track individual user progress
        if (statement.result?.score?.scaled !== undefined) {
          analytics.userProgress.set(userEmail, statement.result.score.scaled);
        }
      });

      const progressValues = Array.from(analytics.userProgress.values());
      const averageProgress = progressValues.length > 0 
        ? progressValues.reduce((sum, progress) => sum + progress, 0) / progressValues.length 
        : 0;

      return {
        totalEnrollments: analytics.totalEnrollments,
        completionRate: analytics.totalEnrollments > 0 ? analytics.completions / analytics.totalEnrollments : 0,
        averageProgress: averageProgress,
        uniqueUsers: analytics.userProgress.size
      };
    } catch (error) {
      console.error('Error getting course analytics:', error);
      return null;
    }
  }

  async getLeaderboard(limit: number = 10): Promise<any[]> {
    try {
      const statements = await this.getStatements({ 
        verb: 'http://adlnet.gov/expapi/verbs/completed',
        limit: 1000 
      });

      if (!statements?.statements) {
        return [];
      }

      const userStats = new Map<string, { 
        name: string; 
        email: string; 
        completions: number; 
        totalScore: number; 
        quizCount: number; 
      }>();

      statements.statements.forEach(statement => {
        const userEmail = statement.actor.mbox?.replace('mailto:', '') || 'unknown';
        const userName = statement.actor.name || 'Unknown User';

        if (!userStats.has(userEmail)) {
          userStats.set(userEmail, {
            name: userName,
            email: userEmail,
            completions: 0,
            totalScore: 0,
            quizCount: 0
          });
        }

        const stats = userStats.get(userEmail)!;
        stats.completions++;

        if (statement.result?.score?.scaled !== undefined) {
          stats.totalScore += statement.result.score.scaled;
          stats.quizCount++;
        }
      });

      const leaderboard = Array.from(userStats.values())
        .map(user => ({
          ...user,
          averageScore: user.quizCount > 0 ? user.totalScore / user.quizCount : 0
        }))
        .sort((a, b) => {
          // Sort by completions first, then by average score
          if (b.completions !== a.completions) {
            return b.completions - a.completions;
          }
          return b.averageScore - a.averageScore;
        })
        .slice(0, limit);

      return leaderboard;
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }

  async getPlatformAnalytics(): Promise<LearningAnalytics | null> {
    try {
      const statements = await this.getStatements({ limit: 10000 });

      if (!statements?.statements) {
        return null;
      }

      const analytics: LearningAnalytics = {
        totalStatements: statements.statements.length,
        userProgress: {},
        courseAnalytics: {}
      };

      // Process statements to build analytics
      statements.statements.forEach(statement => {
        const userEmail = statement.actor.mbox?.replace('mailto:', '') || 'unknown';
        const verbId = statement.verb.id;
        const activityType = statement.object.definition?.type;
        const activityId = statement.object.id;

        // Initialize user progress if not exists
        if (!analytics.userProgress[userEmail]) {
          analytics.userProgress[userEmail] = {
            coursesStarted: 0,
            coursesCompleted: 0,
            modulesCompleted: 0,
            videosWatched: 0,
            quizzesTaken: 0,
            averageQuizScore: 0
          };
        }

        const userProgress = analytics.userProgress[userEmail];

        // Update user progress based on verb and activity type
        if (verbId === 'http://adlnet.gov/expapi/verbs/experienced' && 
            activityType === 'http://adlnet.gov/expapi/activities/course') {
          userProgress.coursesStarted++;
        } else if (verbId === 'http://adlnet.gov/expapi/verbs/completed') {
          if (activityType === 'http://adlnet.gov/expapi/activities/course') {
            userProgress.coursesCompleted++;
          } else if (activityType === 'http://adlnet.gov/expapi/activities/lesson') {
            userProgress.modulesCompleted++;
          }
        } else if (verbId === 'https://w3id.org/xapi/video/verbs/watched') {
          userProgress.videosWatched++;
        } else if ((verbId === 'http://adlnet.gov/expapi/verbs/passed' || 
                   verbId === 'http://adlnet.gov/expapi/verbs/failed') &&
                  activityType === 'http://adlnet.gov/expapi/activities/assessment') {
          userProgress.quizzesTaken++;
        }

        // Extract course ID and update course analytics
        const courseMatch = activityId.match(/\/course\/([^\/]+)/);
        if (courseMatch) {
          const courseId = courseMatch[1];
          
          if (!analytics.courseAnalytics[courseId]) {
            analytics.courseAnalytics[courseId] = {
              totalEnrollments: 0,
              completionRate: 0,
              averageProgress: 0,
              popularModules: []
            };
          }
        }
      });

      return analytics;
    } catch (error) {
      console.error('Error getting platform analytics:', error);
      return null;
    }
  }
}

// Global Learning Locker client instance
let learningLockerClient: LearningLockerClient | null = null;

export function getLearningLockerClient(): LearningLockerClient | null {
  if (!learningLockerClient) {
    const endpoint = process.env.MONGODB_LRS_ENDPOINT || '';
    const auth = process.env.MONGODB_LRS_AUTH || '';
    
    if (!endpoint || !auth) {
      console.warn('Learning Locker LRS endpoint or auth not configured. Analytics will be disabled.');
      return null;
    }
    
    learningLockerClient = new LearningLockerClient(endpoint, auth);
  }
  
  return learningLockerClient;
}
