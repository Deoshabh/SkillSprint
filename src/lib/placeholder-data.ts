
import type { Course, Module, DailyTask, Badge, UserProfile, UserProgress } from './types';

export const placeholderUserProfile: UserProfile = {
  name: 'Alex Johnson',
  email: 'alex.johnson@example.com',
  avatarUrl: 'https://placehold.co/100x100.png',
  points: 1250,
  earnedBadges: [
    { id: 'badge1', name: 'Fast Learner', description: 'Completed 5 modules in a day', icon: 'Zap', color: 'text-yellow-400' },
    { id: 'badge2', name: 'Course Completer', description: 'Finished a full course', icon: 'Award', color: 'text-green-400' },
  ],
  enrolledCourses: ['full-stack-dev', 'dsa-mastery'],
};

const modulesFullStack: Module[] = [
  { id: 'fs-mod1', title: 'Introduction to Web Development', contentType: 'video', contentUrl: 'https://www.youtube.com/embed/example1', estimatedTime: '1 hour', isCompleted: true },
  { id: 'fs-mod2', title: 'HTML & CSS Fundamentals', contentType: 'markdown', contentData: '# HTML & CSS Basics\\n\\nLearn the building blocks of web pages.', estimatedTime: '2 hours', isCompleted: true },
  { id: 'fs-mod3', title: 'JavaScript Essentials', contentType: 'pdf', contentUrl: '/sample.pdf', estimatedTime: '3 hours', isCompleted: false },
  { id: 'fs-mod4', title: 'React Deep Dive', contentType: 'quiz', contentData: JSON.stringify({ questions: [] }), estimatedTime: '2 hours', isCompleted: false },
  { id: 'fs-mod5', title: 'Node.js & Express', contentType: 'assignment', estimatedTime: '4 hours', isCompleted: false },
  { id: 'fs-mod6', title: 'Databases (MongoDB/PostgreSQL)', contentType: 'video', contentUrl: 'https://www.youtube.com/embed/example2', estimatedTime: '3 hours', isCompleted: false },
  { id: 'fs-mod7', title: 'Deployment & CI/CD', contentType: 'markdown', contentData: '## Deploying your Application', estimatedTime: '2 hours', isCompleted: false },
];

const modulesDSA: Module[] = [
  { id: 'dsa-mod1', title: 'Big O Notation', contentType: 'video', contentUrl: 'https://www.youtube.com/embed/example3', estimatedTime: '1.5 hours', isCompleted: true },
  { id: 'dsa-mod2', title: 'Arrays and Strings', contentType: 'markdown', contentData: '# Arrays & Strings\\n\\nMastering common data structures.', estimatedTime: '2.5 hours', isCompleted: false },
  { id: 'dsa-mod3', title: 'Linked Lists', contentType: 'pdf', contentUrl: '/sample.pdf', estimatedTime: '2 hours', isCompleted: false },
  { id: 'dsa-mod4', title: 'Trees and Graphs', contentType: 'quiz', contentData: JSON.stringify({ questions: [] }), estimatedTime: '3 hours', isCompleted: false },
];

