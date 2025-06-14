
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
  suggestedSchedule?: string; // Added for AI-generated course schedule
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

