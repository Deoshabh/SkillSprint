import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserProgress, DatabaseHelpers } from '@/lib/data-service';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Convert Clerk ID to MongoDB User ID
    const mongoUserId = await DatabaseHelpers.getMongoUserIdFromClerkId(userId);
    if (!mongoUserId) {
      // Return empty progress if user doesn't exist in database yet
      return NextResponse.json({ 
        progress: [],
        success: true 
      });
    }

    const progress = await getUserProgress(mongoUserId);
    
    return NextResponse.json({ 
      progress,
      success: true 
    });
  } catch (error) {
    console.error('Error fetching user progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user progress' },
      { status: 500 }
    );
  }
}
