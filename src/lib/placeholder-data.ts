
import type { Course, Module, DailyTask, Badge, UserProfile, UserProgress, VideoLink, UserModuleVideos } from './types';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

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


const fullStackDsaDevOpsModules: Module[] = [
  // Week 1-24 based on user input
  {
    id: 'fsdd-mod1', title: 'HTML5 & CSS3', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['HTML structure', 'CSS selectors', 'box model'],
    practiceTask: 'Build a responsive portfolio homepage',
    videoLinks: [
      { id:'vid-fsdd1-1', langCode: 'hi', langName: 'Hinglish', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/playlist?list=PLu0W_9lII9agiCUZYRsvtGTXdxkzPyItg'), title: 'HTML5 & CSS3 (Hinglish)', isPlaylist: true, creator: 'CodeWithHarry' },
      { id:'vid-fsdd1-2', langCode: 'en', langName: 'English', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=UB1O30fR-EE'), title: 'HTML5 & CSS3 (English)', creator: 'freeCodeCamp', isPlaylist: false },
    ],
  },
  {
    id: 'fsdd-mod2', title: 'Advanced CSS (Flexbox & Grid)', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Flexbox properties', 'Grid layout', 'responsive media queries'],
    practiceTask: 'Clone a blog layout using Flexbox & Grid',
    videoLinks: [
      { id:'vid-fsdd2-1', langCode: 'hi', langName: 'Hinglish', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=RGOj5yH7evk'), title: 'Advanced CSS (Hinglish)', creator: 'Shradha Khapra', isPlaylist: false },
      { id:'vid-fsdd2-2', langCode: 'en', langName: 'English', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=EFafSYg-PkI'), title: 'Advanced CSS (English)', creator: 'Kevin Powell', isPlaylist: false },
    ],
  },
  // ... (other modules with unique IDs for videoLinks)
  {
    id: 'fsdd-mod24', title: 'Soft Skills & Interview Prep', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['STAR method', 'resume polish', 'behavioral Q&A'],
    practiceTask: 'Prepare & record 5 STAR method behavioral answers',
    videoLinks: [
      { id:'vid-fsdd24-1', langCode: 'hi', langName: 'Hinglish', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=2nI4i2pTlPQ'), title: 'Soft Skills & Interview Prep (Hinglish)', creator: 'Aman Dhattarwal', isPlaylist: false },
      { id:'vid-fsdd24-2', langCode: 'en', langName: 'English', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=Q6QXyq9Iqyk'), title: 'Behavioral Interviews (English)', creator: 'Linda Raynier', isPlaylist: false },
    ],
  },
];

const englishCommModules: Module[] = [
  {
    id: 'ec-mod1', title: 'Self-Introduction & Daily Conversation', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Introductions, greetings, basic Q&A'], practiceTask: 'Record self-intro; get feedback',
    videoLinks: [
      { id:'vid-ec1-1', langCode: 'hi', langName: 'Hinglish', creator: 'Learnex', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/playlist?list=PL1XYZ_hindi_intro'), title: 'Self-Introduction (Hinglish)', isPlaylist: true },
      { id:'vid-ec1-2', langCode: 'en', langName: 'English', creator: 'Learn English Lab', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=english_intro_eng'), title: 'Self-Introduction (English)', isPlaylist: false },
    ],
  },
  // ... other english modules
];
const designAiModules: Module[] = [
  {
    id: 'dai-mod1', title: 'UI/UX Design with Figma', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Frames, shapes, prototyping'], practiceTask: 'Recreate login screen in Figma',
    videoLinks: [
      { id:'vid-dai1-1', langCode: 'hi', langName: 'Hinglish', creator: 'CodeWithHarry', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=figma_hindi'), title: 'Figma (Hinglish)', isPlaylist: false },
      { id:'vid-dai1-2', langCode: 'en', langName: 'English', creator: 'freeCodeCamp', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=figma_eng'), title: 'Figma (English)', isPlaylist: false },
    ],
  },
  // ... other design modules
];

const aptitudeModules: Module[] = [
  {
    id: 'apt-mod1', title: 'Arithmetic & Number Concepts', contentType: 'video', estimatedTime: '1 Week',
    subtopics: ['Percentages, ratios, speed/time'], practiceTask: 'Solve 10 arithmetic problems',
    videoLinks: [
      { id:'vid-apt1-1', langCode: 'hi', langName: 'Hinglish', creator: 'Adda247', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=quant_hindi1'), title: 'Arithmetic (Hinglish)', isPlaylist: false },
      { id:'vid-apt1-2', langCode: 'en', langName: 'English', creator: 'KhanAcademy', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=quant_eng'), title: 'Arithmetic (English)', isPlaylist: false },
    ],
  },
  // ... other aptitude modules
];


export let placeholderCourses: Course[] = [
  {
    id: 'skillify-fsdd-01',
    title: 'Full-Stack, DSA & DevOps Mastery Program',
    description: 'A comprehensive 24-week program covering the entire spectrum of web development, data structures, algorithms, and DevOps practices.',
    instructor: 'Skillify Experts',
    category: 'Full-Stack, DSA & DevOps',
    icon: 'Code',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'coding software',
    modules: fullStackDsaDevOpsModules,
    duration: '24 Weeks',
    rating: 4.9,
    enrollmentCount: 3500,
    authorId: 'skillify-platform-admin',
    status: 'published',
    visibility: 'public',
    lastModified: new Date().toISOString(),
  },
  {
    id: 'skillify-ec-01',
    title: 'English Communication Excellence',
    description: 'A 12-week course to enhance your English speaking, listening, writing, and professional communication skills.',
    instructor: 'Language Specialists',
    category: 'English Communication',
    icon: 'Mic',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'communication speech',
    modules: englishCommModules,
    duration: '12 Weeks',
    rating: 4.7,
    enrollmentCount: 1800,
    authorId: 'user-alex-johnson-123',
    status: 'draft',
    visibility: 'private',
    lastModified: new Date().toISOString(),
  },
  {
    id: 'skillify-dait-01',
    title: 'Design & AI Tools for Modern Creatives',
    description: 'A 15-week journey into UI/UX design, popular creative software, and leveraging AI tools for enhanced productivity.',
    instructor: 'Creative Tech Gurus',
    category: 'Design & AI Tools',
    icon: 'Palette',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'art design',
    modules: designAiModules,
    duration: '15 Weeks',
    rating: 4.8,
    enrollmentCount: 1200,
    authorId: 'skillify-platform-admin',
    status: 'pending_review',
    visibility: 'public',
    submittedDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Submitted yesterday
    lastModified: new Date().toISOString(),
  },
  {
    id: 'skillify-ap-01',
    title: 'Aptitude & Logical Reasoning Accelerator',
    description: 'An 8-week intensive course to sharpen your quantitative, logical, and verbal reasoning skills for competitive exams.',
    instructor: 'Aptitude Coaches',
    category: 'Aptitude Prep',
    icon: 'Brain',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'thinking strategy',
    modules: aptitudeModules,
    duration: '8 Weeks',
    rating: 4.6,
    enrollmentCount: 2100,
    authorId: 'user-alex-johnson-123',
    status: 'published',
    visibility: 'public',
    lastModified: new Date().toISOString(),
  },
];

export const placeholderUserProfile: UserProfile = {
  id: 'user-alex-johnson-123',
  name: 'Alex Johnson',
  email: 'alex.johnson@example.com',
  avatarUrl: 'https://placehold.co/100x100.png',
  dataAiHint: 'profile portrait',
  points: 1250,
  earnedBadges: [
    { id: 'badge1', name: 'Fast Learner', description: 'Completed 5 modules in a day', icon: 'Zap', color: 'text-yellow-400' },
    { id: 'badge2', name: 'Course Completer', description: 'Finished a full course', icon: 'Award', color: 'text-green-400' },
  ],
  enrolledCourses: ['skillify-fsdd-01', 'skillify-dait-01'],
  role: 'admin', // Changed to admin for testing moderation
  learningPreferences: {
    tracks: ['Full-Stack, DSA & DevOps', 'Design & AI Tools'],
    language: 'English',
  },
  customVideoLinks: [
    { id: 'userlib-1', langCode: 'en', langName: 'English', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), title: 'My Favorite Study Music (User Pick)', isPlaylist: false, creator: 'User' },
    { id: 'userlib-2', langCode: 'any', langName: 'Any Language', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/playlist?list=PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG'), title: 'Web Dev Favorites (User Playlist)', isPlaylist: true, creator: 'User' }
  ],
  userModuleVideos: {
    'skillify-fsdd-01-fsdd-mod1': [
      { id: 'usermod-1', langCode: 'en', langName: 'English', youtubeEmbedUrl: getEmbedUrl('https://www.youtube.com/watch?v=some_other_html_video'), title: 'Alex\'s HTML Deep Dive', isPlaylist: false, creator: 'Alex' }
    ]
  },
  profileSetupComplete: true,
};

export const placeholderDailyPlan: DailyTask[] = [
  { id: 'task1', title: 'HTML5 & CSS3 - Module 1', courseId: 'skillify-fsdd-01', moduleId: 'fsdd-mod1', courseTitle: 'Full-Stack, DSA & DevOps', moduleTitle: 'HTML5 & CSS3', time: '9:00 AM - 11:00 AM', isCompleted: false, type: 'coursework', icon: 'Briefcase' },
  { id: 'task2', title: 'UI/UX Design with Figma', courseId: 'skillify-dait-01', moduleId: 'dai-mod1', courseTitle: 'Design & AI Tools', moduleTitle: 'UI/UX Design with Figma', time: '11:30 AM - 12:30 PM', isCompleted: false, type: 'review', icon: 'Clock' },
];

export const placeholderUserProgress: UserProgress[] = [
  { courseId: 'skillify-fsdd-01', completedModules: ['fsdd-mod1'], totalModules: fullStackDsaDevOpsModules.length, currentModuleId: 'fsdd-mod2' },
  { courseId: 'skillify-dait-01', completedModules: [], totalModules: designAiModules.length, currentModuleId: 'dai-mod1' },
];

export const placeholderBadges: Badge[] = [
  { id: 'badge1', name: 'Initiator', description: 'Started your first course!', icon: 'Star', color: 'text-yellow-500' },
  { id: 'badge2', name: 'Module Master', description: 'Completed 10 modules.', icon: 'CheckCircle', color: 'text-green-500' },
  { id: 'badge3', name: 'Course Champion', description: 'Finished your first course.', icon: 'Award', color: 'text-blue-500' },
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
    if (placeholderCourses[existingCourseIndex].authorId !== courseData.authorId) {
        console.error("User is not authorized to update this course.");
        return null; // Or throw an error
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
    };
    placeholderCourses.push(newCourse);
    console.log("New course created:", newCourse.id);
    return newCourse;
  }
};

// Add uuid to dependencies if not already there: npm install uuid && npm install --save-dev @types/uuid
// For this environment, I'll assume it's available or the user will add it.
// If direct modification to package.json is needed, that's a separate step.
// For now, this code is for demonstration of in-memory updates.

// Initialize some videoLinks with unique IDs
[...fullStackDsaDevOpsModules, ...englishCommModules, ...designAiModules, ...aptitudeModules].forEach(module => {
  if (module.videoLinks) {
    module.videoLinks = module.videoLinks.map((vl, index) => ({
      ...vl,
      id: vl.id || `${module.id}-vid-${index}`
    }));
  }
});
