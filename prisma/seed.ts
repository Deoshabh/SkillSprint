import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create default badges
  const badges = [
    {
      name: 'First Steps',
      description: 'Complete your first module',
      icon: 'Trophy',
      color: '#fbbf24',
    },
    {
      name: 'Knowledge Seeker',
      description: 'Complete 5 modules',
      icon: 'Book',
      color: '#3b82f6',
    },
    {
      name: 'Course Conqueror',
      description: 'Complete your first course',
      icon: 'Star',
      color: '#10b981',
    },
    {
      name: 'Learning Streak',
      description: 'Study for 7 consecutive days',
      icon: 'Flame',
      color: '#f59e0b',
    },
    {
      name: 'Content Creator',
      description: 'Create your first course',
      icon: 'Lightbulb',
      color: '#8b5cf6',
    },
  ];

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: {},
      create: badge,
    });
  }

  console.log('Badges seeded successfully');

  // Create sample course categories
  const sampleCourses = [
    {
      title: 'Introduction to Web Development',
      description: 'Learn the fundamentals of HTML, CSS, and JavaScript',
      category: 'Programming',
      instructor: 'System',
      icon: 'Code',
      imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=400&fit=crop',
      status: 'PUBLISHED' as const,
      visibility: 'PUBLIC' as const,
      authorId: 'system',
      duration: '8 weeks',
      modules: {
        create: [
          {
            title: 'Getting Started with HTML',
            description: 'Learn the basic structure of web pages',
            contentType: 'VIDEO' as const,
            estimatedTime: '2 hours',
            order: 1,
            subtopics: ['HTML elements', 'Document structure', 'Semantic HTML'],
            practiceTask: 'Create a simple webpage with proper HTML structure',
            videoLinks: {
              create: [
                {
                  title: 'HTML Basics Tutorial',
                  youtubeEmbedUrl: 'https://www.youtube.com/embed/UB1O30fR-EE',
                  language: 'English',
                  creator: 'HTML Dog',
                  isPlaylist: false,
                },
              ],
            },
          },
          {
            title: 'Styling with CSS',
            description: 'Learn how to style your web pages',
            contentType: 'VIDEO' as const,
            estimatedTime: '3 hours',
            order: 2,
            subtopics: ['CSS selectors', 'Box model', 'Flexbox', 'Grid'],
            practiceTask: 'Style the webpage you created in the previous module',
            videoLinks: {
              create: [
                {
                  title: 'CSS Fundamentals',
                  youtubeEmbedUrl: 'https://www.youtube.com/embed/1Rs2ND1ryYc',
                  language: 'English',
                  creator: 'Web Dev Simplified',
                  isPlaylist: false,
                },
              ],
            },
          },
          {
            title: 'JavaScript Basics',
            description: 'Introduction to programming with JavaScript',
            contentType: 'VIDEO' as const,
            estimatedTime: '4 hours',
            order: 3,
            subtopics: ['Variables', 'Functions', 'DOM manipulation', 'Events'],
            practiceTask: 'Add interactive functionality to your webpage',
            videoLinks: {
              create: [
                {
                  title: 'JavaScript Tutorial for Beginners',
                  youtubeEmbedUrl: 'https://www.youtube.com/embed/W6NZfCO5SIk',
                  language: 'English',
                  creator: 'Programming with Mosh',
                  isPlaylist: false,
                },
              ],
            },
          },
        ],
      },
    },
    {
      title: 'Data Structures and Algorithms',
      description: 'Master fundamental computer science concepts',
      category: 'Computer Science',
      instructor: 'System',
      icon: 'Brain',
      imageUrl: 'https://images.unsplash.com/photo-1516110833967-0b5716ca1387?w=600&h=400&fit=crop',
      status: 'PUBLISHED' as const,
      visibility: 'PUBLIC' as const,
      authorId: 'system',
      duration: '12 weeks',
      modules: {
        create: [
          {
            title: 'Arrays and Strings',
            description: 'Learn about basic data structures',
            contentType: 'VIDEO' as const,
            estimatedTime: '3 hours',
            order: 1,
            subtopics: ['Array operations', 'String manipulation', 'Two pointers'],
            practiceTask: 'Solve 5 array and string problems',
          },
          {
            title: 'Linked Lists',
            description: 'Understanding linked data structures',
            contentType: 'VIDEO' as const,
            estimatedTime: '2 hours',
            order: 2,
            subtopics: ['Singly linked lists', 'Doubly linked lists', 'Circular lists'],
            practiceTask: 'Implement a linked list class',
          },
        ],
      },
    },
    {
      title: 'Digital Marketing Fundamentals',
      description: 'Learn the basics of online marketing',
      category: 'Marketing',
      instructor: 'System',
      icon: 'TrendingUp',
      imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop',
      status: 'PUBLISHED' as const,
      visibility: 'PUBLIC' as const,
      authorId: 'system',
      duration: '6 weeks',
      modules: {
        create: [
          {
            title: 'Introduction to Digital Marketing',
            description: 'Overview of digital marketing channels',
            contentType: 'VIDEO' as const,
            estimatedTime: '1.5 hours',
            order: 1,
            subtopics: ['SEO basics', 'Social media marketing', 'Email marketing'],
            practiceTask: 'Create a marketing strategy outline',
          },
        ],
      },
    },
  ];

  for (const course of sampleCourses) {
    await prisma.course.upsert({
      where: { title: course.title },
      update: {},
      create: course,
    });
  }

  console.log('Sample courses seeded successfully');

  console.log('Database seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
