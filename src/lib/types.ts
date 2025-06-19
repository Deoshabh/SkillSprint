
/**
 * Enhanced Type Definitions for SkillSprint
 * 
 * This file contains all the core type definitions used throughout the application.
 * Types are organized by domain and include comprehensive JSDoc documentation.
 */

import type { LucideIcon } from 'lucide-react';

// ============================================================================
// CORE DOMAIN TYPES
// ============================================================================

/**
 * Text note interface for user-created notes
 */
export interface TextNote {
  readonly id: string;
  title: string;
  body: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  tags?: string[];
  courseId?: string;
  moduleId?: string;
}

/**
 * Sketch interface for user-created drawings
 */
export interface Sketch {
  readonly id: string;
  title: string;
  dataUrl: string; // Base64 encoded image data
  readonly createdAt: string;
  readonly updatedAt: string;
  tags?: string[];
  courseId?: string;
  moduleId?: string;
}

/**
 * Uploaded image interface with metadata
 */
export interface UploadedImage {
  readonly id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  dataUrl: string; // Base64 encoded image data
  uploadType: 'avatar' | 'course' | 'content' | 'general';
  readonly uploadedAt: string;
  description?: string;
  altText?: string;
}

/**
 * Document note interface for user annotations
 */
export interface DocumentNote {
  readonly id: string;
  documentId: string;
  userId: string;
  content: string;
  position: {
    x: number;
    y: number;
  };
  color: string;
  readonly createdAt: string;
  readonly updatedAt?: string;
}

/**
 * Document highlight interface for user annotations
 */
export interface DocumentHighlight {
  readonly id: string;
  documentId: string;
  userId: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  color: string;
  readonly createdAt: string;
  readonly updatedAt?: string;
}

/**
 * Course document interface with approval workflow
 */
export interface CourseDocument {
  readonly id: string;
  name: string;
  originalName: string;
  type: 'pdf' | 'doc' | 'docx' | 'txt';
  size: number;
  url: string;
  readonly uploadedAt: string;
  description?: string;
  isPublic?: boolean;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  approvedBy?: string;
  readonly approvedAt?: string;
  fileType?: string;
  fileSize?: number;
  createdAt?: string;
  notes?: DocumentNote[];
  highlights?: DocumentHighlight[];
}

/**
 * Feedback item interface for user feedback system
 */
export interface FeedbackItem {
  readonly id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  type: 'general' | 'course' | 'bug' | 'feature_request';
  courseId?: string;
  courseTitle?: string;
  subject: string;
  message: string;
  readonly submittedAt: string;
  status: 'new' | 'in_progress' | 'resolved' | 'archived';
  priority?: 'low' | 'medium' | 'high';
  adminNotes?: string;
  assignedTo?: string;
  readonly lastUpdated?: string;
}

/**
 * Course interface with comprehensive metadata
 */
export interface Course {
  readonly id: string;
  title: string;
  description: string;
  instructor?: string;
  category: string; // Made required for better organization
  icon?: string;
  imageUrl?: string;
  dataAiHint?: string;
  modules: Module[]; 
  documents?: CourseDocument[];
  duration?: string;
  rating?: number;
  enrollmentCount?: number;
  authorId?: string;
  authorName?: string;
  visibility?: 'private' | 'shared' | 'public';
  status?: 'draft' | 'pending' | 'published' | 'rejected' | 'archived';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours?: number;
  tags?: string[];
  enrolledStudents?: string[];
  ratings?: CourseRating[];
  readonly createdAt?: string;
  readonly updatedAt?: string;
  readonly submittedDate?: string;
  readonly lastModified?: string;
  suggestedSchedule?: string;
  prerequisites?: string[];
  learningObjectives?: string[];
  completionCertificate?: boolean;
}

/**
 * Course rating interface
 */
export interface CourseRating {
  userId: string;
  userName?: string;
  rating: number; // 1-5 scale
  review: string;
  readonly date: Date;
  helpful?: number; // Count of helpful votes
}

/**
 * Module content types with strict typing
 */
export type ModuleContentType = 'video' | 'markdown' | 'pdf' | 'quiz' | 'assignment' | 'text' | 'document';

/**
 * Video link interface with enhanced metadata
 */
export interface VideoLink {
  readonly id?: string;
  langCode: string;
  langName: string;
  youtubeEmbedUrl: string;
  title: string;
  creator?: string;
  notes?: string;
  isPlaylist?: boolean;
  duration?: string;
  thumbnail?: string;
  readonly addedAt?: string;
  quality?: 'low' | 'medium' | 'high';
  viewCount?: number;
}

/**
 * Document link interface for external resources
 */
export interface DocumentLink {
  readonly id?: string;
  url: string;
  title: string;
  type: string;
  description?: string;
  readonly addedAt?: string;
}

/**
 * Module interface with comprehensive content support
 */
export interface Module {
  readonly id: string;
  title: string;
  description?: string;
  contentType: ModuleContentType;
  contentUrl?: string; 
  videoLinks?: VideoLink[]; 
  documents?: CourseDocument[];
  contentData?: string; 
  estimatedTime: string;
  isCompleted?: boolean; 
  subtopics?: string[]; 
  practiceTask?: string;
  order?: number; // For module ordering
  prerequisites?: string[]; // IDs of prerequisite modules
  resources?: string[]; // Additional resource URLs
  quizData?: QuizData;
  assignmentData?: AssignmentData;
}

