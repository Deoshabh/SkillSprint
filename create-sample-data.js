#!/usr/bin/env node
/**
 * Create Sample Data Script
 * 
 * This script creates sample users and courses to test the application.
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');

async function createSampleData() {
  const prisma = new PrismaClient();

  console.log('🔄 Creating sample data...\n');

  try {
    // Create a sample user
    console.log('1. Creating sample user...');
    const sampleUser = await prisma.user.create({
      data: {
        clerkId: 'user_sample123',
        email: 'sample@example.com',
        name: 'Sample User',
        role: 'EDUCATOR',
        points: 0
      }
    });
    console.log('✅ Created sample user:', sampleUser.name);

    // Create a sample course
    console.log('\n2. Creating sample course...');
    const sampleCourse = await prisma.course.create({
      data: {
        title: 'Introduction to Web Development',
        description: 'Learn the basics of HTML, CSS, and JavaScript to build modern web applications.',
        instructor: 'Sample User',
        category: 'Web Development',
        icon: 'Code',
        authorId: sampleUser.clerkId,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=400&fit=crop',
        dataAiHint: 'web development course',
        duration: '8 weeks',
        suggestedSchedule: 'Complete 2-3 modules per week for optimal learning.',
        lastModified: new Date()
      }
    });
    console.log('✅ Created sample course:', sampleCourse.title);

    // Create sample modules
    console.log('\n3. Creating sample modules...');
    const modules = [
      {
        title: 'HTML Fundamentals',
        description: 'Learn the basic structure and elements of HTML.',
        contentType: 'VIDEO',
        estimatedTime: '2 hours',
        order: 1
      },
      {
        title: 'CSS Styling',
        description: 'Understand how to style web pages with CSS.',
        contentType: 'VIDEO',
        estimatedTime: '3 hours',
        order: 2
      },
      {
        title: 'JavaScript Basics',
        description: 'Introduction to JavaScript programming.',
        contentType: 'VIDEO',
        estimatedTime: '4 hours',
        order: 3
      }
    ];

    for (const moduleData of modules) {
      const module = await prisma.module.create({
        data: {
          ...moduleData,
          courseId: sampleCourse.id
        }
      });
      console.log(`   ✅ Created module: ${module.title}`);

      // Add some sample video links
      await prisma.videoLink.create({
        data: {
          moduleId: module.id,
          title: `${module.title} Tutorial`,
          url: 'https://www.youtube.com/watch?v=example',
          language: 'English',
          creator: 'Sample Creator',
          notes: 'Sample tutorial video',
          isPlaylist: false
        }
      });
    }

    console.log('\n🎉 Sample data created successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • Users: 1`);
    console.log(`   • Courses: 1`);
    console.log(`   • Modules: ${modules.length}`);
    console.log(`   • Video Links: ${modules.length}`);

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleData();
