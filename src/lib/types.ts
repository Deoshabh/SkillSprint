import type { LucideIcon } from 'lucide-react';

export interface TextNote {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sketch {
  id: string;
  title: string;
  dataUrl: string; // Base64 encoded image data
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackItem {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  type: 'general' | 'course' | 'bug' | 'feature_request';
  courseId?: string;
  courseTitle?: string;
  subject: string;
  message: string;
  submittedAt: string;
  status: 'new' | 'in_progress' | 'resolved' | 'archived';
  adminNotes?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  category: string;
  icon: string;
  imageUrl?: string;
  dataAiHint?: string;
  modules: Module[]; 
  duration?: string;
  rating?: number;
  enrollmentCount?: number;
  authorId?: string;
  visibility?: 'private' | 'shared' | 'public';
  status?: 'draft' | 'pending_review' | 'published' | 'rejected' | 'archived';
  submittedDate?: string;
  lastModified?: string;
  suggestedSchedule?: string; 
}

export type ModuleContentType = 'video' | 'markdown' | 'pdf' | 'quiz' | 'assignment' | 'text';

export interface VideoLink {
  id?: string;
  langCode: string;
  langName: string;
  youtubeEmbedUrl: string;
  title: string;
  creator?: string;
  notes?: string;
  isPlaylist?: boolean;
}

export interface Module {
  id: string;
  title: string;
  description?: string;
  contentType: ModuleContentType;
  contentUrl?: string; 
  videoLinks?: VideoLink[]; 
  contentData?: string; 
  estimatedTime: string;
  isCompleted?: boolean; 
  subtopics?: string[]; 
  practiceTask?: string; 
}

export interface UserProgress {
  courseId: string;
  completedModules: string[];
  totalModules: number;
  currentModuleId?: string;
  quizScores?: { [moduleId: string]: number };
}

export interface DailyTask {
  id: string;
  title: string;
  description?: string;
  courseId?: string;
  moduleId?: string;
  courseTitle?: string;
  moduleTitle?: string;
  time: string; 
  isCompleted: boolean;
  type: 'coursework' | 'quiz' | 'review' | 'break' | 'meeting' | 'personal';
  icon?: string;
}

export interface DailyPlans {
  [dateKey: string]: DailyTask[]; 
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color?: string;
}

export interface UserModuleVideos {
  [moduleKey: string]: VideoLink[];
}

export type UserRole = 'learner' | 'educator' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  dataAiHint?: string;
  points: number;
  earnedBadges: Badge[];
  enrolledCourses: string[];
  role?: UserRole;
  learningPreferences?: {
    tracks: string[];
    language: string;
  };
  customVideoLinks?: VideoLink[];
  userModuleVideos?: UserModuleVideos;
  textNotes?: TextNote[];
  sketches?: Sketch[];
  dailyPlans?: DailyPlans;
  profileSetupComplete?: boolean;
  submittedFeedback?: FeedbackItem[]; // Optional: track feedback submitted by user
}

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  label?: string;
  disabled?: boolean;
  external?: boolean;
  children?: NavItem[];
}

export interface PlaylistItemDetail {
  videoId: string;
  title: string;
  thumbnailUrl: string;
}

export interface ChatMessagePart {
  text: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: ChatMessagePart[];
  timestamp?: Date;
  id?: string;
}

// Quiz and Assessment Types
export interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'coding';
  question: string;
  options?: string[]; // For multiple choice
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Quiz {
  id: string;
  moduleId: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  totalPoints: number;
  passingScore: number; // Percentage required to pass
  timeLimit?: number; // In minutes
  maxAttempts?: number;
  isRandomized?: boolean;
  createdBy: 'ai' | 'manual';
  estimatedTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  answers: { [questionId: string]: string | string[] };
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  timeSpent: number; // In minutes
  submittedAt: string;
  feedback?: string;
}

export interface ModuleProgress {
  moduleId: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  quizAttempts: QuizAttempt[];
  bestScore?: number;
  completedAt?: string;
}

export interface CourseProgress {
  courseId: string;
  userId: string;
  moduleProgress: { [moduleId: string]: ModuleProgress };
  overallProgress: number; // Percentage
  isCompleted: boolean;
  completedAt?: string;
  currentModuleId?: string;
}

// Enhanced Module type with quiz support
export interface ModuleWithQuiz extends Module {
  quiz?: Quiz;
  isLocked?: boolean;
  unlockRequirements?: {
    previousModuleId?: string;
    minimumQuizScore?: number;
  };
}

// ===== MESSAGING SYSTEM TYPES =====

export interface MessageTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: 'welcome' | 'course' | 'achievement' | 'announcement' | 'reminder' | 'promotional' | 'system';
  description?: string;
  isActive: boolean;
  createdBy: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  subject: string;
  body: string;
  targetSegment?: string;
  targetFilters?: any;
  senderUserId: string;
  totalRecipients: number;
  deliveredCount: number;
  failedCount: number;
  templateId?: string;
  template?: MessageTemplate;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled';
  scheduledFor?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
  recipients?: MessageRecipient[];
}

export interface MessageRecipient {
  id: string;
  messageId: string;
  userId: string;
  user?: UserProfile;
  status: 'pending' | 'delivered' | 'failed' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed';
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  errorMessage?: string;
  personalizedSubject?: string;
  personalizedBody?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageRequest {
  subject: string;
  body: string;
  targetSegment?: string;
  targetFilters?: UserSearchFilters;
  templateId?: string;
  scheduledFor?: string;
}

export interface MessageStats {
  totalSent: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscribeRate: number;
}

export interface UserSearchFilters {
  role?: UserRole;
  createdAfter?: Date;
  createdBefore?: Date;
  search?: string;
  hasCompletedCourses?: boolean;
  minPoints?: number;
  maxPoints?: number;
}