/**
 * Quiz data interface
 */
export interface QuizData {
  questions: QuizQuestion[];
  timeLimit?: number; // in minutes
  passingScore?: number; // percentage
  attempts?: number; // allowed attempts
}

/**
 * Quiz question interface
 */
export interface QuizQuestion {
  readonly id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';
  options?: string[]; // For multiple choice
  correctAnswer?: string | string[];
  explanation?: string;
  points?: number;
}

/**
 * Assignment data interface
 */
export interface AssignmentData {
  instructions: string;
  deliverables: string[];
  dueDate?: string;
  maxPoints?: number;
  rubric?: AssignmentRubric[];
}

/**
 * Assignment rubric interface
 */
export interface AssignmentRubric {
  criteria: string;
  excellent: string;
  good: string;
  satisfactory: string;
  needsImprovement: string;
  points: number;
}

/**
 * User progress tracking interface
 */
export interface UserProgress {
  courseId: string;
  completedModules: string[];
  totalModules: number;
  currentModuleId?: string;
  quizScores?: Record<string, number>; // moduleId -> score
  assignmentScores?: Record<string, number>; // moduleId -> score
  timeSpent?: Record<string, number>; // moduleId -> minutes
  lastAccessed?: string;
  completionPercentage?: number;
  certificateEarned?: boolean;
  readonly startedAt?: string;
  readonly completedAt?: string;
}

/**
 * Daily task interface with enhanced metadata
 */
export interface DailyTask {
  readonly id: string;
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
  priority?: 'low' | 'medium' | 'high';
  estimatedDuration?: number; // in minutes
  actualDuration?: number; // in minutes
  notes?: string;
  readonly createdAt?: string;
  readonly completedAt?: string;
}

/**
 * Daily plans type with date indexing
 */
export type DailyPlans = Record<string, DailyTask[]>; // dateKey -> tasks[]

/**
 * Badge interface for gamification
 */
export interface Badge {
  readonly id: string;
  name: string;
  description: string;
  icon: string;
  color?: string;
  category?: 'achievement' | 'milestone' | 'skill' | 'special';
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  criteria?: string; // Description of how to earn the badge
  readonly earnedAt?: string;
}

/**
 * User module videos mapping
 */
export type UserModuleVideos = Record<string, VideoLink[]>; // moduleKey -> videos[]

/**
 * User AI videos mapping
 */
export type UserAIVideos = Record<string, VideoLink[]>; // moduleKey -> videos[]

/**
 * User AI search usage tracking
 */
export type UserAISearchUsage = Record<string, number>; // moduleKey -> count

/**
 * User role enumeration
 */
export type UserRole = 'user' | 'admin' | 'moderator' | 'instructor';

/**
 * Learning preferences interface
 */
export interface LearningPreferences {
  tracks: string[];
  language: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  pace?: 'slow' | 'normal' | 'fast';
  learningStyle?: 'visual' | 'auditory' | 'reading' | 'kinesthetic';
  timeZone?: string;
  dailyGoalMinutes?: number;
  preferredStudyTimes?: string[]; // Array of time slots like ["09:00", "14:00"]
  notifications?: NotificationPreferences;
}

/**
 * Notification preferences interface
 */
export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  reminders: boolean;
  achievements: boolean;
  courseUpdates: boolean;
  weeklyDigest: boolean;
}

/**
 * Comprehensive user profile interface
 */
export interface UserProfile {
  readonly id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  dataAiHint?: string;
  points: number;
  earnedBadges: Badge[];
  enrolledCourses: string[];
  role?: UserRole;
  learningPreferences?: LearningPreferences;
  customVideoLinks?: VideoLink[];
  userModuleVideos?: UserModuleVideos;
  userAIVideos?: UserAIVideos; // AI-found videos per module
  userAISearchUsage?: UserAISearchUsage; // AI search count per module
  textNotes?: TextNote[];
  sketches?: Sketch[];
  uploadedImages?: UploadedImage[];
  dailyPlans?: DailyPlans;
  profileSetupComplete?: boolean;
  submittedFeedback?: FeedbackItem[]; // Optional: track feedback submitted by user
  readonly createdAt?: string;
  readonly lastLoginAt?: string;
  readonly lastActiveAt?: string;
  streak?: number; // Daily login streak
  totalStudyTime?: number; // Total minutes studied
  completedCourses?: string[]; // Course IDs
  certificatesEarned?: Certificate[];
  socialProfile?: SocialProfile;
  accountSettings?: AccountSettings;
}

/**
 * Certificate interface
 */
export interface Certificate {
  readonly id: string;
  courseId: string;
  courseTitle: string;
  readonly issuedAt: string;
  certificateUrl?: string;
  verificationCode: string;
  grade?: string;
}

/**
 * Social profile interface
 */
export interface SocialProfile {
  bio?: string;
  website?: string;
  twitter?: string;
  linkedin?: string;
  github?: string;
  publicProfile: boolean;
  showProgress: boolean;
  showBadges: boolean;
  showCertificates: boolean;
}

/**
 * Account settings interface
 */
export interface AccountSettings {
  twoFactorEnabled: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  dataProcessingConsent: boolean;
  marketingConsent: boolean;
  readonly lastPasswordChange?: string;
  loginNotifications: boolean;
  suspiciousActivityAlerts: boolean;
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
