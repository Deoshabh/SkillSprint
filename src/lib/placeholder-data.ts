
import type { Course, Module, DailyTask, Badge, UserProfile, UserProgress, VideoLink, UserModuleVideos, TextNote, Sketch, DailyPlans, FeedbackItem } from './types';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs
import { format } from 'date-fns';

// Helper function to create YouTube embed URL from various link formats
const getEmbedUrl = (url: string): string => {
  if (!url) return '';
  if (url.includes('youtube.com/embed/')) return url; // Already an embed URL
  if (url.includes('youtube.com/playlist?list=')) {
    const listId = url.split('playlist?list=')[1]?.split('&')[0];
    return listId ? `https://www.youtube.com/embed/videoseries?list=${listId}` : url;
  }
  if (url.includes('youtube.com/watch?v=')) {
    const videoId = url.split('watch?v=')[1]?.split('&')[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }
  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }
  return url; // Fallback if no specific pattern matches
};

// All prebuilt/mock course data has been removed
// Users can now create their own courses from scratch
export let placeholderCourses: Course[] = [];

const todayKey = format(new Date(), 'yyyy-MM-dd');
const yesterdayKey = format(new Date(Date.now() - 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

// Empty daily plans - users can create their own
const initialDailyPlans: DailyPlans = {
  [todayKey]: [],
  [yesterdayKey]: []
};

// Empty feedback array - users can submit their own feedback
export let placeholderFeedback: FeedbackItem[] = [];

// Default user profile with clean slate
export const placeholderUserProfile: UserProfile = {
  id: 'user-alex-johnson-123',
  name: 'Alex Johnson',
  email: 'alex.johnson@example.com',
  avatarUrl: 'https://placehold.co/100x100.png',
  dataAiHint: 'professional portrait',
  points: 0, // Start with 0 points
  earnedBadges: [], // No badges earned yet
  enrolledCourses: [], // No courses enrolled yet
  role: 'admin', 
  learningPreferences: {
    tracks: [], // No tracks selected yet
    language: 'English',
  },
  customVideoLinks: [], // No custom videos yet
  userModuleVideos: {}, // No module videos yet
  textNotes: [], // No notes yet
  sketches: [], // No sketches yet
  dailyPlans: initialDailyPlans,
  profileSetupComplete: true,
  submittedFeedback: [],
};

// This is deprecated, use user.dailyPlans instead
export const placeholderDailyPlan: DailyTask[] = initialDailyPlans[todayKey] || [];

// Empty user progress - users will build their own progress
export const placeholderUserProgress: UserProgress[] = [];

// Available badges that users can earn
export const placeholderBadges: Badge[] = [
  { id: 'badge1', name: 'Initiator', description: 'Started your first course!', icon: 'Star', color: 'text-yellow-500' },
  { id: 'badge2', name: 'Module Master', description: 'Completed 10 modules.', icon: 'CheckCircle', color: 'text-green-500' },
  { id: 'badge3', name: 'Course Champion', description: 'Finished your first course.', icon: 'Award', color: 'text-blue-500' },
  { id: 'badge4', name: 'Fast Learner', description: 'Completed 5 modules in a day', icon: 'Zap', color: 'text-yellow-400' },
  { id: 'badge5', name: 'Course Completer', description: 'Finished a full course', icon: 'Award', color: 'text-green-400' },
];

// --- Data Mutation Functions (Simulation) ---

export const getAllCourses = (): Course[] => {
  return placeholderCourses;
};

export const getCourseById = (id: string): Course | undefined => {
  return placeholderCourses.find(course => course.id === id);
};

export const getModuleById = (courseId: string, moduleId: string): Module | undefined => {
  const course = getCourseById(courseId);
  return course?.modules.find(module => module.id === moduleId);
};

export const getProgressForCourse = (courseId: string): UserProgress | undefined => {
  return placeholderUserProgress.find(progress => progress.courseId === courseId);
};

export const getCoursesByAuthor = (authorId: string): Course[] => {
  return placeholderCourses.filter(course => course.authorId === authorId);
};

export const getCoursesForReview = (): Course[] => {
  return placeholderCourses.filter(course => course.status === 'pending_review');
};

export const getPublishedCourses = (): Course[] => {
  return placeholderCourses.filter(course => course.status === 'published');
};

export const getRejectedCourses = (): Course[] => {
  return placeholderCourses.filter(course => course.status === 'rejected');
};

export const updateCourseStatus = (courseId: string, newStatus: Course['status']): boolean => {
  const courseIndex = placeholderCourses.findIndex(c => c.id === courseId);
  if (courseIndex > -1) {
    placeholderCourses[courseIndex].status = newStatus;
    placeholderCourses[courseIndex].lastModified = new Date().toISOString();
    console.log(`Course ${courseId} status updated to ${newStatus}`);
    return true;
  }
  return false;
};

export const submitCourseForReview = (courseId: string): boolean => {
  const courseIndex = placeholderCourses.findIndex(c => c.id === courseId && c.visibility === 'public' && c.status === 'draft');
  if (courseIndex > -1) {
    placeholderCourses[courseIndex].status = 'pending_review';
    placeholderCourses[courseIndex].submittedDate = new Date().toISOString();
    placeholderCourses[courseIndex].lastModified = new Date().toISOString();
    console.log(`Course ${courseId} submitted for review.`);
    return true;
  }
  console.log(`Course ${courseId} not eligible for review submission (not public, not draft, or not found).`);
  return false;
};

export const saveOrUpdateCourse = (courseData: Partial<Course> & { authorId: string }): Course | null => {
  if (!courseData.title || !courseData.category || !courseData.authorId) {
    console.error("Course title, category, and authorId are required to save.");
    return null;
  }

  const existingCourseIndex = placeholderCourses.findIndex(c => c.id === courseData.id);

  if (existingCourseIndex > -1) {
    // Update existing course
    const isAdminEditing = courseData.authorId === placeholderUserProfile.id && placeholderUserProfile.role === 'admin';
    if (placeholderCourses[existingCourseIndex].authorId !== courseData.authorId && !isAdminEditing) {
         console.error(`User ${courseData.authorId} is not authorized to update this course owned by ${placeholderCourses[existingCourseIndex].authorId}.`);
         return null; 
    }
    placeholderCourses[existingCourseIndex] = {
      ...placeholderCourses[existingCourseIndex],
      ...courseData,
      lastModified: new Date().toISOString(),
    };
    console.log("Course updated:", placeholderCourses[existingCourseIndex].id);
    return placeholderCourses[existingCourseIndex];
  } else {
    // Create new course
    const newCourse: Course = {
      id: courseData.id || `custom-${uuidv4()}`,
      title: courseData.title,
      description: courseData.description || '',
      instructor: courseData.instructor || placeholderUserProfile.name, // Default to current user
      category: courseData.category,
      icon: courseData.icon || 'Brain', // Default icon
      modules: courseData.modules || [],
      authorId: courseData.authorId,
      status: courseData.status || 'draft',
      visibility: courseData.visibility || 'private',
      imageUrl: courseData.imageUrl || 'https://placehold.co/600x400.png',
      dataAiHint: courseData.dataAiHint || 'custom course',
      lastModified: new Date().toISOString(),
      submittedDate: courseData.status === 'pending_review' ? new Date().toISOString() : undefined,
      suggestedSchedule: courseData.suggestedSchedule || '', 
      duration: courseData.duration, 
    };
    placeholderCourses.push(newCourse);
    console.log("New course created:", newCourse.id);
    return newCourse;
  }
};

// --- Feedback System Functions ---
export const submitFeedback = (
  feedbackData: Omit<FeedbackItem, 'id' | 'submittedAt' | 'status' >
): FeedbackItem => {
  const newFeedback: FeedbackItem = {
    ...feedbackData,
    id: `feedback-${uuidv4()}`,
    submittedAt: new Date().toISOString(),
    status: 'new',
  };
  placeholderFeedback.unshift(newFeedback); // Add to the beginning for newest first
  
  return newFeedback;
};

export const getAllFeedback = (): FeedbackItem[] => {
  // Sort by newest first
  return [...placeholderFeedback].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
};

export const updateFeedbackStatus = (
  feedbackId: string, 
  newStatus: FeedbackItem['status'], 
  adminNotes?: string
): boolean => {
  const feedbackIndex = placeholderFeedback.findIndex(f => f.id === feedbackId);
  if (feedbackIndex > -1) {
    placeholderFeedback[feedbackIndex].status = newStatus;
    if (adminNotes !== undefined) { // Allow clearing notes by passing empty string
        placeholderFeedback[feedbackIndex].adminNotes = adminNotes;
    }
    return true;
  }
  return false;
};
