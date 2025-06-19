import bcrypt from 'bcryptjs';
import { connectToDatabase, User, Course } from './mongodb';

// Sample course data
const sampleCourses = [
  {    id: 'skillify-fsdd-01',
    title: 'Full-Stack, DSA & DevOps Mastery Program',
    description: 'A comprehensive 24-week program covering the entire spectrum of web development, data structures, algorithms, and DevOps practices.',
    category: 'Full-Stack Development',
    authorId: 'admin-user',
    authorName: 'SkillSprint Admin',
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop',
    status: 'published',
    difficulty: 'intermediate',
    estimatedHours: 480,
    modules: [
      {
        id: 'fsdd-mod1',
        title: 'HTML5 & CSS3',
        contentType: 'video',
        estimatedTime: '1 Week',
        subtopics: ['HTML structure', 'CSS selectors', 'box model'],
        practiceTask: 'Build a responsive portfolio homepage',
        videoLinks: [
          {
            id: 'vid-fsdd1-1',
            langCode: 'hi',
            langName: 'Hinglish',
            youtubeEmbedUrl: 'https://www.youtube.com/embed/videoseries?list=PLu0W_9lII9agiCUZYRsvtGTXdxkzPyItg',
            title: 'HTML5 & CSS3 (Hinglish)',
            isPlaylist: true,
            creator: 'CodeWithHarry'
          },
          {
            id: 'vid-fsdd1-2',
            langCode: 'en',
            langName: 'English',
            youtubeEmbedUrl: 'https://www.youtube.com/embed/UB1O30fR-EE',
            title: 'HTML5 & CSS3 (English)',
            isPlaylist: false,
            creator: 'freeCodeCamp'
          }
        ]
      },
      {
        id: 'fsdd-mod2',
        title: 'JavaScript Fundamentals',
        contentType: 'video',
        estimatedTime: '2 Weeks',
        subtopics: ['Variables', 'Functions', 'DOM manipulation'],
        practiceTask: 'Build an interactive to-do app',
        videoLinks: [
          {
            id: 'vid-fsdd2-1',
            langCode: 'hi',
            langName: 'Hinglish',
            youtubeEmbedUrl: 'https://www.youtube.com/embed/videoseries?list=PLu0W_9lII9agiCUZYRsvtGTXdxkzPyItg',
            title: 'JavaScript (Hinglish)',
            isPlaylist: true,
            creator: 'CodeWithHarry'
          }
        ]
      }
    ],
    tags: ['web development', 'full-stack', 'programming'],
    enrolledStudents: [],
    ratings: []
  },
  {    id: 'react-basics-02',
    title: 'React.js Complete Guide',
    description: 'Learn React from scratch including hooks, state management, and modern React patterns.',
    category: 'Frontend Development',
    authorId: 'admin-user',
    authorName: 'SkillSprint Admin',
    imageUrl: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=800&h=600&fit=crop',
    status: 'published',
    difficulty: 'beginner',
    estimatedHours: 120,
    modules: [
      {
        id: 'react-mod1',
        title: 'React Basics',
        contentType: 'video',
        estimatedTime: '1 Week',
        subtopics: ['Components', 'JSX', 'Props'],
        practiceTask: 'Build your first React component',
        videoLinks: [
          {
            id: 'vid-react1-1',
            langCode: 'en',
            langName: 'English',
            youtubeEmbedUrl: 'https://www.youtube.com/embed/bMknfKXIFA8',
            title: 'React Tutorial for Beginners',
            isPlaylist: false,
            creator: 'Programming with Mosh'
          }
        ]
      }
    ],
    tags: ['react', 'frontend', 'javascript'],
    enrolledStudents: [],
    ratings: []
  }
];

export async function seedAdminUser() {
  try {
    await connectToDatabase();
    
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@skillsprint.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
    } else {
      // Create admin user
      const hashedPassword = await bcrypt.hash('admin123', 12);
        const adminUser = new User({
        id: 'admin-user',
        name: 'Admin User',
        email: 'admin@skillsprint.com',
        password: hashedPassword,
        profileSetupComplete: true,
        role: 'admin',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
        points: 1000,
        earnedBadges: [],
        enrolledCourses: [],
        learningPreferences: {
          tracks: ['management'],
          language: 'english'
        },
        customVideoLinks: [],
        userModuleVideos: {},
        textNotes: [],
        sketches: [],
        dailyPlans: {},
        submittedFeedback: []
      });
      
      await adminUser.save();
      console.log('Admin user created successfully:', adminUser.email);
    }
    
    // Create a test user as well
    const testUserExists = await User.findOne({ email: 'user@skillsprint.com' });
    
    if (!testUserExists) {
      const testUserPassword = await bcrypt.hash('user123', 12);
        const testUser = new User({
        id: 'user-' + Date.now().toString(),
        name: 'Test User',
        email: 'user@skillsprint.com',
        password: testUserPassword,
        profileSetupComplete: true,
        role: 'learner',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b332c2f9?w=400&h=400&fit=crop&crop=face',
        points: 150,
        earnedBadges: [],
        enrolledCourses: [],
        learningPreferences: {
          tracks: ['programming'],
          language: 'english'
        },
        customVideoLinks: [],
        userModuleVideos: {},
        textNotes: [],
        sketches: [],
        dailyPlans: {},
        submittedFeedback: []
      });
      
      await testUser.save();
      console.log('Test user created successfully:', testUser.email);
    } else {
      console.log('Test user already exists');
    }
    
    // Seed courses
    await seedCourses();
    
  } catch (error) {
    console.error('Error seeding admin user:', error);
  }
}

export async function seedCourses() {
  try {
    await connectToDatabase();
    
    // Check if courses already exist
    const existingCourses = await Course.find({});
    
    if (existingCourses.length > 0) {
      console.log('Courses already exist in database');
      return;
    }
    
    // Create courses
    for (const courseData of sampleCourses) {
      const course = new Course(courseData);
      await course.save();
      console.log('Course created:', courseData.title);
    }
    
    console.log('All sample courses created successfully');
  } catch (error) {
    console.error('Error seeding courses:', error);
  }
}
