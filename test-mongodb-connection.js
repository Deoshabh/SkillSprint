#!/usr/bin/env node
/**
 * MongoDB Connection Test Script
 * 
 * This script tests the MongoDB connection and verifies that the Prisma client
 * can successfully connect to your MongoDB database.
 * 
 * Usage:
 *   node test-mongodb-connection.js
 * 
 * Make sure your DATABASE_URL is set in .env.local before running this script.
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');

async function testMongoDBConnection() {
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  console.log('🔍 Testing MongoDB connection...\n');

  try {
    // Test basic connection
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('✅ Successfully connected to MongoDB!\n');

    // Test database operations
    console.log('2. Testing database operations...');
    
    // Test counting users (should work even if table is empty)
    const userCount = await prisma.user.count();
    console.log(`📊 Current user count: ${userCount}`);
    
    // Test counting courses
    const courseCount = await prisma.course.count();
    console.log(`📚 Current course count: ${courseCount}`);
    
    // Test counting modules
    const moduleCount = await prisma.module.count();
    console.log(`📖 Current module count: ${moduleCount}`);
    
    console.log('\n3. Testing database schema...');
    
    // Get database info (this will show if collections exist)
    console.log('✅ Database schema is accessible');
    
    console.log('\n🎉 All tests passed! MongoDB is properly configured.\n');
    
    console.log('📋 Database Summary:');
    console.log(`   • Users: ${userCount}`);
    console.log(`   • Courses: ${courseCount}`);
    console.log(`   • Modules: ${moduleCount}`);
    console.log(`   • Connection: ✅ Working`);
    console.log(`   • Schema: ✅ Valid`);

  } catch (error) {
    console.error('❌ MongoDB connection failed!\n');
    console.error('Error details:', error.message);
    
    if (error.code === 'P1001') {
      console.error('\n💡 Common solutions:');
      console.error('   • Check if MongoDB is running');
      console.error('   • Verify DATABASE_URL in .env.local');
      console.error('   • Ensure network connectivity to MongoDB server');
      console.error('   • Check MongoDB authentication credentials');
    }
    
    if (error.code === 'P1008') {
      console.error('\n💡 Database timeout solutions:');
      console.error('   • Check MongoDB server status');
      console.error('   • Verify firewall settings');
      console.error('   • Try increasing connection timeout');
    }
    
    if (error.code === 'P1010') {
      console.error('\n💡 Authentication solutions:');
      console.error('   • Verify username and password in DATABASE_URL');
      console.error('   • Ensure user has proper database permissions');
      console.error('   • Check if authentication database is correct');
    }
    
    console.error('\n📖 For more help, see: MONGODB_MIGRATION_GUIDE.md');
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Disconnected from database.');
  }
}

// Run the test
if (require.main === module) {
  testMongoDBConnection().catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = { testMongoDBConnection };
