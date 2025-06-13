
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
  // User-created course specific fields
  authorId?: string; // ID of the user who created it
  visibility?: 'private' | 'shared' | 'public';
  status?: 'draft' | 'pending_review' | 'published' | 'rejected';
}

export type ModuleContentType = 'video' | 'markdown' | 'pdf' | 'quiz' | 'assignment';

export interface VideoLink {
  langCode: string; // e.g., 'en', 'hi', 'hinglish'
  langName: string; // e.g., 'English', 'Hindi', 'Hinglish'
  youtubeEmbedUrl: string;
  title: string;
  creator?: string; // Optional: Creator/Channel name
  notes?: string; // Optional: User-added notes
}

export interface Module {
  id: string;
  title: string;
  description?: string;
  contentType: ModuleContentType;
  contentUrl?: string; // Default video URL (if 'video'), PDF URL, etc.
  videoLinks?: VideoLink[]; // Additional language-specific video links for 'video' type
  contentData?: string; // Markdown content, quiz data (JSON string)
  estimatedTime: string;
  isCompleted?: boolean;
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

export interface UserProfile {
  id: string; // Added user ID
  name: string;
  email: string;
  avatarUrl?: string;
  dataAiHint?: string; // for avatar
  points: number;
  earnedBadges: Badge[];
  enrolledCourses: string[];
  role?: 'learner' | 'educator' | 'admin';
  learningPreferences?: {
    tracks: string[];
    language: string; 
  };
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
