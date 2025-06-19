import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

// Default limits
const DEFAULT_LIMITS = {
  maxCustomVideos: 3,
  maxAiSearches: 2
};

export async function GET(request: NextRequest) {
  try {
    // Connect to database
    const { db } = await connectToDatabase();
    
    if (!db) {
      console.error('[Admin Limits API] Database connection failed - db is null/undefined');
      return NextResponse.json(DEFAULT_LIMITS);
    }
    
    // Get limits from MongoDB settings collection
    const settingsCollection = db.collection('settings');
    const limitsDoc = await settingsCollection.findOne({ type: 'videoLimits' });
    
    if (limitsDoc) {
      return NextResponse.json({
        maxCustomVideos: limitsDoc.maxCustomVideos || DEFAULT_LIMITS.maxCustomVideos,
        maxAiSearches: limitsDoc.maxAiSearches || DEFAULT_LIMITS.maxAiSearches
      });
    } else {
      // Return default limits if no settings exist
      return NextResponse.json(DEFAULT_LIMITS);
    }
  } catch (error) {
    console.error('Error fetching admin limits:', error);
    // Return default limits on error
    return NextResponse.json(DEFAULT_LIMITS);
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify user is authenticated and is admin
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }    // Check if user is admin
    const { db } = await connectToDatabase();
    
    if (!db) {
      console.error('[Admin Limits API] Database connection failed - db is null/undefined');
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ email: session.user.email });
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { maxCustomVideos, maxAiSearches } = body;

    // Validate input
    if (typeof maxCustomVideos !== 'number' || maxCustomVideos < 0 || maxCustomVideos > 20) {
      return NextResponse.json({ error: 'maxCustomVideos must be a number between 0 and 20' }, { status: 400 });
    }

    if (typeof maxAiSearches !== 'number' || maxAiSearches < 0 || maxAiSearches > 10) {
      return NextResponse.json({ error: 'maxAiSearches must be a number between 0 and 10' }, { status: 400 });
    }    // Update limits in MongoDB
    const settingsCollection = db.collection('settings');
    
    if (!settingsCollection) {
      console.error('[Admin Limits API] Failed to get settings collection');
      return NextResponse.json({ error: 'Database collection access failed' }, { status: 500 });
    }
    
    await settingsCollection.updateOne(
      { type: 'videoLimits' },
      {
        $set: {
          type: 'videoLimits',
          maxCustomVideos,
          maxAiSearches,
          updatedBy: user._id,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      limits: {
        maxCustomVideos,
        maxAiSearches
      }
    });
  } catch (error) {
    console.error('Error updating admin limits:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
