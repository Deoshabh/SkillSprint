
import type { LucideIcon } from 'lucide-react';

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
  status?: 'draft' | 'pending_review' | 'published' | 'rejected';
}

export type ModuleContentType = 'video' | 'markdown' | 'pdf' | 'quiz' | 'assignment' | 'text';

export interface VideoLink {
  id?: string; // Optional unique ID for user-added videos for easier removal
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
  type: 'coursework' | 'quiz' | 'review' | 'break';
  icon?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color?: string;
}

// Key will be "courseId-moduleId"
export interface UserModuleVideos {
  [moduleKey: string]: VideoLink[];
}

export interface UserProfile {
  id: string; 
  name: string;
  email: string;
  avatarUrl?: string;
  dataAiHint?: string; 
  points: number;
  earnedBadges: Badge[];
  enrolledCourses: string[];
  role?: 'learner' | 'educator' | 'admin';
  learningPreferences?: {
    tracks: string[];
    language: string; 
  };
  customVideoLinks?: VideoLink[]; // For Course Designer's "My Library"
  userModuleVideos?: UserModuleVideos; // For user-added videos per module
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

