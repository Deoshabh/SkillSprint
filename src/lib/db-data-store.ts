// New database-backed data store to replace placeholder-data.ts
"use client";

import type { 
  Course, Module as ModuleType, UserProgress, Badge, UserProfile, VideoLink, 
  FeedbackItem, TextNote, Sketch, DailyTask, DailyPlans 
} from '@/lib/types';

// API client functions
class ApiClient {
  private static async fetchWithAuth(url: string, options: RequestInit = {}) {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // User management
  static async getCurrentUser(): Promise<UserProfile> {
    return this.fetchWithAuth('/api/users');
  }

  static async updateUserProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    return this.fetchWithAuth('/api/users', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Course management
  static async getAllCourses(): Promise<Course[]> {
    return this.fetchWithAuth('/api/courses');
  }

  static async getCourseById(id: string): Promise<Course> {
    return this.fetchWithAuth(`/api/courses/${id}`);
  }

  static async createCourse(data: Partial<Course>): Promise<Course> {
    return this.fetchWithAuth('/api/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateCourse(id: string, data: Partial<Course>): Promise<Course> {
    return this.fetchWithAuth(`/api/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async deleteCourse(id: string): Promise<void> {
    await this.fetchWithAuth(`/api/courses/${id}`, {
      method: 'DELETE',
    });
  }

  // Progress tracking
  static async markModuleComplete(courseId: string, moduleId: string): Promise<void> {
    await this.fetchWithAuth(`/api/progress/${courseId}/${moduleId}/complete`, {
      method: 'POST',
    });
  }

  static async markCourseStarted(courseId: string): Promise<void> {
    await this.fetchWithAuth(`/api/progress/${courseId}/start`, {
      method: 'POST',
    });
  }

  // Feedback
  static async submitFeedback(data: Partial<FeedbackItem>): Promise<FeedbackItem> {
    return this.fetchWithAuth('/api/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async getAllFeedback(): Promise<FeedbackItem[]> {
    return this.fetchWithAuth('/api/feedback');
  }

  // Notes and sketches
  static async getUserNotes(): Promise<TextNote[]> {
    return this.fetchWithAuth('/api/notes');
  }

  static async createNote(data: { title: string; content: string }): Promise<TextNote> {
    return this.fetchWithAuth('/api/notes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async getUserSketches(): Promise<Sketch[]> {
    return this.fetchWithAuth('/api/sketches');
  }

  static async createSketch(data: { title: string; data: string }): Promise<Sketch> {
    return this.fetchWithAuth('/api/sketches', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Daily plans
  static async getDailyPlans(date: string): Promise<DailyTask[]> {
    return this.fetchWithAuth(`/api/daily-plans?date=${date}`);
  }

  static async createDailyTask(data: DailyTask): Promise<DailyTask> {
    return this.fetchWithAuth('/api/daily-plans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

// Migration functions to replace placeholder-data.ts functions
export async function getAllCourses(): Promise<Course[]> {
  try {
    return await ApiClient.getAllCourses();
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
}

export async function getCourseById(id: string): Promise<Course | undefined> {
  try {
    return await ApiClient.getCourseById(id);
  } catch (error) {
    console.error('Error fetching course:', error);
    return undefined;
  }
}

export async function getModuleById(courseId: string, moduleId: string): Promise<ModuleType | undefined> {
  try {
    const course = await getCourseById(courseId);
    return course?.modules.find(module => module.id === moduleId);
  } catch (error) {
    console.error('Error fetching module:', error);
    return undefined;
  }
}

export async function saveOrUpdateCourse(courseData: Partial<Course> & { authorId?: string }): Promise<Course | null> {
  try {
    if (courseData.id) {
      return await ApiClient.updateCourse(courseData.id, courseData);
    } else {
      return await ApiClient.createCourse(courseData);
    }
  } catch (error) {
    console.error('Error saving course:', error);
    return null;
  }
}

export async function submitCourseForReview(courseId: string): Promise<boolean> {
  try {
    await ApiClient.updateCourse(courseId, { status: 'pending_review' });
    return true;
  } catch (error) {
    console.error('Error submitting course for review:', error);
    return false;
  }
}

export async function updateCourseStatus(courseId: string, newStatus: Course['status']): Promise<boolean> {
  try {
    await ApiClient.updateCourse(courseId, { status: newStatus });
    return true;
  } catch (error) {
    console.error('Error updating course status:', error);
    return false;
  }
}

export function getCoursesByAuthor(authorId: string): Course[] {
  // This will be handled by the API in real implementation
  // For now, return empty array as this requires database query
  console.warn('getCoursesByAuthor not yet implemented with new API');
  return [];
}

export function getCoursesForReview(): Course[] {
  // This will be handled by the API in real implementation
  console.warn('getCoursesForReview not yet implemented with new API');
  return [];
}

export function getPublishedCourses(): Course[] {
  // This will be handled by the API in real implementation
  console.warn('getPublishedCourses not yet implemented with new API');
  return [];
}

export function getRejectedCourses(): Course[] {
  // This will be handled by the API in real implementation
  console.warn('getRejectedCourses not yet implemented with new API');
  return [];
}

export function getProgressForCourse(courseId: string): UserProgress | undefined {
  // This will be handled by the API in real implementation
  console.warn('getProgressForCourse not yet implemented with new API');
  return undefined;
}

export async function submitFeedback(feedbackData: Omit<FeedbackItem, 'id' | 'submittedAt' | 'status'>): Promise<FeedbackItem> {
  return await ApiClient.submitFeedback(feedbackData);
}

export async function getAllFeedback(): Promise<FeedbackItem[]> {
  try {
    return await ApiClient.getAllFeedback();
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return [];
  }
}

export function updateFeedbackStatus(feedbackId: string, status: FeedbackItem['status'], adminNotes?: string): boolean {
  // This will be handled by the API in real implementation
  console.warn('updateFeedbackStatus not yet implemented with new API');
  return false;
}

// Legacy placeholders - these will be replaced by API calls
export const placeholderCourses: Course[] = [];
export const placeholderUserProgress: UserProgress[] = [];
export const placeholderBadges: Badge[] = [
  { id: 'badge1', name: 'Initiator', description: 'Started your first course!', icon: 'Star', color: 'text-yellow-500' },
  { id: 'badge2', name: 'Module Master', description: 'Completed 10 modules.', icon: 'CheckCircle', color: 'text-green-500' },
  { id: 'badge3', name: 'Course Champion', description: 'Finished your first course.', icon: 'Award', color: 'text-blue-500' },
  { id: 'badge4', name: 'Fast Learner', description: 'Completed 5 modules in a day', icon: 'Zap', color: 'text-yellow-400' },
  { id: 'badge5', name: 'Course Completer', description: 'Finished a full course', icon: 'Award', color: 'text-green-400' },
];

// Default user profile (will be fetched from API)
export const placeholderUserProfile: UserProfile = {
  id: 'temp-user',
  name: 'Loading...',
  email: 'loading@example.com',
  avatarUrl: 'https://placehold.co/100x100.png',
  points: 0,
  earnedBadges: [],
  enrolledCourses: [],
  role: 'learner',
  learningPreferences: {
    tracks: [],
    language: 'English',
  },
  customVideoLinks: [],
  userModuleVideos: {},
  textNotes: [],
  sketches: [],
  dailyPlans: {},
  profileSetupComplete: false,
  submittedFeedback: [],
};

// Daily plan helper
const todayKey = new Date().toISOString().split('T')[0];
export const placeholderDailyPlan: DailyTask[] = [];

// Export the API client for direct use
export { ApiClient };
