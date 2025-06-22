#!/usr/bin/env node
/**
 * Setup MongoDB Replica Set for Local Development
 * 
 * This script helps configure MongoDB as a single-node replica set
 * which is required for Prisma transactions.
 */

const { MongoClient } = require('mongodb');

async function setupReplicaSet() {
  console.log('🔄 Setting up MongoDB replica set...\n');

  // Connect to MongoDB
  const client = new MongoClient('mongodb://localhost:27017/', {
    directConnection: true
  });

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const admin = client.db().admin();
    
    // Check if replica set is already configured
    try {
      const status = await admin.command({ replSetGetStatus: 1 });
      console.log('✅ Replica set already configured:', status.set);
      return;
    } catch (error) {
      // Replica set not configured, let's set it up
      console.log('📝 Configuring replica set...');
    }

    // Initialize replica set
    const config = {
      _id: 'rs0',
      members: [
        {
          _id: 0,
          host: 'localhost:27017'
        }
      ]
    };

    const result = await admin.command({ replSetInitiate: config });
    console.log('✅ Replica set initialized:', result);
    
    // Wait a moment for the replica set to be ready
    console.log('⏳ Waiting for replica set to be ready...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const status = await admin.command({ replSetGetStatus: 1 });
    console.log('✅ Replica set status:', status.set);
    
  } catch (error) {
    console.error('❌ Error setting up replica set:', error.message);
    console.log('\n📖 Manual setup instructions:');
    console.log('1. Stop MongoDB if running');
    console.log('2. Start MongoDB with replica set: mongod --replSet rs0');
    console.log('3. Connect to MongoDB: mongosh');
    console.log('4. Initialize replica set: rs.initiate()');
  } finally {
    await client.close();
  }
}

// Alternative: Update connection string to work without replica set
function updateConnectionString() {
  console.log('\n🔧 Alternative: Update connection string for development');
  console.log('Add the following to your .env.local:');
  console.log('DATABASE_URL="mongodb://localhost:27017/SkillSprint?directConnection=true"');
}

setupReplicaSet().then(() => {
  updateConnectionString();
});