export const placeholderCourses: Course[] = [
  {
    id: 'full-stack-dev',
    title: 'Full-Stack Web Development Bootcamp',
    description: 'Master front-end and back-end technologies to build complete web applications.',
    instructor: 'Jane Doe',
    category: 'Full-Stack',
    icon: 'Code',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'programming computer',
    modules: modulesFullStack,
    duration: '12 weeks',
    rating: 4.8,
    enrollmentCount: 1500,
  },
  {
    id: 'dsa-mastery',
    title: 'Data Structures & Algorithms Mastery',
    description: 'Deep dive into essential data structures and algorithms for interviews and problem-solving.',
    instructor: 'John Smith',
    category: 'DSA',
    icon: 'Sigma',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'algorithms flowchart',
    modules: modulesDSA,
    duration: '8 weeks',
    rating: 4.9,
    enrollmentCount: 2200,
  },
  {
    id: 'devops-essentials',
    title: 'DevOps Essentials: CI/CD & Cloud',
    description: 'Learn the principles of DevOps, continuous integration, delivery, and cloud platforms.',
    instructor: 'Alice Brown',
    category: 'DevOps',
    icon: 'Zap',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'cloud servers',
    modules: [
      { id: 'devops-mod1', title: 'Intro to DevOps', contentType: 'video', contentUrl: 'https://www.youtube.com/embed/example4', estimatedTime: '1 hour' },
      { id: 'devops-mod2', title: 'CI/CD Pipelines with Jenkins/GitLab', contentType: 'markdown', contentData: 'Setup your first pipeline', estimatedTime: '3 hours' },
    ],
    duration: '6 weeks',
    rating: 4.7,
    enrollmentCount: 950,
  },
  {
    id: 'english-fluency',
    title: 'English Fluency & Communication',
    description: 'Enhance your English speaking, writing, and comprehension skills for professional success.',
    instructor: 'David Wilson',
    category: 'English',
    icon: 'Mic',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'communication language',
    modules: [
      { id: 'eng-mod1', title: 'Advanced Grammar', contentType: 'pdf', contentUrl: '/sample.pdf', estimatedTime: '2 hours' },
      { id: 'eng-mod2', title: 'Conversational Practice', contentType: 'video', contentUrl: 'https://www.youtube.com/embed/example5', estimatedTime: '1.5 hours' },
    ],
    duration: '10 weeks',
    rating: 4.6,
    enrollmentCount: 1800,
  },
  {
    id: 'design-ai-tools',
    title: 'Design & AI Tools for Creatives',
    description: 'Explore modern design principles and leverage AI tools for creative workflows.',
    instructor: 'Sophia Lee',
    category: 'Design & AI Tools',
    icon: 'Palette',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'design tools',
    modules: [
       { id: 'design-mod1', title: 'UI/UX Fundamentals', contentType: 'video', contentUrl: 'https://www.youtube.com/embed/exampleUX', estimatedTime: '2 hours' },
       { id: 'design-mod2', title: 'AI in Design (Midjourney, DALL-E)', contentType: 'markdown', contentData: 'Leveraging AI for design inspiration.', estimatedTime: '2.5 hours' },
    ],
    duration: '5 weeks',
    rating: 4.8,
    enrollmentCount: 700,
  },
  {
    id: 'aptitude-prep',
    title: 'Aptitude & Logical Reasoning Prep',
    description: 'Sharpen your analytical and problem-solving skills for competitive exams and interviews.',
    instructor: 'Michael Clark',
    category: 'Aptitude',
    icon: 'Brain',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'logic puzzle',
    modules: [
      { id: 'apt-mod1', title: 'Quantitative Aptitude', contentType: 'quiz', contentData: JSON.stringify({ questions: [] }), estimatedTime: '3 hours' },
      { id: 'apt-mod2', title: 'Logical Reasoning Puzzles', contentType: 'assignment', estimatedTime: '2.5 hours' },
    ],
    duration: '4 weeks',
    rating: 4.7,
    enrollmentCount: 1100,
  },
];

export const placeholderDailyPlan: DailyTask[] = [
  { id: 'task1', title: 'Complete JS Basics - Module 3', courseId: 'full-stack-dev', moduleId: 'fs-mod3', courseTitle: 'Full-Stack Web Development', moduleTitle: 'JavaScript Essentials', time: '9:00 AM - 11:00 AM', isCompleted: false, type: 'coursework', icon: 'Briefcase' },
  { id: 'task2', title: 'Review Big O Notation', courseId: 'dsa-mastery', moduleId: 'dsa-mod1', courseTitle: 'Data Structures & Algorithms', moduleTitle: 'Big O Notation', time: '11:30 AM - 12:30 PM', isCompleted: false, type: 'review', icon: 'Clock' },
  { id: 'task3', title: 'Lunch Break', time: '12:30 PM - 1:30 PM', isCompleted: false, type: 'break', icon: 'Coffee' },
  { id: 'task4', title: 'Practice Array Problems', courseId: 'dsa-mastery', moduleId: 'dsa-mod2', courseTitle: 'Data Structures & Algorithms', moduleTitle: 'Arrays and Strings', time: '1:30 PM - 3:00 PM', isCompleted: false, type: 'coursework', icon: 'Target' },
  { id: 'task5', title: 'Quick Quiz: HTML & CSS', courseId: 'full-stack-dev', moduleId: 'fs-mod2', courseTitle: 'Full-Stack Web Development', moduleTitle: 'HTML & CSS Fundamentals', time: '3:30 PM - 4:00 PM', isCompleted: false, type: 'quiz', icon: 'HelpCircle' },
];

export const placeholderUserProgress: UserProgress[] = [
  { courseId: 'full-stack-dev', completedModules: ['fs-mod1', 'fs-mod2'], totalModules: modulesFullStack.length, currentModuleId: 'fs-mod3' },
  { courseId: 'dsa-mastery', completedModules: ['dsa-mod1'], totalModules: modulesDSA.length, currentModuleId: 'dsa-mod2' },
];

export const placeholderBadges: Badge[] = [
  { id: 'badge1', name: 'Initiator', description: 'Started your first course!', icon: 'Star', color: 'text-yellow-500' },
  { id: 'badge2', name: 'Module Master', description: 'Completed 10 modules.', icon: 'CheckCircle', color: 'text-green-500' },
  { id: 'badge3', name: 'Course Champion', description: 'Finished your first course.', icon: 'Award', color: 'text-blue-500' },
  { id: 'badge4', name: 'Weekend Warrior', description: 'Studied for 5 hours on a weekend.', icon: 'Zap', color: 'text-purple-500' },
  { id: 'badge5', name: 'Top Quizzer', description: 'Scored 90%+ on 3 quizzes.', icon: 'Target', color: 'text-red-500' },
  { id: 'badge6', name: 'Dedicated Learner', description: 'Completed 25 hours of learning.', icon: 'Users', color: 'text-indigo-500' },
];

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
