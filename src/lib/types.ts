
import type { LucideIcon } from 'lucide-react';

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  category: string;
  icon: string; // Changed from LucideIcon | string
  imageUrl?: string;
  dataAiHint?: string; // Added for consistency with placeholder data
  modules: Module[];
  duration?: string; // e.g., "10 hours", "4 weeks"
  rating?: number; // e.g., 4.5
  enrollmentCount?: number; // e.g., 1200
}

export type ModuleContentType = 'video' | 'markdown' | 'pdf' | 'quiz' | 'assignment';

export interface Module {
  id: string;
  title: string;
  description?: string;
  contentType: ModuleContentType;
  contentUrl?: string; // URL for video, PDF
  contentData?: string; // Markdown content, quiz data (JSON string)
  estimatedTime: string; // e.g., "30 minutes", "1 hour"
  isCompleted?: boolean;
}

export interface UserProgress {
  courseId: string;
  completedModules: string[]; // Array of module IDs
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
  time: string; // e.g., "9:00 AM", "Afternoon"
  isCompleted: boolean;
  type: 'coursework' | 'quiz' | 'review' | 'break';
  icon?: string; // Changed from LucideIcon
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Changed from LucideIcon | string
  color?: string; // Optional color for the badge icon or background
}

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl?: string;
  points: number;
  earnedBadges: Badge[];
  enrolledCourses: string[]; // Array of course IDs
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
