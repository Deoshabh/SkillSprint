import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ProgressService, DatabaseHelpers } from '@/lib/data-service';

interface RouteParams {
  params: Promise<{ courseId: string; moduleId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Convert Clerk ID to MongoDB User ID
    const mongoUserId = await DatabaseHelpers.getMongoUserIdFromClerkId(userId);
    if (!mongoUserId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { courseId, moduleId } = await params;
    
    const moduleProgress = await ProgressService.markModuleComplete(mongoUserId, courseId, moduleId);
    return NextResponse.json(moduleProgress);
  } catch (error) {
    console.error('Error marking module complete:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
