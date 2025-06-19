import dotenv from 'dotenv';
import { connectToDatabase, Course } from '../src/lib/mongodb.js';
import { placeholderCourses } from '../src/lib/placeholder-data.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function seedCourses() {
  try {
    await connectToDatabase();
    
    // Clear existing courses
    await Course.deleteMany({});
    console.log('Cleared existing courses');
    
    // Insert placeholder courses
    const coursesToInsert = placeholderCourses.map(course => ({
      ...course,
      createdAt: new Date(),
      updatedAt: new Date(),
      enrolledStudents: [],
      ratings: []
    }));
    
    await Course.insertMany(coursesToInsert);
    console.log(`Inserted ${coursesToInsert.length} courses successfully`);
    
    // List all courses to verify
    const allCourses = await Course.find({});
    console.log(`Total courses in database: ${allCourses.length}`);
    
    allCourses.forEach(course => {
      console.log(`- ${course.title} (${course.status})`);
    });
    
  } catch (error) {
    console.error('Error seeding courses:', error);
  } finally {
    process.exit(0);
  }
}

seedCourses();
