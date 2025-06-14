
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
  modules: Module[]; // Modules are now part of the course
  duration?: string;
  rating?: number;
  enrollmentCount?: number;
  authorId?: string;
  visibility?: 'private' | 'shared' | 'public';
  status?: 'draft' | 'pending_review' | 'published' | 'rejected' | 'archived';
  submittedDate?: string;
  lastModified?: string;
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
  contentUrl?: string; // For primary video or PDF link
  videoLinks?: VideoLink[]; // Could still store AI suggested/alternative videos here
  contentData?: string; // For markdown content
  estimatedTime: string;
  isCompleted?: boolean; // For user progress tracking, not directly edited by admin here
  subtopics?: string[]; // Admin can edit this
  practiceTask?: string; // Admin can edit this
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
  time: string; // Consider making this more structured if complex time logic is needed
  isCompleted: boolean;
  type: 'coursework' | 'quiz' | 'review' | 'break' | 'meeting' | 'personal';
  icon?: string;
  // Removed date from individual task, as it will be the key in the dailyPlans object
}

export interface DailyPlans {
  [dateKey: string]: DailyTask[]; // dateKey will be 'yyyy-MM-dd'
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
